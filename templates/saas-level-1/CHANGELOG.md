# Changelog

All notable changes to the SaaS Level 1 template will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-23

### Added
- Next.js 16 with App Router architecture
- NextAuth authentication with Prisma adapter
- JWT and database session strategy support
- Stripe integration for payments and subscriptions
- Webhook handling for subscription lifecycle events
- Protected route patterns (server and client)
- Comprehensive test suite (unit, integration, smoke, accessibility)
- Production security patterns (env validation, input sanitization)
- Accessibility testing with axe-core
- TypeScript strict mode enabled
- ESLint security rules and pre-commit hooks
- GitHub Actions CI/CD pipeline

### Security
- Environment variable validation at startup
- CSRF protection via NextAuth
- Secure session handling
- Input validation on all API routes
- Secret scanning in CI pipeline

## [Unreleased]

### Planned
- Role-based access control (RBAC) helpers
- Multi-tenant support option
- Email verification flow
- Password reset functionality
