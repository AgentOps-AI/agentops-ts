import type { CustomSpanData } from '@openai/agents-core/dist/tracing/spans';
import {
  CUSTOM_NAME,
  CUSTOM_DATA
} from '../../semconv/agents';
import {
  extractAttributesFromMapping,
  AttributeMap
} from '../../attributes';

/**
 * OpenAI Agents CustomSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface CustomSpanData {
 *   type: 'custom';
 *   name: string;
 *   data: Record<string, any>;
 * }
 */

const CUSTOM_ATTRIBUTES: AttributeMap = {
  [CUSTOM_NAME]: 'name',
  [CUSTOM_DATA]: 'data'
};

/**
 * Converts OpenAI Agents CustomSpanData to OpenTelemetry semantic conventions.
 *
 * Maps custom spans to standard custom semantic conventions using
 * our centralized semantic convention constants and attribute mapping system.
 */
export function convertCustomSpan(data: CustomSpanData): AttributeMap {
  return extractAttributesFromMapping(data, CUSTOM_ATTRIBUTES);
}