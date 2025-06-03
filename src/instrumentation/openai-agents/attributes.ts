import { Span, SpanKind } from '@opentelemetry/api';
import type { Span as OpenAISpan } from '@openai/agents';
import type { SpanData, GenerationSpanData } from '@openai/agents-core/dist/tracing/spans';
import { convertGenerationSpan } from './generation-converter';


const SPAN_TYPE_LABELS: Record<string, string> = {
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


/**
 * Applies attribute mappings to source data and returns semantic convention attributes.
 *
 * @param sourceData - The source object to extract data from
 * @param mappings - Object mapping semantic convention attribute names to source field names
 * @returns Object with semantic convention attributes
 */
export function applyAttributeMappings(
  sourceData: Record<string, any>,
  mappings: Record<string, string>
): Record<string, any> {
  const attributes: Record<string, any> = {};

  for (const [attributeName, sourceField] of Object.entries(mappings)) {
    const value = sourceData[sourceField];

    if (value !== undefined) {
      attributes[attributeName] = value;
    }
  }

  return attributes;
}

/**
 * Gets the display name for a span from its data.
 * Uses the span's name if available, otherwise falls back to a human-readable type label.
 * @param spanData - The span data to extract the name from
 * @returns The span name or a label based on its type
 */
export function getSpanName(spanData: SpanData): string {
  if ('name' in spanData && spanData.name) {
    return spanData.name;
  }
  return SPAN_TYPE_LABELS[spanData.type] || spanData.type;
}

/**
 * Gets the appropriate OpenTelemetry span kind for an OpenAI Agents span type.
 * This determines whether the span is a client call or an internal operation.
 * @param type - The type of the OpenAI Agents span
 * @return The corresponding OpenTelemetry SpanKind
 * @see https://opentelemetry.io/docs/specs/semconv/trace/span-attributes/#span-kind
 */
export function getSpanKind(type: string): SpanKind {
  switch (type) {
    case 'generation':
    case 'transcription':
    case 'speech':
      return SpanKind.CLIENT;
    case 'function':
    case 'agent':
    case 'response':
    case 'handoff':
    case 'guardrail':
    default:
      return SpanKind.INTERNAL;
  }
}

/**
 * Gets OpenTelemetry span attributes for an OpenAI Agents span.
 *
 * @param item - The OpenAI Agents span to convert
 * @param traceMap - Map of OpenAI trace IDs to OpenTelemetry spans
 * @param spanMap - Map of OpenAI span IDs to OpenTelemetry spans
 * @returns Object with semantic convention attributes
 */
export function getSpanAttributes(item: OpenAISpan<any>): Record<string, any> {
  const spanData = item.spanData;

  // Base attributes for all spans
  const baseAttributes: Record<string, any> = {
    'openai_agents.span_id': item.spanId,
    'openai_agents.trace_id': item.traceId,
  };

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
      typeSpecificAttributes = {'span.raw_data': spanData };
      break;
  }

  return { ...baseAttributes, ...typeSpecificAttributes };
}