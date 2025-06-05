import { LoggingInstrumentor } from '../../../src/logging/instrumentor';
import { globalLogBuffer } from '../../../src/logging/buffer';

describe('LoggingInstrumentor', () => {
  let instrumentor: LoggingInstrumentor;
  let originalConsoleLog: typeof console.log;
  let originalConsoleInfo: typeof console.info;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleError: typeof console.error;
  let originalConsoleDebug: typeof console.debug;

  beforeEach(() => {
    instrumentor = new LoggingInstrumentor();
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
    instrumentor.unpatch();
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.debug = originalConsoleDebug;
    globalLogBuffer.clear();
  });

  describe('patch', () => {
    it('should patch console methods', () => {
      instrumentor.patch();
      
      expect(console.log).not.toBe(originalConsoleLog);
      expect(console.info).not.toBe(originalConsoleInfo);
      expect(console.warn).not.toBe(originalConsoleWarn);
      expect(console.error).not.toBe(originalConsoleError);
      expect(console.debug).not.toBe(originalConsoleDebug);
    });

    it('should capture console.log to buffer', () => {
      instrumentor.patch();
      
      console.log('Test log message');
      
      const content = globalLogBuffer.getContent();
      expect(content).toContain('LOG - Test log message');
    });

    it('should capture console.info to buffer', () => {
      instrumentor.patch();
      
      console.info('Test info message');
      
      const content = globalLogBuffer.getContent();
      expect(content).toContain('INFO - Test info message');
    });

    it('should capture console.warn to buffer', () => {
      instrumentor.patch();
      
      console.warn('Test warning');
      
      const content = globalLogBuffer.getContent();
      expect(content).toContain('WARN - Test warning');
    });

    it('should capture console.error to buffer', () => {
      instrumentor.patch();
      
      console.error('Test error');
      
      const content = globalLogBuffer.getContent();
      expect(content).toContain('ERROR - Test error');
    });

    it('should capture console.debug to buffer', () => {
      instrumentor.patch();
      
      console.debug('Test debug');
      
      const content = globalLogBuffer.getContent();
      expect(content).toContain('DEBUG - Test debug');
    });

    it('should handle multiple arguments', () => {
      instrumentor.patch();
      
      console.log('Multiple', 'arguments', 'test');
      
      const content = globalLogBuffer.getContent();
      expect(content).toContain('LOG - Multiple arguments test');
    });

    it('should stringify objects', () => {
      instrumentor.patch();
      
      console.log('Object:', { key: 'value', number: 123 });
      
      const content = globalLogBuffer.getContent();
      expect(content).toContain('LOG - Object: {"key":"value","number":123}');
    });

    it('should handle circular references gracefully', () => {
      instrumentor.patch();
      
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      console.log('Circular:', circular);
      
      const content = globalLogBuffer.getContent();
      expect(content).toContain('LOG - Circular: [object Object]');
    });

    it('should not patch multiple times', () => {
      instrumentor.patch();
      const firstPatchedLog = console.log;
      
      instrumentor.patch(); // Second patch should be no-op
      
      expect(console.log).toBe(firstPatchedLog);
    });
  });

  describe('unpatch', () => {
    it('should restore original console methods', () => {
      instrumentor.patch();
      instrumentor.unpatch();
      
      expect(console.log).toBe(originalConsoleLog);
      expect(console.info).toBe(originalConsoleInfo);
      expect(console.warn).toBe(originalConsoleWarn);
      expect(console.error).toBe(originalConsoleError);
      expect(console.debug).toBe(originalConsoleDebug);
    });

    it('should handle unpatch when not patched', () => {
      // Should not throw
      expect(() => instrumentor.unpatch()).not.toThrow();
    });

    it('should stop capturing after unpatch', () => {
      instrumentor.patch();
      console.log('Before unpatch');
      
      instrumentor.unpatch();
      globalLogBuffer.clear();
      
      console.log('After unpatch');
      
      expect(globalLogBuffer.isEmpty()).toBe(true);
    });
  });

  describe('setupCleanup', () => {
    it('should register cleanup handlers', () => {
      const exitListeners = process.listeners('exit').length;
      const sigintListeners = process.listeners('SIGINT').length;
      const sigtermListeners = process.listeners('SIGTERM').length;
      
      instrumentor.setupCleanup();
      
      expect(process.listeners('exit').length).toBe(exitListeners + 1);
      expect(process.listeners('SIGINT').length).toBe(sigintListeners + 1);
      expect(process.listeners('SIGTERM').length).toBe(sigtermListeners + 1);
      
      // Clean up listeners
      process.removeAllListeners('exit');
      process.removeAllListeners('SIGINT');
      process.removeAllListeners('SIGTERM');
    });
  });
});