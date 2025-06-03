import type { TracingExporter, Trace, Span } from '@openai/agents';
import type { SpanData, GenerationSpanData } from '@openai/agents-core/dist/tracing/spans';
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';

import { convertGenerationSpan } from './generation-converter';
import { InstrumentationBase } from '../base';

// Import semantic conventions
import {
  OPERATION_TYPE,
  OPERATION_NAME,
  OPERATION_ID,
  OPERATION_STATUS,
  OPERATION_PARENT_ID
} from '../../semconv/operations';

import { ERROR_MESSAGE } from '../../semconv/common';

/**
 * OpenAI Agents TracingExporter that converts spans to OpenTelemetry semantic conventions
 */
export class OpenAIAgentsTracingExporter implements TracingExporter {
  private readonly instrumentation: InstrumentationBase;

  constructor(instrumentation: InstrumentationBase) {
    this.instrumentation = instrumentation;
  }
  async export(items: (Trace | Span<any>)[]): Promise<void> {
    for (const item of items) {
      if (item.type === 'trace') {
        this.handleTrace(item as Trace);
      } else if (item.type === 'trace.span') {
        this.handleSpan(item as Span<any>);
      }
    }
  }

  private handleTrace(trace: Trace): void {
    console.log(`[AgentOps] 🔍 Trace: ${trace.name} (${trace.traceId})`);
    
    const attributes: Record<string, any> = {
      [OPERATION_NAME]: trace.name,
      [OPERATION_ID]: trace.traceId,
      [OPERATION_TYPE]: 'trace'
    };

    if (trace.groupId) {
      attributes['trace.group_id'] = trace.groupId;
    }

    if (trace.metadata && Object.keys(trace.metadata).length > 0) {
      attributes['trace.metadata'] = trace.metadata;
    }

    // Create OpenTelemetry span for the trace
    const span = this.instrumentation.createSpan(trace.name, attributes, SpanKind.INTERNAL);

    // End the span immediately since we're processing a completed trace
    span.end();
    console.log(`  Attributes:`, attributes);
  }

  private handleSpan(span: Span<any>): void {
    const spanData = span.spanData;
    
    console.log(`[AgentOps] 📊 Converting span: ${this.getSpanName(spanData)} (${span.spanId})`);

    // Convert span data to semantic conventions based on type
    const attributes = this.convertSpanToSemanticConventions(span);

    // Create OpenTelemetry span
    const spanName = this.getSpanName(spanData);
    const spanKind = this.getSpanKind(spanData.type);
    
    console.log(`[AgentOps] Creating OTel span: ${spanName}`);
    const otelSpan = this.instrumentation.createSpan(spanName, attributes, spanKind);
    console.log(`[AgentOps] OTel span created with ID: ${otelSpan.spanContext().spanId}`);
    // Set the start time if available
    if (span.startedAt) {
      // Note: createSpan doesn't support startTime, so we'll use the current implementation
      // This is a limitation we might need to address in the base class
    }
    // Set error status if present
    if (span.error) {
      otelSpan.recordException(span.error.message);
      otelSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: span.error.message
      });
    } else {
      otelSpan.setStatus({ code: SpanStatusCode.OK });
    }

    // End the span
    otelSpan.end(span.endedAt ? new Date(span.endedAt) : undefined);

    if (span.startedAt && span.endedAt) {
      const duration = new Date(span.endedAt).getTime() - new Date(span.startedAt).getTime();
      console.log(`  Duration: ${duration}ms`);
    }
  }

  private getSpanName(spanData: SpanData): string {
    if ('name' in spanData && spanData.name) {
      return spanData.name;
    }
    return this.getSpanTypeLabel(spanData.type);
  }

  private getSpanTypeLabel(type: string): string {
    const typeLabels: Record<string, string> = {
      'agent': 'Agent',
      'function': 'Function',
      'generation': 'Generation',
      'response': 'Response',
      'handoff': 'Handoff',
      'custom': 'Custom',
      'guardrail': 'Guardrail',
      'transcription': 'Transcription',
      'speech': 'Speech',
      'speech_group': 'Speech Group',
      'mcp_tools': 'MCP List Tools',
    };
    return typeLabels[type] || type;
  }

  private getSpanKind(type: string): SpanKind {
    switch (type) {
      case 'generation':
        return SpanKind.CLIENT; // LLM calls are client calls
      case 'function':
        return SpanKind.INTERNAL; // Tool/function calls are internal
      case 'agent':
        return SpanKind.INTERNAL; // Agent execution is internal
      case 'response':
        return SpanKind.INTERNAL; // Response processing is internal
      case 'handoff':
        return SpanKind.INTERNAL; // Agent handoffs are internal
      case 'guardrail':
        return SpanKind.INTERNAL; // Guardrail checks are internal
      case 'transcription':
      case 'speech':
        return SpanKind.CLIENT; // Audio API calls are client calls
      default:
        return SpanKind.INTERNAL; // Default to internal
    }
  }

  private convertSpanToSemanticConventions(span: Span<any>): Record<string, any> {
    const spanData = span.spanData;
    
    // Base attributes for all spans using semantic conventions
    const baseAttributes: Record<string, any> = {
      [OPERATION_TYPE]: spanData.type,
      [OPERATION_ID]: span.spanId,
      'trace.id': span.traceId,
    };

    if (span.parentId) {
      baseAttributes[OPERATION_PARENT_ID] = span.parentId;
    }


    // Add operation name based on span data
    if ('name' in spanData && spanData.name) {
      baseAttributes[OPERATION_NAME] = spanData.name;
    } else {
      baseAttributes[OPERATION_NAME] = this.getSpanTypeLabel(spanData.type);
    }

    // Add error information if present
    if (span.error) {
      baseAttributes[ERROR_MESSAGE] = span.error.message;
      baseAttributes[OPERATION_STATUS] = 'error';
    } else {
      baseAttributes[OPERATION_STATUS] = 'ok';
    }

    // Type-specific attribute conversion
    let typeSpecificAttributes: Record<string, any> = {};

    switch (spanData.type) {
      case 'generation':
        typeSpecificAttributes = convertGenerationSpan(spanData as GenerationSpanData);
        break;
      
      // TODO: Add other span type converters
      case 'agent':
      case 'function':
      case 'response':
      case 'handoff':
      case 'custom':
      case 'guardrail':
      case 'transcription':
      case 'speech':
      case 'speech_group':
      case 'mcp_tools':
      default:
        // For now, just include the raw span data
        typeSpecificAttributes = { 'span.raw_data': spanData };
        break;
    }

    return { ...baseAttributes, ...typeSpecificAttributes };
  }
}