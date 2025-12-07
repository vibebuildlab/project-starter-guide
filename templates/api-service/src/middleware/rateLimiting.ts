/**
 * Advanced Rate Limiting Configuration
 *
 * Provides multiple rate limiting strategies for different use cases:
 * - Global rate limiting (applied to all routes)
 * - Auth-specific rate limiting (stricter limits for login/register)
 * - API-specific rate limiting (for expensive operations)
 * - Per-user rate limiting (based on authenticated user ID)
 *
 * Features:
 * - Configurable windows and limits
 * - Skip options for trusted IPs
 * - Custom key generators for user-based limiting
 * - Standardized error responses
 */

import rateLimit, { Options } from 'express-rate-limit'
import { Request, Response } from 'express'

// Extend Express Request to include user property from auth middleware
interface AuthenticatedRequest extends Request {
  user?: { userId: number; email?: string }
}

/**
 * Skip rate limiting in test environment
 * This allows integration tests to run without hitting rate limits
 */
const isTestEnvironment = process.env.NODE_ENV === 'test'
const skipInTest = (): boolean => isTestEnvironment

/**
 * Standard rate limit response format
 */
const standardMessage = {
  error: 'Too many requests',
  message: 'You have exceeded the rate limit. Please try again later.',
  retryAfter: 'See Retry-After header for wait time in seconds',
}

/**
 * Global rate limiter - Applied to all routes
 * 100 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: standardMessage,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  skip: skipInTest,
  keyGenerator: (req: Request) => {
    // Use X-Forwarded-For header if behind proxy, otherwise use IP
    return (req.ip || req.socket.remoteAddress || 'unknown') as string
  },
})

/**
 * Auth rate limiter - Stricter limits for authentication endpoints
 * 5 failed attempts per 15 minutes per IP
 * Helps prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    retryAfter: 'See Retry-After header',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  skip: skipInTest,
  keyGenerator: (req: Request) => {
    return (req.ip || req.socket.remoteAddress || 'unknown') as string
  },
})

/**
 * Registration rate limiter - Prevent account creation spam
 * 3 registrations per hour per IP
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many accounts created',
    message: 'Too many accounts created from this IP. Please try again after an hour.',
    retryAfter: 'See Retry-After header',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
})

/**
 * API rate limiter - For expensive/resource-intensive endpoints
 * 10 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'API rate limit exceeded',
    message: 'Too many API requests. Please slow down.',
    retryAfter: 'See Retry-After header',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
})

/**
 * Per-user rate limiter - Limits based on authenticated user ID
 * 1000 requests per hour per user
 * Falls back to IP if user is not authenticated
 */
export const userLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: standardMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  keyGenerator: (req: AuthenticatedRequest) => {
    // Use user ID if authenticated, otherwise fall back to IP
    if (req.user?.userId) {
      return `user:${req.user.userId}`
    }
    return (req.ip || req.socket.remoteAddress || 'unknown') as string
  },
})

/**
 * Create a custom rate limiter with specific configuration
 */
export function createRateLimiter(options: Partial<Options>) {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    message: standardMessage,
    ...options,
  })
}

/**
 * Skip rate limiting for specific IPs (e.g., internal services, load balancers)
 */
export const trustedIPs = new Set<string>([
  // Add trusted IPs here
  // '10.0.0.1',
])

export function skipForTrustedIPs(req: Request): boolean {
  const ip = req.ip || req.socket.remoteAddress
  return ip ? trustedIPs.has(ip) : false
}

/**
 * Rate limit handler for custom error responses
 */
export function rateLimitHandler(
  _req: Request,
  res: Response
): Response {
  return res.status(429).json({
    error: 'Rate limit exceeded',
    message: 'You have made too many requests. Please wait before trying again.',
    retryAfter: res.getHeader('Retry-After'),
  })
}

export default {
  globalLimiter,
  authLimiter,
  registrationLimiter,
  apiLimiter,
  userLimiter,
  createRateLimiter,
  skipForTrustedIPs,
  rateLimitHandler,
}
