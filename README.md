# Project Starter Guide

[![Template Smoke Tests](https://github.com/vibebuildlab/project-starter-guide/actions/workflows/template-smoke-tests.yml/badge.svg)](https://github.com/vibebuildlab/project-starter-guide/actions/workflows/template-smoke-tests.yml)
[![Code Quality](https://github.com/vibebuildlab/project-starter-guide/actions/workflows/code-quality-review.yml/badge.svg)](https://github.com/vibebuildlab/project-starter-guide/actions/workflows/code-quality-review.yml)
[![Dependency Audit](https://github.com/vibebuildlab/project-starter-guide/actions/workflows/dependency-audit.yml/badge.svg)](https://github.com/vibebuildlab/project-starter-guide/actions/workflows/dependency-audit.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Subscribe](https://img.shields.io/badge/Newsletter-Subscribe-blue?logo=substack)](https://blog.vibebuildlab.com/subscribe?utm_source=project-starter-guide-github)

Comprehensive guide for choosing the right architecture and technology stack for any project type. A decision matrix and technical reference for developers starting new projects.

---

> **Maintainer & Ownership**
> This project is maintained by **Vibe Build Lab LLC**, a studio focused on AI-assisted product development, micro-SaaS, and "vibe coding" workflows for solo founders and small teams.
> Learn more at **https://vibebuildlab.com**.

---

## Features

- **Decision Matrix** - Quick-reference table matching project types to recommended stacks
- **Complexity Levels** - 5-tier system from static sites to enterprise-grade applications
- **Quality Automation** - One-command setup for ESLint, Prettier, Husky, GitHub Actions
- **Smart Test Strategy** - Intelligent risk-based validation built into every template
- **Production Templates** - Battle-tested starters for SaaS, APIs, and mobile apps
- **Security First** - Built-in vulnerability scanning and best practices

## Target Users

- **Developers** starting new projects who need architecture guidance
- **Technical leads** evaluating technology stacks for team projects
- **Bootcamp graduates** learning production-ready patterns
- **Solo founders** who want to make the right tech decisions from day one

## Quick Start Decision Matrix

| Project Type | Complexity | Recommended Stack | Time to MVP |
|--------------|------------|-------------------|-------------|
| **Portfolio / About Me** | Level 1 | HTML5 + CSS3 + Vanilla JS | 0.5-1 day |
| **Landing Page** | Level 1 | Next.js + Tailwind | 1-2 days |
| **Blog / Documentation** | Level 2 | Next.js + MDX or Astro | 2-4 days |
| **SaaS MVP** | Level 3 | Next.js + Supabase + Stripe | 3-5 days |
| **E-commerce** | Level 3 | Next.js + Shopify/Stripe + DB | 5-7 days |
| **Enterprise SaaS** | Level 4 | Microservices + K8s + Multiple DBs | 3-6 weeks |

## Pricing & Licensing

**This is a free lead magnet / educational resource.**

- All templates and guides are MIT licensed
- No payment required
- Contributions welcome

## Tech Stack Coverage

### Frontend Frameworks
- **React/Next.js** - Most versatile, great ecosystem
- **Vue/Nuxt.js** - Gentle learning curve, great DX
- **Svelte/SvelteKit** - Smallest bundle size, fast performance
- **Astro** - Content-focused sites, multi-framework support

### Backend Solutions
- **Serverless Functions** - Vercel, Netlify (Levels 1-2)
- **Node.js** - Express, Fastify, Nest.js (Levels 2-3)
- **Python** - FastAPI, Django (Levels 3-4)
- **Go** - Gin, Fiber (Levels 3-5)

### Databases
- **Level 1-2:** LocalStorage, Supabase
- **Level 3:** PostgreSQL, MongoDB, PlanetScale
- **Level 4:** Multiple databases, Redis, search engines

## Getting Started

### Using the Decision Matrix

1. **Identify your project type** - What are you building?
2. **Determine complexity level** - How complex is your use case?
3. **Match a starter** - Pick the closest template to your needs
4. **Review core docs** - Read `docs/ARCHITECTURE.md`, `docs/TESTING.md`, and `docs/DEPLOYMENT.md`
5. **Use templates** - Start with proven patterns

### Adding Quality Automation to Any Project

```bash
# One command adds comprehensive quality tools
npx create-qa-architect@latest
npm install && npm run prepare
```

**What you get:**
- ESLint + Security Rules
- Prettier Formatting
- Security Scanning
- Pre-commit Hooks
- GitHub Actions CI/CD
- Smart Test Strategy

## Complexity Levels

### Level 1: Static & Simple
- **Use Case:** Landing pages, portfolios, documentation
- **Architecture:** Static files, minimal JavaScript
- **Hosting:** Vercel, Netlify, GitHub Pages

### Level 2: Dynamic Frontend
- **Use Case:** Interactive websites, simple web apps
- **Architecture:** Frontend framework + API calls
- **Hosting:** Vercel, Netlify + serverless functions

### Level 3: Full-Stack Applications
- **Use Case:** SaaS products, e-commerce, dashboards
- **Architecture:** Frontend + Backend + Database + Auth
- **Hosting:** Vercel/Railway + managed database

### Level 4: Scalable Systems
- **Use Case:** High-traffic applications, complex business logic
- **Architecture:** Microservices, load balancers, caching
- **Hosting:** Cloud platforms (AWS, GCP, Azure)

### Level 5: Enterprise Grade
- **Use Case:** Mission-critical systems, complex integrations
- **Architecture:** Distributed systems, service mesh, monitoring
- **Hosting:** Multi-cloud, Kubernetes clusters

## Documentation

### Core Guides
- [Architecture](docs/ARCHITECTURE.md)
- [Testing](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)

### Templates
- [About Me Page Template](templates/about-me-page/)
- [SaaS Level 1 Starter](templates/saas-level-1/)
- [API Service Template](templates/api-service/)
- [Mobile App Starter](templates/mobile-app/)

## Roadmap

- [x] Decision matrix and complexity levels
- [x] Quality automation integration
- [x] Smart test strategy
- [x] Template smoke tests
- [ ] AI-assisted stack recommendation
- [ ] Interactive web-based decision wizard
- [ ] Additional language templates (Python, Go)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

- Report bugs via [GitHub Issues](https://github.com/vibebuildlab/project-starter-guide/issues)
- Suggest features via [GitHub Issues](https://github.com/vibebuildlab/project-starter-guide/issues)
- Improve documentation via [Pull Requests](https://github.com/vibebuildlab/project-starter-guide/pulls)

## License

This project is MIT licensed. See [LICENSE](LICENSE) for full details.

## Support

Need help? See [SUPPORT.md](SUPPORT.md) for:
- Documentation links
- Community resources
- Commercial support options
- Security vulnerability reporting

## Legal

- [Privacy Policy](https://vibebuildlab.com/privacy-policy)
- [Terms of Service](https://vibebuildlab.com/terms)

---

> **Vibe Build Lab LLC** · [vibebuildlab.com](https://vibebuildlab.com)
