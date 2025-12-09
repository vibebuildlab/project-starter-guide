#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

// Skip if explicitly requested
if (process.env.PRISMA_GENERATE_SKIP === '1') {
  console.log('⏭️  Skipping Prisma generate (PRISMA_GENERATE_SKIP=1)')
  process.exit(0)
}

const rootDir = process.cwd()
const cacheDir = resolve(rootDir, '.prisma-cache')
const homeDir = resolve(rootDir, '.prisma-home')
mkdirSync(cacheDir, { recursive: true })
mkdirSync(homeDir, { recursive: true })

// Use provided DATABASE_URL or a dummy one for type generation
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy'

const result = spawnSync('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    HOME: homeDir,
    XDG_CACHE_HOME: cacheDir,
    PRISMA_ENGINE_CACHE_DIR: cacheDir,
  },
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 0)
