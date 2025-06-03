import type { GenerationSpanData } from '@openai/agents-core/dist/tracing/spans';
import {
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
  GEN_AI_USAGE_TOTAL_TOKENS
} from '../../semconv/model';
import {
  GEN_AI_PROMPT_ROLE,
  GEN_AI_PROMPT_CONTENT,
  GEN_AI_COMPLETION_ROLE,
  GEN_AI_COMPLETION_CONTENT,
  GEN_AI_COMPLETION_FINISH_REASON
} from '../../semconv/messages';
import {
  extractAttributesFromMapping,
  extractAttributesFromArray,
  AttributeMap,
  IndexedAttributeMap
} from '../../attributes';

/**
 * OpenAI Agents GenerationSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface GenerationSpanData {
 *   type: 'generation';
 *   model?: string;
 *   model_config?: {
 *     temperature?: number;
 *     max_tokens?: number;
 *     top_p?: number;
 *     frequency_penalty?: number;
 *     presence_penalty?: number;
 *     stop?: string | string[];
 *   };
 *   input?: Array<{
 *     role: 'system' | 'user' | 'assistant';
 *     content: string;
 *   }>;
 *   output?: Array<{
 *     role: 'assistant';
 *     content: string;
 *     finish_reason?: string;
 *   }>;
 *   usage?: {
 *     prompt_tokens?: number;
 *     completion_tokens?: number;
 *     total_tokens?: number;
 *   };
 * }
 */


const MODEL_ATTRIBUTES: AttributeMap = {
  [GEN_AI_REQUEST_MODEL]: 'model',
  [GEN_AI_RESPONSE_MODEL]: 'model',
};

const MODEL_CONFIG_ATTRIBUTES: AttributeMap = {
  [GEN_AI_REQUEST_TEMPERATURE]: 'temperature',
  [GEN_AI_REQUEST_MAX_TOKENS]: 'max_tokens',
  [GEN_AI_REQUEST_TOP_P]: 'top_p',
  [GEN_AI_REQUEST_FREQUENCY_PENALTY]: 'frequency_penalty',
  [GEN_AI_REQUEST_PRESENCE_PENALTY]: 'presence_penalty'
  // Note: stop sequences handled separately due to transformation needed
};

const USAGE_ATTRIBUTES: AttributeMap = {
  [GEN_AI_USAGE_INPUT_TOKENS]: 'prompt_tokens',
  [GEN_AI_USAGE_OUTPUT_TOKENS]: 'completion_tokens',
  [GEN_AI_USAGE_TOTAL_TOKENS]: 'total_tokens'
};

const INPUT_ATTRIBUTES: IndexedAttributeMap = {
  [GEN_AI_PROMPT_ROLE]: 'role',
  [GEN_AI_PROMPT_CONTENT]: 'content'
};

const OUTPUT_ATTRIBUTES: IndexedAttributeMap = {
  [GEN_AI_COMPLETION_ROLE]: 'role',
  [GEN_AI_COMPLETION_CONTENT]: 'content',
  [GEN_AI_COMPLETION_FINISH_REASON]: 'finish_reason'
};

/**
 * Converts OpenAI Agents GenerationSpanData to OpenTelemetry semantic conventions.
 *
 * Maps generation spans (LLM calls) to standard GenAI semantic conventions using
 * our centralized semantic convention constants.
 */
export function convertGenerationSpan(data: GenerationSpanData): AttributeMap {
  const attributes: AttributeMap = {};

  if (data.model) {
    Object.assign(attributes, extractAttributesFromMapping(data.model, MODEL_ATTRIBUTES));
  }

  if (data.model_config) {
    Object.assign(attributes, extractAttributesFromMapping(data.model_config, MODEL_CONFIG_ATTRIBUTES));
  }

  if (data.input && Array.isArray(data.input)) {
    Object.assign(attributes, extractAttributesFromArray(data.input, INPUT_ATTRIBUTES));
  }

  if (data.output && Array.isArray(data.output)) {
    Object.assign(attributes, extractAttributesFromArray(data.output, OUTPUT_ATTRIBUTES));
  }

  if (data.usage) {
    Object.assign(attributes, extractAttributesFromMapping(data.usage, USAGE_ATTRIBUTES));
  }

  return attributes;
}