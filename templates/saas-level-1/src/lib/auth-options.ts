import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { PrismaClient } from '@prisma/client'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { env } from '@/lib/env'

// Lazy-load Prisma only when needed (OAuth providers)
// This prevents DATABASE_URL errors when using mock/credentials providers
let prisma: PrismaClient | null = null
const getPrisma = (): PrismaClient => {
  if (!prisma) {
    const { prisma: prismaInstance } = require('@/lib/prisma') as {
      prisma: PrismaClient
    }
    prisma = prismaInstance
  }
  return prisma
}

const providers: NextAuthOptions['providers'] = []

const githubClientId = env.GITHUB_CLIENT_ID || env.GITHUB_ID
const githubClientSecret = env.GITHUB_CLIENT_SECRET || env.GITHUB_SECRET

if (githubClientId && githubClientSecret) {
  providers.push(
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  )
} else {
  console.warn(
    '[auth] GitHub provider disabled – set GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET (or GITHUB_ID/GITHUB_SECRET).'
  )
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    })
  )
} else {
  console.warn(
    '[auth] Google provider disabled – GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET not set.'
  )
}

const hasEmailServerString = !!env.EMAIL_SERVER && !!env.EMAIL_FROM
const hasEmailServerParts =
  !!env.EMAIL_SERVER_HOST &&
  !!env.EMAIL_SERVER_PORT &&
  !!env.EMAIL_SERVER_USER &&
  !!env.EMAIL_SERVER_PASSWORD &&
  !!env.EMAIL_FROM

if (hasEmailServerString || hasEmailServerParts) {
  // Lazy-load EmailProvider to avoid requiring nodemailer when not needed
  const EmailProvider = require('next-auth/providers/email').default
  providers.push(
    EmailProvider({
      server: hasEmailServerString
        ? env.EMAIL_SERVER
        : {
            host: env.EMAIL_SERVER_HOST,
            port: Number(env.EMAIL_SERVER_PORT),
            auth: {
              user: env.EMAIL_SERVER_USER,
              pass: env.EMAIL_SERVER_PASSWORD,
            },
          },
      from: env.EMAIL_FROM,
    })
  )
} else {
  console.warn(
    '[auth] Email provider disabled – set EMAIL_SERVER + EMAIL_FROM, or EMAIL_SERVER_HOST/PORT/USER/PASSWORD + EMAIL_FROM.'
  )
}

if (providers.length === 0) {
  // Fail fast in production - don't boot with no real providers
  if (env.NODE_ENV === 'production') {
    throw new Error(
      '[auth] FATAL: No authentication providers configured in production. ' +
      'Set environment variables for at least one provider (GitHub, Google, Email). ' +
      'Application startup aborted.'
    )
  }

  // Development only: add fallback mock provider
  console.warn('[auth] No authentication providers configured!')
  console.warn('[auth] Using fallback mock provider - configure real providers for production!')
  console.warn('[auth] Available providers: GitHub, Google, Email')

  providers.push(
    CredentialsProvider({
      name: 'Mock Auth',
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        return {
          id: 'mock-user',
          email: credentials?.email || 'mock@example.com',
          name: 'Mock User (configure real auth providers)',
        }
      },
    })
  )
}

// Validate NEXTAUTH_SECRET in production
if (env.NODE_ENV === 'production' && !env.NEXTAUTH_SECRET) {
  throw new Error(
    '[auth] FATAL: NEXTAUTH_SECRET is required in production. ' +
    'Generate one with: openssl rand -base64 32. ' +
    'Missing secret will cause session invalidation across serverless instances.'
  )
}

// Determine if we have any OAuth/email providers (require database)
const hasOAuthProviders = providers.some(p =>
  p.id === 'github' || p.id === 'google' || p.id === 'email'
)

export const authOptions: NextAuthOptions = {
  // Use Prisma adapter when OAuth/email providers are present
  // Credentials-only mode uses JWT (no database needed)
  adapter: hasOAuthProviders ? PrismaAdapter(getPrisma()) : undefined,
  providers,
  callbacks: {
    async session({ session, token, user }) {
      // Send properties to the client
      if (session.user) {
        // Database strategy: user comes from Prisma (already has id)
        // JWT strategy: user comes from token
        // Only set id if it's not already populated (preserve Prisma user.id)
        if (!session.user.id) {
          session.user.id = user?.id || token?.sub || ''
        }
        if (!session.user.role) {
          session.user.role =
            (user && 'role' in user ? user.role : undefined) ||
            token.role ||
            'user' // Explicit default fallback
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      // For credentials provider, store user info in token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        if ('role' in user) {
          token.role = user.role
        }
      }
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for check email message)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out of interest)
  },
  session: {
    // Use database strategy when OAuth/email providers present
    // Use JWT strategy for credentials-only mode (dev/mock)
    strategy: hasOAuthProviders ? 'database' : 'jwt',
  },
  secret: env.NEXTAUTH_SECRET,
}

export { getPrisma }
