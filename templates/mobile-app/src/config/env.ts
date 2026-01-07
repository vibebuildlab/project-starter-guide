/**
 * Environment Configuration
 *
 * Access environment variables defined in .env files
 * All public env vars must be prefixed with EXPO_PUBLIC_
 */

export const config = {
  // API Configuration
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',

  // Feature Flags (parse error = empty object, always logged as error)
  featureFlags: (() => {
    const raw = process.env.EXPO_PUBLIC_FEATURE_FLAGS || '{}'
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {}
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      const errorName = error instanceof Error ? error.constructor.name : 'UnknownError'

      // Always log as error - invalid feature flags break functionality
      console.error('[Config] CRITICAL: Failed to parse EXPO_PUBLIC_FEATURE_FLAGS', {
        error: errorMsg,
        errorType: errorName,
        rawValue: raw,
        environment: process.env.NODE_ENV,
      })

      console.error(
        '\n⚠️  Feature flags are disabled due to parse error!\n' +
        `   Raw value: ${raw}\n` +
        `   Error: ${errorMsg}\n` +
        '\n💡 Fix:\n' +
        '   • Verify EXPO_PUBLIC_FEATURE_FLAGS is valid JSON\n' +
        '   • Example: EXPO_PUBLIC_FEATURE_FLAGS=\'{"newUI":true,"beta":false}\'\n' +
        '   • Check for unescaped quotes or trailing commas\n'
      )

      // In production, this should potentially crash or show user notification
      // since features may be silently disabled, confusing users
      if (process.env.NODE_ENV === 'production') {
        console.error('   🚨 PRODUCTION: All feature flags are disabled!')
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
