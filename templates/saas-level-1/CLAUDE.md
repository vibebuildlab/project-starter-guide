# SaaS Level 1 Template - Claude Guide

> Simple SaaS starter with Next.js, Prisma, NextAuth, and Stripe.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma |
| Auth | NextAuth (Prisma adapter) |
| Payments | Stripe |
| UI | Tailwind CSS |
| Testing | Vitest |

## Key Commands

```bash
npm test              # All tests
npm run type-check    # TypeScript
npm run lint          # ESLint (zero warnings)
npm run quality:check # All checks
npm run prisma:generate  # Generate client
```

## Project Structure

```
saas-level-1/
├── src/
│   ├── app/
│   │   ├── api/          # API routes (auth, stripe)
│   │   ├── (auth)/       # Auth pages
│   │   └── dashboard/    # Protected pages
│   ├── components/       # UI components
│   └── lib/              # Prisma, Stripe clients
├── prisma/               # Schema
└── tests/                # Smoke tests
```

## Auth Pattern (NextAuth)

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Protected page
const session = await getServerSession(authOptions)
if (!session) redirect('/login')

// API route
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

## Stripe Webhook Events

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---
*Server Components by default. Global rules in `~/.claude/CLAUDE.md`.*
