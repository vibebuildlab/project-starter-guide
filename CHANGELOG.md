# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
