/**
 * SSRF (Server-Side Request Forgery) Protection Middleware
 *
 * Validates and sanitizes URLs before making external requests.
 * Use this middleware to protect any endpoint that fetches external resources.
 *
 * Features:
 * - Blocks private/internal IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x)
 * - Blocks localhost and loopback addresses
 * - Blocks reserved/special IP ranges
 * - Validates URL format and protocol
 * - Configurable allowed domains whitelist
 * - DNS rebinding protection via IP validation
 */

import { Request, Response, NextFunction } from 'express'
import dns from 'dns'
import http from 'http'
import https from 'https'
import net from 'net'
import { logger } from '../lib/logger'
import { URL } from 'url'

// Private and reserved IP ranges that should be blocked
const BLOCKED_IP_RANGES = [
  // Private networks (RFC 1918)
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  // Loopback
  /^127\./,
  // Link-local
  /^169\.254\./,
  // Carrier-grade NAT
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./,
  // "This host" / unspecified (0.0.0.0/8)
  /^0\./,
  // Reserved for documentation
  /^192\.0\.2\./,
  /^198\.51\.100\./,
  /^203\.0\.113\./,
  // IPv6 mapped IPv4 localhost
  /^::1$/,
  /^::$/,
  /^0:0:0:0:0:0:0:1$/,
  /^0:0:0:0:0:0:0:0$/,
  // IPv6 private and link-local ranges
  /^fc00:/i,
  /^fd00:/i,
  /^fe80:/i,
  // IPv6 mapped IPv4 (private ranges)
  /^::ffff:10\./i,
  /^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\./i,
  /^::ffff:192\.168\./i,
  /^::ffff:127\./i,
  /^::ffff:0\./i,
]

const METADATA_IP_RANGES = [/^169\.254\.169\.254$/]

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'kubernetes.default',
  'kubernetes.default.svc',
]

const METADATA_HOSTNAMES = ['metadata.google.internal', 'metadata']

// Allowed protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:']

// Blocked ports (commonly used for internal services)
const BLOCKED_PORTS = [22, 25, 3306, 5432, 6379, 27017, 9200, 9300]
const DNS_LOOKUP_TIMEOUT_MS = 2000

interface SSRFOptions {
  allowedDomains?: string[]
  allowedPorts?: number[]
  blockPrivateIPs?: boolean
  blockMetadataEndpoints?: boolean
}

const defaultOptions: SSRFOptions = {
  allowedDomains: [],
  allowedPorts: undefined,
  blockPrivateIPs: true,
  blockMetadataEndpoints: true,
}

/**
 * Check if an IP address is in a blocked range
 */
function isBlockedIP(ip: string, blockMetadataEndpoints: boolean): boolean {
  const ranges = blockMetadataEndpoints
    ? [...BLOCKED_IP_RANGES, ...METADATA_IP_RANGES]
    : BLOCKED_IP_RANGES
  return ranges.some(pattern => pattern.test(ip))
}

/**
 * Check if a hostname is blocked
 */
