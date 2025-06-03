import type { GenerationSpanData } from '@openai/agents-core/dist/tracing/spans';

// Import semantic convention constants
import {
  GEN_AI_OPERATION_NAME,
  GEN_AI_SYSTEM,
  GEN_AI_REQUEST_MODEL,
  GEN_AI_REQUEST_MAX_TOKENS,
  GEN_AI_REQUEST_TEMPERATURE,
  GEN_AI_REQUEST_TOP_P,
  GEN_AI_REQUEST_FREQUENCY_PENALTY,
  GEN_AI_REQUEST_PRESENCE_PENALTY,
  GEN_AI_REQUEST_STOP_SEQUENCES,
  GEN_AI_RESPONSE_MODEL,
  GEN_AI_RESPONSE_FINISH_REASONS,
  GEN_AI_USAGE_INPUT_TOKENS,
  GEN_AI_USAGE_OUTPUT_TOKENS,
  GEN_AI_USAGE_TOTAL_TOKENS,
  GEN_AI_PROMPT,
  GEN_AI_COMPLETION
} from '../../semconv/model';

import { applyAttributeMappings } from './attributes';


// Mapping configurations for different attribute groups
const USAGE_ATTRIBUTE_MAPPINGS: Record<string, string> = {
  [GEN_AI_USAGE_INPUT_TOKENS]: 'prompt_tokens',
  [GEN_AI_USAGE_OUTPUT_TOKENS]: 'completion_tokens',
  [GEN_AI_USAGE_TOTAL_TOKENS]: 'total_tokens'
};

const MODEL_CONFIG_ATTRIBUTE_MAPPINGS: Record<string, string> = {
  [GEN_AI_REQUEST_TEMPERATURE]: 'temperature',
  [GEN_AI_REQUEST_MAX_TOKENS]: 'max_tokens',
  [GEN_AI_REQUEST_TOP_P]: 'top_p',
  [GEN_AI_REQUEST_FREQUENCY_PENALTY]: 'frequency_penalty',
  [GEN_AI_REQUEST_PRESENCE_PENALTY]: 'presence_penalty'
  // Note: stop sequences handled separately due to transformation needed
};

const MESSAGE_ATTRIBUTE_MAPPINGS: Record<string, string> = {
  [GEN_AI_PROMPT]: 'content',
  [GEN_AI_COMPLETION]: 'content'
};

const FINISH_REASON_ATTRIBUTE_MAPPINGS: Record<string, string> = {
  [GEN_AI_RESPONSE_FINISH_REASONS]: 'finish_reason'
};


/**
 * Gets usage-related attributes from generation span data.
 */
function getUsageAttributes(usage: Record<string, any>): Record<string, any> {
  return applyAttributeMappings(usage, USAGE_ATTRIBUTE_MAPPINGS);
}

/**
 * Gets model configuration attributes from generation span data.
 */
function getModelConfigAttributes(config: Record<string, any>): Record<string, any> {
  const attributes = applyAttributeMappings(config, MODEL_CONFIG_ATTRIBUTE_MAPPINGS);

  // Handle special case for stop sequences (needs transformation)
  if (config.stop !== undefined) {
    attributes[GEN_AI_REQUEST_STOP_SEQUENCES] = Array.isArray(config.stop)
      ? config.stop
      : [config.stop];
  }

  return attributes;
}

/**
 * Gets input message attributes from generation span data.
 */
function getInputMessageAttributes(input: Array<Record<string, any>>): Record<string, any> {
  const attributes: Record<string, any> = {};

  // Store the number of input messages
  attributes['gen_ai.request.message_count'] = input.length;

  // Extract system message if present
  const systemMessage = input.find(msg => msg.role === 'system');
  if (systemMessage) {
    const systemAttributes = applyAttributeMappings(systemMessage, {
      'gen_ai.system_prompt': 'content'
    });
    Object.assign(attributes, systemAttributes);
  }

  // Extract user messages - store the last user message as the main prompt
  const userMessages = input.filter(msg => msg.role === 'user');
  if (userMessages.length > 0) {
    const lastUserMessage = userMessages[userMessages.length - 1];
    const userAttributes = applyAttributeMappings(lastUserMessage, {
      [GEN_AI_PROMPT]: 'content'
    });
    Object.assign(attributes, userAttributes);
  }

  return attributes;
}

/**
 * Gets output message attributes from generation span data.
 */
function getOutputMessageAttributes(output: Array<Record<string, any>>): Record<string, any> {
  const attributes: Record<string, any> = {};

  attributes['gen_ai.response.message_count'] = output.length;

  // Extract assistant responses
  const assistantMessages = output.filter(msg => msg.role === 'assistant');
  if (assistantMessages.length > 0) {
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];

    // Apply content mapping
    const contentAttributes = applyAttributeMappings(lastAssistantMessage, {
      [GEN_AI_COMPLETION]: 'content'
    });
    Object.assign(attributes, contentAttributes);

    // Handle finish reason with transformation (convert to array)
    if (lastAssistantMessage.finish_reason !== undefined) {
      attributes[GEN_AI_RESPONSE_FINISH_REASONS] = [lastAssistantMessage.finish_reason];
    }
  }

  return attributes;
}

/**
 * Converts OpenAI Agents GenerationSpanData to OpenTelemetry semantic conventions.
 *
 * Maps generation spans (LLM calls) to standard GenAI semantic conventions using
 * our centralized semantic convention constants.
 */
export function convertGenerationSpan(spanData: GenerationSpanData): Record<string, any> {
  const attributes: Record<string, any> = {
    // Core generation span identification
    [GEN_AI_OPERATION_NAME]: 'chat',
    [GEN_AI_SYSTEM]: 'openai', // Default to OpenAI, could be parameterized
  };

  // Map model information
  if (spanData.model) {
    attributes[GEN_AI_REQUEST_MODEL] = spanData.model;
    attributes[GEN_AI_RESPONSE_MODEL] = spanData.model;
  }

  // Get model configuration attributes
  if (spanData.model_config) {
    Object.assign(attributes, getModelConfigAttributes(spanData.model_config));
  }

  // Get usage attributes
  if (spanData.usage) {
    Object.assign(attributes, getUsageAttributes(spanData.usage));
  }

  // Get input message attributes
  if (spanData.input && Array.isArray(spanData.input)) {
    Object.assign(attributes, getInputMessageAttributes(spanData.input));
  }

  // Get output message attributes
  if (spanData.output && Array.isArray(spanData.output)) {
    Object.assign(attributes, getOutputMessageAttributes(spanData.output));
  }

  return attributes;
}