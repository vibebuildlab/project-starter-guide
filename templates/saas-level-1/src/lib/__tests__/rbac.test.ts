import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import {
  ROLES,
  PERMISSIONS,
  can,
  hasRole,
  isOwner,
  canAccessResource,
  getRoleDisplayName,
  getPermissionsForRole,
  requireRole,
  requirePermission,
  type RBACUser,
  type Role,
  type Permission,
} from '../rbac'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}))

const mockGetServerSession = vi.mocked(getServerSession)

describe('RBAC', () => {
  describe('ROLES constant', () => {
    it('defines all expected roles', () => {
      expect(ROLES.USER).toBe('user')
      expect(ROLES.MEMBER).toBe('member')
      expect(ROLES.ADMIN).toBe('admin')
      expect(ROLES.OWNER).toBe('owner')
    })
  })

  describe('PERMISSIONS constant', () => {
    it('defines user management permissions', () => {
      expect(PERMISSIONS['users:read']).toContain(ROLES.ADMIN)
      expect(PERMISSIONS['users:delete']).toContain(ROLES.OWNER)
    })

    it('defines content permissions', () => {
      expect(PERMISSIONS['posts:read']).toContain(ROLES.USER)
      expect(PERMISSIONS['posts:create']).toContain(ROLES.MEMBER)
    })
  })

  describe('can()', () => {
    it('returns false for null user', () => {
      expect(can(null, 'posts:read')).toBe(false)
    })

    it('returns false for undefined user', () => {
      expect(can(undefined, 'posts:read')).toBe(false)
    })

    it('returns true when user role has permission', () => {
      const user: RBACUser = { id: '1', role: ROLES.ADMIN }
      expect(can(user, 'users:read')).toBe(true)
    })

    it('returns false when user role lacks permission', () => {
      const user: RBACUser = { id: '1', role: ROLES.USER }
      expect(can(user, 'users:delete')).toBe(false)
    })

    it('defaults to USER role when role not specified', () => {
      const user: RBACUser = { id: '1' }
      expect(can(user, 'posts:read')).toBe(true) // USER can read posts
      expect(can(user, 'posts:create')).toBe(false) // USER cannot create posts
    })

    it('returns false for invalid permission', () => {
      const user: RBACUser = { id: '1', role: ROLES.OWNER }
      // Type assertion needed for testing invalid input
      expect(can(user, 'invalid:permission' as Permission)).toBe(false)
    })
  })

  describe('hasRole()', () => {
    it('returns false for null user', () => {
      expect(hasRole(null, ROLES.USER)).toBe(false)
    })

    it('returns false for undefined user', () => {
      expect(hasRole(undefined, ROLES.USER)).toBe(false)
    })

    it('returns true when user has exact role', () => {
      const user: RBACUser = { id: '1', role: ROLES.ADMIN }
      expect(hasRole(user, ROLES.ADMIN)).toBe(true)
    })

    it('returns true when user has higher role', () => {
      const user: RBACUser = { id: '1', role: ROLES.OWNER }
      expect(hasRole(user, ROLES.ADMIN)).toBe(true)
      expect(hasRole(user, ROLES.MEMBER)).toBe(true)
      expect(hasRole(user, ROLES.USER)).toBe(true)
    })

    it('returns false when user has lower role', () => {
      const user: RBACUser = { id: '1', role: ROLES.USER }
      expect(hasRole(user, ROLES.ADMIN)).toBe(false)
    })

    it('defaults to USER role when role not specified', () => {
      const user: RBACUser = { id: '1' }
      expect(hasRole(user, ROLES.USER)).toBe(true)
      expect(hasRole(user, ROLES.MEMBER)).toBe(false)
    })
  })

  describe('isOwner()', () => {
    it('returns false for null user', () => {
      expect(isOwner(null, { userId: '1' })).toBe(false)
    })

    it('returns false for undefined user', () => {
      expect(isOwner(undefined, { userId: '1' })).toBe(false)
    })

    it('returns true when user.id matches resource.userId', () => {
      const user: RBACUser = { id: '123' }
      expect(isOwner(user, { userId: '123' })).toBe(true)
    })

    it('returns true when user.id matches resource.ownerId', () => {
      const user: RBACUser = { id: '123' }
      expect(isOwner(user, { ownerId: '123' })).toBe(true)
    })

    it('returns false when user.id does not match', () => {
      const user: RBACUser = { id: '123' }
      expect(isOwner(user, { userId: '456' })).toBe(false)
    })
  })

  describe('canAccessResource()', () => {
    it('returns false for null user', () => {
      expect(canAccessResource(null, { userId: '1' }, 'posts:read')).toBe(false)
    })

    it('returns true when user is owner', () => {
      const user: RBACUser = { id: '123', role: ROLES.USER }
      expect(canAccessResource(user, { userId: '123' }, 'posts:delete')).toBe(true)
    })

    it('returns true when user has permission (not owner)', () => {
      const user: RBACUser = { id: '456', role: ROLES.ADMIN }
      expect(canAccessResource(user, { userId: '123' }, 'posts:delete')).toBe(true)
    })

    it('returns false when user is not owner and lacks permission', () => {
      const user: RBACUser = { id: '456', role: ROLES.USER }
      expect(canAccessResource(user, { userId: '123' }, 'posts:delete')).toBe(false)
    })
  })

  describe('getRoleDisplayName()', () => {
    it('returns display name for USER', () => {
      expect(getRoleDisplayName(ROLES.USER)).toBe('User')
    })

    it('returns display name for MEMBER', () => {
      expect(getRoleDisplayName(ROLES.MEMBER)).toBe('Member')
    })

    it('returns display name for ADMIN', () => {
      expect(getRoleDisplayName(ROLES.ADMIN)).toBe('Admin')
    })

    it('returns display name for OWNER', () => {
      expect(getRoleDisplayName(ROLES.OWNER)).toBe('Owner')
    })

    it('returns role string for unknown role', () => {
      expect(getRoleDisplayName('unknown' as Role)).toBe('unknown')
    })
  })

  describe('getPermissionsForRole()', () => {
    it('returns permissions for USER role', () => {
      const perms = getPermissionsForRole(ROLES.USER)
      expect(perms).toContain('posts:read')
      expect(perms).not.toContain('posts:create')
    })

    it('returns permissions for MEMBER role', () => {
      const perms = getPermissionsForRole(ROLES.MEMBER)
      expect(perms).toContain('posts:read')
      expect(perms).toContain('posts:create')
      expect(perms).toContain('team:read')
    })

    it('returns permissions for ADMIN role', () => {
      const perms = getPermissionsForRole(ROLES.ADMIN)
      expect(perms).toContain('users:read')
      expect(perms).toContain('users:create')
      expect(perms).toContain('posts:delete')
    })

    it('returns permissions for OWNER role', () => {
      const perms = getPermissionsForRole(ROLES.OWNER)
      expect(perms).toContain('users:delete')
      expect(perms).toContain('billing:manage')
      expect(perms).toContain('settings:update')
      expect(perms).toContain('team:manage-roles')
    })
  })

  describe('requireRole()', () => {
    const mockRequest = new Request('http://localhost/api/test')

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('returns 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const result = await requireRole(mockRequest, ROLES.ADMIN)

      expect(result).toBeInstanceOf(Response)
      const response = result as Response
      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Authentication required')
    })

    it('returns 401 when session has no user', async () => {
      mockGetServerSession.mockResolvedValue({ expires: '2024-01-01' } as never)

      const result = await requireRole(mockRequest, ROLES.ADMIN)

      expect(result).toBeInstanceOf(Response)
      const response = result as Response
      expect(response.status).toBe(401)
    })

    it('returns 403 when user has insufficient role', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '123', email: 'user@test.com', role: ROLES.USER },
        expires: '2024-01-01',
      } as never)

      const result = await requireRole(mockRequest, ROLES.ADMIN)

      expect(result).toBeInstanceOf(Response)
      const response = result as Response
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.error).toBe('Insufficient permissions')
      expect(body.required).toBe(ROLES.ADMIN)
    })

    it('returns user when role is sufficient', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '123', email: 'admin@test.com', role: ROLES.ADMIN },
        expires: '2024-01-01',
      } as never)

      const result = await requireRole(mockRequest, ROLES.ADMIN)

      expect(result).not.toBeInstanceOf(Response)
      const user = result as RBACUser
      expect(user.id).toBe('123')
      expect(user.email).toBe('admin@test.com')
      expect(user.role).toBe(ROLES.ADMIN)
    })

    it('defaults to USER role when user has no role', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '123', email: 'test@test.com' },
        expires: '2024-01-01',
      } as never)

      const result = await requireRole(mockRequest, ROLES.USER)

      expect(result).not.toBeInstanceOf(Response)
      const user = result as RBACUser
      expect(user.role).toBe(ROLES.USER)
    })
  })

  describe('requirePermission()', () => {
    const mockRequest = new Request('http://localhost/api/test')

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('returns 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const result = await requirePermission(mockRequest, 'posts:create')

      expect(result).toBeInstanceOf(Response)
      const response = result as Response
      expect(response.status).toBe(401)
    })

    it('returns 403 when user lacks permission', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '123', email: 'user@test.com', role: ROLES.USER },
        expires: '2024-01-01',
      } as never)

      const result = await requirePermission(mockRequest, 'users:delete')

      expect(result).toBeInstanceOf(Response)
      const response = result as Response
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.error).toBe('Permission denied')
      expect(body.required).toBe('users:delete')
    })

    it('returns user when permission is granted', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: '123', email: 'admin@test.com', role: ROLES.ADMIN },
        expires: '2024-01-01',
      } as never)

      const result = await requirePermission(mockRequest, 'users:read')

      expect(result).not.toBeInstanceOf(Response)
      const user = result as RBACUser
      expect(user.id).toBe('123')
    })
  })
})
