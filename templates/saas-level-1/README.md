# SaaS Level 1 Starter Template ![Coverage](https://img.shields.io/badge/Coverage-90%25+-brightgreen)

A **starter template** with modern tooling for building SaaS applications. Includes pre-configured Next.js 14, TypeScript, Tailwind CSS, NextAuth.js, Prisma, and Stripe setup.

**Complexity Level:** 3 | **Timeline:** 3-5 days to customize | **Tech Stack:** Next.js + TypeScript + Tailwind + Prisma + NextAuth + Stripe

> Need the one-page checklist? Use the commands below as your quick start.

## What's Included

- 🚀 **Next.js 14** with App Router and TypeScript
- 🎨 **Tailwind CSS** with responsive marketing page components
- 💳 **Stripe Integration** (requires setup - see below)
- 🔐 **NextAuth.js** configured (development mock provider included)
- 📊 **Prisma** ORM setup (database schema ready to extend)
- 📱 **Fully Responsive** marketing page components
- ⚡ **Performance Optimized** build configuration
- 🎯 **SEO Ready** with meta tags structure

## What You Need to Build

This is a **starter template**, not a complete SaaS application. You'll need to implement:

- ✏️ **User Authentication Flows** - Sign up, login, password reset pages
- ✏️ **User Dashboard** - Protected user area with account management
- ✏️ **Stripe Integration** - Payment flows, subscription management, webhooks
- ✏️ **Database Models** - Extend Prisma schema for your application data
- ✏️ **API Routes** - Backend logic for your application features
- ✏️ **Business Logic** - Your unique SaaS functionality

**Current State:** Marketing page shell with configured tooling and authentication scaffolding ready to extend.

## Quick Start

1. **Clone and Install**

   ```bash
   npm install        # or: npm ci
   ```

   > `npm install` (or `npm ci`) automatically runs `prisma generate`. If you skip the install step (e.g., using a cached node_modules), run `npx prisma generate` manually before building.

2. **Setup Quality Automation** (Recommended)

   ```bash
   # Add comprehensive quality automation
   npx create-qa-architect@latest
   npm install && npm run prepare

   # Now you have: TypeScript linting, Prettier, security scanning, pre-commit hooks
   npm run lint        # ESLint + Stylelint for Next.js/Tailwind
   npm run format      # Auto-format TypeScript/CSS
   npm run security:audit  # Security vulnerability scanning
   ```

3. **Environment Setup**
   Copy the sample environment file and update values as needed:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   DATABASE_URL="your-database-url"
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. **Database Setup**

   ```bash
   npx prisma db push
   ```

5. **Run Development Server**

   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

7. **Run Component Tests**

   ```bash
   npm test
   ```

8. **Optional CI Setup**
   Use the sample workflow in `.github/workflows/ci.yml` as a starting point for GitHub Actions.

## Quality & Security

- Lint: `npm run lint`
- Type-check: `npm run type-check`
- Tests (coverage enforced ≥90%): `npm test`
- Accessibility smoke: `npm run test:accessibility` (starts local dev + axe CLI)
- Security: `npm run security:audit` and `npm run security:secrets`

## Project Structure

```
saas-level-1/
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   ├── globals.css      # Global styles
│   │   └── providers.tsx    # Context providers
│   ├── components/          # React components
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Pricing.tsx
│   │   └── Footer.tsx
│   └── lib/                 # Utility functions
├── public/                  # Static assets
├── package.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## Customization

### 1. Branding

- Update `SaaS Starter` in components to your product name
- Modify colors in `tailwind.config.js`
- Replace logo and favicon in `public/`

### 2. Content

- Edit hero section text in `src/components/Hero.tsx`
- Update features in `src/components/Features.tsx`
- Modify pricing plans in `src/components/Pricing.tsx`

### 3. Styling

The template uses Tailwind CSS with custom components:

- Primary color: `primary-600` (blue by default)
- Component classes: `.btn`, `.card`, `.feature-card`
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`

### 4. Authentication

