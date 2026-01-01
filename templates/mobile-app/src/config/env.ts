/**
 * Environment Configuration
 *
 * Access environment variables defined in .env files
 * All public env vars must be prefixed with EXPO_PUBLIC_
 */

export const config = {
  // API Configuration
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',

  // Feature Flags (parse error = empty object, logged as error in production)
  featureFlags: (() => {
    const raw = process.env.EXPO_PUBLIC_FEATURE_FLAGS || '{}'
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {}
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[Config] CRITICAL: Failed to parse EXPO_PUBLIC_FEATURE_FLAGS:', raw, error)
      } else {
        console.warn('[Config] Failed to parse EXPO_PUBLIC_FEATURE_FLAGS, using empty defaults:', error)
      }
      return {}
    }
  })(),

  // Sentry Configuration (optional)
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}

// Type-safe feature flag access
export const isFeatureEnabled = (feature: string): boolean => {
  if (!Object.prototype.hasOwnProperty.call(config.featureFlags, feature)) {
    return false
  }
  const entries = Object.entries(config.featureFlags) as [string, boolean][]
  const match = entries.find(([key]) => key === feature)
  return match?.[1] === true
}

// Log configuration in development
if (config.isDevelopment) {
  console.log('[Config] Environment configuration loaded:', {
    apiUrl: config.apiUrl,
    featureFlags: config.featureFlags,
    hasSentry: !!config.sentryDsn,
  })
}
