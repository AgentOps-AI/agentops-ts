import type { ResponseSpanData } from '@openai/agents-core/dist/tracing/spans';
import {
  RESPONSE_ID,
  RESPONSE_INPUT
} from '../../semconv/agents';
import {
  extractAttributesFromMapping,
  AttributeMap
} from '../../attributes';

/**
 * OpenAI Agents ResponseSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface ResponseSpanData {
 *   type: 'response';
 *   response_id?: string;
 *   _input?: any;
 * }
 */

const RESPONSE_ATTRIBUTES: AttributeMap = {
  [RESPONSE_ID]: 'response_id',
  [RESPONSE_INPUT]: '_input'
};

/**
 * Converts OpenAI Agents ResponseSpanData to OpenTelemetry semantic conventions.
 *
 * Maps response spans to standard response semantic conventions using
 * our centralized semantic convention constants and attribute mapping system.
 */
export function convertResponseSpan(data: ResponseSpanData): AttributeMap {
  return extractAttributesFromMapping(data, RESPONSE_ATTRIBUTES);
}