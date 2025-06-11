import { Span, SpanKind } from '@opentelemetry/api';
import type { Span as OpenAISpan } from '@openai/agents';
import type {
  SpanData,
  GenerationSpanData,
  AgentSpanData,
  FunctionSpanData,
  ResponseSpanData,
  HandoffSpanData,
  CustomSpanData,
  GuardrailSpanData,
  TranscriptionSpanData,
  SpeechSpanData,
  SpeechGroupSpanData,
  MCPListToolsSpanData
} from '@openai/agents-core/dist/tracing/spans';
import { AttributeMap } from '../../attributes';
import { convertGenerationSpan } from './generation';
import { convertAgentSpan } from './agent';
import { convertFunctionSpan } from './function';
import { convertResponseSpan } from './response';
import { convertHandoffSpan } from './handoff';
import { convertCustomSpan } from './custom';
import { convertGuardrailSpan } from './guardrail';
import { convertTranscriptionSpan, convertSpeechSpan, convertSpeechGroupSpan } from './audio';
import { convertMCPListToolsSpan } from './mcp';


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
  'mcp_tools': 'MCP Tool',
};


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

  let attributes: Record<string, any> = {};
  switch (spanData.type) {
    case 'generation':
      attributes = convertGenerationSpan(spanData as GenerationSpanData);
      break;
    case 'agent':
      attributes = convertAgentSpan(spanData as AgentSpanData);
      break;
    case 'function':
      attributes = convertFunctionSpan(spanData as FunctionSpanData);
      break;
    case 'response':
      attributes = convertResponseSpan(spanData as ResponseSpanData);
      break;
    case 'handoff':
      attributes = convertHandoffSpan(spanData as HandoffSpanData);
      break;
    case 'custom':
      attributes = convertCustomSpan(spanData as CustomSpanData);
      break;
    case 'guardrail':
      attributes = convertGuardrailSpan(spanData as GuardrailSpanData);
      break;
    case 'transcription':
      attributes = convertTranscriptionSpan(spanData as TranscriptionSpanData);
      break;
    case 'speech':
      attributes = convertSpeechSpan(spanData as SpeechSpanData);
      break;
    case 'speech_group':
      attributes = convertSpeechGroupSpan(spanData as SpeechGroupSpanData);
      break;
    case 'mcp_tools':
      attributes = convertMCPListToolsSpan(spanData as MCPListToolsSpanData);
      break;
    default:
      // For unknown span types, include the raw span data
      attributes = {'span.raw_data': spanData };
      break;
  }

  return { ...baseAttributes, ...attributes };
}
