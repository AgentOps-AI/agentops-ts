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


// Store API request parameters globally
const apiRequestMap = new Map<string, any>();

/**
 * Store API parameters for a given response ID
 */
function storeApiParams(responseId: string, params: any): void {
  apiRequestMap.set(responseId, params);

}

/**
 * Get API parameters for a given response ID
 */
function getApiParamsForResponse(responseId: string): any {
  return apiRequestMap.get(responseId);
}

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
  agentops_temperature?: number;
  agentops_top_p?: number;
  agentops_max_output_tokens?: number;
  agentops_instructions?: string;
  agentops_tool_choice?: string;
  agentops_parallel_tool_calls?: boolean;
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

  if (data.agentops_temperature !== undefined) {
    attributes['agentops_temperature'] = String(data.agentops_temperature);
  }

  if (data.agentops_top_p !== undefined) {
    attributes['agentops_top_p'] = String(data.agentops_top_p);
  }

  if (data.agentops_max_output_tokens !== undefined) {
    attributes['agentops_max_output_tokens'] = String(data.agentops_max_output_tokens);
  }

  if (data.agentops_instructions) {
    attributes['agentops_instructions'] = data.agentops_instructions;
  }

  if (data.agentops_tool_choice) {
    attributes['agentops_tool_choice'] = data.agentops_tool_choice;
  }

  if (data.agentops_parallel_tool_calls !== undefined) {
    attributes['agentops_parallel_tool_calls'] = String(data.agentops_parallel_tool_calls);
  }

  return attributes;
}

/**
 * Patches the OpenAI provider to capture model names.
 * This is the main patching function that intercepts getModel calls.
   */
export function patchOpenAIProvider(exporter: any, moduleExports: any): void {

  
  if (!moduleExports.OpenAIProvider) {

    return;
  }

  const OriginalProvider = moduleExports.OpenAIProvider;

  
  // Patch the getModel method
  const originalGetModel = OriginalProvider.prototype.getModel;
  if (typeof originalGetModel === 'function') {


  OriginalProvider.prototype.getModel = async function(...args: any[]) {


      
    const model = await originalGetModel.call(this, ...args);
      
      // Store the model name on the instance
      if (args[0] && typeof args[0] === 'string') {
 
        (model as any)._agentopsModelName = args[0];
      }
      
      return model;
    };
  }

}

/**
 * Patches the OpenAIResponsesModel class directly to capture model names.
 * This patches the class prototype to handle instances created before instrumentation.
 */
export function patchOpenAIResponsesModelClass(exporter: any, moduleExports: any): void {

  
  if (!moduleExports.OpenAIResponsesModel) {

    return;
  }

  const ResponsesModel = moduleExports.OpenAIResponsesModel;

  
  // Patch the prototype methods
      for (const methodName of ['getResponse', 'getStreamedResponse']) {
    const originalMethod = ResponsesModel.prototype[methodName];
    if (typeof originalMethod === 'function') {


      ResponsesModel.prototype[methodName] = async function(...args: any[]) {
            const request = args[0];

        
        // Get model from stored value (set by getModel patching)
        const modelFromStored = (this as any)._agentopsModelName;

        
        const result = await originalMethod.call(this, ...args);


            try {
          // Get API parameters from our storage
          const apiParams = result.responseId ? getApiParamsForResponse(result.responseId) : null;

          
          // Try to get model name from various sources
          const modelName = apiParams?.model || modelFromStored || request?.model || result?.model || 'unknown';

          
          const data = createEnhancedResponseSpanData(request, result, modelName);
          
          // Include API parameters in the enhanced data
          if (apiParams) {
            data.agentops_temperature = apiParams.temperature;
            data.agentops_top_p = apiParams.top_p;
            data.agentops_max_output_tokens = apiParams.max_output_tokens;
            data.agentops_instructions = apiParams.instructions;
            data.agentops_tool_choice = apiParams.tool_choice;
            data.agentops_parallel_tool_calls = apiParams.parallel_tool_calls;
          }
          
              exporter.storeEnhancedResponseData(result.responseId, data);

            } catch (error) {
          console.warn('Failed to store enhanced response data:', error);
            }

            return result;
          };
      }
    }


}

/**
 * Creates enhanced response span data with generation information.
 *
 * Transforms the raw OpenAI Responses API request/response into an
 * AgentOpsResponseSpanData structure that includes both original response
 * data and enhanced generation data for complete observability.
 */
export function createEnhancedResponseSpanData(request: any, result: any, modelNameFromPatch?: string): AgentOpsResponseSpanData {

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

  // Determine the model name with priority: request.model > result.model > modelNameFromPatch
  const finalModelName = request.model || result.model || modelNameFromPatch || 'unknown';


  const enhancedData: AgentOpsResponseSpanData = {
    type: 'response',
    response_id: result.responseId,
    _input: request.input,
    agentops_model: finalModelName,
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