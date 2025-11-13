/**
 * Test Helper Functions
 * Shared utilities for testing
 */

import UserMaster from '../../application/models/user-master.model';
import bcrypt from 'bcryptjs';

/**
 * Create a test user in the database
 */
export async function createTestUser(overrides?: Partial<any>) {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user' as const,
    status: 'active' as const,
    mobile: null,
    last_login: null,
    created_by: null,
    updated_by: null,
  };

  const userData = { ...defaultUser, ...overrides };
  return await UserMaster.create(userData);
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count: number) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(
      await createTestUser({
        name: `Test User ${i + 1}`,
        email: `test${i + 1}@example.com`,
      })
    );
  }
  return users;
}

/**
 * Clean up test data from database
 */
export async function cleanupDatabase() {
  try {
    await UserMaster.destroy({ where: {}, force: true });
  } catch (error) {
    console.error('Error cleaning up database:', error);
  }
}

/**
 * Generate a hashed password for testing
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Mock Express Request
 */
export function mockRequest(data: any = {}) {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    headers: data.headers || {},
    user: data.user || null,
  };
}

/**
 * Mock Express Response
 */
export function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendSuccess = jest.fn().mockReturnValue(res);
  res.sendError = jest.fn().mockReturnValue(res);
  res.sendUnauthorized = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Wait for a specified time (useful for async tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
