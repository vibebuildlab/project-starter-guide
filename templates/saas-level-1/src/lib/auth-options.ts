import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { PrismaClient } from '@prisma/client'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'

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

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  )
} else {
  console.warn(
    '[auth] GitHub provider disabled – GITHUB_ID and/or GITHUB_SECRET not set.'
  )
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
} else {
  console.warn(
    '[auth] Google provider disabled – GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET not set.'
  )
}

const hasEmailConfig =
  process.env.EMAIL_SERVER_HOST &&
  process.env.EMAIL_SERVER_PORT &&
  process.env.EMAIL_SERVER_USER &&
  process.env.EMAIL_SERVER_PASSWORD &&
  process.env.EMAIL_FROM

if (hasEmailConfig) {
  // Lazy-load EmailProvider to avoid requiring nodemailer when not needed
  const EmailProvider = require('next-auth/providers/email').default
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    })
  )
} else {
  console.warn(
    '[auth] Email provider disabled – EMAIL_SERVER_* variables not fully configured.'
  )
}

if (providers.length === 0) {
  // Fail fast in production - don't boot with no real providers
  if (process.env.NODE_ENV === 'production') {
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
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
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
      }
      return session
    },
    async jwt({ token, user, account }) {
      // For credentials provider, store user info in token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
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
  secret: process.env.NEXTAUTH_SECRET,
}

export { getPrisma }
