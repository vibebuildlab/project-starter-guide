import 'next-auth'
import 'next-auth/jwt'
import type { Role } from '@/lib/rbac'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role?: Role
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    role?: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    role?: Role
  }
}
