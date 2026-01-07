/**
 * Licensing System for {{PROJECT_NAME}}
 * Handles free/starter/pro/enterprise tier validation
 *
 * Part of Project Starter Guide - SaaS Monetization Templates
 *
 * Copyright (c) 2025 Vibe Build Lab LLC
 * Licensed under MIT License
 *
 * Originally from saas-monetization-templates (VBL Internal)
 * Open sourced as part of project-starter-guide
 * Learn more: https://vibebuildlab.com
 *
 * Features:
 * - 4-tier licensing (FREE/STARTER/PRO/ENTERPRISE)
 * - Developer mode for tool creators
 * - Stripe-free user-side validation via LicenseValidator
 * - HMAC-SHA256 signature verification
 * - Environment variable overrides for testing
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')

// License storage locations - support environment variable override for testing
function getLicenseDir() {
  return (
    process.env.{{PROJECT_SLUG_UPPER}}_LICENSE_DIR ||
    path.join(os.homedir(), '.{{PROJECT_SLUG}}')
  )
}

function getLicenseFile() {
  return path.join(getLicenseDir(), 'license.json')
}

// Keep old constants for backward compatibility (but make them dynamic)
Object.defineProperty(exports, 'LICENSE_DIR', {
  get: getLicenseDir,
})
Object.defineProperty(exports, 'LICENSE_FILE', {
  get: getLicenseFile,
})

/**
 * License tiers
 *
 * Standardized to use SCREAMING_SNAKE_CASE for both keys and values
 * for consistency across the codebase.
 */
const LICENSE_TIERS = {
  FREE: 'FREE',
  STARTER: 'STARTER',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
}

/**
 * Feature definitions by tier
 *
 * CUSTOMIZE: Define your product's feature tiers here
 * Example based on create-qa-architect patterns
 */
const FEATURES = {
  [LICENSE_TIERS.FREE]: {
    // Free tier - essential features to attract users
    coreFeature: 'basic',
    apiCalls: 100,
    advancedFeatures: false,
    customIntegrations: false,
    prioritySupport: false,
    // Add product-specific flags:
    // smartFeature: false,
    // premiumAnalytics: false,
    roadmap: [
      '✅ Core functionality',
      '✅ Basic {{FEATURE_CATEGORY}}',
      '✅ Community support',
    ],
  },
  [LICENSE_TIERS.STARTER]: {
    // Starter tier - bridge between free and pro
    coreFeature: 'starter',
    apiCalls: 1000,
    advancedFeatures: false,
    customIntegrations: false,
    prioritySupport: false,
    // Add product-specific flags:
    // multiLanguage: true,
    // projectTypeDetection: true,
    roadmap: [
      '✅ All FREE features included',
      '✅ Extended API limits (1,000 calls)',
      '✅ {{STARTER_FEATURE_1}}',
      '✅ {{STARTER_FEATURE_2}}',
      'Email support (48-72h response)',
    ],
  },
  [LICENSE_TIERS.PRO]: {
    // Pro tier - power users and small teams
    coreFeature: 'premium',
    apiCalls: 10000,
    advancedFeatures: true,
    customIntegrations: false,
    prioritySupport: true,
    // Add product-specific flags:
    // smartFeature: true,
    // premiumAnalytics: true,
    // advancedSecurity: true,
    roadmap: [
      '✅ All STARTER features included',
      '✅ {{PRO_FEATURE_1}} - KEY DIFFERENTIATOR',
      '✅ {{PRO_FEATURE_2}}',
      '✅ {{PRO_FEATURE_3}}',
      'Priority support (24-48h response)',
      '🔄 {{FUTURE_FEATURE_1}} - Coming Q1 2026',
    ],
  },
  [LICENSE_TIERS.ENTERPRISE]: {
    // Enterprise tier - large organizations
    coreFeature: 'enterprise',
    apiCalls: 'unlimited',
    advancedFeatures: true,
    customIntegrations: true,
    prioritySupport: true,
    // Add product-specific flags:
    // multiRepo: true,
    // policyEnforcement: true,
    // customTemplates: true,
    // ssoIntegration: false, // Coming soon
    roadmap: [
      '✅ All PRO features included',
      '✅ {{ENTERPRISE_FEATURE_1}}',
      '✅ {{ENTERPRISE_FEATURE_2}}',
      '✅ {{ENTERPRISE_FEATURE_3}}',
      'Dedicated support with SLA (4-12h response)',
      '🔄 SSO/SCIM integration - Coming Q1 2026',
      '🔄 Audit trails - Coming Q1 2026',
    ],
  },
}

