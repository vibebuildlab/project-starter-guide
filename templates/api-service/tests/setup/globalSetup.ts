import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

export default async function globalSetup() {
  // Set up test environment variables
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret-key-for-real-integration'
  process.env.DATABASE_URL = 'file:./prisma/test-integration.db'

  console.log('🔧 Setting DATABASE_URL to:', process.env.DATABASE_URL)
  console.log(
    '📋 See TESTING.md for PostgreSQL container setup (production recommendation)'
  )

  // Parallel execution protection with stale-lock recovery
  const lockFile = path.join(os.tmpdir(), 'api-service-test.lock')
  if (fs.existsSync(lockFile)) {
    // Check if the lock is stale by verifying the PID
    const lockPid = parseInt(fs.readFileSync(lockFile, 'utf8').trim())

    try {
      // Check if process is still running (cross-platform approach)
      process.kill(lockPid, 0) // Signal 0 checks if process exists without killing it
      throw new Error(
        `Integration tests already running (PID: ${lockPid}). Wait for completion or remove /tmp/api-service-test.lock`
      )
    } catch {
      // Process doesn't exist, remove stale lock
      console.log(
        `🧹 Removing stale lock file (PID ${lockPid} no longer exists)`
      )
      fs.unlinkSync(lockFile)
    }
  }
  fs.writeFileSync(lockFile, process.pid.toString())

  // Clean up any existing test database
  const dbPath = path.join(__dirname, '../../prisma/test-integration.db')
  const dbJournalPath = path.join(
    __dirname,
    '../../prisma/test-integration.db-journal'
  )

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath)
  }
  if (fs.existsSync(dbJournalPath)) {
    fs.unlinkSync(dbJournalPath)
  }

  // Generate temp schema file in untracked location within project (no git risk)
  const tempSchemaPath = path.join(__dirname, '../../.tmp-schema.test.prisma')
  const originalSchemaPath = path.join(__dirname, '../../prisma/schema.prisma')
  const originalSchema = fs.readFileSync(originalSchemaPath, 'utf8')

  // Create SQLite version in temp file
  const sqliteSchema = originalSchema.replace('postgresql', 'sqlite')
  fs.writeFileSync(tempSchemaPath, sqliteSchema)

  // Store temp schema path for cleanup
  process.env.TEMP_SCHEMA_PATH = tempSchemaPath

  try {
    // Generate Prisma client using temp schema
    console.log('🔧 Generating Prisma client with temp schema...')
    execSync(`npx prisma generate --schema=${tempSchemaPath}`, {
      stdio: 'pipe',
      cwd: path.join(__dirname, '../..'),
    })

    // Setup test database using temp schema
    console.log('🔧 Setting up test database with temp schema...')
    execSync(`npx prisma db push --force-reset --schema=${tempSchemaPath}`, {
      stdio: 'pipe',
      cwd: path.join(__dirname, '../..'),
    })
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(tempSchemaPath)) {
      fs.unlinkSync(tempSchemaPath)
    }
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile)
    }
    console.error('Failed to set up test database:', error)
    throw error
  }

  console.log(
    '✅ Test database setup complete (using temp schema, tracked files untouched)'
  )
}
