import type { HandoffSpanData } from '@openai/agents-core/dist/tracing/spans';
import {
  AGENT_HANDOFF_FROM,
  AGENT_HANDOFF_TO
} from '../../semconv/agents';
import {
  extractAttributesFromMapping,
  AttributeMap
} from '../../attributes';

/**
 * OpenAI Agents HandoffSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface HandoffSpanData {
 *   type: 'handoff';
 *   from_agent?: string;
 *   to_agent?: string;
 * }
 */

const HANDOFF_ATTRIBUTES: AttributeMap = {
  [AGENT_HANDOFF_FROM]: 'from_agent',
  [AGENT_HANDOFF_TO]: 'to_agent'
};

/**
 * Converts OpenAI Agents HandoffSpanData to OpenTelemetry semantic conventions.
 *
 * Maps handoff spans (agent-to-agent transitions) to standard agent semantic conventions using
 * our centralized semantic convention constants and attribute mapping system.
 */
export function convertHandoffSpan(data: HandoffSpanData): AttributeMap {
  return extractAttributesFromMapping(data, HANDOFF_ATTRIBUTES);
}