import type { GuardrailSpanData } from '@openai/agents-core/dist/tracing/spans';
import {
  GUARDRAIL_NAME,
  GUARDRAIL_TRIGGERED
} from '../../semconv/agents';
import {
  extractAttributesFromMapping,
  AttributeMap
} from '../../attributes';

/**
 * OpenAI Agents GuardrailSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface GuardrailSpanData {
 *   type: 'guardrail';
 *   name: string;
 *   triggered: boolean;
 * }
 */

const GUARDRAIL_ATTRIBUTES: AttributeMap = {
  [GUARDRAIL_NAME]: 'name',
  [GUARDRAIL_TRIGGERED]: 'triggered'
};

/**
 * Converts OpenAI Agents GuardrailSpanData to OpenTelemetry semantic conventions.
 *
 * Maps guardrail spans to standard guardrail semantic conventions using
 * our centralized semantic convention constants and attribute mapping system.
 */
export function convertGuardrailSpan(data: GuardrailSpanData): AttributeMap {
  return extractAttributesFromMapping(data, GUARDRAIL_ATTRIBUTES);
}