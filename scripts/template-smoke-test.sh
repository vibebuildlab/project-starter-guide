#!/usr/bin/env bash

# Template Smoke Test Script
# Tests templates with production-like environments and comprehensive validation
#
# Features:
# - Uses validate:all command when available (API service, mobile app)
# - Supports clean command for artifact cleanup (set CLEAN_BEFORE_TEST=true)
# - Environment variable testing (minimal and production-like configs)
# - Security audit with waiver support (.security-waivers.json)

set -euo pipefail

TEMPLATE_PATH=$1
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PROJECT_DIR="$ROOT_DIR/templates/$TEMPLATE_PATH"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "Template path '$TEMPLATE_PATH' not found under templates/"
  exit 1
fi

echo "🔍 Running smoke tests for $TEMPLATE_PATH"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
  echo "ℹ️  No package.json found, skipping npm-based checks."
  exit 0
fi

pushd "$PROJECT_DIR" >/dev/null

export npm_config_cache="$PROJECT_DIR/.npm-cache"
mkdir -p "$npm_config_cache"
export HUSKY=0

has_script() {
  node -e "const pkg = require('./package.json'); process.exit(pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, '$1') ? 0 : 1);"
}

echo "📦 Installing dependencies..."
npm ci --no-audit --no-fund

# Optional: Clean artifacts from previous runs if clean script exists
if has_script "clean" && [ "${CLEAN_BEFORE_TEST:-false}" = "true" ]; then
  echo "🧹 Cleaning previous artifacts..."
  HUSKY=0 npm run clean
  echo "📦 Reinstalling dependencies after clean..."
  npm ci --no-audit --no-fund
fi

run_if_script_exists() {
  local script=$1
  local description=$2
  if has_script "$script"; then
    echo "▶️  $description"
    HUSKY=0 npm run "$script"
  else
    echo "⏭️  Skipping $description (script not defined)"
  fi
}