Set up authentication providers in `src/app/api/auth/[...nextauth]/route.ts`:

- Google OAuth
- GitHub OAuth
- Email/Password
- Magic links

### 5. Payments

Configure Stripe products and prices:

- Create products in Stripe Dashboard
- Update price IDs in pricing component
- Set up webhooks for subscription management

## Additional Pages to Create

### Authentication Pages

- `/signup` - User registration
- `/login` - User login
- `/dashboard` - User dashboard

### Marketing Pages

- `/features` - Detailed features page
- `/pricing` - Expanded pricing page
- `/about` - Company information
- `/contact` - Contact form

### Legal Pages

- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/cookies` - Cookie policy

## Deployment

### Vercel (Recommended)

1. Push to GitHub repository
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

### Railway

1. Connect GitHub repository
2. Add environment variables
3. Deploy with automatic builds

### Other Platforms

- Netlify (static export)
- AWS Amplify
- Docker deployment

## Environment Variables

Required environment variables:

```env
# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/saas_db"

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Next Steps

1. **Set up Authentication** - Configure OAuth providers
2. **Create Database Schema** - Design your data models
3. **Implement Stripe** - Set up subscription billing
4. **Add Dashboard** - Build user dashboard interface
5. **Create API Routes** - Build your application logic
6. **Add Tests** - Unit and integration tests
7. **Deploy** - Launch to production

## Tech Stack Details

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript for type safety
- **Styling:** Tailwind CSS for rapid development
- **UI Components:** Custom components with Tailwind
- **Icons:** Lucide React for consistent icons
- **Authentication:** NextAuth.js with multiple providers
- **Database:** Prisma ORM (PostgreSQL recommended)
- **Payments:** Stripe for subscription billing
- **Deployment:** Vercel/Railway recommended

## Troubleshooting

### Husky ".git can't be found" Warning

**Issue:** During `npm install`, you see `.git can't be found`

**Cause:** You copied the template files instead of cloning with git

**Fix:**
```bash
git init
git add .
git commit -m "Initial commit"
npm install  # Re-run to set up git hooks
```

**Impact:** None - this only affects git hooks setup. The app works fine without git hooks.

---

### Slow npm install (13+ minutes)

**Issue:** `npm install` takes 10-15 minutes

**Cause:** Next.js full-stack dependencies (~780 packages including Prisma, NextAuth, Tailwind)

**Status:** ✅ **Expected for full-stack SaaS templates**

**Tips to speed up:**
```bash
# Use npm ci for faster installs (requires package-lock.json)
npm ci

# Enable caching in CI/CD
# See .github/workflows/ci.yml for caching example
```

**Expected times:**
- **First install:** 10-15 minutes
- **With cache:** 2-3 minutes
- **npm ci:** 5-8 minutes

---

### Prisma Client Not Generated

**Issue:** Build fails with "Cannot find module '@prisma/client'"

**Cause:** Prisma client not generated after install

**Fix:**
```bash
# Generate Prisma client
npx prisma generate

# Or reinstall (runs postinstall script)
npm install
```

**Note:** `npm install` automatically runs `prisma generate` via postinstall script

---

### Database Connection Errors

**Issue:** `PrismaClientInitializationError: Can't reach database server`

**Fixes:**

