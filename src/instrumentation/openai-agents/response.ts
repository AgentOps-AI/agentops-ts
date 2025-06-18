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
  extractAttributesFromMappingWithIndex,
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
  const attrs: AttributeMap = {};
  Object.assign(attrs, extractAttributesFromMapping(data, RESPONSE_ATTRIBUTES));

  if (Array.isArray(data._input)) {
    data._input.forEach((item, i) => {
      if (item.type === 'message') {
        Object.assign(
          attrs,
          extractAttributesFromMappingWithIndex(item, RESPONSE_INPUT_ATTRIBUTES, i)
        );
      } else if (item.type === 'function_call') {
        Object.assign(
          attrs,
          extractAttributesFromMappingWithIndex(
            item,
            RESPONSE_INPUT_FUNCTION_CALL_ATTRIBUTES,
            i
          )
        );
      }
    });
  }

  if (data._response) {
    Object.assign(attrs, extractAttributesFromMapping(data._response, RESPONSE_MODEL_ATTRIBUTES));
    Object.assign(attrs, extractAttributesFromMapping(data._response.usage, RESPONSE_USAGE_ATTRIBUTES));

    const completions: any[] = [];
    if (Array.isArray(data._response.output)) {
      for (const item of data._response.output) {
        if (item.type === 'message') {
          for (const c of item.content || []) {
            if (c.type === 'output_text') {
              completions.push({ role: item.role || 'assistant', content: c.text });
            } else if (c.type === 'refusal') {
              completions.push({ role: item.role || 'assistant', content: c.refusal });
            }
          }
        } else if (
          item.type === 'function_call' ||
          item.type === 'file_search_call' ||
          item.type === 'web_search_call' ||
          item.type === 'computer_call'
        ) {
          Object.assign(attrs, extractAttributesFromMapping(item, RESPONSE_TOOL_CALL_ATTRIBUTES));
        } else if (item.type === 'reasoning') {
          const reasoningText = (item.summary || [])
            .filter((r: any) => r.type === 'summary_text')
            .map((r: any) => r.text)
            .join('');
          if (reasoningText) {
            completions.push({ role: 'assistant', content: reasoningText });
          }
        }
      }
    }

    if (completions.length > 0) {
      Object.assign(attrs, extractAttributesFromArray(completions, RESPONSE_OUTPUT_ATTRIBUTES));
    }
  }

  return attrs;
}

