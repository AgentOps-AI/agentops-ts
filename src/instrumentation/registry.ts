import { AgentOpsInstrumentationBase } from './base';
import { InstrumentorMetadata } from '../types';
import { OpenAIInstrumentation } from './openai-instrumentation';
// Import other instrumentors here as they're added
// import { LangChainInstrumentation } from './langchain-instrumentation';
// import { AnthropicInstrumentation } from './anthropic-instrumentation';

// Module-level registry of all available instrumentors
const AVAILABLE_INSTRUMENTORS: (typeof AgentOpsInstrumentationBase)[] = [
  OpenAIInstrumentation,
  // LangChainInstrumentation,
  // AnthropicInstrumentation,
];

export class InstrumentationRegistry {
  private instrumentors = new Map<string, typeof AgentOpsInstrumentationBase>();
  private enabledInstrumentors = new Set<string>();

  constructor() {
    // Auto-register only available instrumentors
    for (const instrumentorClass of AVAILABLE_INSTRUMENTORS) {
      if (instrumentorClass.isAvailable()) {
        this.register(instrumentorClass);
      }
    }
  }

  register(instrumentorClass: typeof AgentOpsInstrumentationBase): void {
    // Enforce that instrumentor classes have required metadata
    const metadata = (instrumentorClass as any).metadata;

    if (!metadata?.name || !metadata?.version || !metadata?.targetLibrary) {
      throw new Error(`Instrumentor class must have static 'metadata' with name, version, and targetLibrary properties`);
    }

    this.instrumentors.set(metadata.targetLibrary, instrumentorClass);
  }

  getAvailable(): string[] {
    return Array.from(this.instrumentors.keys());
  }

  getEnabled(): string[] {
    return Array.from(this.enabledInstrumentors);
  }

  clearEnabled(): void {
    this.enabledInstrumentors.clear();
  }

  createInstance(instrumentorName: string, packageName: string, packageVersion: string): AgentOpsInstrumentationBase | null {
    const InstrumentorClass = this.instrumentors.get(instrumentorName);
    if (!InstrumentorClass) {
      return null;
    }

    try {
      const instance = new InstrumentorClass(packageName, packageVersion, {});

      // Mark as enabled when successfully created
      this.enabledInstrumentors.add(instrumentorName);

      return instance;
    } catch (error) {
      console.warn(`Failed to create instrumentor ${instrumentorName}:`, error);
      return null;
    }
  }

}