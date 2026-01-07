import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { validateRegister, validateLogin } from '../utils/validation'
import type { AuthenticatedRequest } from '../types/express'
import { prisma } from '../lib/prisma'
import { env } from '../config/env'
import { logger } from '../lib/logger'
import { HttpStatus } from '../constants/http'
import { AuthConfig } from '../constants/auth'
import { errorResponses } from '../utils/responses'

interface PrismaError {
  code: string
  meta?: { target?: string[] }
}

function isPrismaUniqueConstraintError(error: unknown, field: string): boolean {
  if (!error || typeof error !== 'object') return false
  const prismaError = error as PrismaError
  return (
    prismaError.code === 'P2002' &&
    Array.isArray(prismaError.meta?.target) &&
    prismaError.meta.target.includes(field)
  )
}

export const register = async (req: Request, res: Response) => {
  try {
    const { error, value } = validateRegister(req.body)
    if (error) {
      return errorResponses.badRequest(res, error.details[0].message)
    }

    const { email, password, name } = value

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return errorResponses.resourceExists(res, 'user')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, AuthConfig.BCRYPT_SALT_ROUNDS)

    // Create user (database constraint handles uniqueness)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    // Generate JWT token (4 hour expiry - implement refresh tokens for longer sessions)
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: AuthConfig.JWT_EXPIRY,
    })

    return res.status(HttpStatus.CREATED).json({
      message: 'User created successfully',
      user,
      token,
    })
  } catch (error: unknown) {
    logger.error('Registration error', { error, requestId: req.requestId })

    if (isPrismaUniqueConstraintError(error, 'email')) {
      return errorResponses.badRequest(res, 'User with this email already exists')
    }

    return errorResponses.internalError(res)
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { error, value } = validateLogin(req.body)
    if (error) {
      return errorResponses.badRequest(res, error.details[0].message)
    }

    const { email, password } = value

    // Find user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return errorResponses.invalidCredentials(res)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return errorResponses.invalidCredentials(res)
    }

    // Generate JWT token (4 hour expiry - implement refresh tokens for longer sessions)
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: AuthConfig.JWT_EXPIRY,
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    logger.error('Login error', { error, requestId: req.requestId })
    return errorResponses.internalError(res)
  }
}

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (typeof req.userId !== 'number') {
      return errorResponses.unauthorized(res)
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    })

    if (!user) {
      return errorResponses.notFound(res, 'User not found')
    }

    return res.json({ user })
  } catch (error) {
    logger.error('Get profile error', { error, requestId: req.requestId })
    return errorResponses.internalError(res)
  }
}
