#!/usr/bin/env node

/**
 * Create SaaS Monetization - Bootstrap complete revenue system for any project
 *
 * Usage: npx create-saas-monetization@latest
 *
 * Part of Project Starter Guide - SaaS Monetization Templates
 * Copyright (c) 2025 Vibe Build Lab LLC
 * Licensed under MIT License
 *
 * Learn more: https://vibebuildlab.com
 *
 * Implements:
 * - Stripe payment infrastructure
 * - License key system with CLI activation
 * - Billing dashboard and customer portal
 * - Legal compliance (Privacy, Terms, Copyright, Disclaimers)
 * - Conversion landing page
 * - Beta user email campaigns
 * - Upgrade prompts and messaging
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

// Template source repository
const TEMPLATES_REPO =
  process.env.SAAS_TEMPLATES_PATH ||
  path.join(
    process.env.HOME || os.homedir(),
    "Projects/saas-monetization-templates/templates",
  );

class SaaSMonetizationBootstrap {
  constructor() {
    this.projectRoot = process.cwd();
    this.config = {};
    this.templatePath = TEMPLATES_REPO;
  }

  async run() {
    console.log("🚀 Create SaaS Monetization");
    console.log("═══════════════════════════════════");
    console.log("Bootstrap complete revenue system for your project\n");

    // Verify templates exist
    if (!fs.existsSync(this.templatePath)) {
      console.error("❌ Template repository not found at:", this.templatePath);
      console.error(
        "Please ensure saas-monetization-templates is cloned to ~/Projects/saas-monetization-templates/",
      );
      process.exit(1);
    }

    // Collect project configuration
    await this.collectConfiguration();

    // Create directory structure
    this.createDirectoryStructure();

    // Generate all components
    await this.generateFromTemplates();
    await this.updatePackageJson();
    await this.generateEnvironmentTemplate();
    await this.generateDeploymentGuide();

    console.log("\\n🎉 SaaS Monetization System Created!");
    console.log("═══════════════════════════════════════");
    console.log("\\nWhat was generated:");
    console.log("📁 lib/monetization/ - Complete payment infrastructure");
    console.log("📁 legal/ - GDPR/CCPA compliant legal pages");
    console.log("📁 marketing/ - Landing pages and email campaigns");
    console.log("📁 billing/ - Customer dashboard and portal");
    console.log("📄 .env.template - Environment configuration");
    console.log("📄 MONETIZATION_GUIDE.md - Complete setup instructions");

    console.log("\\n📋 Next Steps:");
    console.log("1. Copy .env.template to .env and configure Stripe keys");
    console.log("2. Deploy legal pages to your domain");
    console.log("3. Set up Stripe products and pricing");
    console.log("4. Launch beta user email campaign");
    console.log("5. Read MONETIZATION_GUIDE.md for detailed instructions");

    console.log("\\n💰 Revenue Potential: $1,500-5,000/month recurring");
  }

  async collectConfiguration() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (query) =>
      new Promise((resolve) => rl.question(query, resolve));

    try {
      console.log("📋 Project Configuration");
      console.log("─────────────────────────");

      this.config.projectName =
        (await question("Project name: ")) || path.basename(this.projectRoot);
      this.config.description =
        (await question("Project description: ")) ||
        `${this.config.projectName} - Professional SaaS platform`;
      this.config.domain =
        (await question("Domain (e.g. yoursite.com): ")) || "yoursite.com";
      this.config.companyName =
        (await question("Company/Author name: ")) || "Your Company";
      this.config.supportEmail =
        (await question("Support email: ")) || "support@yoursite.com";
      this.config.governingLaw =
        (await question("Governing law (default Delaware, USA): ")) ||
        "Delaware, USA";
      this.config.venue =
        (await question(
          "Venue (default State and Federal courts in Delaware): ",
        )) || "State and Federal courts in Delaware";

      console.log("\\n💰 Pricing Configuration");
      console.log("─────────────────────────");
      this.config.proPrice =
        (await question("Pro tier monthly price (default $39): ")) || "39";
      this.config.enterprisePrice =
        (await question("Enterprise tier monthly price (default $197): ")) ||
        "197";
      this.config.founderDiscount =
        (await question("Founder discount % (default 50): ")) || "50";

      console.log("\\n🎯 Feature Configuration");
      console.log("─────────────────────────");
      this.config.premiumFeatures =
        (await question("Premium features (comma-separated): ")) ||
        "Advanced Analytics,Priority Support,Custom Integrations";
      this.config.freeTierFeatures =
        (await question("Free tier features (comma-separated): ")) ||
        "Basic Features,Community Support";
    } finally {
      rl.close();
    }

    // Generate derived configuration
    this.generateDerivedConfig();
  }

  generateDerivedConfig() {
    // Calculate pricing
    this.config.founderProPrice = (
      parseFloat(this.config.proPrice) *
      (1 - parseFloat(this.config.founderDiscount) / 100)
    ).toFixed(2);
    this.config.founderEnterprisePrice = (
      parseFloat(this.config.enterprisePrice) *
      (1 - parseFloat(this.config.founderDiscount) / 100)
    ).toFixed(2);

    // Generate project slug (for directory names, license prefixes)
    this.config.projectSlug = this.config.projectName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");

    // Generate license prefix (uppercase, truncated)
    this.config.licensePrefix =
      this.config.projectName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 3) || "SAS";

    // Parse features
    this.config.proFeatureList = this.config.premiumFeatures
      .split(",")
      .map((f) => f.trim());
    this.config.freeFeatureList = this.config.freeTierFeatures
      .split(",")
      .map((f) => f.trim());

    // Generate CLI commands
    this.config.cliActivateCommand = `npx ${this.config.projectSlug}@latest --activate-license`;
    this.config.upgradeUrl = `https://${this.config.domain}/upgrade`;
    this.config.enterpriseUpgradeUrl = `https://${this.config.domain}/enterprise`;

    // Legal metadata
    const today = new Date();
    this.config.lastUpdated = today.toISOString().split("T")[0];
    this.config.copyrightYear = today.getUTCFullYear().toString();
    this.config.governingLaw = this.config.governingLaw || "Delaware, USA";
    this.config.venue =
      this.config.venue || "State and Federal courts in Delaware";
  }

  createDirectoryStructure() {
    const dirs = ["lib/monetization", "legal", "marketing", "billing"];

    dirs.forEach((dir) => {
      const fullPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  async generateFromTemplates() {
    const filesToProcess = [
      ["lib/licensing.js", "lib/monetization/licensing.js"],
      ["lib/stripe-integration.js", "lib/monetization/stripe-integration.js"],
      ["lib/cli-activation.js", "lib/monetization/cli-activation.js"],
      ["lib/license-status.js", "lib/monetization/license-status.js"],
      ["lib/stripe-webhook.js", "lib/monetization/stripe-webhook.js"],
      ["legal/privacy-policy.md", "legal/privacy-policy.md"],
      ["legal/terms-of-service.md", "legal/terms-of-service.md"],
      ["legal/copyright.md", "legal/copyright.md"],
      ["legal/disclaimer.md", "legal/disclaimer.md"],
      ["marketing/landing-page.html", "marketing/landing-page.html"],
      ["marketing/beta-email-campaign.md", "marketing/beta-email-campaign.md"],
      ["billing/dashboard.html", "billing/dashboard.html"],
    ];

    for (const [source, target] of filesToProcess) {
      await this.processTemplate(source, target);
    }

    console.log("✅ Templates processed and customized");
  }

  async processTemplate(sourcePath, targetPath) {
    const templateFile = path.join(this.templatePath, sourcePath);
    const targetFile = path.join(this.projectRoot, targetPath);

    if (!fs.existsSync(templateFile)) {
      console.warn(`⚠️ Template not found: ${sourcePath}`);
      return;
    }

    let content = fs.readFileSync(templateFile, "utf8");

    // Replace all placeholders
    content = content
      .replace(/{{PROJECT_NAME}}/g, this.config.projectName)
      .replace(/{{PROJECT_SLUG}}/g, this.config.projectSlug)
      .replace(/{{LICENSE_PREFIX}}/g, this.config.licensePrefix)
      .replace(/{{DOMAIN}}/g, this.config.domain)
      .replace(/{{COMPANY_NAME}}/g, this.config.companyName)
      .replace(/{{SUPPORT_EMAIL}}/g, this.config.supportEmail)
      .replace(/{{LAST_UPDATED}}/g, this.config.lastUpdated)
      .replace(/{{COPYRIGHT_YEAR}}/g, this.config.copyrightYear)
      .replace(/{{GOVERNING_LAW}}/g, this.config.governingLaw)
      .replace(/{{VENUE}}/g, this.config.venue)
      .replace(/{{PRO_PRICE}}/g, this.config.proPrice)
      .replace(/{{ENTERPRISE_PRICE}}/g, this.config.enterprisePrice)
      .replace(/{{PRO_FOUNDER_PRICE}}/g, this.config.founderProPrice)
      .replace(
        /{{ENTERPRISE_FOUNDER_PRICE}}/g,
        this.config.founderEnterprisePrice,
      )
      .replace(/{{FOUNDER_DISCOUNT}}/g, this.config.founderDiscount)
      .replace(/{{CLI_ACTIVATE_COMMAND}}/g, this.config.cliActivateCommand)
      .replace(/{{UPGRADE_URL}}/g, this.config.upgradeUrl)
      .replace(/{{ENTERPRISE_UPGRADE_URL}}/g, this.config.enterpriseUpgradeUrl)
      .replace(
        /{{PRO_FEATURE_1}}/g,
        this.config.proFeatureList[0] || "Advanced Features",
      )
      .replace(
        /{{PRO_FEATURE_2}}/g,
        this.config.proFeatureList[1] || "Priority Support",
      )
      .replace(
        /{{PRO_FEATURE_3}}/g,
        this.config.proFeatureList[2] || "Custom Integrations",
      )
      .replace(/{{ENTERPRISE_FEATURE_1}}/g, "SSO/SAML Integration")
      .replace(/{{ENTERPRISE_FEATURE_2}}/g, "Dedicated Support (24h response)")
      .replace(/{{ENTERPRISE_FEATURE_3}}/g, "Custom onboarding and training");

    fs.writeFileSync(targetFile, content);
    console.log(`✅ Generated: ${targetPath}`);
  }

  async updatePackageJson() {
    const packagePath = path.join(this.projectRoot, "package.json");

    let pkg = { name: this.config.projectSlug, version: "1.0.0" };
    if (fs.existsSync(packagePath)) {
      pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    }

    // Add monetization scripts
    pkg.scripts = pkg.scripts || {};
    pkg.scripts["activate-license"] = "node lib/monetization/cli-activation.js";
    pkg.scripts["license-status"] = "node lib/monetization/license-status.js";
    pkg.scripts["billing-webhook"] = "node lib/monetization/stripe-webhook.js";

    // Add monetization dependencies
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["stripe"] = "^14.25.0";

    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
    console.log(
      "✅ Updated package.json with monetization scripts and dependencies",
    );
  }

  async generateEnvironmentTemplate() {
    const envTemplate = `# ${this.config.projectName} - SaaS Monetization Environment Variables

# Stripe Configuration (Required for production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
STRIPE_PRICE_ID_PRO_FOUNDER=price_...
STRIPE_PRICE_ID_ENTERPRISE_FOUNDER=price_...

# License Signing (Required for security)
LICENSE_SIGNING_SECRET=your-secure-random-secret-change-in-prod

# Optional: Development settings
NODE_ENV=development
DEBUG=${this.config.projectSlug}:*`;

    fs.writeFileSync(path.join(this.projectRoot, ".env.template"), envTemplate);
    console.log("✅ Created .env.template with required environment variables");
  }

  async generateDeploymentGuide() {
    const guide = `# ${this.config.projectName} - Monetization Setup Guide

## 🚀 Complete SaaS Revenue System

This guide walks you through setting up the complete monetization infrastructure for ${this.config.projectName}.

### 📁 What Was Generated

- lib/monetization/stripe-integration.js — Complete Stripe payment processing
- lib/monetization/licensing.js — License key validation and management
- legal/ — GDPR/CCPA compliant legal pages
- marketing/ — Landing pages and email campaigns
- billing/ — Customer dashboard and subscription management

### 🔑 Environment Setup

1. Copy .env.template to .env
2. Configure your Stripe keys from the Stripe dashboard
3. Generate a secure LICENSE_SIGNING_SECRET (recommended: 64 character random string)

### 💳 Stripe Configuration

1. Create products in Stripe Dashboard:
   - Pro Monthly: $${this.config.proPrice}/month
   - Enterprise Monthly: $${this.config.enterprisePrice}/month
   - Pro Founder: $${this.config.founderProPrice}/month
   - Enterprise Founder: $${this.config.founderEnterprisePrice}/month

2. Copy Price IDs to your .env file

3. Configure webhook endpoint: https://${this.config.domain}/api/stripe/webhook

### 🔧 License Integration

Add license checks to your application:

    const { getLicenseInfo } = require('./lib/monetization/licensing')

    const license = getLicenseInfo()
    if (license.tier === 'FREE') {
      showUpgradeMessage('Premium Feature')
      return
    }

Edit lib/monetization/licensing.js and update:
- Feature definitions in FEATURES object
- Upgrade URLs and messaging
- CLI command references

### 📋 Pricing Strategy

Your configured pricing:
- **Free**: ${this.config.freeFeatureList.join(", ")}
- **Pro**: $${this.config.proPrice}/month (${this.config.founderDiscount}% founder discount: $${this.config.founderProPrice}/month)
- **Enterprise**: $${this.config.enterprisePrice}/month (${this.config.founderDiscount}% founder discount: $${this.config.founderEnterprisePrice}/month)

### 📈 Revenue Projections

Conservative: 50 users × $${this.config.founderProPrice} = $${(50 * parseFloat(this.config.founderProPrice)).toLocaleString()}/month
Growth: 100 users × $${Math.round(parseFloat(this.config.proPrice) * 0.8)} = $${(100 * Math.round(parseFloat(this.config.proPrice) * 0.8)).toLocaleString()}/month
Scale: 200 users × $${this.config.proPrice} = $${(200 * parseFloat(this.config.proPrice)).toLocaleString()}/month

### 🎯 Next Steps

1. **Test locally**: Use development validation mode (no Stripe required)
2. **Deploy legal pages**: Upload legal/*.html to https://${this.config.domain}/legal/
3. **Configure Stripe**: Set up products, prices, and webhooks
4. **Launch marketing**: Deploy landing page to ${this.config.upgradeUrl}
5. **Monitor metrics**: Track conversion rates and revenue growth

- CLI prompts: lib/monetization/licensing.js
- Upgrade URLs: Marketing assets and upgrade prompts
- Email templates: marketing/beta-user-email-campaign.md

### 🔗 Resources

- Stripe Dashboard: https://dashboard.stripe.com/
- Legal pages: https://${this.config.domain}/legal/privacy-policy.html
- Upgrade page: ${this.config.upgradeUrl}
- Enterprise sales: ${this.config.enterpriseUpgradeUrl}
- Documentation: https://${this.config.domain}/docs/monetization

**Ready to start generating revenue!** 🚀💰
`;

    fs.writeFileSync(
      path.join(this.projectRoot, "MONETIZATION_GUIDE.md"),
      guide,
    );
    console.log("✅ Created MONETIZATION_GUIDE.md with setup instructions");
  }
}

// CLI entry point
if (require.main === module) {
  const bootstrap = new SaaSMonetizationBootstrap();
  bootstrap.run().catch(console.error);
}

module.exports = { SaaSMonetizationBootstrap };
