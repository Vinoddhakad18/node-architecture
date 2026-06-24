/**
 * Mock Sequelize for Unit Tests
 * Provides mock implementations of Sequelize methods
 */

export const mockSequelize = {
  authenticate: jest.fn().mockResolvedValue(undefined),
  sync: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  transaction: jest.fn((callback: any) => {
    const t = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    return callback(t);
  }),
};

export const mockModel = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn(),
};
