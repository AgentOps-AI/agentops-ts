import { ConsoleLoggingInstrumentation } from '../../../src/instrumentation/console-logging';
import { globalLogBuffer } from '../../../src/instrumentation/console-logging/buffer';
import { Client } from '../../../src/client';

// Mock the client
const mockClient = {
  config: {
    serviceName: 'test-service'
  }
} as Client;

describe('ConsoleLoggingInstrumentation', () => {
  let instrumentation: ConsoleLoggingInstrumentation;
  let originalConsoleLog: typeof console.log;
  let originalConsoleInfo: typeof console.info;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleError: typeof console.error;
  let originalConsoleDebug: typeof console.debug;

  beforeEach(() => {
    instrumentation = new ConsoleLoggingInstrumentation(mockClient);
    // Save original console methods
    originalConsoleLog = console.log;
    originalConsoleInfo = console.info;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    originalConsoleDebug = console.debug;
    // Clear buffer before each test
    globalLogBuffer.clear();
  });

  afterEach(() => {
    // Restore original console methods
    instrumentation.teardownRuntimeTargeting();
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.debug = originalConsoleDebug;
    globalLogBuffer.clear();
  });

  describe('setup/teardown', () => {
    it('should patch console methods when setup is called', () => {
      const originalLog = console.log;
      
      instrumentation.setupRuntimeTargeting();
      
      expect(console.log).not.toBe(originalLog);
    });

    it('should capture console.log to buffer', () => {
      instrumentation.setupRuntimeTargeting();
      
      console.log('test message');
      
      expect(globalLogBuffer.getContent()).toContain('LOG - test message');
    });

    it('should capture console.info to buffer', () => {
      instrumentation.setupRuntimeTargeting();
      
      console.info('info message');
      
      expect(globalLogBuffer.getContent()).toContain('INFO - info message');
    });

    it('should capture console.warn to buffer', () => {
      instrumentation.setupRuntimeTargeting();
      
      console.warn('warning message');
      
      expect(globalLogBuffer.getContent()).toContain('WARN - warning message');
    });

    it('should capture console.error to buffer', () => {
      instrumentation.setupRuntimeTargeting();
      
      console.error('error message');
      
      expect(globalLogBuffer.getContent()).toContain('ERROR - error message');
    });

    it('should capture console.debug to buffer', () => {
      instrumentation.setupRuntimeTargeting();
      
      console.debug('debug message');
      
      expect(globalLogBuffer.getContent()).toContain('DEBUG - debug message');
    });

    it('should handle multiple arguments', () => {
      instrumentation.setupRuntimeTargeting();
      
      console.log('message', 'with', 'multiple', 'args');
      
      expect(globalLogBuffer.getContent()).toContain('LOG - message with multiple args');
    });

    it('should stringify objects', () => {
      instrumentation.setupRuntimeTargeting();
      
      const obj = { key: 'value', nested: { prop: 123 } };
      console.log('Object:', obj);
      
      const content = globalLogBuffer.getContent();
      expect(content).toContain('LOG - Object: {"key":"value","nested":{"prop":123}}');
    });

    it('should handle circular references gracefully', () => {
      instrumentation.setupRuntimeTargeting();
      
      const obj: any = { key: 'value' };
      obj.self = obj; // Create circular reference
      
      console.log('Circular:', obj);
      
      const content = globalLogBuffer.getContent();
      expect(content).toContain('LOG - Circular: [object Object]');
    });

    it('should not patch multiple times', () => {
      const firstSetup = console.log;
      instrumentation.setupRuntimeTargeting();
      const afterFirstSetup = console.log;
      
      instrumentation.setupRuntimeTargeting(); // Should be no-op
      const afterSecondSetup = console.log;
      
      expect(firstSetup).not.toBe(afterFirstSetup);
      expect(afterFirstSetup).toBe(afterSecondSetup);
    });

    it('should restore original console methods on teardown', () => {
      const original = console.log;
      
      instrumentation.setupRuntimeTargeting();
      expect(console.log).not.toBe(original);
      
      instrumentation.teardownRuntimeTargeting();
      expect(console.log).toBe(original);
    });

    it('should handle teardown when not setup', () => {
      // Should not throw
      expect(() => instrumentation.teardownRuntimeTargeting()).not.toThrow();
    });

    it('should stop capturing after teardown', () => {
      instrumentation.setupRuntimeTargeting();
      
      console.log('before teardown');
      const contentAfterLog = globalLogBuffer.getContent();
      
      instrumentation.teardownRuntimeTargeting();
      
      console.log('after teardown');
      const contentAfterTeardown = globalLogBuffer.getContent();
      
      expect(contentAfterLog).toContain('LOG - before teardown');
      expect(contentAfterTeardown).not.toContain('LOG - after teardown');
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', () => {
      expect(ConsoleLoggingInstrumentation.metadata.name).toBe('console-logging-instrumentation');
      expect(ConsoleLoggingInstrumentation.metadata.targetLibrary).toBe('console');
      expect(ConsoleLoggingInstrumentation.useRuntimeTargeting).toBe(true);
    });
  });
});