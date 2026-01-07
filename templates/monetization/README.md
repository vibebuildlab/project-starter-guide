# SaaS Monetization Templates

Complete revenue infrastructure for building sustainable SaaS businesses.

## What's Included

### 💳 Payment Infrastructure (`lib/`)

- **licensing.js** - License validation system with HMAC-SHA256 signatures
- **stripe-integration.js** - Complete Stripe payment flows (checkout, subscriptions, webhooks)
- **cli-activation.js** - Command-line license activation
- **license-status.js** - License status checking and validation
- **license-validator.js** - Server-side license verification
- **stripe-webhook.js** - Webhook handler for payment events

### 📄 Legal Compliance (`legal/`)

- **privacy-policy.md** - GDPR/CCPA compliant privacy policy template
- **terms-of-service.md** - Standard terms of service
- **copyright.md** - Copyright and DMCA policy
- **disclaimer.md** - Liability disclaimers

### 📣 Marketing Assets (`marketing/`)

- **landing-page.html** - Conversion-optimized landing page
- **beta-email-campaign.md** - Email sequence for beta users

### 💼 Customer Portal (`billing/`)

- **dashboard.html** - Customer billing dashboard

### 🚀 Bootstrap Script (`scripts/`)

- **create-saas-monetization.js** - Interactive setup wizard

## Quick Start

### Option 1: Interactive Setup

```bash
cd your-project
node path/to/templates/monetization/scripts/create-saas-monetization.js
```

The script will:

1. Ask for project details (name, domain, company name)
2. Copy templates to your project
3. Replace placeholders with your values
4. Set up Stripe integration
5. Generate legal documents

### Option 2: Manual Integration

1. **Copy needed files** to your project:

   ```bash
   cp templates/monetization/lib/licensing.js src/lib/
   cp templates/monetization/lib/stripe-integration.js src/lib/
   ```

2. **Replace placeholders**:
   - `{{PROJECT_NAME}}` - Your project name
   - `{{PROJECT_SLUG}}` - URL-safe project identifier
   - `{{DOMAIN}}` - Your domain (e.g., yoursite.com)
   - `{{COMPANY_NAME}}` - Your company/DBA name
   - `{{LICENSE_PREFIX}}` - Prefix for license keys (e.g., "MYAPP")

3. **Configure environment variables**:

   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   LICENSE_SIGNING_SECRET=your-secure-random-secret
   ```

4. **Integrate into your app**:

   ```javascript
   const { LicensingSystem } = require("./lib/licensing");
   const { StripeIntegration } = require("./lib/stripe-integration");

   const licensing = new LicensingSystem({
     productName: "Your Product",
     licensePrefix: "MYAPP",
   });

   const stripe = new StripeIntegration({
     productName: "Your Product",
     tiers: ["FREE", "STARTER", "PRO", "ENTERPRISE"],
   });
   ```

## Licensing Tiers

The templates support 4-tier licensing:

| Tier           | Description     | Use Case                      |
| -------------- | --------------- | ----------------------------- |
| **FREE**       | Basic features  | Testing, personal use         |
| **STARTER**    | Core features   | Small projects, solo founders |
| **PRO**        | All features    | Growing businesses            |
| **ENTERPRISE** | Premium support | Large organizations           |

## Feature Gating

Control feature access by license tier:

```javascript
const licensing = new LicensingSystem({...})

// Check feature access
if (licensing.hasFeature('advanced-analytics')) {
  // Show advanced analytics
}

// Get tier limits
const limits = licensing.getTierLimits('STARTER')
console.log(limits.maxProjects) // 5
console.log(limits.maxUsers) // 10
```

## Stripe Integration

### Create Checkout Session

```javascript
const stripe = new StripeIntegration({...})

const session = await stripe.createCheckoutSession({
  tier: 'PRO',
  customerEmail: 'customer@example.com',
  successUrl: 'https://yoursite.com/success',
  cancelUrl: 'https://yoursite.com/cancel'
})

// Redirect to session.url
```

### Handle Webhooks

```javascript
app.post("/webhooks/stripe", async (req, res) => {
  const event = stripe.constructWebhookEvent(
    req.body,
    req.headers["stripe-signature"],
  );

  switch (event.type) {
    case "checkout.session.completed":
      // Generate license key
      // Send welcome email
      break;
    case "customer.subscription.deleted":
      // Revoke license
      // Send cancellation email
      break;
  }

  res.json({ received: true });
});
```

## Legal Compliance

### Customizing Legal Documents

1. Replace company placeholders:
   - `{{COMPANY_NAME}}` - Your legal entity name
   - `{{DOMAIN}}` - Your website domain
   - `{{CONTACT_EMAIL}}` - Support email address
   - `{{LAST_UPDATED}}` - Document update date

2. Review for jurisdiction-specific requirements
3. Consult with a lawyer for production use

### Required Disclosures

- **Privacy Policy**: GDPR Article 13, CCPA §1798.100
- **Terms of Service**: Contract formation, liability limits
- **Copyright**: DMCA compliance (17 U.S.C. § 512)
- **Disclaimer**: Warranty limitations

## Developer Mode

For tool creators building on these templates:

```javascript
const licensing = new LicensingSystem({
  productName: "Your Product",
  developerMode: true, // Disables license validation
});

// All features unlocked for development/testing
```

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate keys** - Change `LICENSE_SIGNING_SECRET` periodically
3. **Validate webhooks** - Always verify Stripe webhook signatures
4. **Use HTTPS** - Never send license keys over HTTP
5. **Rate limit** - Protect activation endpoints from abuse

## Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_live_...           # Stripe secret key
LICENSE_SIGNING_SECRET=random-secret    # License signature key

# Optional
STRIPE_WEBHOOK_SECRET=whsec_...         # Webhook verification
STRIPE_PRICE_ID_PRO=price_...           # Stripe price IDs by tier
STRIPE_PRICE_ID_ENTERPRISE=price_...
NODE_ENV=production                     # Environment mode
```

## Migration Guide

### From Free to Paid

1. **Set up Stripe account** at stripe.com
2. **Create products and prices** in Stripe dashboard
3. **Configure webhook endpoint** at `/webhooks/stripe`
4. **Update environment variables** with Stripe keys
5. **Deploy changes** and test checkout flow
6. **Monitor** Stripe dashboard for successful payments

### From Manual to Automated

1. **Replace manual license generation** with automated flow
2. **Set up webhook handlers** for subscription events
3. **Automate email sending** (welcome, expiry, renewal)
4. **Add usage tracking** for tier limits
5. **Implement upgrade prompts** in-app

## Support

These templates are part of [Project Starter Guide](https://github.com/vibebuildlab/project-starter-guide), an open-source resource by [Vibe Build Lab](https://vibebuildlab.com).

- **Issues**: [GitHub Issues](https://github.com/vibebuildlab/project-starter-guide/issues)
- **Discussions**: [GitHub Discussions](https://github.com/vibebuildlab/project-starter-guide/discussions)
- **Paid Support**: [VBL Professional Services](https://vibebuildlab.com/pricing)

## License

MIT License - Copyright (c) 2025 Vibe Build Lab LLC

Originally from saas-monetization-templates (VBL Internal), open sourced as part of project-starter-guide.

## Next Steps

Ready to build? Check out the [Value Ladder](../../README.md#value-ladder):

1. **Free**: This guide + monetization templates
2. **$49**: [VBL Validator](https://vibebuildlab.com/validate) - Idea validation
3. **$249**: [saas-starter-kit](https://vibebuildlab.com/starter-kit) - Production foundation
4. **$599**: [VBL Professional](https://vibebuildlab.com/pricing) - Full automation
