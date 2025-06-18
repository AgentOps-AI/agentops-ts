import type { ResponseSpanData } from '@openai/agents-core/dist/tracing/spans';
import {
  RESPONSE_ID,
  RESPONSE_INPUT
} from '../../semconv/agents';
import {
  GEN_AI_REQUEST_MODEL,
  GEN_AI_RESPONSE_MODEL,
  GEN_AI_USAGE_INPUT_TOKENS,
  GEN_AI_USAGE_OUTPUT_TOKENS,
  GEN_AI_USAGE_TOTAL_TOKENS
} from '../../semconv/model';
import {
  GEN_AI_PROMPT_ROLE,
  GEN_AI_PROMPT_CONTENT,
  GEN_AI_COMPLETION_ROLE,
  GEN_AI_COMPLETION_CONTENT,
  GEN_AI_COMPLETION_FINISH_REASON,
  GEN_AI_MESSAGE_FUNCTION_CALL_NAME,
  GEN_AI_MESSAGE_FUNCTION_CALL_ARGUMENTS,
  GEN_AI_TOOL_CALL_ID,
  GEN_AI_TOOL_CALL_TYPE,
  GEN_AI_TOOL_CALL_NAME,
  GEN_AI_TOOL_CALL_ARGUMENTS
} from '../../semconv/messages';
import {
  extractAttributesFromMapping,
  extractAttributesFromArray,
  AttributeMap,
  IndexedAttributeMap
} from '../../attributes';
import { debug } from './index';

/**
 * OpenAI Agents ResponseSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface ResponseSpanData {
 *   type: 'response';
 *   response_id?: string;
 *   _input?: any;
 *   _response?: {
 *     id: string;
 *     model: string;
 *     usage?: {
 *       input_tokens: number;
 *       output_tokens: number;
 *       total_tokens: number;
 *     };
 *     output?: Array<{
 *       type: string;
 *       role?: string;
 *       content?: string;
 *     }>;
 *     output_text?: string;
 *   };
 * }
 */

const RESPONSE_ATTRIBUTES: AttributeMap = {
  [RESPONSE_ID]: 'response_id',
  [RESPONSE_INPUT]: '_input'
};

const RESPONSE_MODEL_ATTRIBUTES: AttributeMap = {
  [GEN_AI_RESPONSE_MODEL]: 'model',
};

const RESPONSE_USAGE_ATTRIBUTES: AttributeMap = {
  [GEN_AI_USAGE_INPUT_TOKENS]: 'input_tokens',
  [GEN_AI_USAGE_OUTPUT_TOKENS]: 'output_tokens',
  [GEN_AI_USAGE_TOTAL_TOKENS]: 'total_tokens'
};

const RESPONSE_OUTPUT_ATTRIBUTES: IndexedAttributeMap = {
  [GEN_AI_COMPLETION_ROLE]: 'role',
  [GEN_AI_COMPLETION_CONTENT]: 'content'
};

const RESPONSE_INPUT_ATTRIBUTES: IndexedAttributeMap = {
  [GEN_AI_PROMPT_ROLE]: 'role',
  [GEN_AI_PROMPT_CONTENT]: 'content'
};

const RESPONSE_TOOL_CALL_ATTRIBUTES: IndexedAttributeMap = {
  [GEN_AI_TOOL_CALL_ID]: 'id',
  [GEN_AI_TOOL_CALL_TYPE]: 'type',
  [GEN_AI_TOOL_CALL_NAME]: 'name',
  [GEN_AI_TOOL_CALL_ARGUMENTS]: 'arguments'
};

const RESPONSE_INPUT_FUNCTION_CALL_ATTRIBUTES: IndexedAttributeMap = {
  [GEN_AI_MESSAGE_FUNCTION_CALL_NAME]: 'name',
  [GEN_AI_MESSAGE_FUNCTION_CALL_ARGUMENTS]: 'arguments'
};

/**
 * Converts OpenAI Agents ResponseSpanData to OpenTelemetry semantic conventions.
 *
 * Maps response spans to standard response semantic conventions using
 * our centralized semantic convention constants and attribute mapping system.
 */
export function convertResponseSpan(data: ResponseSpanData): AttributeMap {
  const attributes: AttributeMap = {};
  Object.assign(attributes, extractAttributesFromMapping(data, RESPONSE_ATTRIBUTES));

  if (data._input && Array.isArray(data._input)) {
    for (const item of data._input) {
      switch (item.type) {
        case 'message': // Input message
          Object.assign(attributes,
            extractAttributesFromMapping(item, RESPONSE_INPUT_ATTRIBUTES));
          break;
        case 'function_call': // Input function call
          Object.assign(attributes,
            extractAttributesFromMapping(item, RESPONSE_INPUT_FUNCTION_CALL_ATTRIBUTES));
          debug('Extracted input function call:', item.name);
          break;
        case 'function_call_result': // Function call result
          debug('Skipping function call result');
          break;
        default:
          debug('Unknown input item type:', item.type);
          break;
      }
    }
  }

  // _response was added with https://github.com/openai/openai-agents-js/pull/85
  if (data._response) {
    Object.assign(attributes,
      extractAttributesFromMapping(data._response, RESPONSE_MODEL_ATTRIBUTES));
    Object.assign(attributes,
      extractAttributesFromMapping(data._response.usage, RESPONSE_USAGE_ATTRIBUTES));

    const completions = [];
    if (Array.isArray(data._response.output)) {
      for (const item of data._response.output) {
        switch (item.type) {
        case 'message': { // ResponseOutputMessage
          for (const contentItem of item.content || []) {
            switch (contentItem.type) {
              case 'output_text': // ResponseOutputText
                completions.push({
                  role: item.role || 'assistant',
                  content: contentItem.text
                });
                break;
              case 'refusal': // ResponseOutputRefusal
                completions.push({
                  role: item.role || 'assistant',
                  content: contentItem.refusal
                });
                break;
              default:
                debug('Unknown message content type:', contentItem.type);
                break;
            }
          }
          break;
        }
        case 'reasoning': { // ResponseReasoningItem
          const reasoningText = item.summary
            ?.filter((item: any) => item.type === 'summary_text')
            ?.map((item: any) => item.text)
            ?.join('') || '';

          if (reasoningText) {
            completions.push({
              role: 'assistant',
              content: reasoningText
            });
          }
          break;
        }
        case 'function_call': // ResponseFunctionToolCall
        case 'file_search_call': // ResponseFileSearchToolCall
        case 'web_search_call': // ResponseFunctionWebSearch
        case 'computer_call': { // ResponseComputerToolCall
          Object.assign(attributes,
            extractAttributesFromMapping(item, RESPONSE_TOOL_CALL_ATTRIBUTES));
          break;
        }
        case 'image_generation_call': // ResponseOutputItem.ImageGenerationCall
        case 'code_interpreter_call': // ResponseCodeInterpreterToolCall
        case 'local_shell_call': // ResponseOutputItem.LocalShellCall
        case 'mcp_call': // ResponseOutputItem.McpCall
        case 'mcp_list_tools': // ResponseOutputItem.McpListTools
        case 'mcp_approval_request': { // ResponseOutputItem.McpApprovalRequest
          debug('Unhandled output item type:', item.type);
          break;
        }
        default: {
          debug('Unknown output item type:', item.type);
          break;
        }
      }
    }

    if (completions.length > 0) {
      Object.assign(attributes,
        extractAttributesFromArray(completions, RESPONSE_OUTPUT_ATTRIBUTES));
    }
  }

  return attributes;
}

