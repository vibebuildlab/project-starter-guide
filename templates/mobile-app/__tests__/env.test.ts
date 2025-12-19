/**
 * Tests for environment configuration
 */

describe('env config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('config object', () => {
    it('uses default API URL when not set', () => {
      delete process.env.EXPO_PUBLIC_API_URL
      const { config } = require('../src/config/env')
      expect(config.apiUrl).toBe('https://api.example.com')
    })

    it('uses custom API URL when set', () => {
      process.env.EXPO_PUBLIC_API_URL = 'https://custom.api.com'
      const { config } = require('../src/config/env')
      expect(config.apiUrl).toBe('https://custom.api.com')
    })

    it('parses feature flags from JSON', () => {
      process.env.EXPO_PUBLIC_FEATURE_FLAGS = '{"newFeature": true}'
      const { config } = require('../src/config/env')
      expect(config.featureFlags).toEqual({ newFeature: true })
    })

    it('returns empty object for invalid feature flags JSON', () => {
      process.env.EXPO_PUBLIC_FEATURE_FLAGS = 'invalid json {'
      const { config } = require('../src/config/env')
      expect(config.featureFlags).toEqual({})
    })

    it('returns empty object for non-object feature flags JSON', () => {
      process.env.EXPO_PUBLIC_FEATURE_FLAGS = '"enabled"'
      const { config } = require('../src/config/env')
      expect(config.featureFlags).toEqual({})
    })

    it('returns empty object when feature flags not set', () => {
      delete process.env.EXPO_PUBLIC_FEATURE_FLAGS
      const { config } = require('../src/config/env')
      expect(config.featureFlags).toEqual({})
    })

    it('detects development environment', () => {
      process.env.NODE_ENV = 'development'
      const { config } = require('../src/config/env')
      expect(config.isDevelopment).toBe(true)
      expect(config.isProduction).toBe(false)
    })

    it('detects production environment', () => {
      process.env.NODE_ENV = 'production'
      const { config } = require('../src/config/env')
      expect(config.isDevelopment).toBe(false)
      expect(config.isProduction).toBe(true)
    })

    it('uses empty string for Sentry DSN when not set', () => {
      delete process.env.EXPO_PUBLIC_SENTRY_DSN
      const { config } = require('../src/config/env')
      expect(config.sentryDsn).toBe('')
    })

    it('uses custom Sentry DSN when set', () => {
      process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://sentry.io/123'
      const { config } = require('../src/config/env')
      expect(config.sentryDsn).toBe('https://sentry.io/123')
    })
  })

  describe('isFeatureEnabled', () => {
    it('returns true for enabled feature', () => {
      process.env.EXPO_PUBLIC_FEATURE_FLAGS = '{"testFeature": true}'
      const { isFeatureEnabled } = require('../src/config/env')
      expect(isFeatureEnabled('testFeature')).toBe(true)
    })

    it('returns false for disabled feature', () => {
      process.env.EXPO_PUBLIC_FEATURE_FLAGS = '{"testFeature": false}'
      const { isFeatureEnabled } = require('../src/config/env')
      expect(isFeatureEnabled('testFeature')).toBe(false)
    })

    it('returns false for non-existent feature', () => {
      process.env.EXPO_PUBLIC_FEATURE_FLAGS = '{}'
      const { isFeatureEnabled } = require('../src/config/env')
      expect(isFeatureEnabled('nonExistent')).toBe(false)
    })

    it('returns false for non-boolean feature value', () => {
      process.env.EXPO_PUBLIC_FEATURE_FLAGS = '{"testFeature": "yes"}'
      const { isFeatureEnabled } = require('../src/config/env')
      expect(isFeatureEnabled('testFeature')).toBe(false)
    })
  })

  describe('development logging', () => {
    it('logs config in development mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      process.env.NODE_ENV = 'development'
      process.env.EXPO_PUBLIC_API_URL = 'https://dev.api.com'

      require('../src/config/env')

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Config] Environment configuration loaded:',
        expect.objectContaining({
          apiUrl: 'https://dev.api.com',
        })
      )

      consoleSpy.mockRestore()
    })

    it('does not log config in production mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      process.env.NODE_ENV = 'production'

      require('../src/config/env')

      expect(consoleSpy).not.toHaveBeenCalledWith(
        '[Config] Environment configuration loaded:',
        expect.anything()
      )

      consoleSpy.mockRestore()
    })
  })
})