1. **Check DATABASE_URL in .env.local:**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/saas_db"
   ```

2. **Verify database is running:**
   ```bash
   # For PostgreSQL
   psql -U postgres -c "SELECT version();"

   # For MySQL
   mysql -u root -p -e "SELECT version();"
   ```

3. **Create database if it doesn't exist:**
   ```bash
   # PostgreSQL
   createdb saas_db

   # MySQL
   mysql -u root -p -e "CREATE DATABASE saas_db;"
   ```

4. **Push schema to database:**
   ```bash
   npx prisma db push
   ```

---

### NextAuth Configuration Errors

**Issue:** `[next-auth][error][CALLBACK_CREDENTIALS_HANDLER_ERROR]`

**Common causes:**

1. **Missing NEXTAUTH_SECRET:**
   ```bash
   # Generate a secret
   openssl rand -base64 32

   # Add to .env.local
   NEXTAUTH_SECRET=your-generated-secret
   ```

2. **Wrong NEXTAUTH_URL:**
   ```env
   # Development
   NEXTAUTH_URL=http://localhost:3000

   # Production
   NEXTAUTH_URL=https://yourdomain.com
   ```

3. **Database schema not pushed:**
   ```bash
   npx prisma db push
   ```

---

### Next.js Build Errors

**Issue:** `Error: Cannot find module` or `Module not found`

**Fixes:**

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Clear all caches:**
   ```bash
   rm -rf node_modules .next
   npm install
   npm run build
   ```

3. **Check import paths:**
   - Use `@/` for src directory imports
   - Ensure tsconfig.json paths are correct

---

### Tailwind Styles Not Loading

**Issue:** Tailwind classes not applying in production

**Fixes:**

1. **Verify globals.css is imported:**
   ```typescript
   // src/app/layout.tsx
   import './globals.css'
   ```

2. **Check tailwind.config.js content paths:**
   ```javascript
   content: [
     './src/**/*.{js,ts,jsx,tsx,mdx}',
   ]
   ```

3. **Rebuild:**
   ```bash
   rm -rf .next
   npm run build
   ```

---

### Type Errors with Prisma

**Issue:** TypeScript errors about Prisma types

**Fix:**
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

### Environment Variables Not Loading

**Issue:** `process.env.VARIABLE_NAME` is undefined

**Common issues:**

1. **Using .env instead of .env.local:**
   - Next.js loads `.env.local` by default
   - Copy `.env.example` to `.env.local`

2. **Variables need NEXT_PUBLIC_ prefix for client-side:**
   ```env
   # Server-side only
   DATABASE_URL=postgresql://...

   # Client-side accessible
   NEXT_PUBLIC_API_URL=https://api.example.com
   ```

3. **Restart dev server after changing .env:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

### Stripe Integration Issues

**Issue:** Stripe checkout not working

**Checklist:**

1. **Verify Stripe keys:**
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Test mode vs Live mode:**
   - Use `pk_test_` and `sk_test_` for development
   - Ensure keys match (both test or both live)

3. **Webhook setup:**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Forward webhooks to localhost
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

---

### Hot Reload Not Working

**Issue:** Changes don't appear without manual refresh

**Fixes:**

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Clear browser cache:** Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

3. **Check file watch limits (Linux/WSL):**
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

---

### Port Already in Use

**Issue:** `Error: listen EADDRINUSE: address already in use :::3000`

**Fixes:**

1. **Find and kill process:**
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Use different port:**
   ```bash
   PORT=3001 npm run dev
   ```

---

### Deployment Issues (Vercel)

**Issue:** Build fails on Vercel but works locally

**Common fixes:**

1. **Add environment variables in Vercel dashboard**
   - All variables from `.env.local`
   - Mark sensitive ones as "Sensitive"

2. **Check Node version:**
   - Vercel uses Node 18 by default
   - Add `.nvmrc` if needed:
     ```bash
     echo "18" > .nvmrc
     ```

3. **Build command issues:**
   - Ensure `prisma generate` runs before build
   - Check package.json `build` script

4. **Database connection:**
   - Use connection pooling for serverless (Prisma Data Proxy or PgBouncer)
   - Increase connection limits

---

### Still Having Issues?

1. **Check Next.js documentation:** https://nextjs.org/docs
2. **Prisma troubleshooting:** https://www.prisma.io/docs/guides/troubleshooting
3. **NextAuth docs:** https://next-auth.js.org/getting-started/introduction
4. **Review validation results:** See `claudedocs/fresh-clone-validation-results.md`

**Need more help?** Open an issue with:
- Node version (`node --version`)
- npm version (`npm --version`)
- Next.js version (from package.json)
- Database type (PostgreSQL/MySQL/SQLite)
- Full error message
- Steps to reproduce

## License

MIT License - free to use for personal and commercial projects.
