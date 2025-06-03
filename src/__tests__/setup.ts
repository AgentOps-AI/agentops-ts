// Global test setup
process.env.NODE_ENV = 'test';

// Mock fetch globally for API calls
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};