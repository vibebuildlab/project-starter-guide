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
 * - Redis support for distributed rate limiting (multi-instance deployments)
 *
 * IMPORTANT: For production multi-instance deployments, configure Redis:
 *   Set REDIS_URL environment variable to enable distributed rate limiting
 *   Example: REDIS_URL=redis://localhost:6379
 */

import rateLimit, { Options } from 'express-rate-limit'
import { Request, Response } from 'express'
import { RedisStore, type RedisReply, type SendCommandFn } from 'rate-limit-redis'
import { createClient } from 'redis'
import { RateLimits } from '../constants/rateLimit'
import { HttpStatus } from '../constants/http'

// Extend Express Request to include user property from auth middleware
interface AuthenticatedRequest extends Request {
  userId?: number
}

/**
 * Skip rate limiting in test environment
 * This allows integration tests to run without hitting rate limits
 */
const isTestEnvironment = process.env.NODE_ENV === 'test'
export const skipInTest = (): boolean => isTestEnvironment

/**
 * Standard rate limit response format
 */
export const standardMessage = {
  error: 'Too many requests',
  message: 'You have exceeded the rate limit. Please try again later.',
  retryAfter: 'See Retry-After header for wait time in seconds',
}

/**
 * Extract client IP from request
 * Used by rate limiters as key generator
 */
export function getClientIP(req: Request): string {
  return (req.ip || req.socket.remoteAddress || 'unknown') as string
}

/**
 * Extract user ID or fall back to IP
 * Used by user-based rate limiter
 */
export function getUserKey(req: AuthenticatedRequest): string {
  if (req.userId) {
    return `user:${req.userId}`
  }
  return getClientIP(req)
}

/**
 * Create Redis store for distributed rate limiting
 * Only used when REDIS_URL is configured
 */
function createRedisStore() {
  if (!process.env.REDIS_URL) {
    return undefined // Use in-memory store
  }

  try {
    const client = createClient({ url: process.env.REDIS_URL })
    client.connect().catch((err: Error) => {
      const errorMsg = err instanceof Error ? err.message : String(err)
      const errorName = err instanceof Error ? err.constructor.name : 'UnknownError'

      console.error('[RateLimit] CRITICAL: Failed to connect to Redis', {
        error: errorMsg,
        errorType: errorName,
        redisUrl: process.env.REDIS_URL ? '***configured***' : 'missing',
        stack: err instanceof Error ? err.stack : undefined,
      })

      // Alert operators immediately with actionable steps
      console.error(
        '\n🚨 CRITICAL: Redis connection failed\n' +
        `   Error: ${errorMsg} (${errorName})\n` +
        '   Impact: Falling back to in-memory rate limiting\n' +
        '   ⚠️  WARNING: In-memory rate limiting does NOT work across multiple instances!\n' +
        '   This means rate limits are per-instance, allowing bypass via load balancer.\n' +
        '\n💡 Troubleshooting:\n' +
        '   • Verify REDIS_URL is set and correct\n' +
        '   • Check Redis server is running and accessible\n' +
        '   • Verify network connectivity and firewall rules\n' +
        '   • Check Redis authentication credentials\n'
      )
    })

    const sendCommand: SendCommandFn = async (...args: string[]) => {
      const reply = await client.sendCommand(args)
      return (reply ?? 0) as RedisReply
    }
    return new RedisStore({ sendCommand, prefix: 'rl:' })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.constructor.name : 'UnknownError'

    console.error('[RateLimit] CRITICAL: Failed to configure Redis rate limiting', {
      error: errorMsg,
      errorType: errorName,
      redisUrl: process.env.REDIS_URL ? '***configured***' : 'missing',
      stack: error instanceof Error ? error.stack : undefined,
    })
    console.error(
      '[RateLimit] Falling back to in-memory store. This is NOT safe for production multi-instance deployments!'
    )
    return undefined
  }
}

const store = createRedisStore()

if (!store && process.env.NODE_ENV === 'production') {
  throw new Error(
    '[RateLimit] FATAL: Redis is required in production for distributed rate limiting. ' +
      'Set REDIS_URL environment variable. ' +
      'Example: REDIS_URL=redis://localhost:6379'
  )
}

/**
 * Global rate limiter - Applied to all routes
 * 100 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  store,
  windowMs: RateLimits.WINDOW_MS,
  max: RateLimits.GLOBAL_MAX,
  message: standardMessage,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  skip: skipInTest,
  keyGenerator: getClientIP,
})

/**
 * Auth rate limiter - Stricter limits for authentication endpoints
 * 5 failed attempts per 15 minutes per IP
 * Helps prevent brute force attacks
 */
export const authLimiter = rateLimit({
  store,
  windowMs: RateLimits.WINDOW_MS,
  max: RateLimits.AUTH_MAX,
  message: {
    error: 'Too many authentication attempts',
    message:
      'Too many login attempts from this IP. Please try again after 15 minutes.',
    retryAfter: 'See Retry-After header',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  skip: skipInTest,
  keyGenerator: getClientIP,
})

/**
 * Registration rate limiter - Prevent account creation spam
 * 3 registrations per hour per IP
 */
export const registrationLimiter = rateLimit({
  store,
  windowMs: RateLimits.REGISTRATION_WINDOW_MS,
  max: RateLimits.REGISTRATION_MAX,
  message: {
    error: 'Too many accounts created',
    message:
      'Too many accounts created from this IP. Please try again after an hour.',
    retryAfter: 'See Retry-After header',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  keyGenerator: getClientIP,
})

/**
 * Per-user rate limiter for /fetch endpoint
 * 100 requests per hour per user (prevents abuse as proxy service)
 * Falls back to IP-based limiting for unauthenticated requests
 */
export const fetchLimiter = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    error: 'Fetch rate limit exceeded',
    message:
      'You have made too many fetch requests. Please try again after an hour.',
    retryAfter: 'See Retry-After header',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  keyGenerator: getUserKey, // Uses user ID if authenticated, IP otherwise
})

/**
 * Create a custom rate limiter with specific configuration
 */
export function createRateLimiter(options: Partial<Options>) {
  return rateLimit({
    store,
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
export function rateLimitHandler(_req: Request, res: Response): Response {
  return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
    error: 'Rate limit exceeded',
    message:
      'You have made too many requests. Please wait before trying again.',
    retryAfter: res.getHeader('Retry-After'),
  })
}

export default {
  globalLimiter,
  authLimiter,
  registrationLimiter,
  fetchLimiter,
  createRateLimiter,
  skipForTrustedIPs,
  rateLimitHandler,
  getClientIP,
  getUserKey,
  skipInTest,
}
