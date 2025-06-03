/**
 * GenAI semantic convention constants
 * Based on OpenTelemetry GenAI semantic conventions
 * https://opentelemetry.io/docs/specs/semconv/gen-ai/
 */

// GenAI operation attributes
export const GEN_AI_OPERATION_NAME = 'gen_ai.operation.name';
export const GEN_AI_SYSTEM = 'gen_ai.system';

// GenAI request attributes  
export const GEN_AI_REQUEST_MODEL = 'gen_ai.request.model';
export const GEN_AI_REQUEST_MAX_TOKENS = 'gen_ai.request.max_tokens';
export const GEN_AI_REQUEST_TEMPERATURE = 'gen_ai.request.temperature';
export const GEN_AI_REQUEST_TOP_P = 'gen_ai.request.top_p';
export const GEN_AI_REQUEST_FREQUENCY_PENALTY = 'gen_ai.request.frequency_penalty';
export const GEN_AI_REQUEST_PRESENCE_PENALTY = 'gen_ai.request.presence_penalty';
export const GEN_AI_REQUEST_STOP_SEQUENCES = 'gen_ai.request.stop_sequences';

// GenAI response attributes
export const GEN_AI_RESPONSE_MODEL = 'gen_ai.response.model';
export const GEN_AI_RESPONSE_FINISH_REASONS = 'gen_ai.response.finish_reasons';

// GenAI usage attributes
export const GEN_AI_USAGE_INPUT_TOKENS = 'gen_ai.usage.input_tokens';
export const GEN_AI_USAGE_OUTPUT_TOKENS = 'gen_ai.usage.output_tokens';
export const GEN_AI_USAGE_TOTAL_TOKENS = 'gen_ai.usage.total_tokens';

// GenAI content attributes
export const GEN_AI_PROMPT = 'gen_ai.prompt';
export const GEN_AI_COMPLETION = 'gen_ai.completion';