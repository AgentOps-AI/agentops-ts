import { Span, SpanKind, trace } from '@opentelemetry/api';
import {
  InstrumentationBase as _InstrumentationBase,
  InstrumentationNodeModuleDefinition,
  InstrumentationConfig
} from '@opentelemetry/instrumentation';
import { InstrumentorMetadata } from '../types';

const debug = require('debug')('agentops:instrumentation:base');


/**
 * Utility function to resolve module exports robustly from the current working directory.
 * This allows instrumentations to access modules that may not be in the global node_modules.
 *
 * @param moduleName - Name of the module to resolve
 * @throws {Error} If the module cannot be resolved
 * @returns The resolved module exports, or null if the module cannot be found
 */
function resolveModulePath(moduleName: string): string {
  // Use require.resolve to find the module path from current working directory
  return require.resolve(moduleName, { paths: [process.cwd()] });
}

/**
 * Utility function to get module exports from a resolved module path.
 * Returns null if the module cannot be found or loaded.
 *
 * @param moduleName - Name of the module to load
 * @returns The module exports, or null if the module cannot be found
 */
function getModuleExports(moduleName: string): any {
  try {
    return require(resolveModulePath(moduleName));
  } catch (error) {
    return null;
  }
}

/**
 * Base class for all AgentOps instrumentations.
 *
 * Provides a simplified interface for creating OpenTelemetry instrumentations
 * with automatic setup/teardown lifecycle management and metadata-driven configuration.
 *
 * @example
 * ```typescript
 * export class MyInstrumentation extends InstrumentationBase {
 *   static readonly metadata: InstrumentorMetadata = {
 *     name: 'my-instrumentation',
 *     version: '1.0.0',
 *     description: 'Instrumentation for My Library',
 *     targetLibrary: 'my-library',
 *     targetVersions: ['>=1.0.0']
 *   };
 *
 *   protected setup(moduleExports: any): any {
 *     // Apply instrumentation patches
 *     return moduleExports;
 *   }
 * }
 * ```
 */
export abstract class InstrumentationBase extends _InstrumentationBase {
  static readonly metadata: InstrumentorMetadata;
  static readonly useRuntimeTargeting?: boolean = false;
  private isRuntimeSetup: boolean = false;

  /**
   * Initializes the instrumentation module definition using the static metadata.
   *
   * @returns The instrumentation node module definition with setup/teardown callbacks
   */
  init(): InstrumentationNodeModuleDefinition | InstrumentationNodeModuleDefinition[] {
    const metadata = (this.constructor as typeof InstrumentationBase).metadata;

    return new InstrumentationNodeModuleDefinition(
      metadata.targetLibrary,
      metadata.targetVersions,
      (moduleExports, moduleVersion) => this._setup(moduleExports, moduleVersion),
      (moduleExports, moduleVersion) => this.teardown(moduleExports, moduleVersion)
    );
  }

  /**
   * Gets the unique identifier for this instrumentation from its metadata.
   *
   * @returns The instrumentation name
   */
  static get identifier(): string {
    return this.metadata.name;
  }

  getIdentifier(): string {
    return (this.constructor as typeof InstrumentationBase).identifier;
  }

  /**
   * Checks if the target library for this instrumentation is available.
   *
   * @returns True if the target library can be resolved, false otherwise
   */
  static get available(): boolean {
    try {
      resolveModulePath(this.metadata.targetLibrary);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets the OpenTelemetry tracer for this instrumentation.
   *
   * @returns The tracer instance
   */
  public get tracer() {
    return trace.getTracer(this.instrumentationName, this.instrumentationVersion);
  }

  /**
   * Sets up instrumentation patches for the target module.
   *
   * NOTE: This method is only called automatically when the target library is
   * actually require()'d or import'ed by the application. OpenTelemetry uses
   * module hooking to detect when modules are loaded and applies patches at
   * that time, not during instrumentation registration.
   *
   * Subclasses should override this method to apply their specific instrumentation logic.
   *
   * @param moduleExports - The module exports to instrument
   * @param moduleVersion - Optional version of the module being instrumented
   * @returns The potentially modified module exports
   */
  protected setup(moduleExports: any, moduleVersion?: string): any {
    return moduleExports;
  }

  /**
   * Removes instrumentation patches from the target module.
   *
   * Subclasses should override this method to clean up their instrumentation.
   *
   * @param moduleExports - The module exports to uninstrument
   * @param moduleVersion - Optional version of the module being uninstrumented
   * @returns The potentially modified module exports
   */
  protected teardown(moduleExports: any, moduleVersion?: string): any {
    return moduleExports;
  }

  /**
   * Wrapped setup method that prevents duplicate execution
   */
  private _setup(moduleExports: any, moduleVersion?: string): any {
    if ((this.constructor as typeof InstrumentationBase).useRuntimeTargeting) {
      debug(`deferring setup() for runtime targeting for ${this.getIdentifier()}`);
      return moduleExports;
    }

    return this.setup(moduleExports, moduleVersion);
  }

  /**
   * Gets the target module exports.
   *
   * This mimics the built-in OpenTelemetry behavior of resolving the module exports
   * and lets us use them with runtime targeting.
   */
  private getTargetModuleExports(): any {
    const metadata = (this.constructor as typeof InstrumentationBase).metadata;
    return getModuleExports(metadata.targetLibrary);
  }

  /**
   * Performs runtime targeting for instrumentations that bypass OpenTelemetry's module hooking.
   * This method uses robust module resolution and calls the setup method directly.
   */
  setupRuntimeTargeting(): void {
    if (this.isRuntimeSetup) {
      debug('runtime targeting already set up, skipping');
      return;
    }

    debug(`starting runtime targeting setup for ${this.getIdentifier()}`);
    const moduleExports = this.getTargetModuleExports();
    this.setup(moduleExports);
  }

  /**
   * Performs runtime teardown for instrumentations using runtime targeting.
   */
  teardownRuntimeTargeting(): void {
    if (!this.isRuntimeSetup) {
      return;
    }

    debug(`starting runtime targeting teardown for ${this.getIdentifier()}`);
    const moduleExports = this.getTargetModuleExports();
    this.teardown(moduleExports);
    this.isRuntimeSetup = false;
  }

}