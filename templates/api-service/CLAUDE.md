# API Service Template - Claude Guide

> Production-ready REST API with Express.js, TypeScript, PostgreSQL, and Prisma.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Express 5 |
| Language | TypeScript |
| Database | PostgreSQL + Prisma |
| Auth | JWT |
| Testing | Vitest |

## Key Commands

```bash
npm test              # Unit + smoke tests
npm run test:integration  # DB tests
npm run type-check    # TypeScript
npm run lint          # ESLint
npm run quality:check # All checks
```

## Project Structure

```
api-service/
├── src/
│   ├── config/        # Env validation
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Auth, rate limiting, SSRF
│   ├── routes/        # Route definitions
│   └── services/      # Business logic
├── tests/             # Unit, integration, smoke
└── prisma/            # Schema
```

## Security

- **Rate Limiting**: 100 req/15min global, 5 auth failures/15min
- **SSRF Protection**: Use `validateExternalURL()` for user URLs
- **Env Validation**: Fails fast on missing vars

## Common Tasks

### Add Endpoint
1. Define route in `src/routes/`
2. Create controller in `src/controllers/`
3. Add validation schema
4. Write tests

### Protect Route
```typescript
import { authenticateToken } from '../middleware/auth'
router.get('/protected', authenticateToken, handler)
```

---
*90% line coverage, 65% branch. Global rules in `~/.claude/CLAUDE.md`.*
