/**
 * Role-Based Access Control (RBAC)
 *
 * Simple RBAC implementation for SaaS applications.
 * Supports roles, permissions, and resource-based access control.
 *
 * Usage:
 *   import { can, requireRole, ROLES } from '@/lib/rbac'
 *
 *   // Check permission
 *   if (can(user, 'posts:create')) { ... }
 *
 *   // In API routes
 *   const session = await requireRole(request, 'admin')
 */

import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-options'

// Define available roles (ordered by privilege level)
export const ROLES = {
  USER: 'user',
  MEMBER: 'member',
  ADMIN: 'admin',
  OWNER: 'owner',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Role hierarchy (higher index = more privileges)
const ROLE_HIERARCHY: Role[] = [
  ROLES.USER,
  ROLES.MEMBER,
  ROLES.ADMIN,
  ROLES.OWNER,
]

// Permission definitions
// Format: 'resource:action'
export const PERMISSIONS = {
  // User management
  'users:read': [ROLES.ADMIN, ROLES.OWNER],
  'users:create': [ROLES.ADMIN, ROLES.OWNER],
  'users:update': [ROLES.ADMIN, ROLES.OWNER],
  'users:delete': [ROLES.OWNER],

  // Content/Posts
  'posts:read': [ROLES.USER, ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER],
  'posts:create': [ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER],
  'posts:update': [ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER],
  'posts:delete': [ROLES.ADMIN, ROLES.OWNER],

  // Billing
  'billing:read': [ROLES.ADMIN, ROLES.OWNER],
  'billing:manage': [ROLES.OWNER],

  // Settings
  'settings:read': [ROLES.ADMIN, ROLES.OWNER],
  'settings:update': [ROLES.OWNER],

  // Team management
  'team:read': [ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER],
  'team:invite': [ROLES.ADMIN, ROLES.OWNER],
  'team:remove': [ROLES.ADMIN, ROLES.OWNER],
  'team:manage-roles': [ROLES.OWNER],
} as const

export type Permission = keyof typeof PERMISSIONS

// User interface for RBAC
export interface RBACUser {
  id: string
  email?: string | null
  role?: Role
}

/**
 * Check if a user has a specific permission
 */
export function can(user: RBACUser | null | undefined, permission: Permission): boolean {
  if (!user) return false

  const userRole = user.role || ROLES.USER
  const permEntry = Object.entries(PERMISSIONS).find(([key]) => key === permission)
  if (!permEntry) return false

  return (permEntry[1] as readonly Role[]).includes(userRole)
}

/**
 * Check if a user has at least the specified role
 */
export function hasRole(user: RBACUser | null | undefined, requiredRole: Role): boolean {
  if (!user) return false

  const userRole = user.role || ROLES.USER
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole)
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole)

  return userRoleIndex >= requiredRoleIndex
}

/**
 * Check if user owns the resource
 */
export function isOwner(
  user: RBACUser | null | undefined,
  resource: { userId?: string; ownerId?: string }
): boolean {
  if (!user) return false
  return resource.userId === user.id || resource.ownerId === user.id
}

/**
 * Check if user can access resource (owner or has permission)
 */
export function canAccessResource(
  user: RBACUser | null | undefined,
  resource: { userId?: string; ownerId?: string },
  permission: Permission
): boolean {
  if (!user) return false
  return isOwner(user, resource) || can(user, permission)
}

async function getAuthenticatedUser(): Promise<RBACUser | NextResponse> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  return {
    id: (session.user as RBACUser & { id?: string }).id || '',
    email: session.user.email,
    role: (session.user as RBACUser).role || ROLES.USER,
  }
}

/**
 * API route middleware to require a minimum role
 * Returns 401 if not authenticated, 403 if insufficient permissions
 *
 * Usage in API routes:
 *   export async function GET(request: Request) {
 *     const session = await requireRole(request, 'admin')
 *     if (session instanceof NextResponse) return session
 *     // ... handle request
 *   }
 */
export async function requireRole(
  _request: Request,
  requiredRole: Role
): Promise<RBACUser | NextResponse> {
  const result = await getAuthenticatedUser()
  if (result instanceof NextResponse) return result

  if (!hasRole(result, requiredRole)) {
    return NextResponse.json(
      { error: 'Insufficient permissions', required: requiredRole },
      { status: 403 }
    )
  }

  return result
}

/**
 * API route middleware to require a specific permission
 *
 * Usage:
 *   export async function POST(request: Request) {
 *     const session = await requirePermission(request, 'posts:create')
 *     if (session instanceof NextResponse) return session
 *     // ... handle request
 *   }
 */
export async function requirePermission(
  _request: Request,
  permission: Permission
): Promise<RBACUser | NextResponse> {
  const result = await getAuthenticatedUser()
  if (result instanceof NextResponse) return result

  if (!can(result, permission)) {
    return NextResponse.json(
      { error: 'Permission denied', required: permission },
      { status: 403 }
    )
  }

  return result
}

/**
 * Helper to get display name for a role
 */
export function getRoleDisplayName(role: Role): string {
  // Map is pre-defined with all valid roles - lookup is safe
  switch (role) {
    case ROLES.USER:
      return 'User'
    case ROLES.MEMBER:
      return 'Member'
    case ROLES.ADMIN:
      return 'Admin'
    case ROLES.OWNER:
      return 'Owner'
    default:
      return role
  }
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return (Object.entries(PERMISSIONS) as [Permission, readonly Role[]][])
    .filter(([, roles]) => roles.includes(role))
    .map(([permission]) => permission)
}
