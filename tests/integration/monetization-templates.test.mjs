import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const monetizationDir = './templates/monetization'

describe('Monetization Templates - File Structure', () => {
  it('should have all required lib files', () => {
    const requiredFiles = [
      'licensing.js',
      'stripe-integration.js',
      'cli-activation.js',
      'license-status.js',
      'stripe-webhook.js',
      'license-validator.js'
    ]

    requiredFiles.forEach(file => {
      const filePath = join(monetizationDir, 'lib', file)
      expect(existsSync(filePath), `Missing ${file}`).toBe(true)
    })
  })

  it('should have all legal templates', () => {
    const legalFiles = [
      'privacy-policy.md',
      'terms-of-service.md',
      'copyright.md',
      'disclaimer.md'
    ]

    legalFiles.forEach(file => {
      const filePath = join(monetizationDir, 'legal', file)
      expect(existsSync(filePath), `Missing ${file}`).toBe(true)
    })
  })

  it('should have marketing templates', () => {
    expect(existsSync(join(monetizationDir, 'marketing/landing-page.html'))).toBe(true)
    expect(existsSync(join(monetizationDir, 'marketing/beta-email-campaign.md'))).toBe(true)
  })

  it('should have billing dashboard', () => {
    expect(existsSync(join(monetizationDir, 'billing/dashboard.html'))).toBe(true)
  })

  it('should have bootstrap script', () => {
    expect(existsSync(join(monetizationDir, 'scripts/create-saas-monetization.js'))).toBe(true)
  })

  it('should have README', () => {
    expect(existsSync(join(monetizationDir, 'README.md'))).toBe(true)
  })
})

describe('Monetization Templates - Licensing & Attribution', () => {
  const jsFiles = [
    'lib/licensing.js',
    'lib/stripe-integration.js',
    'lib/cli-activation.js',
    'lib/license-status.js',
    'lib/stripe-webhook.js',
    'lib/license-validator.js',
    'scripts/create-saas-monetization.js'
  ]

  jsFiles.forEach(file => {
    it(`should have MIT license header in ${file}`, () => {
      const content = readFileSync(join(monetizationDir, file), 'utf8')
      expect(content).toContain('Licensed under MIT License')
      expect(content).toContain('Copyright (c) 2025 Vibe Build Lab LLC')
    })
  })

  it('should have VBL attribution in all JS files', () => {
    jsFiles.forEach(file => {
      const content = readFileSync(join(monetizationDir, file), 'utf8')
      expect(content.toLowerCase()).toContain('vibe build lab')
    })
  })
})

describe('Monetization Templates - Placeholder Consistency', () => {
  const templateFiles = [
    'lib/licensing.js',
    'lib/stripe-integration.js',
    'lib/stripe-webhook.js'
  ]

  it('should use standard placeholders in templates', () => {
    templateFiles.forEach(file => {
      const content = readFileSync(join(monetizationDir, file), 'utf8')

      // Check for at least one standard placeholder
      const hasPlaceholders =
        content.includes('{{PROJECT_NAME}}') ||
        content.includes('{{PROJECT_SLUG}}') ||
        content.includes('{{DOMAIN}}') ||
        content.includes('{{COMPANY_NAME}}')

      expect(hasPlaceholders, `${file} should contain template placeholders`).toBe(true)
    })
  })

  it('should not contain actual API keys or secrets', () => {
    const allFiles = [
      ...templateFiles,
      'scripts/create-saas-monetization.js',
      'lib/cli-activation.js',
      'lib/license-status.js',
      'lib/license-validator.js'
    ]

    allFiles.forEach(file => {
      const content = readFileSync(join(monetizationDir, file), 'utf8')

      // Check for common patterns that indicate real secrets (not placeholders)
      expect(content).not.toMatch(/sk_live_[a-zA-Z0-9]{24,}/)
      expect(content).not.toMatch(/pk_live_[a-zA-Z0-9]{24,}/)
      expect(content).not.toMatch(/whsec_[a-zA-Z0-9]{32,}/)
    })
  })
})

describe('Monetization Templates - Configuration', () => {
  it('should be registered in .templates.json', () => {
    const configPath = './templates/.templates.json'
    expect(existsSync(configPath)).toBe(true)

    const config = JSON.parse(readFileSync(configPath, 'utf8'))
    expect(config.templates).toHaveProperty('monetization')
    expect(config.templates.monetization.name).toBe('SaaS Monetization System')
    expect(config.templates.monetization.complexity).toBe(0)
  })

  it('should have required environment variables defined', () => {
    const configPath = './templates/.templates.json'
    const config = JSON.parse(readFileSync(configPath, 'utf8'))

    const monetizationConfig = config.templates.monetization
    expect(monetizationConfig.envVars).toBeInstanceOf(Array)

    const envVarKeys = monetizationConfig.envVars.map(v => v.key)
    expect(envVarKeys).toContain('STRIPE_SECRET_KEY')
    expect(envVarKeys).toContain('LICENSE_SIGNING_SECRET')
  })
})

describe('Monetization Templates - README Quality', () => {
  it('should have comprehensive README with key sections', () => {
    const readmePath = join(monetizationDir, 'README.md')
    const content = readFileSync(readmePath, 'utf8')

    // Check for essential sections
    expect(content).toContain("What's Included")
    expect(content).toContain('Quick Start')
    expect(content).toContain('Licensing Tiers')
    expect(content).toContain('Stripe Integration')
    expect(content).toContain('Legal Compliance')
    expect(content).toContain('Security Best Practices')
    expect(content).toContain('Environment Variables')
    expect(content).toContain('Value Ladder')
  })

  it('should link to VBL services', () => {
    const readmePath = join(monetizationDir, 'README.md')
    const content = readFileSync(readmePath, 'utf8')

    expect(content).toContain('vibebuildlab.com')
    expect(content).toContain('VBL Validator')
    expect(content).toContain('saas-starter-kit')
    expect(content).toContain('VBL Professional')
  })

  it('should mention MIT License', () => {
    const readmePath = join(monetizationDir, 'README.md')
    const content = readFileSync(readmePath, 'utf8')

    expect(content).toContain('MIT License')
    expect(content).toContain('Vibe Build Lab LLC')
  })
})
