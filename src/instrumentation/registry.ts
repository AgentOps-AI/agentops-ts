import { InstrumentationBase } from './base';
import { AVAILABLE_INSTRUMENTORS } from './index';
import { InstrumentorMetadata } from '../types';
import { getPackageVersion } from '../attributes';

export class InstrumentationRegistry {
  private instrumentors = new Map<string, typeof InstrumentationBase>();
  private enabledInstrumentors = new Set<string>();
  private readonly packageVersion: string;

  constructor() {
    this.packageVersion = getPackageVersion();
    // Auto-register only available instrumentors
    for (const instrumentorClass of AVAILABLE_INSTRUMENTORS) {
      if (instrumentorClass.available) {
        this.register(instrumentorClass);
      }
    }
  }

  register(instrumentorClass: typeof InstrumentationBase): void {
    this.instrumentors.set(instrumentorClass.identifier, instrumentorClass);
  }

  getAvailable(): (typeof InstrumentationBase)[] {
    return Array.from(this.instrumentors.values());
  }

  getEnabled(): string[] {
    return Array.from(this.enabledInstrumentors);
  }

  private createInstance(instrumentorClass: typeof InstrumentationBase, packageName: string): InstrumentationBase | null {
    try {
      const instance = new (instrumentorClass as any)(packageName, this.packageVersion, {});

      // Mark as enabled when successfully created
      this.enabledInstrumentors.add(instrumentorClass.identifier);

      return instance;
    } catch (error) {
      console.warn(`Failed to create instrumentor ${instrumentorClass.identifier}:`, error);
      return null;
    }
  }

  /**
   * Get active instrumentors
   */
  getActiveInstrumentors(serviceName: string): InstrumentationBase[] {
    const available: (typeof InstrumentationBase)[] = this.getAvailable();
    const instrumentors: InstrumentationBase[] = [];

    for (const instrumentorClass of available) {
      const instrumentor = this.createInstance(instrumentorClass, serviceName);
      if (instrumentor) {
        instrumentors.push(instrumentor);
      }
    }

    return instrumentors;
  }

}