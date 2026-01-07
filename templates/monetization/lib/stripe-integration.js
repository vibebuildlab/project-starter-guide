"use strict";

/**
 * Stripe Integration for {{PROJECT_NAME}}
 * Handles subscription payments, license key generation, and billing management
 *
 * Part of Project Starter Guide - SaaS Monetization Templates
 * Copyright (c) 2025 Vibe Build Lab LLC
 * Licensed under MIT License
 *
 * Originally from saas-monetization-templates (VBL Internal)
 * Open sourced as part of project-starter-guide
 * Learn more: https://vibebuildlab.com
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");

class StripeIntegration {
  constructor() {
    this.stripe = null;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.priceIds = {
      PRO_MONTHLY:
        process.env.STRIPE_PRICE_ID_PRO || "price_pro_monthly_placeholder",
      ENTERPRISE_MONTHLY:
        process.env.STRIPE_PRICE_ID_ENTERPRISE ||
        "price_enterprise_monthly_placeholder",
      PRO_FOUNDER:
        process.env.STRIPE_PRICE_ID_PRO_FOUNDER ||
        "price_pro_founder_placeholder",
      ENTERPRISE_FOUNDER:
        process.env.STRIPE_PRICE_ID_ENTERPRISE_FOUNDER ||
        "price_enterprise_founder_placeholder",
    };
    this.licenseDir = path.join(os.homedir(), ".{{PROJECT_SLUG}}");
  }

  getSigningSecret() {
    const secret =
      process.env.LICENSE_SIGNING_SECRET ||
      "{{PROJECT_SLUG}}-dev-secret-change-in-prod";
    if (
      process.env.NODE_ENV === "production" &&
      secret.includes("{{PROJECT_SLUG}}-dev-secret-change-in-prod")
    ) {
      throw new Error(
        "LICENSE_SIGNING_SECRET is required in production for secure license signing.",
      );
    }
    return secret;
  }

  /**
   * Initialize Stripe with API key
   */
  async initialize() {
    if (!process.env.STRIPE_SECRET_KEY) {
      // Return false to allow development mode, don't throw error
      return false;
    }

    try {
      // Dynamic import for Stripe (ESM module)
      const { default: Stripe } = await import("stripe");
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      return true;
    } catch (error) {
      console.error("Failed to initialize Stripe:", error.message);
      return false;
    }
  }

  /**
   * Ensure Stripe client is available; helpful guards for production
   */
  requireStripe(
    message = "Stripe is not configured. Set STRIPE_SECRET_KEY to enable billing flows.",
  ) {
    if (!this.stripe) {
      throw new Error(message);
    }
  }

  /**
   * Create checkout session for Pro/Enterprise subscription
   */
  async createCheckoutSession({
    tier,
    isFounder = false,
    customerEmail,
    successUrl,
    cancelUrl,
    metadata = {},
  }) {
    const initialized = await this.initialize();
    if (!initialized) {
      throw new Error(
        "Stripe is not configured. Set STRIPE_SECRET_KEY to create checkout sessions.",
      );
    }
    this.requireStripe();

    const priceId = this.getPriceId(tier, isFounder);

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          tier,
          isFounder: isFounder.toString(),
          ...metadata,
        },
      },
      metadata: {
        tier,
        isFounder: isFounder.toString(),
        ...metadata,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Get appropriate price ID for tier and founder status
   */
  getPriceId(tier, isFounder = false) {
    if (tier === "PRO") {
      return isFounder ? this.priceIds.PRO_FOUNDER : this.priceIds.PRO_MONTHLY;
    }
    if (tier === "ENTERPRISE") {
      return isFounder
        ? this.priceIds.ENTERPRISE_FOUNDER
        : this.priceIds.ENTERPRISE_MONTHLY;
    }
    throw new Error(`Invalid tier: ${tier}`);
  }

  /**
   * Generate license key for subscription
   */
  generateLicenseKey(customerId, tier, isFounder = false) {
    const payload = {
      customerId,
      tier,
      isFounder,
      issued: Date.now(),
      version: "1.0",
    };

    // Create deterministic key from customer ID and tier
    const hash = crypto
      .createHash("sha256")
      .update(`${customerId}:${tier}:${isFounder}:{{PROJECT_SLUG}}-license-v1`)
      .digest("hex");

    // Format as license key: {{LICENSE_PREFIX}}-XXXX-XXXX-XXXX-XXXX
    const keyParts = hash.slice(0, 16).match(/.{4}/g);
    const licenseKey = `{{LICENSE_PREFIX}}-${keyParts.join("-").toUpperCase()}`;

    return {
      licenseKey,
      payload,
      signature: this.signLicensePayload(payload),
    };
  }

  /**
   * Sign license payload for validation
   */
  signLicensePayload(payload) {
    const secret = this.getSigningSecret();
    return crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");
  }

  /**
   * Validate license key and return user tier
   */
  async validateLicenseKey(licenseKey) {
    try {
      // Check local license file first
      const licenseFile = path.join(this.licenseDir, "license.json");

      if (fs.existsSync(licenseFile)) {
        const license = JSON.parse(fs.readFileSync(licenseFile, "utf8"));

        if (license.licenseKey === licenseKey) {
          // Validate signature
          const isValid = this.verifyLicenseSignature(
            license.payload,
            license.signature,
          );

          if (isValid) {
            return {
              valid: true,
              tier: license.payload.tier,
              isFounder: license.payload.isFounder,
              customerId: license.payload.customerId,
              issued: new Date(license.payload.issued),
              expires: license.expires,
              // Include original payload and signature for re-storage
              payload: license.payload,
              signature: license.signature,
            };
          }
        }
      }

      // Fallback: Development validation (Stripe not available or configured)
      // Extract customer ID from license key format
      const customerMatch = licenseKey.match(
        /{{LICENSE_PREFIX}}-([A-F0-9]{4})-([A-F0-9]{4})-([A-F0-9]{4})-([A-F0-9]{4})/,
      );

      if (!customerMatch) {
        return { valid: false, error: "Invalid license key format" };
      }

      // Development/Testing validation - generates cryptographically signed license
      // TODO: Replace with full Stripe customer lookup in production
      if (process.env.NODE_ENV === "production") {
        return {
          valid: false,
          error:
            "Stripe validation unavailable in production. Check STRIPE_SECRET_KEY.",
        };
      }

      console.log(
        "⚠️ Using development license validation (Stripe lookup not implemented)",
      );

      // Generate a valid license for development/testing
      const customerId = `test_${customerMatch[1]}_${customerMatch[2]}`;
      const licenseData = this.generateLicenseKey(customerId, "PRO", false);

      return {
        valid: true,
        tier: "PRO",
        isFounder: false,
        customerId: customerId,
        issued: new Date(),
        expires: null, // No expiration for development licenses
        payload: licenseData.payload,
        signature: licenseData.signature,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.constructor.name : 'UnknownError';

      console.error("[License] CRITICAL: License validation failed", {
        error: errorMsg,
        errorType: errorName,
        licenseKey: licenseKey ? licenseKey.substring(0, 20) + '...' : 'none',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Return detailed error for user troubleshooting
      return {
        valid: false,
        error: `License validation failed: ${errorMsg}. ` +
               `If you believe this is an error, contact support with error code: LIC_${errorName.toUpperCase()}`
      };
    }
  }

  /**
   * Verify license signature
   */
  verifyLicenseSignature(payload, signature) {
    const expectedSignature = this.signLicensePayload(payload);
    const sigBuffer = Buffer.from(signature || "", "utf8");
    const expBuffer = Buffer.from(expectedSignature, "utf8");
    if (sigBuffer.length !== expBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  }

  /**
   * Store license locally after successful payment
   */
  async storeLicenseLocally(licenseData) {
    try {
      // Create license directory if it doesn't exist
      if (!fs.existsSync(this.licenseDir)) {
        fs.mkdirSync(this.licenseDir, { recursive: true });
      }

      const licenseFile = path.join(this.licenseDir, "license.json");

      const licenseRecord = {
        licenseKey: licenseData.licenseKey,
        payload: licenseData.payload,
        signature: licenseData.signature,
        activated: Date.now(),
      };

      fs.writeFileSync(licenseFile, JSON.stringify(licenseRecord, null, 2));

      console.log("✅ License activated successfully!");
      console.log(`📋 Tier: ${licenseData.payload.tier}`);
      console.log(
        `🎁 Founder: ${licenseData.payload.isFounder ? "Yes" : "No"}`,
      );

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof Error && 'code' in error ? error.code : 'UNKNOWN';

      console.error("[License] CRITICAL: Failed to store license locally", {
        error: errorMsg,
        errorCode,
        licenseDir: this.licenseDir,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // User-facing error with actionable steps
      console.error(
        "\n❌ License activation failed\n" +
        `   Error: ${errorMsg}\n` +
        `   Location: ${this.licenseDir}\n` +
        "\n💡 Troubleshooting:\n" +
        `   • Check directory permissions: ls -la ${this.licenseDir}\n` +
        "   • Verify disk space: df -h\n" +
        "   • Contact support if issue persists\n"
      );

      return false;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(body, signature) {
    const initialized = await this.initialize();
    if (!initialized) {
      throw new Error("Stripe not configured; cannot process webhooks.");
    }
    this.requireStripe("Stripe not configured; cannot process webhooks.");

    let event;
    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.webhookSecret,
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error.message);
      return { success: false, error: "Invalid signature" };
    }

    switch (event.type) {
      case "checkout.session.completed":
        return await this.handleCheckoutCompleted(event.data.object);

      case "customer.subscription.deleted":
        return await this.handleSubscriptionCanceled(event.data.object);

      case "invoice.payment_succeeded":
        return await this.handlePaymentSucceeded(event.data.object);

      case "invoice.payment_failed":
        return await this.handlePaymentFailed(event.data.object);

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return { success: true };
    }
  }

  /**
   * Handle successful checkout completion
   */
  async handleCheckoutCompleted(session) {
    try {
      const { tier, isFounder } = session.metadata;
      const customerId = session.customer;

      // Generate license key
      const licenseData = this.generateLicenseKey(
        customerId,
        tier,
        isFounder === "true",
      );

      // Here you would typically:
      // 1. Store license in database
      // 2. Send license key to customer via email
      // 3. Update customer record

      console.log("✅ Checkout completed:", {
        customerId,
        tier,
        isFounder,
        licenseKey: licenseData.licenseKey,
      });

      return {
        success: true,
        licenseKey: licenseData.licenseKey,
        customerId,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.constructor.name : 'UnknownError';

      console.error("[Webhook] CRITICAL: Checkout completion failed", {
        error: errorMsg,
        errorType: errorName,
        sessionId: session.id,
        customerId: session.customer,
        tier: session.metadata?.tier,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // CRITICAL: Customer has paid but license generation failed
      // This requires manual intervention and customer notification
      console.error(
        "\n🚨 CRITICAL: Customer paid but license generation failed!\n" +
        `   Session: ${session.id}\n` +
        `   Customer: ${session.customer}\n` +
        `   Error: ${errorMsg}\n` +
        "\n⚠️  REQUIRED ACTIONS:\n" +
        "   1. Manually generate license for this customer\n" +
        "   2. Send license key via support email\n" +
        "   3. Investigate root cause to prevent recurrence\n" +
        "   4. Consider implementing retry queue for failed license generation\n"
      );

      return {
        success: false,
        error: `License generation failed: ${errorMsg} (${errorName})`,
        requiresManualIntervention: true,
        sessionId: session.id,
        customerId: session.customer,
      };
    }
  }

  /**
   * Handle subscription cancellation
   */
  async handleSubscriptionCanceled(subscription) {
    console.log("❌ Subscription canceled:", subscription.id);

    // Here you would typically:
    // 1. Revoke license access
    // 2. Send cancellation confirmation email
    // 3. Update customer record to free tier

    return { success: true };
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(invoice) {
    console.log("💰 Payment succeeded:", invoice.id);
    return { success: true };
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(invoice) {
    console.log("❌ Payment failed:", invoice.id);

    // Here you would typically:
    // 1. Send payment failure notification
    // 2. Implement grace period logic
    // 3. Downgrade after grace period expires

    return { success: true };
  }

  /**
   * Get customer portal URL for subscription management
   */
  async createCustomerPortalSession(customerId, returnUrl) {
    await this.initialize();
    this.requireStripe();

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Create promotional discount codes
   */
  async createPromotionCode(couponId, code, maxRedemptions = null) {
    await this.initialize();
    this.requireStripe();

    const promotionCode = await this.stripe.promotionCodes.create({
      coupon: couponId,
      code: code,
      max_redemptions: maxRedemptions,
      active: true,
    });

    return promotionCode;
  }
}

module.exports = { StripeIntegration };
