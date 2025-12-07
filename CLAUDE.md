# Project Starter Guide - Claude Configuration

## Project Overview

Comprehensive guide for choosing the right architecture and technology stack for any project type. Contains starter templates for SaaS, API services, mobile apps, and static sites.

---

## Repository Structure

```
project-starter-guide/
├── docs/                        # Project documentation
│   ├── ARCHITECTURE.md          # System architecture overview
│   ├── DEPLOYMENT.md            # Deployment guide
│   ├── TESTING.md               # Testing strategy
│   ├── architecture-patterns.md # Architecture decision patterns
│   ├── complexity-levels.md     # Template complexity guide
│   ├── dependency-monitoring.md # Dependency management
│   ├── security-guide.md        # Security best practices
│   ├── technology-matrix.md     # Tech stack decision matrix
│   ├── template-comparison.md   # Template feature comparison
│   ├── template-quickstart.md   # Quick start guide
│   ├── testing-strategy.md      # Testing approaches
│   └── project-types/           # Project type guides
├── templates/
│   ├── about-me-page/           # Static HTML/CSS portfolio (no CLAUDE.md)
│   ├── api-service/             # Express + TypeScript + Prisma
│   ├── mobile-app/              # React Native + Expo
│   └── saas-level-1/            # Next.js + NextAuth + Stripe
├── scripts/
│   ├── template-smoke-test.sh   # Smoke test runner (run from root)
│   ├── cleanup-artifacts.sh     # Clean build artifacts
│   ├── smart-test-strategy.sh   # Intelligent test execution
│   └── test-production-validation.sh  # Production env validation
├── .github/
│   └── workflows/               # CI/CD workflows
├── AGENTS.md                    # Agent-specific guidance
├── CLAUDE.md                    # This file
└── README.md                    # Project documentation
```

**Note:** Only `api-service`, `mobile-app`, and `saas-level-1` have template-specific `CLAUDE.md` files. The `about-me-page` template is a simple static site without one.

---

## Template Structure

```
templates/
├── about-me-page/     # Static HTML/CSS portfolio (no package.json, no CLAUDE.md)
├── api-service/       # Express + TypeScript + Prisma (has CLAUDE.md)
├── mobile-app/        # React Native + Expo (has CLAUDE.md)
└── saas-level-1/      # Next.js + NextAuth + Stripe (has CLAUDE.md)
```

Each npm-based template (api-service, mobile-app, saas-level-1) has:
- Its own `package.json` with template-specific scripts
- Its own `CLAUDE.md` with template-specific guidance
- Independent dependency management
- Self-contained test suites

**Important:** There is **no root-level `package.json`**. All npm commands must be run from within individual template directories, not from the project root.

---

## Development Workflow

### Running Commands

**From Template Directories:**
```bash
# Navigate to template first
cd templates/saas-level-1
npm install
npm test
npm run build

# NOT from root (will fail - no package.json)
npm test  # ❌ Error: no package.json
```

**From Root Directory:**
```bash
# Use scripts that handle multi-template operations
bash scripts/template-smoke-test.sh saas-level-1
bash scripts/template-smoke-test.sh mobile-app
bash scripts/template-smoke-test.sh api-service

# Clean artifacts across templates
bash scripts/cleanup-artifacts.sh
```

### Template Validation Process

**Test all templates after making changes:**

```bash
# From root directory
bash scripts/template-smoke-test.sh api-service
bash scripts/template-smoke-test.sh mobile-app
bash scripts/template-smoke-test.sh saas-level-1
```

**What the smoke test does:**
- Installs dependencies (`npm ci`)
- Runs linting (`npm run lint`)
- Runs tests (`npm test`)
- Builds the project (`npm run build`)
- Validates environment configuration
- Checks for security vulnerabilities

**Expected completion times:**
- `api-service`: ~2 minutes
- `mobile-app`: ~5 minutes
- `saas-level-1`: ~13 minutes

**Security waivers:**
- `mobile-app` uses `.security-waivers.json` for documented, acceptable vulnerabilities
- Other templates must pass security audits without waivers

### Quality Checks

- **Always test template functionality** before committing
- **Run smoke tests** on all templates after changes
- **Validate documentation accuracy** against actual implementation
- **Security scanning** for configuration exposure and hardcoded secrets
- **Keep CLAUDE.md files in sync** with actual template features

---

## Template-Specific Configuration

### API Service (`templates/api-service/`)
- **Tech:** Express 5, TypeScript, PostgreSQL, Prisma, JWT Auth, Vitest
- **Key Features:** Rate limiting, SSRF protection, security-first design
- **Tests:** Unit, integration, smoke tests
- **Documentation:** See `templates/api-service/CLAUDE.md`

