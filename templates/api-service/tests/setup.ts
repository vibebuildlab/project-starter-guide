// Global Vitest setup for API template
// Provides an in-memory Prisma mock so tests run without a real database

import { vi, beforeAll, beforeEach, afterAll } from 'vitest'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test-db'

type UserRecord = {
  id: number
  email: string
  name: string
  password: string
  createdAt: Date
  updatedAt: Date
  lastLogin: Date | null
}

const users: UserRecord[] = []

const resetDb = () => {
  users.splice(0, users.length)
}

// Create mock implementation
const createMockPrismaClient = () => ({
  user: {
    findUnique: vi.fn(({ where }: { where: { email?: string; id?: number } }) => {
      const { email, id } = where
      const found = users.find(
        (u) => (email && u.email === email) || (id && u.id === id)
      )
      return Promise.resolve(found ?? null)
    }),
    findMany: vi.fn(() => Promise.resolve([...users])),
    create: vi.fn(({ data, select }: { data: { email: string; name: string; password: string }; select?: Record<string, boolean> }) => {
      const exists = users.find((u) => u.email === data.email)
      if (exists) {
        const err = new Error(
          'Unique constraint failed on the fields: (`email`)'
        ) as Error & { code?: string; meta?: { target: string[] } }
        err.code = 'P2002'
        err.meta = { target: ['email'] }
        return Promise.reject(err)
      }
      const newUser: UserRecord = {
        id: users.length + 1,
        email: data.email,
        name: data.name,
        password: data.password,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      }
      users.push(newUser)

      if (select) {
        const result: Partial<UserRecord> = {}
        Object.entries(select).forEach(([key, enabled]) => {
          if (enabled && key in newUser) {
            (result as Record<string, unknown>)[key] = (newUser as Record<string, unknown>)[key]
          }
        })
        return Promise.resolve(result)
      }

      return Promise.resolve(newUser)
    }),
    update: vi.fn(({ where, data }: { where: { id: number }; data: Partial<UserRecord> }) => {
      const target = users.find((u) => u.id === where.id)
      if (!target) return Promise.resolve(null)
      Object.assign(target, data, { updatedAt: new Date() })
      return Promise.resolve(target)
    }),
    deleteMany: vi.fn(() => {
      const count = users.length
      resetDb()
      return Promise.resolve({ count })
    }),
    count: vi.fn(() => Promise.resolve(users.length)),
  },
  $queryRaw: vi.fn(() => Promise.resolve([{ test: 1 }])),
  $executeRaw: vi.fn(() => {
    resetDb()
    return Promise.resolve(0)
  }),
  $disconnect: vi.fn(() => Promise.resolve()),
})

// Mock PrismaClient as a class
class MockPrismaClient {
  user: ReturnType<typeof createMockPrismaClient>['user']
  $queryRaw: ReturnType<typeof createMockPrismaClient>['$queryRaw']
  $executeRaw: ReturnType<typeof createMockPrismaClient>['$executeRaw']
  $disconnect: ReturnType<typeof createMockPrismaClient>['$disconnect']

  constructor() {
    const mock = createMockPrismaClient()
    this.user = mock.user
    this.$queryRaw = mock.$queryRaw
    this.$executeRaw = mock.$executeRaw
    this.$disconnect = mock.$disconnect
  }
}

// Mock @prisma/client
vi.mock('@prisma/client', () => ({
  PrismaClient: MockPrismaClient,
}))

// Mock @prisma/adapter-pg (not needed in tests)
vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: vi.fn(),
}))

// Mock pg Pool (not needed in tests)
vi.mock('pg', () => ({
  Pool: vi.fn(),
}))

// Create singleton mock instance for direct imports
const mockPrismaInstance = createMockPrismaClient()

// Mock the src/lib/prisma module
vi.mock('../src/lib/prisma', () => ({
  prisma: mockPrismaInstance,
}))

// Ensure DB is clean before every test file & test case
beforeAll(resetDb)
beforeEach(resetDb)
afterAll(resetDb)

// Silence error logs during tests to keep CI output readable; real errors still fail assertions.
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
afterAll(() => {
  consoleErrorSpy.mockRestore()
})
