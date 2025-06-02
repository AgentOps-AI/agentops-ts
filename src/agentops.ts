import { NodeSDK as OpenTelemetryNodeSDK } from '@opentelemetry/sdk-node';
import { InstrumentationRegistry } from './instrumentation/registry';
import { InstrumentationBase } from './instrumentation/base';
import { Config } from './types';
import { createGlobalResourceAttributes } from './attributes';
import { API, TokenResponse, BearerToken } from './api';

/**
 * Main AgentOps SDK class.
 *
 * @example
 * ```typescript
 * import { agentops } from 'agentops';
 *
 * // Initialize with environment variable API key
 * await agentops.init();
 *
 * // Or initialize with explicit configuration
 * await agentops.init({
 *   apiKey: 'your-api-key',
 *   ...
 * });
 * ```
 */
export class AgentOps {
  private config: Config;
  public readonly registry: InstrumentationRegistry;
  private sdk: OpenTelemetryNodeSDK | null = null;
  private api: API | null = null;
  private authToken: BearerToken | null = null;

  /**
   * Creates a new AgentOps instance with default configuration.
   */
  constructor() {
    this.registry = new InstrumentationRegistry();
    this.config = {
      serviceName: 'agentops',
      apiEndpoint: 'https://api.agentops.ai',
      otlpEndpoint: 'https://otlp.agentops.ai/v1/traces',
      apiKey: process.env.AGENTOPS_API_KEY
    };
  }

  /**
   * Initializes the AgentOps SDK with OpenTelemetry instrumentation.
   *
   * Performs the following setup:
   * - Merges user configuration with defaults
   * - Authenticates with AgentOps API using JWT tokens
   * - Configures OpenTelemetry SDK with active instrumentations
   * - Sets up automatic cleanup on process exit
   *
   * @param config - Partial configuration to override defaults
   * @throws {Error} When API key is not provided via config or environment variable
   *
   * @example
   * ```typescript
   * // Use environment variable AGENTOPS_API_KEY
   * await agentops.init();
   *
   * // Override specific settings
   * await agentops.init({
   *   apiKey: 'custom-key'
   * });
   * ```
   */
  async init(config: Partial<Config> = {}): Promise<void> {
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
    this.api = new API(this.config.apiKey, this.config.apiEndpoint!);

    // Set authentication headers
    const bearerToken = await this.getBearerToken();
    process.env.OTEL_EXPORTER_OTLP_HEADERS = `authorization=${bearerToken.getAuthHeader()}`;
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = this.config.otlpEndpoint;

    this.sdk = new OpenTelemetryNodeSDK({
      resource: createGlobalResourceAttributes(this.config.serviceName!),
      instrumentations: this.registry.getActiveInstrumentors(this.config.serviceName!),
    });
    this.sdk.start();

    // Setup process exit handlers
    this.setupExitHandlers();
  }

  /**
   * Checks if the SDK has been initialized.
   *
   * @returns True if init() has been called successfully, false otherwise
   */
  get initialized(): boolean {
    return this.sdk !== null;
  }

  /**
   * Ensures the SDK is initialized before performing operations.
   *
   * @throws {Error} When the SDK has not been initialized
   * @private
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('AgentOps not initialized. Call agentops.init() first.');
    }
  }

  /**
   * Shuts down the OpenTelemetry SDK and cleans up resources.
   *
   * This method is automatically called on process exit and should contain any necessary cleanup logic.
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await this.sdk!.shutdown();
    this.sdk = null;
  }

  /**
   * Sets up process event handlers for automatic cleanup on exit.
   *
   * Handles the following scenarios:
   * - Normal process exit
   * - SIGINT (Ctrl+C)
   * - SIGTERM (process termination)
   * - Uncaught exceptions
   * - Unhandled promise rejections
   *
   * @private
   */
  private setupExitHandlers(): void {
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
   * Gets the current bearer token for API authentication.
   *
   * @returns Promise resolving to a bearer token
   * @throws {Error} When the SDK is not initialized
   * @private
   */
  private async getBearerToken(): Promise<BearerToken> {
    if (!this.authToken) {
      const tokenResponse = await this.api!.authenticate();
      this.authToken = new BearerToken(tokenResponse.token);
    }

    return this.authToken;
  }
}