/**
 * Check if developer/owner mode is enabled
 * Allows the tool creator to use all features without a license
 */
function isDeveloperMode() {
  // Check environment variable
  if (process.env.{{PROJECT_SLUG_UPPER}}_DEVELOPER === 'true') {
    return true
  }

  // Check for marker file in license directory
  try {
    const developerMarkerFile = path.join(getLicenseDir(), '.{{PROJECT_SLUG}}-developer')
    if (fs.existsSync(developerMarkerFile)) {
      return true
    }
  } catch {
    // Ignore errors checking for marker file
  }

  return false
}

/**
 * Check if user has a valid license file (USER-FACING - NO STRIPE DEPENDENCIES)
 */
function getLicenseInfo() {
  try {
    // Developer/owner bypass - full PRO access without license
    if (isDeveloperMode()) {
      return {
        tier: LICENSE_TIERS.PRO,
        valid: true,
        email: 'developer@localhost',
        isDeveloper: true,
      }
    }

    const licenseFile = getLicenseFile()
    if (!fs.existsSync(licenseFile)) {
      return { tier: LICENSE_TIERS.FREE, valid: true }
    }

    const licenseData = JSON.parse(fs.readFileSync(licenseFile, 'utf8'))

    // Validate license structure (support both 'key' and 'licenseKey' for backward compatibility)
    const licenseKey = licenseData.licenseKey || licenseData.key
    if (!licenseData.tier || !licenseKey || !licenseData.email) {
      return {
        tier: LICENSE_TIERS.FREE,
        valid: true,
        error: 'Invalid license format',
      }
    }

    // Check expiration
    if (licenseData.expires && new Date(licenseData.expires) < new Date()) {
      return { tier: LICENSE_TIERS.FREE, valid: true, error: 'License expired' }
    }

    // Signature validation for newer licenses
    if (licenseData.payload && licenseData.signature) {
      // Validate signature using the same method as StripeIntegration
      if (verifyLicenseSignature(licenseData.payload, licenseData.signature)) {
        return {
          tier: licenseData.tier,
          valid: true,
          email: licenseData.email,
          expires: licenseData.expires,
          isFounder: licenseData.isFounder,
          customerId: licenseData.customerId,
          signed: true
        }
      } else {
        // Signature verification failed - treat as invalid
        return {
          tier: LICENSE_TIERS.FREE,
          valid: true,
          error: 'License signature verification failed - license may have been tampered with',
        }
      }
    }

    // Legacy license support (without signatures) - basic key validation only
    if (validateLicenseKey(licenseKey, licenseData.tier)) {
      return {
        tier: licenseData.tier,
        valid: true,
        email: licenseData.email,
        expires: licenseData.expires,
        legacy: true // Mark as legacy for upgrade prompts
      }
    } else {
      return {
        tier: LICENSE_TIERS.FREE,
        valid: true,
        error: 'Invalid license key',
      }
    }
  } catch (error) {
    return {
      tier: LICENSE_TIERS.FREE,
      valid: true,
      error: `License read error: ${error.message}`,
    }
  }
}

/**
 * License key validation with Stripe integration
 * Supports both legacy format and new Stripe-generated keys
 */
