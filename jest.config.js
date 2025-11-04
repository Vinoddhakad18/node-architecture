module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/app.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@models/(.*)$': '<rootDir>/src/database/models/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@const/(.*)$': '<rootDir>/src/const/$1',
    '^@graphql/(.*)$': '<rootDir>/src/graphql/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  verbose: true,
  testTimeout: 10000
};
