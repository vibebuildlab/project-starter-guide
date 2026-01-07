"use strict";

/**
 * Minimal Stripe webhook handler for {{PROJECT_NAME}}
 *
 * Part of Project Starter Guide - SaaS Monetization Templates
 * Copyright (c) 2025 Vibe Build Lab LLC
 * Licensed under MIT License
 *
 * Production use: wire this into your existing web framework.
 * Dev mode: `node lib/monetization/stripe-webhook.js` (listens on :4242).
 */

const http = require("http");
const { StripeIntegration } = require("./stripe-integration");

async function handleRequest(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  let rawBody = "";
  req.on("data", (chunk) => {
    rawBody += chunk;
  });
  req.on("end", async () => {
    try {
      const signature = req.headers["stripe-signature"];
      const stripe = new StripeIntegration();
      const result = await stripe.handleWebhook(rawBody, signature);

      if (result.success) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ received: true }));
      }

      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: result.error || "Webhook handling failed" }),
      );
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

function startServer() {
  const port = process.env.PORT || 4242;
  const server = http.createServer(handleRequest);
  server.listen(port, () => {
    console.log(
      `🚏 Stripe webhook listener running on http://localhost:${port}`,
    );
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { handleRequest };