### Mobile App (`templates/mobile-app/`)
- **Tech:** React Native 0.81, Expo 54, TypeScript, React Navigation
- **Testing:** Jest with `jest-expo` preset (configured in `package.json`)
- **Key Features:** File-based routing, theming, platform-specific code
- **Documentation:** See `templates/mobile-app/CLAUDE.md`

### SaaS Level 1 (`templates/saas-level-1/`)
- **Tech:** Next.js 16, React 19, TypeScript, Tailwind CSS, Prisma, NextAuth, Stripe
- **Auth:** NextAuth with Prisma adapter (database sessions)
- **Tests:** Vitest for unit/integration, includes auth flow testing
- **Documentation:** See `templates/saas-level-1/CLAUDE.md`
- **Auth Testing:** See `templates/saas-level-1/docs/architecture/nextauth-strategy-matrix.md`

### About Me Page (`templates/about-me-page/`)
- **Tech:** Static HTML/CSS
- **No build process:** Pure static files
- **No CLAUDE.md:** Simple enough not to require one

---

## Authentication Testing Requirements

**Only applies to SaaS Level 1 template** (has NextAuth integration):

- **Integration tests required:** Complete auth flows (login → session → subsequent requests)
- **Production validation:** Test fail-fast scenarios with `NODE_ENV=production`
- **Strategy testing:** Test both JWT and database session strategies
- **Session preservation:** Verify `session.user.id` persists across requests
- **Reference:** `templates/saas-level-1/docs/architecture/nextauth-strategy-matrix.md`

**Note:** These requirements are specific to the SaaS template and documented in detail in `templates/saas-level-1/CLAUDE.md`.

---

## Common Scripts (Root Level)

### Template Smoke Tests
```bash
# Run smoke tests on a specific template
bash scripts/template-smoke-test.sh <template-name>

# Examples:
bash scripts/template-smoke-test.sh saas-level-1
bash scripts/template-smoke-test.sh mobile-app
bash scripts/template-smoke-test.sh api-service
```

### Cleanup
```bash
# Clean build artifacts across all templates
bash scripts/cleanup-artifacts.sh
```

### Smart Testing
```bash
# Intelligent test execution based on changes
bash scripts/smart-test-strategy.sh
```

### Production Validation
```bash
# Test production environment configuration
bash scripts/test-production-validation.sh
```

---

## AI Assistant Guidelines

When working on this project:

### General Rules
- **Read existing code** before making changes
- **Follow established patterns** in similar files
- **Run type-check and tests** after changes
- **Don't add features** beyond what's requested
- **Keep documentation in sync** with implementation

### Working with Templates
- **Navigate to template directory first** before running npm commands
- **Test your changes** by running the smoke test script
- **Update template CLAUDE.md** if you change template behavior
- **Don't assume root npm commands exist** - they don't

### Documentation Updates
- **Update docs/** files when architecture changes
- **Keep CLAUDE.md accurate** - it should reflect actual project state
- **Document security waivers** in `.security-waivers.json` with justification
- **Update template comparison** docs when adding features

### Testing
- **Run smoke tests** on affected templates before committing
- **Test production scenarios** when changing environment handling
- **Validate all three templates** if making cross-cutting changes
- **Check security audits** pass (or have documented waivers)

---

## Documentation Directory

The `docs/` directory contains comprehensive guides:

- **ARCHITECTURE.md** - Overall system architecture
- **DEPLOYMENT.md** - Deployment strategies
- **TESTING.md** - Testing approach
- **architecture-patterns.md** - Design pattern decisions
- **complexity-levels.md** - Template complexity guide
- **dependency-monitoring.md** - Dependency management strategy
- **security-guide.md** - Security best practices
- **technology-matrix.md** - Technology decision matrix
- **template-comparison.md** - Feature comparison across templates
- **template-quickstart.md** - Quick start guide for templates
- **testing-strategy.md** - Testing strategy details
- **project-types/** - Guides for specific project types

---

## Key Differences from Previous Version

### Fixed Inaccuracies
1. **Removed claim** that all templates have CLAUDE.md (about-me-page doesn't)
2. **Clarified** that root-level npm commands don't exist (no root package.json)
3. **Moved** authentication testing requirements to SaaS-specific section
4. **Updated** mobile app Jest documentation to reflect package.json configuration
5. **Added** docs/ directory to structure documentation
6. **Documented** scripts/template-smoke-test.sh usage from root

### New Sections
- **Repository Structure** - Shows docs/ directory
- **Template Structure** - Clarifies which templates have CLAUDE.md
- **Running Commands** - Emphasizes template-vs-root distinction
- **Documentation Directory** - Lists all available guides

---

*Project-specific configuration for Project Starter Guide development*
