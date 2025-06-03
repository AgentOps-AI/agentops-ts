import type { FunctionSpanData } from '@openai/agents-core/dist/tracing/spans';
import {
  FUNCTION_NAME,
  FUNCTION_INPUT,
  FUNCTION_OUTPUT,
  FUNCTION_MCP_DATA
} from '../../semconv/agents';
import {
  extractAttributesFromMapping,
  AttributeMap
} from '../../attributes';

/**
 * OpenAI Agents FunctionSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface FunctionSpanData {
 *   type: 'function';
 *   name: string;
 *   input: any;
 *   output: any;
 *   mcp_data?: any;
 * }
 */

const FUNCTION_ATTRIBUTES: AttributeMap = {
  [FUNCTION_NAME]: 'name',
  [FUNCTION_INPUT]: 'input',
  [FUNCTION_OUTPUT]: 'output',
  [FUNCTION_MCP_DATA]: 'mcp_data'
};

/**
 * Converts OpenAI Agents FunctionSpanData to OpenTelemetry semantic conventions.
 *
 * Maps function spans (tool calls) to standard function semantic conventions using
 * our centralized semantic convention constants and attribute mapping system.
 */
export function convertFunctionSpan(data: FunctionSpanData): AttributeMap {
  return extractAttributesFromMapping(data, FUNCTION_ATTRIBUTES);
}