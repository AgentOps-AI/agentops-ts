import { globalLogBuffer } from './buffer';

export class LoggingInstrumentor {
  private originalMethods: Map<string, Function> = new Map();
  private isPatched: boolean = false;

  /**
   * Patch console methods to capture output to the log buffer
   */
  patch(): void {
    if (this.isPatched) {
      return;
    }

    // List of console methods to patch
    const methodsToPatch = ['log', 'info', 'warn', 'error', 'debug'];

    methodsToPatch.forEach(method => {
      const originalMethod = (console as any)[method];
      this.originalMethods.set(method, originalMethod);

      // Create a patched version that logs to buffer and calls original
      (console as any)[method] = (...args: any[]) => {
        // Format the message
        const message = args
          .map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          })
          .join(' ');

        // Add level prefix and append to buffer
        const levelPrefix = method.toUpperCase();
        globalLogBuffer.append(`${levelPrefix} - ${message}`);

        // Call the original method
        originalMethod.apply(console, args);
      };
    });

    this.isPatched = true;
  }

  /**
   * Restore original console methods
   */
  unpatch(): void {
    if (!this.isPatched) {
      return;
    }

    this.originalMethods.forEach((originalMethod, method) => {
      (console as any)[method] = originalMethod;
    });

    this.originalMethods.clear();
    this.isPatched = false;
  }

  /**
   * Setup cleanup handlers to restore console on exit
   */
  setupCleanup(): void {
    const cleanup = () => {
      this.unpatch();
      globalLogBuffer.clear();
    };

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }
}

// Global logging instrumentor instance
export const loggingInstrumentor = new LoggingInstrumentor();