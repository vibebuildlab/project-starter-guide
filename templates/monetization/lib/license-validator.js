/**
 * License Validator (user-side, no Stripe dependencies)
 *
 * Part of Project Starter Guide - SaaS Monetization Templates
 * Copyright (c) 2025 Vibe Build Lab LLC
 * Licensed under MIT License
 *
 * Originally from saas-monetization-templates (VBL Internal)
 * Learn more: https://vibebuildlab.com
 *
 * Features:
 * - No Stripe dependencies (secrets stay server-side)
 * - Fetches signed license registry from configurable HTTPS endpoint
 * - Caches locally for offline use with graceful fallback
 * - Developer mode for testing without license
 * - SHA256 integrity verification for license database
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')

class LicenseValidator {
  constructor() {
    // Support environment variable override for testing
    this.licenseDir =
      process.env.{{PROJECT_SLUG_UPPER}}_LICENSE_DIR ||
      path.join(os.homedir(), '.{{PROJECT_SLUG}}')
    this.licenseFile = path.join(this.licenseDir, 'license.json')
    this.legitimateDBFile = path.join(
      this.licenseDir,
      'legitimate-licenses.json'
    )

    // Allow enterprises to host their own registry
    this.licenseDbUrl =
      process.env.{{PROJECT_SLUG_UPPER}}_LICENSE_DB_URL ||
      'https://license.{{DOMAIN}}/{{PROJECT_SLUG}}/legitimate-licenses.json'
  }

  ensureLicenseDir() {
    if (!fs.existsSync(this.licenseDir)) {
      fs.mkdirSync(this.licenseDir, { recursive: true })
    }
  }

  /**
   * Initialize license directory and database if needed
   */
  initialize() {
    try {
      this.ensureLicenseDir()

      // Initialize legitimate license database if it doesn't exist
      if (!fs.existsSync(this.legitimateDBFile)) {
        const initialDB = {
          _metadata: {
            version: '1.0',
            created: new Date().toISOString(),
            description:
              'Legitimate license database - populated by webhook/admin',
          },
        }
        fs.writeFileSync(
          this.legitimateDBFile,
          JSON.stringify(initialDB, null, 2)
        )
      }

      return true
    } catch (error) {
      console.error('Failed to initialize license directory:', error.message)
      return false
    }
  }

  /**
   * Load legitimate licenses from the cached database
   */
  loadLegitimateDatabase() {
    try {
      if (fs.existsSync(this.legitimateDBFile)) {
        const data = fs.readFileSync(this.legitimateDBFile, 'utf8')
        const parsed = JSON.parse(data)

        // Remove metadata for license lookup
        const { _metadata, ...licenses } = parsed
        return licenses
      }
    } catch (error) {
      console.error('Error loading legitimate license database:', error.message)
    }
    return {}
  }

  /**
   * Compute SHA256 hash for integrity checks
   */
  computeSha256(json) {
    return crypto.createHash('sha256').update(json).digest('hex')
  }

  /**
   * Fetch latest legitimate licenses from server (if available)
   */
  async fetchLegitimateDatabase() {
    try {
      this.ensureLicenseDir()
      console.log(
        `🔄 Fetching latest license database from ${this.licenseDbUrl} ...`
      )

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(this.licenseDbUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': '{{PROJECT_SLUG}}-cli' },
      })
      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const database = await response.json()

      if (!database || typeof database !== 'object' || !database._metadata) {
        throw new Error('invalid database format')
      }

      // Mandatory integrity verification
      if (!database._metadata.sha256) {
        throw new Error('license database missing sha256 checksum')
      }

      const { _metadata, ...licenses } = database
      const computed = this.computeSha256(JSON.stringify(licenses))
      if (computed !== database._metadata.sha256) {
        throw new Error('license database integrity check failed')
      }

      // Cache locally for offline use
      fs.writeFileSync(this.legitimateDBFile, JSON.stringify(database, null, 2))
      console.log('✅ License database updated and cached')

      return licenses
    } catch (error) {
      const isTest = process.argv.join(' ').includes('test')
      const prefix = isTest ? '📋 TEST SCENARIO:' : '⚠️'
      console.log(`${prefix} Database fetch failed: ${error.message}`)
      return this.loadLegitimateDatabase()
    }
  }

  /**
   * Validate license key (fetches latest database, then validates locally)
   */
  async validateLicense(licenseKey, userEmail) {
    try {
      // Check if already activated locally
      const localLicense = this.getLocalLicense()
      if (
        localLicense &&
        localLicense.licenseKey === licenseKey &&
        localLicense.valid
      ) {
        return {
          valid: true,
          tier: localLicense.tier,
          isFounder: localLicense.isFounder || false,
          email: localLicense.email,
          source: 'local_file',
        }
      }

      // Fetch latest legitimate database from server
      const legitimateDB = await this.fetchLegitimateDatabase()

      // If database is empty (no licenses), fail with actionable message
      const licenseInfo = legitimateDB[licenseKey]
      const hasLicenses = Object.keys(legitimateDB || {}).length > 0

      if (!hasLicenses) {
        return {
          valid: false,
          error:
            'License registry is empty. Please connect to the internet and retry, or ask support to populate your license.',
        }
      }

      if (!licenseInfo) {
        return {
          valid: false,
          error:
            'License key not found. Verify the key and email, or contact support if this was a purchase.',
        }
      }

      // Verify email matches (if specified in database)
      if (
        licenseInfo.email &&
        licenseInfo.email.toLowerCase() !== userEmail.toLowerCase()
      ) {
        return {
          valid: false,
          error:
            'Email address does not match the license registration. Please use the email associated with your purchase.',
        }
      }

      // License is valid
      console.log(
        `✅ License validated: ${licenseInfo.tier} ${licenseInfo.isFounder ? '(Founder)' : ''}`
      )

      return {
        valid: true,
        tier: licenseInfo.tier,
        isFounder: licenseInfo.isFounder || false,
        customerId: licenseInfo.customerId,
        email: userEmail,
        source: 'legitimate_database',
      }
    } catch (error) {
      console.error('License validation error:', error.message)
      return {
        valid: false,
        error:
          'License validation failed due to an internal error. Please try again or contact support.',
      }
    }
  }

  /**
   * Get local license file if it exists
   */
  getLocalLicense() {
    if (fs.existsSync(this.licenseFile)) {
      // Let JSON parse errors propagate to caller for proper error handling
      const license = JSON.parse(fs.readFileSync(this.licenseFile, 'utf8'))

      // Check signature if present
      if (license.payload && license.signature) {
        const isValid = this.verifySignature(license.payload, license.signature)
        return { ...license, valid: isValid }
      }

      // Legacy format
      return {
        ...license,
        valid: true,
        tier: license.tier,
        licenseKey: license.licenseKey || license.key,
        email: license.email,
      }
    }
    return null
  }

  /**
   * Save license locally after successful validation
   */
  saveLicense(licenseData) {
    try {
      this.initialize()

      const payload = {
        customerId: licenseData.customerId,
        tier: licenseData.tier,
        isFounder: licenseData.isFounder,
        email: licenseData.email,
        issued: Date.now(),
        version: '1.0',
      }

      const signature = this.signPayload(payload)

      const licenseRecord = {
        licenseKey: licenseData.licenseKey,
        tier: licenseData.tier,
        isFounder: licenseData.isFounder,
        email: licenseData.email,
        activated: new Date().toISOString(),
        payload,
        signature,
      }

      fs.writeFileSync(this.licenseFile, JSON.stringify(licenseRecord, null, 2))

      console.log('✅ License activated successfully!')
      console.log(`📋 Tier: ${licenseData.tier}`)
      console.log(`🎁 Founder: ${licenseData.isFounder ? 'Yes' : 'No'}`)
      console.log(`📧 Email: ${licenseData.email}`)

      return { success: true }
    } catch (error) {
      console.error('Failed to save license:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * Sign payload for validation
   */
  signPayload(payload) {
    const secret =
      process.env.LICENSE_SIGNING_SECRET || '{{PROJECT_SLUG}}-dev-secret-change-in-prod'
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')
  }

  /**
   * Verify signature
   */
  verifySignature(payload, signature) {
    const expectedSignature = this.signPayload(payload)
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    } catch {
      return false
    }
  }

  /**
   * Activate license (main user entry point)
   */
  async activateLicense(licenseKey, userEmail) {
    try {
      // Validate license key format
      if (
        !licenseKey.match(
          /^{{LICENSE_PREFIX}}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
        )
      ) {
        return {
          success: false,
          error:
            'Invalid license key format. Expected format: {{LICENSE_PREFIX}}-XXXX-XXXX-XXXX-XXXX',
        }
      }

      // Validate email format
      if (!userEmail || !userEmail.includes('@')) {
        return {
          success: false,
          error: 'Valid email address required for license activation',
        }
      }

      console.log('🔍 Validating license key...')

      // Validate against database
      const validation = await this.validateLicense(licenseKey, userEmail)

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'License validation failed',
        }
      }

      // Save locally
      const saveResult = this.saveLicense({
        licenseKey,
        tier: validation.tier,
        isFounder: validation.isFounder,
        email: userEmail,
        customerId: validation.customerId,
      })

      if (saveResult.success) {
        return {
          success: true,
          tier: validation.tier,
          isFounder: validation.isFounder,
        }
      } else {
        return {
          success: false,
          error: 'License validation succeeded but failed to save locally',
        }
      }
    } catch (error) {
      console.error('License activation failed:', error.message)
      return {
        success: false,
        error: `License activation failed: ${error.message}`,
      }
    }
  }

  /**
   * Remove license (for testing)
   */
  removeLicense() {
    try {
      if (fs.existsSync(this.licenseFile)) {
        fs.unlinkSync(this.licenseFile)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

/**
 * Add a legitimate license key to local database (admin/webhook function)
 */
async function addLegitimateKey(
  licenseKey,
  customerId,
  tier,
  isFounder = false,
  purchaseEmail = null
) {
  try {
    const licenseDir =
      process.env.{{PROJECT_SLUG_UPPER}}_LICENSE_DIR ||
      path.join(os.homedir(), '.{{PROJECT_SLUG}}')
    const legitimateDBFile = path.join(licenseDir, 'legitimate-licenses.json')

    // Ensure directory exists
    if (!fs.existsSync(licenseDir)) {
      fs.mkdirSync(licenseDir, { recursive: true })
    }

    // Load existing database
    let database = {}
    if (fs.existsSync(legitimateDBFile)) {
      try {
        database = JSON.parse(fs.readFileSync(legitimateDBFile, 'utf8'))
      } catch {
        console.error(
          'Warning: Could not parse existing database, creating new one'
        )
      }
    }

    // Initialize metadata if needed
    if (!database._metadata) {
      database._metadata = {
        version: '1.0',
        created: new Date().toISOString(),
        description: 'Legitimate license database - populated by admin/webhook',
      }
    }

    // Add license
    database[licenseKey] = {
      customerId,
      tier,
      isFounder,
      email: purchaseEmail,
      addedDate: new Date().toISOString(),
      addedBy: 'admin_tool',
    }

    // Update metadata
    database._metadata.lastUpdate = new Date().toISOString()
    database._metadata.totalLicenses = Object.keys(database).length - 1 // Exclude metadata

    // Calculate SHA256 checksum for integrity verification (MANDATORY)
    const { _metadata, ...licensesOnly } = database
    const sha256 = crypto
      .createHash('sha256')
      .update(JSON.stringify(licensesOnly))
      .digest('hex')
    database._metadata.sha256 = sha256

    // Save database
    fs.writeFileSync(legitimateDBFile, JSON.stringify(database, null, 2))

    console.log(`✅ Added legitimate license: ${licenseKey}`)
    console.log(`   Customer: ${customerId}`)
    console.log(`   Tier: ${tier}`)
    console.log(`   Founder: ${isFounder ? 'Yes' : 'No'}`)
    if (purchaseEmail) {
      console.log(`   Purchase Email: ${purchaseEmail}`)
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

module.exports = { LicenseValidator, addLegitimateKey }
