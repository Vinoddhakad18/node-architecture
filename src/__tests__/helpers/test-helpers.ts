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
  res.setHeader = jest.fn().mockReturnValue(res);

  // Mock response helpers that call through to status + json
  res.sendSuccess = jest.fn((data?: any, message: string = 'Request successful') => {
    return res.status(200).json({ success: true, message, data });
  });

  res.sendCreated = jest.fn((data?: any, message: string = 'Resource created successfully') => {
    return res.status(201).json({ success: true, message, data });
  });

  res.sendError = jest.fn((message: string = 'Internal server error') => {
    return res.status(500).json({ success: false, message });
  });

  res.sendServerError = jest.fn((message: string = 'Internal server error') => {
    return res.status(500).json({ success: false, message });
  });

  res.sendBadRequest = jest.fn((message: string = 'Bad request', errors?: any) => {
    const response: any = { success: false, message };
    if (errors) {
      response.errors = errors;
    }
    return res.status(400).json(response);
  });

  res.sendUnauthorized = jest.fn((message: string = 'Unauthorized access') => {
    return res.status(401).json({ success: false, message });
  });

  res.sendForbidden = jest.fn((message: string = 'Forbidden') => {
    return res.status(403).json({ success: false, message });
  });

  res.sendNotFound = jest.fn((message: string = 'Resource not found') => {
    return res.status(404).json({ success: false, message });
  });

  res.sendConflict = jest.fn((message: string = 'Conflict', errors?: any) => {
    const response: any = { success: false, message };
    if (errors) {
      response.errors = errors;
    }
    return res.status(409).json(response);
  });

  return res;
}

/**
 * Wait for a specified time (useful for async tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
