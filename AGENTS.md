# Repository Guidelines

Contributor quickstart for the Project Starter Guide. Use this repo to maintain the decision matrix, deep-dive docs, and production-ready templates.

## Project Structure & Module Organization
- `docs/` architecture, testing, security, and operations guides; start with `docs/ARCHITECTURE.md` and `docs/TESTING.md`.
- `templates/` production starters (e.g., `saas-level-1`, `api-service`, `about-me-page`, `mobile-app`); each template has its own README and config.
- `scripts/` reusable helpers such as `template-smoke-test.sh`, `smart-test-strategy.sh`, and automation setup.
- Root landing pages (`landing-page*.html`) showcase the offering; keep them lightweight and static.

## Build, Test, and Development Commands
- Work inside a template folder. Example for `templates/saas-level-1` (Node 20+):
  - `npm install` (or `npm ci`) to sync dependencies; `npm run dev` to launch Next.js locally.
  - `npm run build` for production build; `npm start` to serve the build.
  - `npm run lint`, `npm run type-check`, `npm run test` (Vitest), `npm run test:smoke`, `npm run test:accessibility` (axe CLI).
  - `npm run quality:check` bundles type-check, lint, and full test matrix.
- For template verification from repo root: `scripts/template-smoke-test.sh <template-name>` installs and runs the template’s validation scripts.

## Coding Style & Naming Conventions
- TypeScript + React/Next.js with Prettier formatting and ESLint (`eslint.config.mjs` in templates). Run `npm run lint:fix` for autofix.
- Components and pages: PascalCase (`PricingTable.tsx`); functions/vars: camelCase; environment helpers live in `src/lib`.
- Keep CSS via Tailwind utility classes; shared styles belong in `src/styles` or component-local modules.

## Testing Guidelines
- Vitest with React Testing Library; tests live in `src/components/__tests__`, `src/app/**/__tests__`, and `tests/smoke`.
- Aim to keep coverage for new modules; prefer unit + lightweight integration tests. Use `npm run test:coverage` when changing core flows.
- Record risk-based decisions in PR descriptions when skipping tests; align with `docs/TESTING.md`.

## Commit & Pull Request Guidelines
- Follow existing prefixes (`docs:`, `ci:`, `release:`, feature area) and imperative subjects, e.g., `docs: clarify complexity matrix`.
- Keep commits scoped and reversible; avoid mixing docs and code in the same change unless tightly coupled.
- PRs should include: summary, scope of impact, test commands/output, and linked issues. Add screenshots for UI changes in templates.

## Security & Configuration Tips
- Never commit secrets; use `.env.example` patterns inside templates and run `npm run security:secrets` when available.
- Run `npm audit --production --audit-level=high` (or `scripts/template-smoke-test.sh` which does this) before releasing template updates.
- When modifying auth/payment flows (NextAuth, Stripe), update `SECURITY.md` and template READMEs with any new configuration steps.
