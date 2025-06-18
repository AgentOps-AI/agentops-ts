module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['<rootDir>/tests/setup.ts', '<rootDir>/tests/mocks/'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      diagnostics: false,
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@openai/agents|@openai/agents-core)/)'
  ],
  moduleNameMapper: {
    '^@openai/agents$': '<rootDir>/tests/mocks/opentelemetry.ts'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/**/*.d.ts',
    '!src/instrumentation/**',
    '!src/tracing.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
};