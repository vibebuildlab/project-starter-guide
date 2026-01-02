# Security Status - API Service Template

**Last Updated**: 2025-11-22
**Template Version**: 1.0.0

## Current Vulnerability Status

**Audit Command**: `npm audit` (run 2025-11-23)
**Result**: `found 8 low severity vulnerabilities (dev-only)`

```bash
# Full audit command and output
$ npm audit
found 8 vulnerabilities (8 low)

To address all issues (including breaking changes), run:
  npm audit fix --force

# Production-only audit (the important one)
$ npm audit --production
found 0 vulnerabilities
```

### Production Dependencies: ✅ SECURE

- **0 Critical** severity
- **0 High** severity
- **0 Moderate** severity
- **0 Low** severity

### Development Dependencies: ⚠️ 8 KNOWN LOW-RISK

- **0 Critical** severity
- **0 High** severity
- **0 Moderate** severity (js-yaml resolved)
- **8 Low** severity (documented waivers)

## Vulnerability Resolution History

### Resolved Vulnerabilities

- **js-yaml** (was moderate): ✅ Resolved through dependency updates (2025-11-22)

### Known Dev-Only Vulnerabilities (Documented Waivers)

- **cookie** (low): Via @lhci/cli -> lighthouse -> @sentry/node
- **tmp** (low): Via @lhci/cli -> inquirer -> external-editor
- **6 additional low-severity** vulnerabilities in @lhci/cli dependency chain

**Total**: 8 low-severity vulnerabilities in development dependencies only
**Production Impact**: None - these packages are not included in production builds
**Waiver Documentation**: See `.security-waivers.json` for detailed analysis

### Status Summary

- **Production Dependencies**: 0 vulnerabilities ✅
- **Development Dependencies**: 8 low-severity (documented and approved) ⚠️

## Security Implementation

### Rate Limiting

**Location:** `src/middleware/rateLimiting.ts`

| Limiter      | Limit   | Window | Purpose                  |
| ------------ | ------- | ------ | ------------------------ |
| Global       | 100 req | 15 min | General abuse prevention |
| Auth         | 5 req   | 15 min | Brute force protection   |
| Registration | 3 req   | 1 hour | Account spam prevention  |
| API          | 10 req  | 1 min  | Expensive operations     |

### SSRF Protection

**Location:** `src/middleware/ssrfProtection.ts`

Protects against Server-Side Request Forgery when fetching external URLs:

- Blocks private IP ranges (10.x, 172.16-31.x, 192.168.x)
- Blocks localhost and loopback addresses
- Blocks cloud metadata endpoints (169.254.169.254)
- DNS rebinding protection (validates resolved IPs)

**Usage:**

```typescript
import { validateExternalURL } from './middleware/ssrfProtection'
const { valid, url, error } = await validateExternalURL(userUrl)
```

### Express.js Security Features

This template implements Express.js security best practices:

- **Environment Variables**: Proper .env file handling with .env.example template
- **Security Middleware**: Helmet.js with custom CSP directives
- **CORS Configuration**: Configurable CORS with wildcard warning in development
- **Request Validation**: Joi schema validation for API inputs
- **Error Handling**: Secure error handling that doesn't leak stack traces
- **Rate Limiting**: Built-in rate limiting middleware
- **Structured Logging**: All security events logged via Winston (not console.error)
- **Reverse Proxy Support**: TRUST_PROXY flag for deployments behind proxies

#### Helmet.js Configuration

**Location:** `src/app.ts`

Custom Content Security Policy (CSP) directives:

```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow cross-origin requests for API
})
```

#### CORS Configuration

**Location:** `src/app.ts`

- Wildcard (`*`) allowed in development with startup warning
- Production requires specific origin in `CORS_ORIGIN` env var
- Credentials enabled for non-wildcard origins

#### TRUST_PROXY Configuration

**Location:** `src/app.ts`, `src/config/env.ts`

