import { NodeSDK as OpenTelemetryNodeSDK } from '@opentelemetry/sdk-node';
import { InstrumentationRegistry } from './instrumentation/registry';
import { AgentOpsInstrumentationBase } from './instrumentation/base';
import { AgentOpsConfig } from './types';
import { createGlobalResourceAttributes } from './attributes';

const packageInfo = require('../package.json');

class AgentOps {
  private sdk: OpenTelemetryNodeSDK | null = null;
  public readonly registry: InstrumentationRegistry;
  private config: AgentOpsConfig;
  public readonly instrumentations: AgentOpsInstrumentationBase[] = [];

  constructor() {
    this.registry = new InstrumentationRegistry();
    this.config = {
      serviceName: 'agentops'
    };
  }

  async init(config: Partial<AgentOpsConfig> = {}): Promise<void> {
    if (this.initialized) {
      console.warn('AgentOps already initialized');
      return;
    }

    // Merge user config with defaults
    this.config = {
      serviceName: config.serviceName ?? this.config.serviceName ?? 'agentops',
      endpoint: config.endpoint ?? this.config.endpoint,
      headers: { ...this.config.headers, ...config.headers },
      sampling: config.sampling ?? this.config.sampling,
    };

    // Set environment variables
    if (this.config.endpoint) {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = this.config.endpoint;
    }

    this.sdk = new OpenTelemetryNodeSDK({
      resource: createGlobalResourceAttributes(this.config.serviceName!),
      instrumentations: this.createInstrumentations(),
    });

    this.sdk.start();
  }

  private createInstrumentations(): AgentOpsInstrumentationBase[] {
    // Clear previous instrumentations and enabled tracking
    this.instrumentations.length = 0;
    this.registry.clearEnabled();

    const availableNames = this.registry.getAvailable();

    for (const name of availableNames) {
      const instrumentation = this.registry.createInstance(name, this.config.serviceName!, packageInfo.version);

      if (instrumentation) {
        this.instrumentations.push(instrumentation);
      }
    }

    return this.instrumentations;
  }

  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
      this.sdk = null;
    }
  }

  get initialized(): boolean {
    return this.sdk !== null;
  }
}

// Export singleton instance
export const agentops = new AgentOps();