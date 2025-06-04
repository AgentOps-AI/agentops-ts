import { NodeSDK as OpenTelemetryNodeSDK } from '@opentelemetry/sdk-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { InstrumentationRegistry } from './instrumentation/registry';
import { InstrumentationBase } from './instrumentation/base';
import { Config, LogLevel } from './types';
import { createGlobalResourceAttributes } from './attributes';
import { API, TokenResponse, BearerToken } from './api';

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
  private sdk: OpenTelemetryNodeSDK;
  private api: API | null = null;
  private authToken: BearerToken | null = null;
  private _initialized = false;

  /**
   * Creates a new Client instance with default configuration.
   * Creates the SDK with instrumentations immediately to catch module loading.
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

    // Create SDK with instrumentations early to catch module loading
    this.sdk = new OpenTelemetryNodeSDK({
      resource: createGlobalResourceAttributes(this.config.serviceName!),
      instrumentations: this.registry.getActiveInstrumentors(this.config.serviceName!),
    });
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
    this.configureLogging();
    this.registry.initialize();

    if (!this.config.apiKey) {
      throw new Error('API key is required. Set AGENTOPS_API_KEY environment variable or pass it in config.');
    }
    this.api = new API(this.config.apiKey, this.config.apiEndpoint!);

    const authToken = await this.getAuthToken();
    process.env.OTEL_EXPORTER_OTLP_HEADERS = `authorization=${authToken.getAuthHeader()}`;
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = this.config.otlpEndpoint;

    // Setting batch size to 1 ensures spans are exported immediately.
    // Without this, the batch processor holds spans waiting for more to accumulate,
    // and its internal timers keep the Node.js event loop alive, preventing process
    // exit in short-lived scripts. This causes spans to be logged but never exported.
    process.env.OTEL_BSP_MAX_EXPORT_BATCH_SIZE = '1';
    //process.env.OTEL_BSP_SCHEDULE_DELAY = '500';
    //process.env.OTEL_BSP_EXPORT_TIMEOUT = '5000';


    this.sdk.start();
    this.setupExitHandlers();

    this._initialized = true;
    debug('[agentops] initialized');
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

    await this.sdk.shutdown();
    this._initialized = false;
    debug('[agentops] shutdown');
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

  /**
   * Configures OpenTelemetry diagnostic logging and debug visibility based on the current log level.
   */
  private configureLogging(): void {
    const logLevel = this.config.logLevel!;
    const levelMap: Record<LogLevel, DiagLogLevel> = {
      debug: DiagLogLevel.DEBUG,
      info: DiagLogLevel.INFO,
      error: DiagLogLevel.ERROR
    };
    const diagLevel = levelMap[logLevel] || DiagLogLevel.ERROR;

    diag.setLogger(new DiagConsoleLogger(), diagLevel);
  }
}

