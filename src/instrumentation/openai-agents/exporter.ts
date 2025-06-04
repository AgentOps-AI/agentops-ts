import { trace, context, SpanStatusCode, SpanKind, Span, ROOT_CONTEXT } from '@opentelemetry/api';
import type { TracingExporter, Trace as OpenAITrace, Span as OpenAISpan } from '@openai/agents';
import { InstrumentationBase } from '../base';
import { getSpanAttributes, getSpanName, getSpanKind } from './attributes';
import type { AgentOpsResponseSpanData } from './response';


export class OpenAIAgentsTracingExporter implements TracingExporter {
  private readonly instrumentation: InstrumentationBase;
  private readonly traceMap = new Map<string, Span>(); // OpenAI Agents trace ID -> root OpenTelemetry span
  private readonly spanMap = new Map<string, Span>(); // OpenAI Agents span ID -> OpenTelemetry span

  // Storage for enhanced response data, keyed by response ID
  private readonly enhancedResponseData = new Map<string, Partial<AgentOpsResponseSpanData>>();

  /**
   * Creates a new OpenAIAgentsTracingExporter instance.
   * @param instrumentation The instrumentation base to use for exporting spans.
   */
  constructor(instrumentation: InstrumentationBase) {
    this.instrumentation = instrumentation;
  }

  /**
   * Stores enhanced response data for later injection into response spans.
   */
  public storeEnhancedResponseData(responseId: string, enhancedData: Partial<AgentOpsResponseSpanData>): void {
    this.enhancedResponseData.set(responseId, enhancedData);
  }

  /**
   * Retrieves enhanced response data for a given response ID.
   */
  private getEnhancedResponseData(responseId: string): Partial<AgentOpsResponseSpanData> | undefined {
    return this.enhancedResponseData.get(responseId);
  }

  /**
   * Exports OpenAI Agents traces and spans to OpenTelemetry spans.
   * @param items The items to export, which can be either traces or spans.
   */
  async export(items: (OpenAITrace | OpenAISpan<any>)[]): Promise<void> {
    for (const item of items) {
      if (item.type === 'trace') {
        this.handleTrace(item as OpenAITrace);
      } else if (item.type === 'trace.span') {
        this.handleSpan(item as OpenAISpan<any>);
      }
    }
  }

  /**
   * Handles an OpenAI Agents trace, converting it to an OpenTelemetry span.
   * @param item The OpenAI Agents trace to handle.
   * This creates a root span for the trace, which can be used to link child spans.
   * The trace ID is stored in a map for later reference when handling spans.
   * The span is ended immediately, as it is only a root span without any child spans.
   */
  private handleTrace(item: OpenAITrace): void {
    const attributes: Record<string, any> = {};

    const span = this.instrumentation.tracer.startSpan(item.name, {
      kind: SpanKind.INTERNAL,
      attributes
    });

    const traceId = span.spanContext().traceId;
    this.traceMap.set(item.traceId, span);

    span.end();
  }

  /**
   * Handles an OpenAI Agents span, converting it to an OpenTelemetry span.
   * @param item The OpenAI Agents span to handle.
   * This retrieves the attributes and name for the span, creates a new OpenTelemetry span,
   * and sets its parent context to the root span of the trace.
   * If the span has an error, it records the exception and sets the status to ERROR.
   * If the span does not have an error, it sets the status to OK.
   * The span is ended with the provided end time or the current time if not specified.
   * The span is stored in a map for later reference.
   */
  private handleSpan(item: OpenAISpan<any>): void {
    // Check if this is a response span that we can enhance with stored generation data
    if (item.spanData.type === 'response' && item.spanData.response_id) {
      const enhancedData = this.getEnhancedResponseData(item.spanData.response_id);
      if (enhancedData) {
        // Enhance the span data directly
        Object.assign(item.spanData, enhancedData);
      }
    }

    const attributes = getSpanAttributes(item);
    const spanName = getSpanName(item.spanData);

    const rootSpan = this.traceMap.get(item.traceId);
    const mappedTraceId = rootSpan?.spanContext().traceId;
    const parentContext = rootSpan ? trace.setSpan(ROOT_CONTEXT, rootSpan) : ROOT_CONTEXT;

    const span = this.instrumentation.tracer.startSpan(spanName, {
      kind: getSpanKind(item.spanData.type),
      attributes,
      startTime: item.startedAt ? new Date(item.startedAt) : undefined
    }, parentContext);

    this.spanMap.set(item.spanId, span);

    if (item.error) {
      span.recordException(item.error.message);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: item.error.message
      });
    } else {
      span.setStatus({
        code: SpanStatusCode.OK
      });
    }

    // TODO this might be better as a conditional so end doesn't get called early.
    span.end(item.endedAt ? new Date(item.endedAt) : undefined);
  }
}