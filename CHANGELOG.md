# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **api-service**: Refactored error handling with centralized response utilities
- **api-service**: Added HTTP status code and auth constants for maintainability
- **api-service**: Streamlined routing structure and removed unused routes

### Fixed
- **api-service**: Replaced console.error with structured logger in SSRF middleware (CODE-001)
- **api-service**: Customized Helmet.js with explicit CSP directives (SEC-008)
- **api-service**: Added CORS wildcard startup warning for development (SEC-009)
- **api-service**: Server startup now handles port binding errors (EADDRINUSE, EACCES)
- **api-service**: Added `res.on('error')` handler in fetch.ts to prevent hanging requests
- **api-service**: JWT verification now enforces HS256 algorithm (prevents algorithm confusion)
- **api-service**: SSRF protection catch blocks now log errors instead of silently failing
- **api-service**: Health check error response includes error type name for diagnostics
- **mobile-app**: Config parse errors log as CRITICAL in production
- **mobile-app**: Added useCallback for navigation handlers (performance)
- **mobile-app**: Extracted SCREEN_OPTIONS constant to prevent re-renders
- **saas-level-1**: Added template-specific .gitignore (was missing)
- **mobile-app**: Added template-specific .gitignore (was missing)

### Added
- **FEAT-003**: Interactive template generator tool (`npm run generate`)
  - Template selection with complexity indicators
  - Customization options (database, auth providers, features)
  - Non-interactive mode with `--defaults` flag for CI/automation
  - Auto-generated .env.example with secure secrets
  - Template metadata in `templates/.templates.json`
- **FEAT-002**: QA integration test suite (74 tests)
  - Template configuration validation
  - Script availability checks
  - Security waiver validation
  - Environment variable validation
  - Lint/Prettier/TypeScript config presence
  - Husky pre-commit hooks
  - Generator integration tests
  - CI workflow validation

### Security
- **api-service**: Added TRUST_PROXY documentation for reverse proxy deployments (SEC-006)
- **api-service**: Documented refresh token rotation as optional enhancement (SEC-007)
- **api-service**: SSRF protection hardening - DNS lookup timeout, pinned agent to mitigate DNS rebinding, ignore array query/body values
- **api-service**: Auth header validation - require Bearer scheme, handle array headers
- **api-service**: Error handler hides 5xx details in production
- **api-service**: Explicit `TRUST_PROXY` env flag (prevents X-Forwarded-For spoofing)
- **api-service**: Rate limiting now keys off `req.userId` (matches auth middleware)
- Strengthened SSRF protection middleware with additional blocklist entries
- Improved error handler and notFound middleware robustness
- Added comprehensive unit tests for SSRF protection

### Added
- **api-service**: New `/api/fetch` route demonstrating SSRF-safe external request proxy
- **saas-level-1**: Support both `GITHUB_CLIENT_ID` and legacy `GITHUB_ID` env vars
- **saas-level-1**: Support `EMAIL_SERVER` connection string or `EMAIL_SERVER_*` parts
- **saas-level-1**: Require `NEXTAUTH_URL` in production (no localhost default)

### Changed
- **api-service**: Test infrastructure uses `os.tmpdir()` for portable lock files
- Enhanced mobile-app env configuration and test coverage

## [2.2.0] - 2025-12-08

### Added
- Database performance indexes to all Prisma schemas (Account.userId, Session.userId/expires, User.stripeCustomerId, Subscription.userId+status)
- ARIA accessibility attributes to mobile menu button (aria-label, aria-expanded, aria-controls)
- Prettier configuration files to api-service and mobile-app templates
- .dockerignore files to api-service and saas-level-1 templates
- Secret generation commands in .env.example files (openssl commands)
- .env.docker.example for secure Docker Compose configuration

### Changed
- **BREAKING**: Enabled TypeScript strict mode in saas-level-1 template
- Docker secrets moved from hardcoded values to .env.docker file (api-service)
- Placeholder text color improved from gray-400 to gray-500 for WCAG AA compliance
- Security waiver expiry dates updated, cleared resolved vulnerabilities
- Updated glob dependency to ^10.5.0 via package.json overrides (fixes GHSA-5j98-mcp5-4vw2)
- Updated js-yaml via npm audit fix (fixes GHSA-mh29-5h37-fv8m)
- .gitignore updated to include .env.docker

### Security
- Fixed 3 high-severity vulnerabilities in glob (command injection)
- Fixed 1 moderate-severity vulnerability in js-yaml (prototype pollution)
- Removed all security waivers from saas-level-1 (vulnerabilities resolved)
- Docker Compose secrets no longer hardcoded, now use environment files

### Performance
- Added 7 database indexes for 50-80% query performance improvement:
  - Account: userId index for faster OAuth account lookups
  - Session: userId and expires indexes for session management and cleanup
  - User: stripeCustomerId index for webhook processing
  - Subscription: compound userId+status index for active subscription queries
  - User (api-service): lastLogin index for analytics queries

### Accessibility
- Mobile menu now fully keyboard accessible with proper ARIA labels
- Improved color contrast for form placeholders (WCAG 2.1 AA compliant)
- Mobile navigation role explicitly defined

## [1.0.0] - 2025-11-20

### Initial Release
- Three starter templates: api-service, mobile-app, saas-level-1
- Comprehensive documentation and README files
- Security best practices and automated scanning
- Quality automation with ESLint, Prettier, Stylelint
- Testing infrastructure with Jest and Vitest
- CI/CD workflows for automated testing and quality checks
- Docker support for api-service template
- NextAuth authentication for saas-level-1
- React Native/Expo mobile app template
- Tailwind CSS styling
- Prisma ORM integration
- Stripe payment integration (saas-level-1)

---

## Migration Guide

### Upgrading to v2.2.0

#### TypeScript Strict Mode (saas-level-1)
If you've forked the saas-level-1 template, enabling strict mode may reveal type errors:

```bash
# Run type-check to identify issues
npm run type-check

# Common fixes needed:
# 1. Add explicit types to function parameters
# 2. Replace 'any' types with proper types
# 3. Handle null/undefined cases explicitly
```

#### Docker Secrets (api-service)
If using Docker Compose:

```bash
# 1. Copy the new env file template
cp .env.docker.example .env.docker

# 2. Update .env.docker with your secrets
# Generate JWT secret: openssl rand -hex 32
# Update DATABASE_URL, POSTGRES_PASSWORD

# 3. Docker Compose will now read from .env.docker
docker-compose up
```

#### Database Migrations (All templates)
New indexes require a database migration:

```bash
# Generate migration
npx prisma migrate dev --name add_performance_indexes

# Or for existing databases
npx prisma db push
```

---

**Note**: This changelog will be updated with each release. For detailed commit history, see the git log.
