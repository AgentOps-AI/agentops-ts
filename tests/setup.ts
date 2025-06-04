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

// Mock console.debug to keep test output clean
const originalDebug = console.debug;
console.debug = jest.fn();

// Restore console.debug after all tests
afterAll(() => {
  console.debug = originalDebug;
});