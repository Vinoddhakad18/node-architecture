// Test setup file
// Runs before all tests

// Set environment to test
process.env.NODE_ENV = 'local';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
process.env.ENCRYPTION_IV = '1234567890123456';

// Mock logger to suppress console output during tests
jest.mock('@utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Global test timeout
jest.setTimeout(10000);