function validateLicenseKey(key, tier) {
  // New Stripe format: {{LICENSE_PREFIX}}-XXXX-XXXX-XXXX-XXXX
  const stripeFormat = /^{{LICENSE_PREFIX}}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/

  if (stripeFormat.test(key)) {
    // Stripe-generated key - always valid if properly formatted
    return true
  }

  // Legacy format validation for backward compatibility
  const expectedPrefix = `{{LICENSE_PREFIX}}-${tier.toUpperCase()}-`
  return key.startsWith(expectedPrefix) && key.length > 20
}

/**
 * Verify license signature using the same algorithm as StripeIntegration
 */
function verifyLicenseSignature(payload, signature) {
  try {
    const secret = process.env.LICENSE_SIGNING_SECRET || '{{PROJECT_SLUG}}-dev-secret-change-in-prod'
    if (process.env.NODE_ENV === 'production' && secret.includes('{{PROJECT_SLUG}}-dev-secret-change-in-prod')) {
      throw new Error('LICENSE_SIGNING_SECRET is required in production for secure license validation.')
    }
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    const sigBuffer = Buffer.from(signature || '', 'utf8')
    const expBuffer = Buffer.from(expectedSignature, 'utf8')
    if (sigBuffer.length !== expBuffer.length) return false
    return crypto.timingSafeEqual(sigBuffer, expBuffer)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.constructor.name : 'UnknownError'

    console.error('[License] CRITICAL: Signature verification failed', {
      error: errorMsg,
      errorType: errorName,
      hasSecret: !!process.env.LICENSE_SIGNING_SECRET,
      hasPayload: !!payload,
      hasSignature: !!signature,
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Log actionable troubleshooting steps
    if (!process.env.LICENSE_SIGNING_SECRET) {
      console.error(
        '\n⚠️  LICENSE_SIGNING_SECRET is not set!\n' +
        '   This is required for license validation.\n' +
        '   Set it in your .env file or environment variables.\n'
      )
    }

    // Production should fail closed (reject invalid signatures)
    // But we log WHY it failed for debugging
    return false
  }
}

/**
 * Check if a specific feature is available for current license
 */
function hasFeature(featureName) {
  const license = getLicenseInfo()
  const tierFeatures = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]
  return tierFeatures[featureName] || false
}

/**
 * Get the core feature level for current license
 */
function getCoreFeatureLevel() {
  const license = getLicenseInfo()
  const tierFeatures = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]
  return tierFeatures.coreFeature
}

/**
 * Get API call limit for current license
 */
function getApiLimit() {
  const license = getLicenseInfo()
  const tierFeatures = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]
  return tierFeatures.apiCalls
}

/**
 * Display upgrade message for premium features
 */
function showUpgradeMessage(feature) {
  const license = getLicenseInfo()
  const _tierFeatures = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]

  console.log(`\n🔒 ${feature} is a premium feature`)
  console.log(`📊 Current license: ${license.tier.toUpperCase()}`)

  if (license.tier === LICENSE_TIERS.FREE) {
    console.log('\n💎 Upgrade to Pro for premium features:')
    console.log('   • {{PRO_FEATURE_1}}')
    console.log('   • {{PRO_FEATURE_2}}')
    console.log('   • {{PRO_FEATURE_3}}')
    console.log('   • Priority email support')
    console.log('\n💰 Pricing:')
    console.log('   • Pro: ${{PRO_PRICE}}/month')
    console.log('   • Limited-time founder pricing: ${{PRO_FOUNDER_PRICE}}/month')
    console.log('\n🚀 Upgrade now: {{UPGRADE_URL}}')
    console.log('🔑 Activate license: {{CLI_ACTIVATE_COMMAND}}')
  } else if (license.tier === LICENSE_TIERS.PRO) {
    console.log('\n🏢 Enterprise tier features:')
    console.log('   • Everything in Pro')
    console.log('   • {{ENTERPRISE_FEATURE_1}}')
    console.log('   • {{ENTERPRISE_FEATURE_2}}')
    console.log('   • {{ENTERPRISE_FEATURE_3}}')
    console.log('\n💰 Pricing: ${{ENTERPRISE_PRICE}}/month')
    console.log('\n🏢 Upgrade: {{ENTERPRISE_UPGRADE_URL}}')
  }
}

