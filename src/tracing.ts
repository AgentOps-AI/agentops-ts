import { NodeSDK as OpenTelemetryNodeSDK } from '@opentelemetry/sdk-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor, SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { ExportResult, ExportResultCode } from '@opentelemetry/core';
import { Resource } from '@opentelemetry/resources';
import { Config, LogLevel } from './types';
import { BearerToken } from './api';
import { InstrumentationBase } from './instrumentation/base';

const debug = require('debug')('agentops:tracing');

const MAX_EXPORT_BATCH_SIZE = 1; // Export immediately
const SCHEDULED_DELAY_MILLIS = 0; // No delay between exports
const EXPORT_TIMEOUT_MILLIS = 5000; // 5 second timeout

// TODO make this part of config
const DASHBOARD_URL = "https://app.agentops.ai";

// Forward declaration to avoid circular dependency
interface ClientLike {
  uploadLogFile(traceId: string): Promise<{ id: string } | null>;
}

class Exporter extends OTLPTraceExporter {
  private exportedTraceIds: Set<string> = new Set();
  private uploadedTraceIds: Set<string> = new Set();
  private printedTraceIds: Set<string> = new Set();

  constructor(config: any, private client?: ClientLike) {
    super(config);
  }

  /**
    * Creates a new OTLP exporter for AgentOps with custom export handling.
    *
    * @param spans - Array of spans to export
    * @param resultCallback - Callback to handle export result
   */
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    super.export(spans, (result: ExportResult) => {
      this.onExportResult(spans, result);
      resultCallback(result);
    });
  }

  /**
   * Prints the AgentOps dashboard URL for a given trace ID.
   *
   * @param traceId - The trace ID to generate a dashboard URL for
   */
  private printExportedTraceURL(traceId: string): void {
    const url = `${DASHBOARD_URL}/sessions?trace_id=${traceId}`;
    console.log(`\x1b[34m🖇  AgentOps: Session Replay for trace: ${url}\x1b[0m`);
  }

  /**
   * Tracks a newly exported trace (without immediate actions).
   *
   * @param span - The span to track
   */
  private trackExportedTrace(span: ReadableSpan): void {
    const traceId = span.spanContext().traceId;
    this.exportedTraceIds.add(traceId);
  }

  /**
   * Handle export results and track successfully exported traces.
   * Actions are deferred until flush() is called.
   *
   * @param spans - The spans that were exported
   * @param result - The export result
   */
  private onExportResult(spans: ReadableSpan[], result: ExportResult): void {
    if (result.code === ExportResultCode.SUCCESS) {
      spans.forEach(span => {
        this.trackExportedTrace(span);
      });
      debug(`exported ${spans.length} span(s)`);
    } else {
      console.error(`Export failed for ${spans.length} spans: ${result.error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Flush all pending actions: print URLs and upload logs for all exported traces.
   */
  async flush(): Promise<void> {
    debug('flushing exported traces');
    
    // Print URLs and upload logs for all exported traces
    const uploadPromises: Promise<void>[] = [];
    
    this.exportedTraceIds.forEach(traceId => {
      // Print URL only if not already printed
      if (!this.printedTraceIds.has(traceId)) {
        this.printedTraceIds.add(traceId);
        this.printExportedTraceURL(traceId);
      }
      
      // Upload logs if client is available and not already uploaded
      if (this.client && !this.uploadedTraceIds.has(traceId)) {
        this.uploadedTraceIds.add(traceId);
        const uploadPromise = this.client.uploadLogFile(traceId)
          .then(() => {}) // Convert to void
          .catch(error => {
            debug(`Failed to upload logs for trace ${traceId}:`, error);
            // Remove from uploaded set if upload failed, allowing retry
            this.uploadedTraceIds.delete(traceId);
          });
        uploadPromises.push(uploadPromise);
      }
    });
    
    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
  }

  /**
   * Shutdown the exporter.
   *
   * @return Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    debug('exporter shutdown');
    return super.shutdown();
  }
}


/**
 * Core tracing functionality for AgentOps SDK.
 *
 * Handles OpenTelemetry SDK initialization, configuration, and lifecycle management
 * in isolation from the main client logic.
 */
export class TracingCore {
  private sdk: OpenTelemetryNodeSDK | null = null;
  private exporter: Exporter | null = null;
  private processor: BatchSpanProcessor | null = null;

  /**
   * Creates a new TracingCore instance with the provided configuration and instrumentations.
   *
   * @param config - AgentOps configuration
   * @param authToken - Bearer token for authenticating with AgentOps API
   * @param instrumentations - Array of AgentOps instrumentations to enable
   * @param resource - Pre-created resource with async attributes resolved
   * @param client - Client instance for log upload functionality
   */
  constructor(
    private config: Config,
    private authToken: BearerToken,
    private instrumentations: InstrumentationBase[],
    resource: Resource,
    client?: ClientLike
  ) {
    this.exporter = new Exporter({
      url: `${config.otlpEndpoint}/v1/traces`,
      headers: {
        authorization: authToken.getAuthHeader(),
      },
    }, client);

    this.processor = new BatchSpanProcessor(this.exporter, {
      maxExportBatchSize: MAX_EXPORT_BATCH_SIZE,
      scheduledDelayMillis: SCHEDULED_DELAY_MILLIS,
      exportTimeoutMillis: EXPORT_TIMEOUT_MILLIS,
    });

    this.sdk = new OpenTelemetryNodeSDK({
      resource: resource,
      instrumentations: instrumentations,
      spanProcessor: this.processor as any,
    });

    // Configure logging after resource attributes are settled
    this.configureLogging();
    this.sdk.start();
    debug('tracing core initialized');
  }

  /**
   * Flush all pending trace actions: print URLs and upload logs.
   * Call this after execution is complete.
   */
  async flush(): Promise<void> {
    if (this.exporter) {
      await this.exporter.flush();
    }
  }

  /**
   * Shuts down the OpenTelemetry SDK and cleans up resources.
   */
  async shutdown(): Promise<void> {
    if (!this.sdk) {
      return;
    }

    await this.sdk.shutdown();
    debug('tracing core shutdown');
  }

  /**
   * Configures OpenTelemetry diagnostic logging based on the current log level.
   *
   * @private
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