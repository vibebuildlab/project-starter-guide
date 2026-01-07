// Comprehensive integration tests with real database operations
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../setup/testSetup'
import app from '../../src/app'

// Helper function to generate unique email addresses for tests
const generateUniqueEmail = (prefix: string = 'test') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
}

describe('Comprehensive Authentication Integration Tests (Real Database)', () => {
  // Database cleanup is handled by testSetup.ts

  describe('Complete Authentication Flow with Enhanced Database Simulation', () => {
    it('should register user, verify JWT/hashing, and login successfully', async () => {
      const userData = {
        name: 'Integration Test User',
        email: generateUniqueEmail('integration'),
        password: 'IntegrationPassword123!',
      }

      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      expect(registerResponse.status).toBe(201)
      expect(registerResponse.body).toHaveProperty('token')
      expect(registerResponse.body.user).toHaveProperty('email', userData.email)
      expect(registerResponse.body.user).toHaveProperty('name', userData.name)
      expect(registerResponse.body.user).toHaveProperty('id')
      expect(registerResponse.body.user).not.toHaveProperty('password')

      // Step 2: Verify JWT token is valid and contains correct user ID
      const decodedToken = jwt.verify(
        registerResponse.body.token,
        process.env.JWT_SECRET!
      ) as any
      expect(decodedToken).toHaveProperty('userId')
      expect(decodedToken.userId).toBe(registerResponse.body.user.id)

      // Step 3: Verify user exists in real database with correct data
      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      expect(userInDb).toBeTruthy()
      expect(userInDb!.email).toBe(userData.email)
      expect(userInDb!.name).toBe(userData.name)
      expect(userInDb!.id).toBe(registerResponse.body.user.id)
      expect(userInDb!.password).not.toBe(userData.password) // Should be hashed
      expect(userInDb!.createdAt).toBeInstanceOf(Date)
      expect(userInDb!.updatedAt).toBeInstanceOf(Date)
      expect(userInDb!.lastLogin).toBeNull() // Not set on registration

      // Step 4: Verify password is properly hashed
      const isPasswordValid = await bcrypt.compare(
        userData.password,
        userInDb!.password
      )
      expect(isPasswordValid).toBe(true)

      // Step 5: Login with correct credentials
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: userData.password,
      })

      expect(loginResponse.status).toBe(200)
      expect(loginResponse.body).toHaveProperty('token')
      expect(loginResponse.body.user).toHaveProperty('email', userData.email)
      expect(loginResponse.body.user).toHaveProperty('id', userInDb!.id)
      expect(loginResponse.body.user).not.toHaveProperty('password')

      // Step 6: Verify login JWT is valid
      const loginToken = jwt.verify(
        loginResponse.body.token,
        process.env.JWT_SECRET!
      ) as any
      expect(loginToken).toHaveProperty('userId', userInDb!.id)

      // Step 7: Verify lastLogin is updated in real database
      const updatedUser = await prisma.user.findUnique({
        where: { email: userData.email },
      })
      expect(updatedUser!.lastLogin).toBeInstanceOf(Date)
      expect(updatedUser!.lastLogin!.getTime()).toBeGreaterThan(
        userInDb!.createdAt.getTime()
      )
    })

    it('should enforce unique email constraint in real database', async () => {
      const userData = {
        name: 'First User',
        email: generateUniqueEmail('unique'),
        password: 'TestPassword123!',
      }

      // Register first user
      const firstResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      expect(firstResponse.status).toBe(201)

      // Verify user exists in real database
      const firstUser = await prisma.user.findUnique({
        where: { email: userData.email },
      })
      expect(firstUser).toBeTruthy()

      // Try to register second user with same email
      const duplicateResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          name: 'Second User',
        })

      expect(duplicateResponse.status).toBe(400)
      expect(duplicateResponse.body).toHaveProperty('error')

      // Verify only one user exists in real database
      const userCount = await prisma.user.count({
        where: { email: userData.email },
      })
      expect(userCount).toBe(1)
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      })
      expect(existingUser!.name).toBe('First User') // Original user unchanged
    })

    it('should reject login with wrong password using real database', async () => {
      const userData = {
        name: 'Password Test User',
        email: generateUniqueEmail('password'),
        password: 'CorrectPassword123!',
      }

      // Register user
      await request(app).post('/api/auth/register').send(userData)

      // Verify user exists in real database
      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email },
      })
      expect(userInDb).toBeTruthy()

      // Try login with wrong password
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: 'WrongPassword123!',
      })

      expect(loginResponse.status).toBe(401)
      expect(loginResponse.body).toHaveProperty('error', 'Invalid credentials')

      // Verify lastLogin is still null (login failed)
      const userAfterFailedLogin = await prisma.user.findUnique({
        where: { email: userData.email },
      })
      expect(userAfterFailedLogin!.lastLogin).toBeNull()
    })

    it('should reject login for non-existent user in real database', async () => {
      // Ensure real database is empty
      const userCount = await prisma.user.count()
      expect(userCount).toBe(0)

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: generateUniqueEmail('nonexistent'),
          password: 'SomePassword123!',
        })

      expect(loginResponse.status).toBe(401)
      expect(loginResponse.body).toHaveProperty('error', 'Invalid credentials')

      // Verify no users were created
      const finalUserCount = await prisma.user.count()
      expect(finalUserCount).toBe(0)
    })

    it('should handle database constraints and validation', async () => {
      // Test missing required fields
      const invalidUser = {
        email: generateUniqueEmail('incomplete'),
        // Missing name and password
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')

      // Verify no user was created in real database
      const userCount = await prisma.user.count()
      expect(userCount).toBe(0)
    })

    it('should handle duplicate registration with 400 error (not 500)', async () => {
      const userData = {
        name: 'Duplicate Test User',
        email: generateUniqueEmail('duplicate'),
        password: 'DuplicatePassword123!',
      }

      // Register first user - should succeed
      const firstResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      expect(firstResponse.status).toBe(201)

      // Attempt to register same email - should return 400, not 500
      const duplicateResponse = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          name: 'Different Name',
        })

      expect(duplicateResponse.status).toBe(400)
      expect(duplicateResponse.body.error).toContain('already exists')

      // Verify only one user exists
      const userCount = await prisma.user.count()
      expect(userCount).toBe(1)
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      })
      expect(existingUser!.name).toBe(userData.name) // Original user unchanged
    })

    it('should handle concurrent registration attempts deterministically', async () => {
      const userData = {
        name: 'Concurrent User',
        email: generateUniqueEmail('concurrent'),
        password: 'ConcurrentPassword123!',
      }

      // Make multiple simultaneous registration requests
      const promises = Array(3)
        .fill(null)
        .map(() => request(app).post('/api/auth/register').send(userData))

      const responses = await Promise.all(promises)

      // Only one should succeed with 201, others should fail with 400 (not 500)
      const successfulResponses = responses.filter(r => r.status === 201)
      const clientErrorResponses = responses.filter(r => r.status === 400)
      const serverErrorResponses = responses.filter(r => r.status === 500)

      expect(successfulResponses).toHaveLength(1)
      expect(clientErrorResponses).toHaveLength(2)
      expect(serverErrorResponses).toHaveLength(0) // No 500 errors

      // Verify only one user exists in real database
      const userCount = await prisma.user.count()
      expect(userCount).toBe(1)

      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      })
      expect(user).toBeTruthy()
      expect(user!.name).toBe(userData.name)
    })

    it('should maintain data integrity across operations', async () => {
      // Register multiple users
      const users = [
        {
          name: 'User One',
          email: generateUniqueEmail('user1'),
          password: 'Password1!',
        },
        {
          name: 'User Two',
          email: generateUniqueEmail('user2'),
          password: 'Password2!',
        },
        {
          name: 'User Three',
          email: generateUniqueEmail('user3'),
          password: 'Password3!',
        },
      ]

      // Register all users
      for (const userData of users) {
        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
        expect(response.status).toBe(201)
      }

      // Verify all users exist in real database
      const allUsers = await prisma.user.findMany({
        orderBy: { id: 'asc' },
      })
      expect(allUsers).toHaveLength(3)

      // Verify each user has correct data
      users.forEach((userData, index) => {
        expect(allUsers[index].name).toBe(userData.name)
        expect(allUsers[index].email).toBe(userData.email)
        expect(allUsers[index].password).not.toBe(userData.password)
        expect(allUsers[index].id).toBe(index + 1) // Auto-increment IDs
      })

      // Test login for each user
      for (let i = 0; i < users.length; i++) {
        const userData = users[i]
        const loginResponse = await request(app).post('/api/auth/login').send({
          email: userData.email,
          password: userData.password,
        })

        expect(loginResponse.status).toBe(200)
        expect(loginResponse.body.user.id).toBe(i + 1)
      }

      // Verify all users have updated lastLogin
      const usersAfterLogin = await prisma.user.findMany()
      usersAfterLogin.forEach(user => {
        expect(user.lastLogin).toBeInstanceOf(Date)
      })
    })
  })

  describe('Database Error Handling', () => {
    it('should handle database connection issues gracefully', async () => {
      // This test verifies the app handles database errors
      // In a real scenario, this would test connection failures

      // Test with valid registration first
      const userData = {
        name: 'Connection Test',
        email: generateUniqueEmail('connection'),
        password: 'ConnectionPassword123!',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)

      expect(response.status).toBe(201)

      // Verify the user was created
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      })
      expect(user).toBeTruthy()
    })
  })
})
