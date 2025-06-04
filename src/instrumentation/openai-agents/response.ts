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
  GEN_AI_MESSAGE_FUNCTION_CALL_ARGUMENTS
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

/**
 * AgentOps enhanced ResponseSpanData interface.
 *
 * Extends the original ResponseSpanData with additional generation data
 * captured from the OpenAI Responses API to provide complete observability.
 */
export interface AgentOpsResponseSpanData extends ResponseSpanData {
  type: 'response';
  // Original response span data
  response_id?: string;
  _input?: any;
  // Enhanced generation data captured by AgentOps instrumentation
  agentops_model?: string;
  agentops_input_messages?: Array<{
    role: string;
    content: string;
  }>;
  agentops_output_messages?: Array<{
    role: string;
    content: string;
    finish_reason?: string;
  }>;
  agentops_function_calls?: Array<{
    name: string;
    arguments: string;
  }>;
  agentops_usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

const AGENTOPS_MODEL_ATTRIBUTES: AttributeMap = {
  [GEN_AI_REQUEST_MODEL]: 'agentops_model',
  [GEN_AI_RESPONSE_MODEL]: 'agentops_model',
};

const AGENTOPS_USAGE_ATTRIBUTES: AttributeMap = {
  [GEN_AI_USAGE_INPUT_TOKENS]: 'prompt_tokens',
  [GEN_AI_USAGE_OUTPUT_TOKENS]: 'completion_tokens',
  [GEN_AI_USAGE_TOTAL_TOKENS]: 'total_tokens'
};

const AGENTOPS_INPUT_ATTRIBUTES: IndexedAttributeMap = {
  [GEN_AI_PROMPT_ROLE]: 'role',
  [GEN_AI_PROMPT_CONTENT]: 'content'
};

const AGENTOPS_OUTPUT_ATTRIBUTES: IndexedAttributeMap = {
  [GEN_AI_COMPLETION_ROLE]: 'role',
  [GEN_AI_COMPLETION_CONTENT]: 'content',
  [GEN_AI_COMPLETION_FINISH_REASON]: 'finish_reason'
};

const AGENTOPS_FUNCTION_CALL_ATTRIBUTES: IndexedAttributeMap = {
  [GEN_AI_MESSAGE_FUNCTION_CALL_NAME]: 'name',
  [GEN_AI_MESSAGE_FUNCTION_CALL_ARGUMENTS]: 'arguments'
};

/**
 * Converts AgentOps enhanced ResponseSpanData to OpenTelemetry semantic conventions.
 *
 * Maps both the original response span data and the enhanced generation data
 * to standard GenAI semantic conventions, providing complete observability
 * for LLM interactions captured from the OpenAI Responses API.
 */
export function convertEnhancedResponseSpan(data: AgentOpsResponseSpanData): AttributeMap {
  const attributes: AttributeMap = {};

  // Include original response attributes
  Object.assign(attributes, extractAttributesFromMapping(data, RESPONSE_ATTRIBUTES));

  // Include enhanced generation attributes
  Object.assign(attributes, extractAttributesFromMapping(data, AGENTOPS_MODEL_ATTRIBUTES));

  if (data.agentops_input_messages && Array.isArray(data.agentops_input_messages)) {
    Object.assign(attributes, extractAttributesFromArray(data.agentops_input_messages, AGENTOPS_INPUT_ATTRIBUTES));
  }

  if (data.agentops_output_messages && Array.isArray(data.agentops_output_messages)) {
    Object.assign(attributes, extractAttributesFromArray(data.agentops_output_messages, AGENTOPS_OUTPUT_ATTRIBUTES));
  }

  if (data.agentops_function_calls && Array.isArray(data.agentops_function_calls)) {
    Object.assign(attributes, extractAttributesFromArray(data.agentops_function_calls, AGENTOPS_FUNCTION_CALL_ATTRIBUTES));
  }

  if (data.agentops_usage) {
    Object.assign(attributes, extractAttributesFromMapping(data.agentops_usage, AGENTOPS_USAGE_ATTRIBUTES));
  }

  return attributes;
}

/**
   * Patches the OpenAI Responses model to capture enhanced generation data.
   *
   * This method intercepts OpenAI model creation and enhances response spans
   * with complete generation data (model, input messages, output content, usage)
   * using the AgentOps response span format for better observability.
   */
export function patchOpenAIResponsesModel(exporter: any, moduleExports: any): void {
  if (!moduleExports.OpenAIProvider) {
    debug('OpenAIProvider not found, skipping response model patching');
    return;
  }

  const OriginalProvider = moduleExports.OpenAIProvider;
  const originalGetModel = OriginalProvider.prototype.getModel;

  // Patch the getModel method to intercept model instances
  OriginalProvider.prototype.getModel = async function(...args: any[]) {
    const model = await originalGetModel.call(this, ...args);
    if (model.constructor.name === 'OpenAIResponsesModel') {
      for (const methodName of ['getResponse', 'getStreamedResponse']) {
        if (typeof model[methodName] === 'function') {
          const originalMethod = model[methodName].bind(model);

          model[methodName] = async function(...args: any[]) {
            const request = args[0];
            const result = await originalMethod(...args);

            try {
              const data = createEnhancedResponseSpanData(request, result);
              exporter.storeEnhancedResponseData(result.responseId, data);
              debug(`stored enhanced response data for ${result.responseId}`);
            } catch (error) {
              debug('failed to store enhanced response data:', error);
            }

            return result;
          };
        }
      }
    }

    return model;
  };
}

/**
 * Creates enhanced response span data with generation information.
 *
 * Transforms the raw OpenAI Responses API request/response into an
 * AgentOpsResponseSpanData structure that includes both original response
 * data and enhanced generation data for complete observability.
 */
export function createEnhancedResponseSpanData(request: any, result: any): AgentOpsResponseSpanData {
  const inputMessages = [];

  if (request.input && Array.isArray(request.input)) {
    const messageItems = request.input
      .filter((item: any) => item.type === 'message')
      .map((item: any) => ({
        role: item.role,
        content: item.content
      }));
    inputMessages.push(...messageItems);
  }

  // Add system instructions as a system message if present
  if (request.systemInstructions) {
    inputMessages.unshift({
      role: 'system',
      content: request.systemInstructions
    });
  }

  // Extract the actual response output content and function calls separately
  const outputMessages = [];
  const functionCalls = [];

  if (result.output && Array.isArray(result.output)) {
    for (const item of result.output) {
      if (item.type === 'message' && item.role === 'assistant') {
        outputMessages.push({
          role: 'assistant',
          content: Array.isArray(item.content) ?
            item.content.map((c: any) => c.text || c.content || c).join('') :
            item.content || '',
          finish_reason: 'stop'
        });
      } else if (item.type === 'function_call') {
        // Extract function call data
        functionCalls.push({
          name: item.name,
          arguments: item.arguments || '{}'
        });
      }
    }
  }

  const enhancedData: AgentOpsResponseSpanData = {
    type: 'response',
    response_id: result.responseId,
    _input: request.input,
    agentops_model: request.model || result.model || null,
    agentops_input_messages: inputMessages,
    agentops_output_messages: outputMessages,
    agentops_function_calls: functionCalls,
    agentops_usage: result.usage ? {
      prompt_tokens: result.usage.inputTokens,
      completion_tokens: result.usage.outputTokens,
      total_tokens: result.usage.totalTokens
    } : undefined
  };

  return enhancedData;
}