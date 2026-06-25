/**
 * Mock Logger for Tests
 * Prevents actual logging during tests
 */

export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

jest.mock('../../application/config/logger', () => ({
  logger: mockLogger,
}));
