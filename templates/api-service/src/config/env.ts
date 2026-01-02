/**
 * Environment Variable Validation
 *
 * Validates required environment variables on application startup.
 * Fails fast in production with helpful error messages.
 */

import { logger } from '../lib/logger'

interface EnvConfig {
  NODE_ENV: string
  PORT: number
  DATABASE_URL: string
  JWT_SECRET: string
  CORS_ORIGIN: string
  TRUST_PROXY: boolean
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnvValidationError'
  }
}

/**
 * Validates a single environment variable.
 * Restricts keys to a known allowlist to avoid object injection patterns flagged by eslint-plugin-security.
 */
const ALLOWED_ENV_KEYS = new Set([
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'CORS_ORIGIN',
  'TRUST_PROXY',
])

function getEnvVar(
  key: string,
  options: {
    required?: boolean
    defaultValue?: string
    validate?: (value: string) => boolean
    errorMessage?: string
  } = {}
): string {
  if (!ALLOWED_ENV_KEYS.has(key)) {
    throw new EnvValidationError(
      `Unexpected environment variable requested: ${key}`
    )
  }
  const { required = true, defaultValue, validate, errorMessage } = options
  let value: string | undefined
  switch (key) {
    case 'NODE_ENV':
      value = process.env.NODE_ENV
      break
    case 'PORT':
      value = process.env.PORT
      break
    case 'DATABASE_URL':
      value = process.env.DATABASE_URL
      break
    case 'JWT_SECRET':
      value = process.env.JWT_SECRET
      break
    case 'CORS_ORIGIN':
      value = process.env.CORS_ORIGIN
      break
    case 'TRUST_PROXY':
      value = process.env.TRUST_PROXY
      break
  }

  // Check if variable is missing
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    if (required) {
      throw new EnvValidationError(
        `Missing required environment variable: ${key}\n` +
          `${errorMessage || `Please set ${key} in your .env file`}`
      )
    }
    return ''
  }

  // Run custom validation if provided
  if (validate && !validate(value)) {
    throw new EnvValidationError(
      `Invalid value for ${key}: ${value}\n` +
        `${errorMessage || `Please check ${key} in your .env file`}`
    )
  }

  return value
}

/**
 * Validates all required environment variables
 * Called once at application startup
 */
export function validateEnv(): EnvConfig {
  // Validate NODE_ENV
  const NODE_ENV = getEnvVar('NODE_ENV', {
    defaultValue: 'development',
    validate: val => ['development', 'production', 'test'].includes(val),
    errorMessage: 'NODE_ENV must be one of: development, production, test',
  })

  const isProduction = NODE_ENV === 'production'
  const isTest = NODE_ENV === 'test'

  // Validate PORT
  const portStr = getEnvVar('PORT', {
    required: false,
    defaultValue: '3000',
    validate: val =>
      !isNaN(Number(val)) && Number(val) > 0 && Number(val) < 65536,
    errorMessage: 'PORT must be a valid port number (1-65535)',
  })
  const PORT = Number(portStr)

  // Validate DATABASE_URL
  const DATABASE_URL = getEnvVar('DATABASE_URL', {
    validate: val => {
      // In test mode, allow SQLite URLs (file:...)
      if (isTest && val.startsWith('file:')) {
        return true
      }
      // Otherwise require PostgreSQL
      return val.startsWith('postgresql://') || val.startsWith('postgres://')
    },
    errorMessage: isTest
      ? 'DATABASE_URL must be a valid database connection string (postgresql://... or file:... for tests)'
      : 'DATABASE_URL must be a valid PostgreSQL connection string (postgresql://...)',
  })

  // Validate JWT_SECRET
  const JWT_SECRET = getEnvVar('JWT_SECRET', {
    validate: val => {
      if (isProduction) {
        // In production, require strong secret (min 32 chars)
        return val.length >= 32 && val !== 'replace-with-strong-secret'
      }
      // In development, just check it's not the example value
      return val !== 'replace-with-strong-secret'
    },
    errorMessage: isProduction
      ? 'JWT_SECRET must be at least 32 characters in production. Generate with: openssl rand -hex 32'
      : 'JWT_SECRET must be changed from the example value. Generate with: openssl rand -hex 32',
  })

  // Validate CORS_ORIGIN
  const CORS_ORIGIN = getEnvVar('CORS_ORIGIN', {
    required: !isTest, // Optional in test mode
    defaultValue: isTest ? 'http://localhost:3000' : undefined,
    validate: val => {
      // Allow '*' for development/test, require specific origins in production
      if (isProduction && val === '*') {
        return false
      }
      return (
        val === '*' || val.startsWith('http://') || val.startsWith('https://')
      )
    },
    errorMessage: isProduction
      ? 'CORS_ORIGIN must be a specific origin in production (not *). Example: https://yourdomain.com'
      : 'CORS_ORIGIN must be a valid origin. Example: http://localhost:3000',
  })

  const trustProxyStr = getEnvVar('TRUST_PROXY', {
    required: false,
    defaultValue: 'false',
    validate: val => ['true', 'false', '1', '0'].includes(val),
    errorMessage: 'TRUST_PROXY must be true/false or 1/0',
  })
  const TRUST_PROXY = trustProxyStr === 'true' || trustProxyStr === '1'

  // Log validation success
  logger.info('Environment variables validated successfully')
  if (isTest) {
    logger.info('Running in test mode - validations relaxed for testing')
  } else if (!isProduction) {
    logger.info('Running in development mode - some validations are relaxed')
  }

  return {
    NODE_ENV,
    PORT,
    DATABASE_URL,
    JWT_SECRET,
    CORS_ORIGIN,
    TRUST_PROXY,
  }
}

/**
 * Export validated environment configuration
 * This throws on startup if validation fails
 */
export const env = validateEnv()
