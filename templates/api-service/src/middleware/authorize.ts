/**
 * Role-Based Authorization Middleware
 *
 * Provides middleware for protecting routes based on user roles.
 * Uses centralized role hierarchy utilities for consistent permission checks.
 *
 * Usage:
 * - requireRole(Role.ADMIN) - Exact role match
 * - requireMinimumRole(Role.MODERATOR) - Moderator or higher
 * - requireAnyRole([Role.ADMIN, Role.MODERATOR]) - Any of the listed roles
 */

import { Request, Response, NextFunction } from 'express'
import { Role } from '@prisma/client'
import { hasMinimumRole, hasExactRole, hasAnyRole } from '../utils/roleHierarchy'
import { prisma } from '../lib/prisma'
import { HttpStatus } from '../constants/http'
import { errorResponses } from '../utils/responses'

interface AuthenticatedRequest extends Request {
  userId?: number
  userRole?: Role
}

type RoleCheckResult =
  | { success: true; role: Role }
  | { success: false; response: Response }

async function getUserRole(
  req: Request,
  res: Response
): Promise<RoleCheckResult> {
  const authReq = req as AuthenticatedRequest

  if (!authReq.userId) {
    return {
      success: false,
      response: errorResponses.unauthorized(res, 'Authentication required'),
    }
  }

  if (authReq.userRole) {
    return { success: true, role: authReq.userRole }
  }

  const user = await prisma.user.findUnique({
    where: { id: authReq.userId },
    select: { role: true },
  })

  if (!user) {
    return {
      success: false,
      response: errorResponses.unauthorized(res, 'User not found'),
    }
  }

  authReq.userRole = user.role
  return { success: true, role: user.role }
}

function forbiddenResponse(res: Response, message: string): Response {
  return res.status(HttpStatus.FORBIDDEN).json({
    error: 'Insufficient permissions',
    message,
  })
}

export function requireRole(requiredRole: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await getUserRole(req, res)
    if (!result.success) return result.response

    if (!hasExactRole(requiredRole, result.role)) {
      return forbiddenResponse(res, `This action requires ${requiredRole} role`)
    }

    return next()
  }
}

export function requireMinimumRole(minimumRole: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await getUserRole(req, res)
    if (!result.success) return result.response

    if (!hasMinimumRole(minimumRole, result.role)) {
      return forbiddenResponse(
        res,
        `This action requires at least ${minimumRole} role`
      )
    }

    return next()
  }
}

export function requireAnyRole(allowedRoles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await getUserRole(req, res)
    if (!result.success) return result.response

    if (!hasAnyRole(allowedRoles, result.role)) {
      return forbiddenResponse(
        res,
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      )
    }

    return next()
  }
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole(Role.ADMIN)

/**
 * Middleware to require moderator or admin role
 */
export const requireModerator = requireMinimumRole(Role.MODERATOR)