/**
 * Save license information (for testing or license activation)
 */
function saveLicense(tier, key, email, expires = null) {
  try {
    if (!fs.existsSync(LICENSE_DIR)) {
      fs.mkdirSync(LICENSE_DIR, { recursive: true })
    }

    const licenseData = {
      tier,
      key,
      email,
      expires,
      activated: new Date().toISOString(),
    }

    fs.writeFileSync(LICENSE_FILE, JSON.stringify(licenseData, null, 2))
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Save license information with signature validation data
 */
function saveLicenseWithSignature(tier, key, email, validation) {
  try {
    if (!fs.existsSync(LICENSE_DIR)) {
      fs.mkdirSync(LICENSE_DIR, { recursive: true })
    }

    const licenseData = {
      tier,
      licenseKey: key,  // Use licenseKey field for consistency with StripeIntegration
      email,
      expires: validation.expires,
      activated: new Date().toISOString(),
      customerId: validation.customerId,
      isFounder: validation.isFounder,
      // Include validation payload and signature for security
      payload: validation.payload,
      signature: validation.signature,
      issued: validation.issued
    }

    fs.writeFileSync(LICENSE_FILE, JSON.stringify(licenseData, null, 2))
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Remove license (for testing)
 */
function removeLicense() {
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      fs.unlinkSync(LICENSE_FILE)
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Activate license from Stripe checkout
 */
async function activateLicense(licenseKey, email) {
  try {
    // Import Stripe integration
    const { StripeIntegration } = require('./stripe-integration')
    const stripe = new StripeIntegration()

    // Validate license key format
    if (!licenseKey.match(/^{{LICENSE_PREFIX}}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/)) {
      return { success: false, error: 'Invalid license key format' }
    }

    // Try to initialize Stripe for production validation
    const initialized = await stripe.initialize()

    if (!initialized) {
      console.log('⚠️ Stripe not configured - using development validation mode')
    }

    // Validate with Stripe (handles both production and development cases)
    const validation = await stripe.validateLicenseKey(licenseKey)

    if (validation.valid) {
      // Store license locally with full validation data
      const result = saveLicenseWithSignature(validation.tier, licenseKey, email, validation)

      if (result.success) {
        console.log('✅ License activated successfully!')
        console.log(`📋 Tier: ${validation.tier}`)
        console.log(`🎁 Founder: ${validation.isFounder ? 'Yes' : 'No'}`)
        console.log(`📧 Email: ${email}`)

        return {
          success: true,
          tier: validation.tier,
          isFounder: validation.isFounder
        }
      } else {
        return { success: false, error: 'Failed to store license' }
      }
    } else {
      // No insecure fallback - validation must succeed
      return {
        success: false,
        error: `License validation failed: ${validation.error || 'Invalid license key'}`
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.constructor.name : 'UnknownError'

    console.error('[License] Activation failed', {
      error: errorMsg,
      errorType: errorName,
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Distinguish transient failures (can retry) from permanent failures (cannot retry)
    const isTransientFailure =
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('ETIMEDOUT') ||
      errorMsg.includes('ENOTFOUND') ||
      errorMsg.includes('network') ||
      errorMsg.includes('timeout') ||
      errorMsg.includes('fetch failed')

    if (isTransientFailure) {
      return {
        success: false,
        error: `License activation failed due to network error: ${errorMsg}. Please check your internet connection and try again.`,
        retryable: true
      }
    }

    // Permanent failure - don't suggest retry
    return {
      success: false,
      error: `License activation failed: ${errorMsg}. Please verify your license key and email, or contact support.`,
      retryable: false
    }
  }
}

/**
 * Interactive license activation prompt
 */
async function promptLicenseActivation() {
  const readline = require('readline')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    console.log('\n🔑 License Activation')
    console.log('Enter your license key from the Stripe purchase confirmation email.\n')

    rl.question('License key ({{LICENSE_PREFIX}}-XXXX-XXXX-XXXX-XXXX): ', (licenseKey) => {
      if (!licenseKey.trim()) {
        console.log('❌ License key required')
        rl.close()
        resolve({ success: false })
        return
      }

      rl.question('Email address: ', async (email) => {
        if (!email.trim()) {
          console.log('❌ Email address required')
          rl.close()
          resolve({ success: false })
          return
        }

        rl.close()

        const result = await activateLicense(licenseKey.trim(), email.trim())
        resolve(result)
      })
    })
  })
}

/**
 * Enable developer mode by creating the marker file
 */
function enableDeveloperMode() {
  try {
    const licenseDir = getLicenseDir()
    const developerMarkerFile = path.join(licenseDir, '.{{PROJECT_SLUG}}-developer')

    if (!fs.existsSync(licenseDir)) {
      fs.mkdirSync(licenseDir, { recursive: true })
    }

    fs.writeFileSync(
      developerMarkerFile,
      `# {{PROJECT_NAME}} Developer Mode\n# Created: ${new Date().toISOString()}\n# This file grants full PRO access for development purposes.\n`
    )

    console.log('✅ Developer mode enabled')
    console.log(`   Marker file: ${developerMarkerFile}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Disable developer mode by removing the marker file
 */
function disableDeveloperMode() {
  try {
    const developerMarkerFile = path.join(getLicenseDir(), '.{{PROJECT_SLUG}}-developer')

    if (fs.existsSync(developerMarkerFile)) {
      fs.unlinkSync(developerMarkerFile)
    }

    console.log('✅ Developer mode disabled')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Display current license status
 */
function showLicenseStatus() {
  const license = getLicenseInfo()

  console.log('\n📋 License Status:')
  if (license.isDeveloper) {
    console.log('   Mode: 🛠️  DEVELOPER (full PRO access)')
  }
  console.log(`   Tier: ${license.tier.toUpperCase()}`)

  if (license.email) {
    console.log(`   Email: ${license.email}`)
  }

  if (license.expires) {
    console.log(`   Expires: ${license.expires}`)
  }

  if (license.error) {
    console.log(`   ⚠️  Issue: ${license.error}`)
  }

  console.log('\n🎯 Available Features:')
  const features = FEATURES[license.tier] || FEATURES[LICENSE_TIERS.FREE]
  console.log(`   Core Features: ${features.coreFeature}`)
  console.log(`   API Calls: ${features.apiCalls}`)
  console.log(
    `   Advanced Features: ${features.advancedFeatures ? '✅' : '❌'}`
  )
  console.log(
    `   Priority Support: ${features.prioritySupport ? '✅' : '❌'}`
  )

  if (features.roadmap && features.roadmap.length) {
    console.log('\n🛠️ Upcoming features:')
    features.roadmap.forEach(item => console.log(`   - ${item}`))
  }
}

module.exports = {
  LICENSE_TIERS,
  FEATURES,
  getLicenseInfo,
  hasFeature,
  getCoreFeatureLevel,
  getApiLimit,
  showUpgradeMessage,
  saveLicense,
  saveLicenseWithSignature,
  removeLicense,
  showLicenseStatus,
  activateLicense,
  promptLicenseActivation,
  verifyLicenseSignature,
  // Developer mode functions
  isDeveloperMode,
  enableDeveloperMode,
  disableDeveloperMode,
  // License validator (Stripe-free user-side validation)
  LicenseValidator: require('./license-validator').LicenseValidator,
  addLegitimateKey: require('./license-validator').addLegitimateKey,
}
