import { InstrumentorMetadata } from '../types';
import { getPackageVersion } from '../attributes';
import { AVAILABLE_INSTRUMENTORS } from './index';
import { InstrumentationBase } from './base';

const debug = require('debug')('agentops:instrumentation:registry');


/**
 * Registry for managing instrumentation discovery, registration, and lifecycle.
 *
 * Automatically discovers available instrumentations, registers them if their target
 * libraries are present, and provides methods to create and manage active instances.
 */
export class InstrumentationRegistry {
  private instrumentors = new Map<string, typeof InstrumentationBase>();
  private enabledInstrumentors = new Map<string, InstrumentationBase>();
  private readonly packageVersion: string;

  /**
   * Creates a new instrumentation registry.
   *
   * Automatically discovers and registers all available instrumentations
   * from the AVAILABLE_INSTRUMENTORS list.
   */
  constructor() {
    this.packageVersion = getPackageVersion();
  }

  /**
   * Initialize the registry by checking availability and registering instrumentors.
   * This is called from Client.init() to ensure availability is checked from the correct working directory.
   */
  initialize(): void {
    for (const instrumentorClass of AVAILABLE_INSTRUMENTORS) {
      if (instrumentorClass.available) {
        this.register(instrumentorClass);

        // For instrumentors using runtime targeting, create instance and trigger setup immediately
        if (instrumentorClass.useRuntimeTargeting) {
          const existingInstance = this.enabledInstrumentors.get(instrumentorClass.identifier);
          if (!existingInstance) {
            // TODO don't hardcode package name
            const instance = this.createInstance(instrumentorClass, 'agentops');
            if (instance) {
              instance.setupRuntimeTargeting();
            }
          } else {
            debug(`found existing instance for ${instrumentorClass.identifier}, skipping setup`);
          }
        }
      }
    }
  }

  /**
   * Registers an instrumentation class in the registry.
   *
   * @param instrumentorClass - The instrumentation class to register
   */
  register(instrumentorClass: typeof InstrumentationBase): void {
    this.instrumentors.set(instrumentorClass.identifier, instrumentorClass);
    debug(`registered instrumentor ${instrumentorClass.identifier}`);
  }

  /**
   * Gets all available instrumentation classes.
   *
   * @returns Array of registered instrumentation class constructors
   */
  getAvailable(): (typeof InstrumentationBase)[] {
    return Array.from(this.instrumentors.values());
  }

  /**
   * Gets the identifiers of successfully enabled instrumentations.
   *
   * @returns Array of instrumentation identifiers that were successfully created
   */
  getEnabled(): string[] {
    return Array.from(this.enabledInstrumentors.keys());
  }

  /**
   * Creates an instance of the specified instrumentation class.
   *
   * @param instrumentorClass - The instrumentation class to instantiate
   * @param packageName - Name of the service/package being instrumented
   * @returns The created instrumentation instance, or null if creation failed
   */
  private createInstance(instrumentorClass: typeof InstrumentationBase, packageName: string): InstrumentationBase | undefined {
    const existingInstance = this.enabledInstrumentors.get(instrumentorClass.identifier);
    if (existingInstance) {
      return existingInstance;
    }

    try {
      const instance = new (instrumentorClass as any)(packageName, this.packageVersion, {});
      this.enabledInstrumentors.set(instrumentorClass.identifier, instance);
      debug(`instantiated ${instrumentorClass.identifier}`);
      return instance;
    } catch (error) {
      console.warn(`[agentops.registry] Failed to create instrumentor ${instrumentorClass.identifier}:`, error);
      return undefined;
    }
  }

  /**
   * Creates and returns all active instrumentations.
   *
   * Attempts to create instances of all registered instrumentations for the specified service.
   * Only successfully created instances are included in the result.
   *
   * @param serviceName - Name of the service to create instrumentations for
   * @returns Array of active instrumentation instances
   */
  getActiveInstrumentors(serviceName: string): InstrumentationBase[] {
    const available: (typeof InstrumentationBase)[] = this.getAvailable();
    const instrumentors: InstrumentationBase[] = [];

    for (const instrumentorClass of available) {
      // Check if already enabled, otherwise create new instance
      let instrumentor = this.enabledInstrumentors.get(instrumentorClass.identifier);
      if (!instrumentor && instrumentorClass.available) {
        instrumentor = this.createInstance(instrumentorClass, serviceName);
      }

      if (instrumentor) {
        instrumentors.push(instrumentor);
      }
    }

    return instrumentors;
  }
}