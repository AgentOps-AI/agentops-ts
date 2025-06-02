import { NodeSDK as OpenTelemetryNodeSDK } from '@opentelemetry/sdk-node';
import { InstrumentationRegistry } from './instrumentation/registry';
import { AgentOpsInstrumentationBase } from './instrumentation/base';
import { AgentOpsConfig } from './types';
import { createGlobalResourceAttributes } from './attributes';
import { AgentOpsAPI, TokenResponse, BearerToken } from './api';

class AgentOps {
  private config: AgentOpsConfig;
  public readonly registry: InstrumentationRegistry;
  private sdk: OpenTelemetryNodeSDK | null = null;
  private api: AgentOpsAPI | null = null;
  private authToken: BearerToken | null = null;

  constructor() {
    this.registry = new InstrumentationRegistry();
    this.config = {
      serviceName: 'agentops',
      apiEndpoint: 'https://api.agentops.ai',
      otlpEndpoint: 'https://otlp.agentops.ai/v1/traces',
      apiKey: process.env.AGENTOPS_API_KEY
    };
  }

  async init(config: Partial<AgentOpsConfig> = {}): Promise<void> {
    if (this.initialized) {
      console.warn('AgentOps already initialized');
      return;
    }

    // Merge user config with defaults
    this.config = { ...this.config, ...config };

    // Initialize API client
    if (!this.config.apiKey) {
      throw new Error('API key is required. Set AGENTOPS_API_KEY environment variable or pass it in config.');
    }
    this.api = new AgentOpsAPI(this.config.apiKey, this.config.apiEndpoint!);

    // Set authentication headers
    const bearerToken = await this.getBearerToken();
    process.env.OTEL_EXPORTER_OTLP_HEADERS = `authorization=${bearerToken.getAuthHeader()}`;
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = this.config.otlpEndpoint;

    this.sdk = new OpenTelemetryNodeSDK({
      resource: createGlobalResourceAttributes(this.config.serviceName!),
      instrumentations: this.registry.createAllInstrumentations(this.config.serviceName!),
    });
    this.sdk.start();

    // Setup process exit handlers
    this.setupExitHandlers();
  }

  get initialized(): boolean {
    return this.sdk !== null;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('AgentOps not initialized. Call agentops.init() first.');
    }
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await this.sdk!.shutdown();
    this.sdk = null;
  }

  private setupExitHandlers(): void {
    // Handle various exit scenarios
    process.on('exit', this.shutdown);
    process.on('SIGINT', this.shutdown);
    process.on('SIGTERM', this.shutdown);
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      // TODO we can handle error states on unexported spans here
      this.shutdown();
      process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled rejection:', reason);
      this.shutdown();
      process.exit(1);
    });
  }

  /**
   * Get current bearer token, authenticating if necessary
   */
  private async getBearerToken(): Promise<BearerToken> {
    this.ensureInitialized();

    if (!this.authToken || this.authToken.isExpired()) {
      const tokenResponse = await this.api!.authenticate();
      this.authToken = new BearerToken(tokenResponse.token);
    }

    return this.authToken;
  }
}

// Export singleton instance
export const agentops = new AgentOps();