function isBlockedHostname(
  hostname: string,
  blockMetadataEndpoints: boolean
): boolean {
  const lowerHostname = hostname.toLowerCase()
  const blocked = blockMetadataEndpoints
    ? [...BLOCKED_HOSTNAMES, ...METADATA_HOSTNAMES]
    : BLOCKED_HOSTNAMES
  return blocked.some(
    blocked =>
      lowerHostname === blocked || lowerHostname.endsWith(`.${blocked}`)
  )
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('DNS lookup timeout'))
    }, timeoutMs)

    promise
      .then(value => {
        clearTimeout(timeoutId)
        resolve(value)
      })
      .catch(error => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

function createPinnedLookup(addresses: string[]) {
  let index = 0
  return (
    _hostname: string,
    _options: unknown,
    callback: (err: Error | null, address: string, family: number) => void
  ) => {
    const address = addresses[index % addresses.length]
    index += 1
    callback(null, address, net.isIP(address))
  }
}

export function createPinnedAgent(url: URL, resolvedAddresses?: string[]) {
  if (!resolvedAddresses || resolvedAddresses.length === 0) {
    return undefined
  }

  const lookup = createPinnedLookup(resolvedAddresses)
  if (url.protocol === 'https:') {
    return new https.Agent({ lookup, servername: url.hostname })
  }
  return new http.Agent({ lookup })
}

/**
 * Validate a URL for SSRF vulnerabilities
 */
export async function validateURL(
  urlString: string,
  options: SSRFOptions = {}
): Promise<{
  valid: boolean
  error?: string
  url?: URL
  resolvedAddresses?: string[]
}> {
  const opts = { ...defaultOptions, ...options }

  try {
    const url = new URL(urlString)

    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
      return { valid: false, error: `Protocol ${url.protocol} is not allowed` }
    }

    // Check hostname
    if (isBlockedHostname(url.hostname, opts.blockMetadataEndpoints ?? true)) {
      return { valid: false, error: 'Hostname is blocked' }
    }

    // Check port
    const port = url.port
      ? parseInt(url.port, 10)
      : url.protocol === 'https:'
        ? 443
        : 80
    if (BLOCKED_PORTS.includes(port)) {
      return { valid: false, error: `Port ${port} is blocked` }
    }
    if (opts.allowedPorts && !opts.allowedPorts.includes(port)) {
      return { valid: false, error: `Port ${port} is not allowed` }
    }

    // Check allowed domains whitelist
    if (opts.allowedDomains && opts.allowedDomains.length > 0) {
      const isAllowed = opts.allowedDomains.some(
        domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      )
      if (!isAllowed) {
        return { valid: false, error: 'Domain not in allowed list' }
      }
    }

    // DNS resolution check - validates the actual IP address
    let resolvedAddresses: string[] | undefined
    if (opts.blockPrivateIPs) {
      try {
        const addresses = await withTimeout(
          dns.promises.lookup(url.hostname, { all: true }),
          DNS_LOOKUP_TIMEOUT_MS
        )
        if (
          addresses.some(({ address }) =>
            isBlockedIP(address, opts.blockMetadataEndpoints ?? true)
          )
        ) {
          return { valid: false, error: 'URL resolves to a blocked IP address' }
        }
        resolvedAddresses = addresses.map(({ address }) => address)
      } catch (err) {
        logger.error('[SSRF] DNS resolution failed', {
          hostname: url.hostname,
          error: err,
        })
        return { valid: false, error: 'Failed to resolve hostname' }
      }
    }

    return { valid: true, url, resolvedAddresses }
  } catch (err) {
    logger.error('[SSRF] URL validation failed', { urlString, error: err })
    return { valid: false, error: 'Invalid URL format' }
  }
}

/**
 * Express middleware to validate URLs in request body or query
 * Expects { url: string } in request body or query params
 */
export function ssrfProtection(options: SSRFOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const urlToValidate = req.body?.url || req.query?.url

    if (!urlToValidate || Array.isArray(urlToValidate)) {
      return next()
    }

    const result = await validateURL(urlToValidate, options)

    if (!result.valid) {
      return res.status(400).json({
        error: 'Invalid URL',
        details: result.error,
      })
    }

    // Attach validated URL to request object (not req.body which may be undefined)
    // Use a custom property that doesn't depend on body-parser being mounted
    const reqWithUrl = req as Request & {
      validatedUrl?: URL
      validatedUrlAddresses?: string[]
      validatedUrlAgent?: http.Agent | https.Agent
    }
    reqWithUrl.validatedUrl = result.url
    reqWithUrl.validatedUrlAddresses = result.resolvedAddresses
    reqWithUrl.validatedUrlAgent = result.url
      ? createPinnedAgent(result.url, result.resolvedAddresses)
      : undefined
    next()
  }
}

/**
 * Utility function for direct URL validation in controllers
 * @example
 * const { valid, url, error } = await validateExternalURL(userProvidedUrl)
 * if (!valid) throw new Error(error)
 * const response = await fetch(url.toString())
 */
export async function validateExternalURL(
  urlString: string,
  allowedDomains?: string[]
): Promise<{ valid: boolean; url?: URL; error?: string }> {
  return validateURL(urlString, {
    allowedDomains,
    blockPrivateIPs: true,
    blockMetadataEndpoints: true,
  })
}

export default ssrfProtection