**⚠️ CRITICAL for reverse proxy deployments:**

When deploying behind Nginx, CloudFlare, AWS ALB, Vercel, etc.:

1. Set `TRUST_PROXY=true` in environment variables
2. Ensures rate limiting and security features use real client IPs from `X-Forwarded-For`
3. Without this, all requests appear to come from proxy IP (bypasses rate limits)

See `README.md` deployment section for detailed configuration.

### Development Security

- **No Hardcoded Secrets**: All sensitive data via environment variables
- **TypeScript**: Type safety reduces runtime errors and security issues
- **ESLint Security Rules**: Security-focused linting rules
- **Package Auditing**: Regular npm audit checks
- **Input Validation**: Comprehensive request validation with Joi

### API Security Features

- **Authentication Ready**: JWT authentication middleware
- **Input Validation**: Joi schema validation for all endpoints
- **Security Headers**: Helmet.js security headers
- **Error Sanitization**: Safe error responses in production
- **CORS Management**: Configurable cross-origin resource sharing

## Verification

To verify the security status:

```bash
npm audit                # Shows: 8 low severity vulnerabilities (dev-only)
npm audit --omit=dev     # Should show: found 0 vulnerabilities
npm audit --production   # Production dependencies only: 0 vulnerabilities
```

**Note**: Production builds (`npm audit --production`) show 0 vulnerabilities. The 8 low-severity findings are development tools only.

## Template Security Features

- **JWT Authentication**: Ready-to-use authentication middleware
- **Environment Template**: .env.example with all required variables
- **Secure Development**: TypeScript + ESLint security rules
- **Input Validation**: Joi schema validation for API endpoints
- **Security Headers**: Helmet.js configuration for security headers
- **Error Handling**: Production-safe error responses

## Security Audit History

| Date       | Total Vulns      | Production | Development | Action Taken                                |
| ---------- | ---------------- | ---------- | ----------- | ------------------------------------------- |
| 2025-11-11 | 9 (1 mod, 8 low) | Unknown    | Unknown     | Initial audit                               |
| 2025-11-22 | 8 (0 mod, 8 low) | 0          | 8           | js-yaml resolved, dev-only vulns documented |

### Current Status Summary

- **js-yaml moderate vulnerability**: ✅ Resolved through automatic dependency updates
- **8 low-severity development vulnerabilities**: ⚠️ Documented as acceptable risk
  - All related to @lhci/cli (Lighthouse CI) dependency chain
  - No impact on production builds or runtime security
  - Proper documentation in `.security-waivers.json`

### Production Security

- **Production dependencies**: 0 vulnerabilities ✅
- **Runtime security**: Not affected by development tool vulnerabilities

## Maintenance

### Regular Security Checks

```bash
# Run monthly security audit
npm audit

# Update dependencies and check for vulnerabilities
npm update
npm audit

# Check for outdated packages
npm outdated
```

### When to Update This Document

- After any dependency changes
- When npm audit reports new vulnerabilities
- After Express.js major version updates
- Quarterly security review
- When adding new security-related features

## Security Configuration

### Recommended Environment Variables

```bash
# Authentication
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=24h

# Database (if using)
DATABASE_URL="your-database-connection-string"

# API Configuration
PORT=3000
NODE_ENV=production

# Security
CORS_ORIGIN=https://your-frontend-domain.com
```

### Helmet.js Security Headers

The template includes pre-configured security headers:

```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
)
```

## References

- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Joi Validation](https://joi.dev/api/)
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)

## Contact

For security concerns specific to this template:

- Open an issue: [GitHub Issues](https://github.com/brettstark73/project-starter-guide/issues)
- Security advisory: Use GitHub Security Advisory for private disclosure

---

**Summary**: Production dependencies are secure (0 vulnerabilities). Development dependencies have 8 documented low-risk vulnerabilities that don't affect production. Template includes security best practices for Express.js APIs, authentication, and input validation. Ready for production use.
