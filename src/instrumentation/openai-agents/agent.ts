import type { AgentSpanData } from '@openai/agents-core/dist/tracing/spans';
import {
  AGENT_NAME,
  AGENT_OUTPUT_TYPE,
  AGENT_HANDOFF_FROM,
  AGENT_HANDOFF_TO,
  AGENT_TOOL_NAME,
  AGENT_TOOL_DESCRIPTION
} from '../../semconv/agents';
import {
  extractAttributesFromMapping,
  extractAttributesFromArray,
  AttributeMap,
  IndexedAttributeMap
} from '../../attributes';

/**
 * OpenAI Agents AgentSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface AgentSpanData {
 *   type: 'agent';
 *   name?: string;
 *   handoffs?: Array<{
 *     from_agent?: string;
 *     to_agent?: string;
 *   }>;
 *   tools?: Array<{
 *     name: string;
 *     description?: string;
 *   }>;
 *   output_type?: string;
 * }
 */

const AGENT_ATTRIBUTES: AttributeMap = {
  [AGENT_NAME]: 'name',
  [AGENT_OUTPUT_TYPE]: 'output_type'
};

const HANDOFF_ATTRIBUTES: IndexedAttributeMap = {
  [AGENT_HANDOFF_FROM]: 'from_agent',
  [AGENT_HANDOFF_TO]: 'to_agent'
};

const TOOL_ATTRIBUTES: IndexedAttributeMap = {
  [AGENT_TOOL_NAME]: 'name',
  [AGENT_TOOL_DESCRIPTION]: 'description'
};

/**
 * Converts OpenAI Agents AgentSpanData to OpenTelemetry semantic conventions.
 *
 * Maps agent spans to standard agent semantic conventions using
 * our centralized semantic convention constants and attribute mapping system.
 */
export function convertAgentSpan(data: AgentSpanData): AttributeMap {
  const attributes: AttributeMap = {};

  // Basic agent attributes
  Object.assign(attributes, extractAttributesFromMapping(data, AGENT_ATTRIBUTES));

  // Handoffs array
  if (data.handoffs && Array.isArray(data.handoffs)) {
    Object.assign(attributes, extractAttributesFromArray(data.handoffs, HANDOFF_ATTRIBUTES));
  }

  // Tools array
  if (data.tools && Array.isArray(data.tools)) {
    Object.assign(attributes, extractAttributesFromArray(data.tools, TOOL_ATTRIBUTES));
  }

  return attributes;
}