import { InstrumentationBase } from '../base';
import { InstrumentorMetadata } from '../../types';
import { globalLogBuffer } from './buffer';
import { loggingService } from './service';

const debug = require('debug')('agentops:instrumentation:console-logging');

export class ConsoleLoggingInstrumentation extends InstrumentationBase {
  static readonly metadata: InstrumentorMetadata = {
    name: 'console-logging-instrumentation',
    version: '1.0.0',
    description: 'Instrumentation for console logging capture',
    targetLibrary: 'console', // Dummy target since console is global
    targetVersions: ['*']
  };
  static readonly useRuntimeTargeting = true;

  private originalMethods: Map<string, Function> = new Map();
  private isPatched: boolean = false;

  protected setup(moduleExports: any, moduleVersion?: string): any {
    this.patch();
    return moduleExports;
  }

  protected teardown(moduleExports: any, moduleVersion?: string): any {
    // Export logs before unpatching if we have spans exported
    this.exportLogsIfNeeded();
    this.unpatch();
    return moduleExports;
  }

  /**
   * Patch console methods to capture output to the log buffer
   */
  private patch(): void {
    if (this.isPatched) {
      return;
    }

    debug('patching console methods');

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
  private unpatch(): void {
    if (!this.isPatched) {
      return;
    }

    debug('unpatching console methods');

    this.originalMethods.forEach((originalMethod, method) => {
      (console as any)[method] = originalMethod;
    });

    this.originalMethods.clear();
    this.isPatched = false;
  }

  /**
   * Export logs if needed during teardown
   */
  private exportLogsIfNeeded(): void {
    try {
      if (!globalLogBuffer.isEmpty()) {
        debug('logs available for export during teardown');
        // Logs will be uploaded automatically by the flush mechanism
      }
    } catch (error) {
      debug('failed to check logs during teardown:', error);
    }
  }
} 