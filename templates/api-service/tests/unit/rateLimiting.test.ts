import { Request, Response } from 'express'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  createRateLimiter,
  skipForTrustedIPs,
  rateLimitHandler,
  trustedIPs,
  getClientIP,
  getUserKey,
  skipInTest,
  standardMessage,
} from '../../src/middleware/rateLimiting'

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    trustedIPs.clear()
  })

  describe('getClientIP', () => {
    it('returns req.ip when available', () => {
      const req = {
        ip: '192.168.1.100',
        socket: { remoteAddress: '10.0.0.1' },
      } as unknown as Request

      expect(getClientIP(req)).toBe('192.168.1.100')
    })

    it('falls back to socket.remoteAddress when req.ip is undefined', () => {
      const req = {
        ip: undefined,
        socket: { remoteAddress: '10.0.0.1' },
      } as unknown as Request

      expect(getClientIP(req)).toBe('10.0.0.1')
    })

    it('returns unknown when no IP available', () => {
      const req = {
        ip: undefined,
        socket: { remoteAddress: undefined },
      } as unknown as Request

      expect(getClientIP(req)).toBe('unknown')
    })
  })

  describe('getUserKey', () => {
    it('returns user:userId when user is authenticated', () => {
      const req = {
        user: { userId: 123, email: 'test@example.com' },
        ip: '192.168.1.1',
      } as unknown as Request & { user?: { userId: number; email?: string } }

      expect(getUserKey(req)).toBe('user:123')
    })

    it('falls back to IP when user is not authenticated', () => {
      const req = {
        user: undefined,
        ip: '192.168.1.1',
      } as unknown as Request & { user?: { userId: number; email?: string } }

      expect(getUserKey(req)).toBe('192.168.1.1')
    })

    it('falls back to IP when user object exists but has no userId', () => {
      const req = {
        user: { email: 'test@example.com' },
        ip: '10.0.0.5',
      } as unknown as Request

      expect(getUserKey(req)).toBe('10.0.0.5')
    })
  })

  describe('skipInTest', () => {
    it('returns true in test environment', () => {
      expect(skipInTest()).toBe(true)
    })
  })

  describe('standardMessage', () => {
    it('has expected structure', () => {
      expect(standardMessage).toEqual({
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: 'See Retry-After header for wait time in seconds',
      })
    })
  })

  describe('createRateLimiter', () => {
    it('creates a rate limiter with custom options', () => {
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 10,
      })

      expect(limiter).toBeDefined()
      expect(typeof limiter).toBe('function')
    })

    it('creates a rate limiter with default message', () => {
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 5,
      })

      expect(limiter).toBeDefined()
    })

    it('allows overriding default message', () => {
      const customMessage = { error: 'Custom error' }
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 5,
        message: customMessage,
      })

      expect(limiter).toBeDefined()
    })
  })

  describe('skipForTrustedIPs', () => {
    it('returns false for unknown IP', () => {
      const req = {
        ip: '192.168.1.1',
        socket: { remoteAddress: '192.168.1.1' },
      } as unknown as Request

      expect(skipForTrustedIPs(req)).toBe(false)
    })

    it('returns true for trusted IP', () => {
      trustedIPs.add('10.0.0.1')

      const req = {
        ip: '10.0.0.1',
        socket: { remoteAddress: '10.0.0.1' },
      } as unknown as Request

      expect(skipForTrustedIPs(req)).toBe(true)
    })

    it('falls back to socket.remoteAddress when req.ip is undefined', () => {
      trustedIPs.add('172.16.0.1')

      const req = {
        ip: undefined,
        socket: { remoteAddress: '172.16.0.1' },
      } as unknown as Request

      expect(skipForTrustedIPs(req)).toBe(true)
    })

    it('returns false when no IP is available', () => {
      const req = {
        ip: undefined,
        socket: { remoteAddress: undefined },
      } as unknown as Request

      expect(skipForTrustedIPs(req)).toBe(false)
    })

    it('handles multiple trusted IPs', () => {
      trustedIPs.add('10.0.0.1')
      trustedIPs.add('10.0.0.2')
      trustedIPs.add('10.0.0.3')

      const req1 = { ip: '10.0.0.1' } as unknown as Request
      const req2 = { ip: '10.0.0.2' } as unknown as Request
      const req3 = { ip: '10.0.0.4' } as unknown as Request

      expect(skipForTrustedIPs(req1)).toBe(true)
      expect(skipForTrustedIPs(req2)).toBe(true)
      expect(skipForTrustedIPs(req3)).toBe(false)
    })
  })

  describe('rateLimitHandler', () => {
    it('returns 429 status with JSON body', () => {
      const req = {} as Request
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        getHeader: vi.fn().mockReturnValue('60'),
      } as unknown as Response

      const result = rateLimitHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(429)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Rate limit exceeded',
        message: 'You have made too many requests. Please wait before trying again.',
        retryAfter: '60',
      })
      expect(result).toBe(res)
    })

    it('includes Retry-After from response header', () => {
      const req = {} as Request
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        getHeader: vi.fn().mockReturnValue('120'),
      } as unknown as Response

      rateLimitHandler(req, res)

      expect(res.getHeader).toHaveBeenCalledWith('Retry-After')
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ retryAfter: '120' })
      )
    })

    it('handles missing Retry-After header', () => {
      const req = {} as Request
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        getHeader: vi.fn().mockReturnValue(undefined),
      } as unknown as Response

      rateLimitHandler(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ retryAfter: undefined })
      )
    })
  })

  describe('trustedIPs Set', () => {
    it('starts empty by default', () => {
      expect(trustedIPs.size).toBe(0)
    })

    it('can add and remove IPs', () => {
      trustedIPs.add('10.0.0.1')
      expect(trustedIPs.has('10.0.0.1')).toBe(true)

      trustedIPs.delete('10.0.0.1')
      expect(trustedIPs.has('10.0.0.1')).toBe(false)
    })
  })
})
