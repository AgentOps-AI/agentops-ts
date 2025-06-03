import type { TranscriptionSpanData, SpeechSpanData, SpeechGroupSpanData } from '@openai/agents-core/dist/tracing/spans';
import {
  AUDIO_INPUT_DATA,
  AUDIO_INPUT_FORMAT,
  AUDIO_OUTPUT_DATA,
  AUDIO_OUTPUT_FORMAT
} from '../../semconv/agents';
import {
  GEN_AI_REQUEST_MODEL,
  GEN_AI_RESPONSE_MODEL
} from '../../semconv/model';
import {
  extractAttributesFromMapping,
  AttributeMap
} from '../../attributes';

/**
 * OpenAI Agents TranscriptionSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface TranscriptionSpanData {
 *   type: 'transcription';
 *   input: {
 *     data: any;
 *     format: string;
 *   };
 *   output?: string;
 *   model?: string;
 *   model_config?: any;
 * }
 */

const TRANSCRIPTION_ATTRIBUTES: AttributeMap = {
  [GEN_AI_REQUEST_MODEL]: 'model',
  [GEN_AI_RESPONSE_MODEL]: 'model',
  [AUDIO_OUTPUT_DATA]: 'output'
};

const TRANSCRIPTION_INPUT_ATTRIBUTES: AttributeMap = {
  [AUDIO_INPUT_DATA]: 'data',
  [AUDIO_INPUT_FORMAT]: 'format'
};

/**
 * OpenAI Agents SpeechSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface SpeechSpanData {
 *   type: 'speech';
 *   input?: string;
 *   output: {
 *     data: any;
 *     format: string;
 *   };
 *   model?: string;
 *   model_config?: any;
 * }
 */

const SPEECH_ATTRIBUTES: AttributeMap = {
  [GEN_AI_REQUEST_MODEL]: 'model',
  [GEN_AI_RESPONSE_MODEL]: 'model',
  [AUDIO_INPUT_DATA]: 'input'
};

const SPEECH_OUTPUT_ATTRIBUTES: AttributeMap = {
  [AUDIO_OUTPUT_DATA]: 'data',
  [AUDIO_OUTPUT_FORMAT]: 'format'
};

/**
 * OpenAI Agents SpeechGroupSpanData type definition (from @openai/agents-core/dist/tracing/spans):
 *
 * interface SpeechGroupSpanData {
 *   type: 'speech_group';
 *   input?: string;
 * }
 */

const SPEECH_GROUP_ATTRIBUTES: AttributeMap = {
  [AUDIO_INPUT_DATA]: 'input'
};

/**
 * Converts OpenAI Agents TranscriptionSpanData to OpenTelemetry semantic conventions.
 *
 * Maps transcription spans (audio-to-text) to standard audio and GenAI semantic conventions using
 * our centralized semantic convention constants and attribute mapping system.
 */
export function convertTranscriptionSpan(data: TranscriptionSpanData): AttributeMap {
  const attributes: AttributeMap = {};

  // Basic transcription attributes
  Object.assign(attributes, extractAttributesFromMapping(data, TRANSCRIPTION_ATTRIBUTES));

  // Input attributes
  if (data.input) {
    Object.assign(attributes, extractAttributesFromMapping(data.input, TRANSCRIPTION_INPUT_ATTRIBUTES));
  }

  return attributes;
}

/**
 * Converts OpenAI Agents SpeechSpanData to OpenTelemetry semantic conventions.
 *
 * Maps speech spans (text-to-audio) to standard audio and GenAI semantic conventions using
 * our centralized semantic convention constants and attribute mapping system.
 */
export function convertSpeechSpan(data: SpeechSpanData): AttributeMap {
  const attributes: AttributeMap = {};

  // Basic speech attributes
  Object.assign(attributes, extractAttributesFromMapping(data, SPEECH_ATTRIBUTES));

  // Output attributes
  if (data.output) {
    Object.assign(attributes, extractAttributesFromMapping(data.output, SPEECH_OUTPUT_ATTRIBUTES));
  }

  return attributes;
}

/**
 * Converts OpenAI Agents SpeechGroupSpanData to OpenTelemetry semantic conventions.
 *
 * Maps speech group spans to standard audio semantic conventions using
 * our centralized semantic convention constants and attribute mapping system.
 */
export function convertSpeechGroupSpan(data: SpeechGroupSpanData): AttributeMap {
  return extractAttributesFromMapping(data, SPEECH_GROUP_ATTRIBUTES);
}