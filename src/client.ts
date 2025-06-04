import { InstrumentationRegistry } from './instrumentation/registry';
import { InstrumentationBase } from './instrumentation/base';
import { Config, LogLevel } from './types';
import { API, TokenResponse, BearerToken } from './api';
import { TracingCore } from './tracing';
import { getGlobalResource } from './attributes';

const debug = require('debug')('agentops:client');

/**
 * Main AgentOps SDK client class.
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
export class Client {
  private config: Config;
  public readonly registry: InstrumentationRegistry;
  private core: TracingCore | null = null;
  private api: API | null = null;
  private authToken: BearerToken | null = null;
  private _initialized = false;

  /**
   * Creates a new Client instance with default configuration.
   */
  constructor() {
    this.config = {
      serviceName: 'agentops',
      apiEndpoint: 'https://api.agentops.ai',
      otlpEndpoint: 'https://otlp.agentops.ai',
      apiKey: process.env.AGENTOPS_API_KEY,
      logLevel: (process.env.AGENTOPS_LOG_LEVEL as LogLevel) || 'error'
    };
    this.registry = new InstrumentationRegistry();
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

    this.config = { ...this.config, ...config };
    this.registry.initialize();

    if (!this.config.apiKey) {
      throw new Error('API key is required. Set AGENTOPS_API_KEY environment variable or pass it in config.');
    }
    this.api = new API(this.config.apiKey, this.config.apiEndpoint!);

    const resource = await getGlobalResource(this.config.serviceName!);
    this.core = new TracingCore(
      this.config,
      await this.getAuthToken(),
      this.registry.getActiveInstrumentors(this.config.serviceName!),
      resource
    );
    this.setupExitHandlers();

    this._initialized = true;
    debug('initialized');
  }

  /**
   * Checks if the SDK has been initialized.
   *
   * @returns True if init() has been called successfully, false otherwise
   */
  get initialized(): boolean {
    return this._initialized;
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

    if(this.core) {
      await this.core.shutdown();
    }

    this._initialized = false;
    debug('shutdown');
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
    process.on('exit', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
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
  private async getAuthToken(): Promise<BearerToken> {
    if (!this.authToken) {
      const tokenResponse = await this.api!.authenticate();
      this.authToken = new BearerToken(tokenResponse.token);
    }

    return this.authToken;
  }

}

