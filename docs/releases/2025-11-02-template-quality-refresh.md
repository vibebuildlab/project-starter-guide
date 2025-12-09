# Release Notes — November 2, 2025

These notes capture the quality and security updates applied across all starter templates prior to the November 2025 handoff.

## Highlights

- Local template test suites (SaaS, API, Mobile) now execute cleanly under Node 20.11.1 after addressing configuration gaps and missing mocks.
- Continuous Integration examples ship with `npm ci` and `npm run security:audit`, keeping production pipelines consistent with smoke-test coverage.
- `.env.example` files were reviewed to ensure every template documents required secrets for authentication, databases, and Expo runtime.
- Smoke-test documentation now links workflow-ready YAML snippets so production repos inherit the updated audit step automatically.

## Template Testing Updates

- **SaaS Starter** — Vitest setup now compiles JSX by using a `.tsx` setup file and enabling automatic JSX transforms. Added an accessible label to the pricing section so downstream tests can target it reliably.
- **API Service** — Tightened Prisma mocks and converted Express controller responses to explicit returns, unblocking TypeScript-aware Jest runs.
- **Mobile App** — Added Expo’s Babel preset, refreshed Jest configuration, and mocked SafeArea + Navigation providers for deterministic renders. App entry tests now wait for async screen mounting.

## Environment Examples

- Verified environment samples for each template cover auth secrets, database URLs, and third-party tokens.
- Confirmed placeholders for Stripe keys (SaaS), JWT secrets (API), and Expo public config (mobile) are in place to align with onboarding docs.

## CI & Automation

- Added `npm run security:audit` to every template workflow alongside the existing lint, type-check, test, and build stages.
- Published the production CI porting guide (`docs/operations-ci-porting.md`) with branch filters, Node pinning, and validation checklist.
- Validated YAML blocks in the guide programmatically to prevent copy/paste regressions.

## Next Steps

- ~~Mirror these updates into live repositories and open verification pull requests before tagging the Templates Q4 2025 release.~~ ✅ Completed 2025-12-08
- Monitor npm audit output in the next runs; follow `docs/security-guide.md` for handling high-severity findings.

## Completion Notes (2025-12-08)

- Template versions aligned to v2.2.0 across all package.json files
- Next.js updated to ^16.0.7 (CVE-2025-55182 security patch)
- All templates verified against CHANGELOG v2.2.0 release notes
