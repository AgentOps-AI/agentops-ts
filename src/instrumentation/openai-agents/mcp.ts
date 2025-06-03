import type { MCPListToolsSpanData } from '@openai/agents-core/dist/tracing/spans';
import {
  MCP_SERVER,
  MCP_TOOLS_RESULT
} from '../../semconv/agents';
import {
  extractAttributesFromMapping,
  AttributeMap
} from '../../attributes';

/**
 * OpenAI Agents MCPListToolsSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface MCPListToolsSpanData {
 *   type: 'mcp_tools';
 *   server?: string;
 *   result?: string[];
 * }
 */

const MCP_ATTRIBUTES: AttributeMap = {
  [MCP_SERVER]: 'server',
  [MCP_TOOLS_RESULT]: 'result'
};

/**
 * Converts OpenAI Agents MCPListToolsSpanData to OpenTelemetry semantic conventions.
 *
 * Maps MCP (Model Context Protocol) tool listing spans to standard MCP semantic conventions using
 * our centralized semantic convention constants and attribute mapping system.
 */
export function convertMCPListToolsSpan(data: MCPListToolsSpanData): AttributeMap {
  return extractAttributesFromMapping(data, MCP_ATTRIBUTES);
}