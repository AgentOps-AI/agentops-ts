import { Span, SpanKind, trace } from '@opentelemetry/api';
import {
  InstrumentationBase as _InstrumentationBase,
  InstrumentationNodeModuleDefinition,
  InstrumentationConfig
} from '@opentelemetry/instrumentation';
import { InstrumentorMetadata } from '../types';

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
      (moduleExports, moduleVersion) => this.setup(moduleExports, moduleVersion),
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

  /**
   * Checks if the target library for this instrumentation is available.
   *
   * @returns True if the target library can be resolved, false otherwise
   */
  static get available(): boolean {
    try {
      require.resolve(this.metadata.targetLibrary);
      return true;
    } catch (error) {
      return false;
    }
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
   * Creates a new OpenTelemetry span with the specified configuration.
   *
   * @param operationName - Name of the operation being traced
   * @param attributes - Optional attributes to add to the span
   * @param spanKind - Type of span (CLIENT, SERVER, INTERNAL, etc.)
   * @returns The created span
   */
  protected createSpan(
    operationName: string,
    attributes: Record<string, any> = {},
    spanKind: SpanKind = SpanKind.CLIENT
  ): Span {
    const tracer = trace.getTracer(this.instrumentationName, this.instrumentationVersion);

    return tracer.startSpan(operationName, {
      kind: spanKind,
      attributes
    });
  }


}