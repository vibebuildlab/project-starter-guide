"use strict";

/**
 * CLI helper to show license status for {{PROJECT_NAME}}
 *
 * Part of Project Starter Guide - SaaS Monetization Templates
 * Copyright (c) 2025 Vibe Build Lab LLC
 * Licensed under MIT License
 */
const { showLicenseStatus } = require("./licensing");

function run() {
  showLicenseStatus();
}

run();
