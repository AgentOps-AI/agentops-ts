import { NodeSDK as OpenTelemetryNodeSDK } from '@opentelemetry/sdk-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { ExportResult, ExportResultCode } from '@opentelemetry/core';
import { Config, LogLevel } from './types';
import { createGlobalResourceAttributes } from './attributes';
import { BearerToken } from './api';
import { InstrumentationBase } from './instrumentation/base';

const debug = require('debug')('agentops:tracing');

const MAX_EXPORT_BATCH_SIZE = 1; // Export immediately
const SCHEDULED_DELAY_MILLIS = 500; // Check for spans every 500ms
const EXPORT_TIMEOUT_MILLIS = 5000; // 5 second timeout

// TODO make this part of config
const DASHBOARD_URL = "https://app.agentops.ai";


class Exporter extends OTLPTraceExporter {
  private exportedTraceIds: Set<string> = new Set();

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
    // TODO better log handler.
    console.log(`\x1b[34m🖇 AgentOps: Session Replay for trace: ${url}\x1b[0m`);
  }

  /**
   * Tracks a newly exported trace and prints its dashboard URL if not already seen.
   *
   * @param span - The span to track
   */
  private trackExportedTrace(span: ReadableSpan): void {
    const traceId = span.spanContext().traceId;
    if(!this.exportedTraceIds.has(traceId)){
      this.exportedTraceIds.add(traceId);
      this.printExportedTraceURL(traceId);
    }
  }

  /**
   * Handle export results and track successfully exported traces.
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
   * Shutdown the exporter and print dashboard URLs for all exported traces.
   *
   * @return Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    debug('exporter shutdown');
    this.exportedTraceIds.forEach(traceId => {
      this.printExportedTraceURL(traceId);
    })
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
   */
  constructor(
    private config: Config,
    private authToken: BearerToken,
    private instrumentations: InstrumentationBase[]
  ) {
    this.configureLogging();

    this.exporter = new Exporter({
      url: `${config.otlpEndpoint}/v1/traces`,
      headers: {
        authorization: authToken.getAuthHeader(),
      },
    });

    this.processor = new BatchSpanProcessor(this.exporter, {
      maxExportBatchSize: MAX_EXPORT_BATCH_SIZE,
      scheduledDelayMillis: SCHEDULED_DELAY_MILLIS,
      exportTimeoutMillis: EXPORT_TIMEOUT_MILLIS,
    });

    this.sdk = new OpenTelemetryNodeSDK({
      resource: createGlobalResourceAttributes(this.config.serviceName!),
      instrumentations: instrumentations,
      spanProcessor: this.processor,
    });

    this.sdk.start();
    debug('tracing core initialized');
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