"use strict";

/**
 * CLI helper to activate a license for {{PROJECT_NAME}}
 *
 * Part of Project Starter Guide - SaaS Monetization Templates
 * Copyright (c) 2025 Vibe Build Lab LLC
 * Licensed under MIT License
 *
 * Learn more: https://vibebuildlab.com
 */
const { promptLicenseActivation } = require("./licensing");

async function run() {
  const result = await promptLicenseActivation();

  if (!result.success) {
    console.log(`❌ Activation failed: ${result.error || "Please try again"}`);
    process.exitCode = 1;
  }
}

run();
