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

export function convertResponseSpan(data: ResponseSpanData): AttributeMap {
  const attributes: AttributeMap = {};
  Object.assign(attributes, extractAttributesFromMapping(data, RESPONSE_ATTRIBUTES));

  if (data._input && Array.isArray(data._input)) {
    for (const item of data._input) {
      switch (item.type) {
        case 'message':
          Object.assign(attributes,
            extractAttributesFromMapping(item, RESPONSE_INPUT_ATTRIBUTES));
          break;
        case 'function_call':
          Object.assign(attributes,
            extractAttributesFromMapping(item, RESPONSE_INPUT_FUNCTION_CALL_ATTRIBUTES));
          debug('Extracted input function call:', item.name);
          break;
        case 'function_call_result':
          debug('Skipping function call result');
          break;
        default:
          debug('Unknown input item type:', item.type);
          break;
      }
    }
  }

  if ((data as any)._response) {
    Object.assign(attributes,
      extractAttributesFromMapping((data as any)._response, RESPONSE_MODEL_ATTRIBUTES));
    Object.assign(attributes,
      extractAttributesFromMapping((data as any)._response.usage, RESPONSE_USAGE_ATTRIBUTES));

    const completions = [];
    if (Array.isArray((data as any)._response.output)) {
      for (const item of (data as any)._response.output) {
        switch (item.type) {
        case 'message': {
          for (const contentItem of item.content || []) {
            switch (contentItem.type) {
              case 'output_text':
                completions.push({
                  role: item.role || 'assistant',
                  content: contentItem.text
                });
                break;
              case 'refusal':
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
        case 'reasoning': {
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
        case 'function_call':
        case 'file_search_call':
        case 'web_search_call':
        case 'computer_call': {
          Object.assign(attributes,
            extractAttributesFromMapping(item, RESPONSE_TOOL_CALL_ATTRIBUTES));
          break;
        }
        case 'image_generation_call':
        case 'code_interpreter_call':
        case 'local_shell_call':
        case 'mcp_call':
        case 'mcp_list_tools':
        case 'mcp_approval_request': {
          debug('Unhandled output item type:', item.type);
          break;
        }
        default: {
          debug('Unknown output item type:', item.type);
          break;
        }
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

export function createEnhancedResponseSpanData(
  baseData: { model: string; input: Array<{ type: string; role?: string; content?: string }> },
  metadata: { responseId: string; usage: { inputTokens: number; outputTokens: number; totalTokens: number } }
): any {
  return {
    type: 'response',
    response_id: metadata.responseId,
    _input: baseData.input,
    _response: {
      id: metadata.responseId,
      model: baseData.model,
      usage: {
        input_tokens: metadata.usage.inputTokens,
        output_tokens: metadata.usage.outputTokens,
        total_tokens: metadata.usage.totalTokens
      }
    }
  };
}

export function convertEnhancedResponseSpan(data: any): AttributeMap {
  const attributes: AttributeMap = {};
  
  Object.assign(attributes, extractAttributesFromMapping(data, RESPONSE_ATTRIBUTES));
  
  if (data._input && Array.isArray(data._input)) {
    Object.assign(attributes, extractAttributesFromArray(data._input, RESPONSE_INPUT_ATTRIBUTES));
  }
  
  if (data._response) {
    Object.assign(attributes, extractAttributesFromMapping(data._response, RESPONSE_MODEL_ATTRIBUTES));
    Object.assign(attributes, extractAttributesFromMapping(data._response.usage, RESPONSE_USAGE_ATTRIBUTES));
  }
  
  return attributes;
}

