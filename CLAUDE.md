# Project Starter Guide - Claude Guide

> Collection of production-ready starter templates for different project types.

## Templates

| Template | Tech Stack | Use For |
|----------|------------|---------|
| `about-me-page/` | Static HTML/CSS | Simple portfolios, landing pages |
| `api-service/` | Express 5, TypeScript, Prisma | RESTful APIs, microservices |
| `mobile-app/` | React Native, Expo 54 | iOS/Android apps |
| `saas-level-1/` | Next.js 16, NextAuth, Stripe | SaaS products with auth + payments |

## Key Commands

**From Template Directory:**
```bash
cd templates/saas-level-1
npm install && npm test && npm run build
```

**From Root (Smoke Tests):**
```bash
bash scripts/template-smoke-test.sh api-service
bash scripts/template-smoke-test.sh mobile-app
bash scripts/template-smoke-test.sh saas-level-1
bash scripts/cleanup-artifacts.sh
```

## Project Structure

```
project-starter-guide/
├── templates/
│   ├── about-me-page/      # Static (no CLAUDE.md)
│   ├── api-service/        # Express (has CLAUDE.md)
│   ├── mobile-app/         # React Native (has CLAUDE.md)
│   └── saas-level-1/       # Next.js (has CLAUDE.md)
├── scripts/                # Smoke tests, cleanup
└── docs/                   # Architecture docs
```

**Important:** No root `package.json`. Run npm from template directories.

## What NOT to Do

- Don't run npm commands from root (no package.json)
- Don't skip smoke tests before committing
- Don't modify templates without testing
- Don't leave docs out of sync

---
*See template-specific CLAUDE.md files for details. Global rules in `~/.claude/CLAUDE.md`.*
