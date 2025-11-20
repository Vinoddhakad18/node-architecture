module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/environment/',
    '/src/__tests__/helpers/',
    '/src/__tests__/mocks/',
    '/e2e/'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/index.ts',
    '!src/server.ts',
    '!src/swagger.ts',
    '!src/environment/**',
    '!src/config.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@config/(.*)$': '<rootDir>/src/application/config/$1',
    '^@constants/(.*)$': '<rootDir>/src/application/constants/$1',
    '^@controllers/(.*)$': '<rootDir>/src/application/controllers/$1',
    '^@dtos/(.*)$': '<rootDir>/src/application/dtos/$1',
    '^@events/(.*)$': '<rootDir>/src/application/events/$1',
    '^@helpers/(.*)$': '<rootDir>/src/application/helpers/$1',
    '^@interfaces/(.*)$': '<rootDir>/src/application/interfaces/$1',
    '^@middleware/(.*)$': '<rootDir>/src/application/middleware/$1',
    '^@models/(.*)$': '<rootDir>/src/application/models/$1',
    '^@repositories/(.*)$': '<rootDir>/src/application/repositories/$1',
    '^@routes/(.*)$': '<rootDir>/src/application/routes/$1',
    '^@services/(.*)$': '<rootDir>/src/application/services/$1',
    '^@environment/(.*)$': '<rootDir>/src/environment/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  verbose: true,
};