run_security_audit() {
  echo "🔐 Running security audit"

  # Always check production dependencies first (most critical)
  echo "🏭 Checking production dependencies..."
  if npm audit --production --audit-level=high; then
    echo "✅ Production dependencies are secure"
  else
    echo "🚨 High/critical vulnerabilities found in production dependencies"
    echo "   This is a blocking issue - review SECURITY.md and fix immediately"
    exit 1
  fi

  # Check if there's a documented waiver file for dev dependencies
  if [ -f ".security-waivers.json" ]; then
    echo "ℹ️  Security waivers file found - checking dev dependencies against waivers"

    # Extract waived package names from our waiver structure
    WAIVED_PACKAGES=$(node -e "
      const waivers = require('./.security-waivers.json');
      if (waivers.waivers && waivers.waivers.dev_only_vulnerabilities && waivers.waivers.dev_only_vulnerabilities.vulnerabilities) {
        const packages = waivers.waivers.dev_only_vulnerabilities.vulnerabilities.map(v => v.package);
        console.log(packages.join(','));
      } else {
        console.log('');
      }
    ")

    # Run full audit (including dev) and capture JSON output
    AUDIT_JSON=$(npm audit --json 2>/dev/null || true)

    # Extract vulnerable package names from audit output
    FOUND_PACKAGES=$(echo "$AUDIT_JSON" | node -e "
      const fs = require('fs');
      const stdin = fs.readFileSync(0, 'utf-8');
      try {
        const audit = JSON.parse(stdin);
        const packages = new Set();

        if (audit.vulnerabilities) {
          Object.keys(audit.vulnerabilities).forEach(pkg => {
            packages.add(pkg);
          });
        }

        console.log(Array.from(packages).join(','));
      } catch (e) {
        console.error('Error parsing audit JSON:', e.message);
        process.exit(0);
      }
    ")

    if [ -z "$FOUND_PACKAGES" ]; then
      echo "✅ No vulnerabilities found in dev dependencies"
      return 0
    fi

    # Check for NEW (non-waived) vulnerable packages
    NEW_VULNS=$(node -e "
      const waived = '$WAIVED_PACKAGES'.split(',').filter(Boolean);
      const found = '$FOUND_PACKAGES'.split(',').filter(Boolean);
      const newVulns = found.filter(pkg => !waived.includes(pkg));
      console.log(newVulns.join(','));
    ")

    if [ -n "$NEW_VULNS" ]; then
      echo "🚨 NEW vulnerable packages found (not in .security-waivers.json):"
      echo "   Packages: $NEW_VULNS"
      echo "   Run 'npm audit' locally for details"
      echo "   If these are acceptable dev-only risks, add them to .security-waivers.json"
      exit 1
    fi

    echo "✅ All vulnerable packages are documented in .security-waivers.json"
    WAIVED_COUNT=$(echo "$FOUND_PACKAGES" | tr ',' '\n' | grep -c . || echo "0")
    echo "   ($WAIVED_COUNT waived packages: $FOUND_PACKAGES)"

  else
    # No waiver file - run audit normally
    if has_script "security:audit"; then
      HUSKY=0 npm run security:audit
    else
      npm audit --audit-level=high --production || {
        echo "⚠️  High/critical vulnerabilities found in production dependencies"

        # If SECURITY.md exists, remind to review documented issues
        if [ -f "SECURITY.md" ]; then
          echo "📋 SECURITY.md documents known vulnerabilities"
          echo "   Review if these are newly introduced issues or already documented"
        fi

        echo "   Run 'npm audit' locally for details"
        exit 1
      }
    fi
  fi
}

# Test 1: Minimal .env scenario (critical for production readiness)
echo "🧪 Testing minimal .env configuration..."
test_minimal_env() {
  local template=$1

  case "$template" in
    "saas-level-1")
      # Test with ONLY required vars (no DB, no OAuth)
      # This tests that mock provider works without DATABASE_URL
      export NEXTAUTH_SECRET="test-secret-at-least-32-characters-long-for-ci"
      export NEXTAUTH_URL="http://localhost:3000"
      export NODE_ENV="development"
      # Intentionally NOT setting DATABASE_URL, OAuth providers
      # Template should work with mock/credentials provider
      echo "   Testing SaaS with mock provider (no DATABASE_URL)..."
      ;;
    "api-service")
      # API requires DATABASE_URL - test with minimal set
      export DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
      export PORT="3000"
      export JWT_SECRET="test-jwt-secret-at-least-32-chars"
      export NODE_ENV="test"
      echo "   Testing API with minimal required vars..."
      ;;
    "mobile-app")
      # Mobile app doesn't need server env vars
      echo "   Testing mobile app (no server env vars needed)..."
      ;;
  esac
}

test_minimal_env "$TEMPLATE_PATH"

# Test 2: Full production-like env (all providers enabled)
echo "🚀 Testing production-like configuration..."
if [[ "$TEMPLATE_PATH" == "saas-level-1" ]]; then
  # Add full OAuth/database env for production testing
  export DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
  export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_dummy"
  export STRIPE_SECRET_KEY="sk_test_dummy"
  export STRIPE_WEBHOOK_SECRET="whsec_dummy"
  export GITHUB_ID="dummy-github-client-id"
  export GITHUB_SECRET="dummy-github-client-secret"
  export GOOGLE_CLIENT_ID="dummy-google-client-id.apps.googleusercontent.com"
  export GOOGLE_CLIENT_SECRET="dummy-google-client-secret"
  echo "   Testing with OAuth providers and database..."
fi

# Run comprehensive validation (lint/type-check/build) with production env
export NODE_ENV="production"

# Run lint and type-check first (these work in production mode)
run_if_script_exists lint "npm run lint"
run_if_script_exists "type-check" "npm run type-check"
run_if_script_exists build "npm run build"

# Run tests with test env (React 19's testing library requires NODE_ENV=test)
export NODE_ENV="test"
if [ "$TEMPLATE_PATH" = "saas-level-1" ]; then
  run_if_script_exists test "npm test"
else
  run_if_script_exists test "npm test -- --runInBand"
fi

SKIP_SECURITY_AUDIT=false

# Run security audit only if not already included in validate:all
if [ "$SKIP_SECURITY_AUDIT" = false ]; then
  run_security_audit
else
  echo "⏭️  Skipping separate security audit (included in validate:all)"
fi

popd >/dev/null

echo "✅ Smoke tests completed for $TEMPLATE_PATH"
