/**
 * General AI semantic conventions based on OpenTelemetry GenAI semantic conventions.
 * These conventions are framework-agnostic and should be used across all AI instrumentations.
 * Based on AgentOps Python SDK span_attributes.py
 */

// System
export const GEN_AI_SYSTEM = 'gen_ai.system';

// Request attributes
export const GEN_AI_REQUEST_MODEL = 'gen_ai.request.model';
export const GEN_AI_REQUEST_MAX_TOKENS = 'gen_ai.request.max_tokens';
export const GEN_AI_REQUEST_TEMPERATURE = 'gen_ai.request.temperature';
export const GEN_AI_REQUEST_TOP_P = 'gen_ai.request.top_p';
export const GEN_AI_REQUEST_TOP_K = 'gen_ai.request.top_k';
export const GEN_AI_REQUEST_SEED = 'gen_ai.request.seed';
export const GEN_AI_REQUEST_SYSTEM_INSTRUCTION = 'gen_ai.request.system_instruction';
export const GEN_AI_REQUEST_CANDIDATE_COUNT = 'gen_ai.request.candidate_count';
export const GEN_AI_REQUEST_STOP_SEQUENCES = 'gen_ai.request.stop_sequences';
export const GEN_AI_REQUEST_TYPE = 'gen_ai.request.type';
export const GEN_AI_REQUEST_STREAMING = 'gen_ai.request.streaming';
export const GEN_AI_REQUEST_FREQUENCY_PENALTY = 'gen_ai.request.frequency_penalty';
export const GEN_AI_REQUEST_PRESENCE_PENALTY = 'gen_ai.request.presence_penalty';
export const GEN_AI_REQUEST_FUNCTIONS = 'gen_ai.request.functions';
export const GEN_AI_REQUEST_HEADERS = 'gen_ai.request.headers';
export const GEN_AI_REQUEST_INSTRUCTIONS = 'gen_ai.request.instructions';
export const GEN_AI_REQUEST_VOICE = 'gen_ai.request.voice';
export const GEN_AI_REQUEST_SPEED = 'gen_ai.request.speed';

// Content
export const GEN_AI_PROMPT = 'gen_ai.prompt';
export const GEN_AI_COMPLETION = 'gen_ai.completion';
export const GEN_AI_COMPLETION_CHUNK = 'gen_ai.completion.chunk';

// Response attributes
export const GEN_AI_RESPONSE_MODEL = 'gen_ai.response.model';
export const GEN_AI_RESPONSE_FINISH_REASON = 'gen_ai.response.finish_reason';
export const GEN_AI_RESPONSE_STOP_REASON = 'gen_ai.response.stop_reason';
export const GEN_AI_RESPONSE_ID = 'gen_ai.response.id';

// Usage metrics (NOTE: Using prompt_tokens and completion_tokens as per Python SDK)
export const GEN_AI_USAGE_COMPLETION_TOKENS = 'gen_ai.usage.completion_tokens';
export const GEN_AI_USAGE_PROMPT_TOKENS = 'gen_ai.usage.prompt_tokens';
export const GEN_AI_USAGE_TOTAL_TOKENS = 'gen_ai.usage.total_tokens';
export const GEN_AI_USAGE_CACHE_CREATION_INPUT_TOKENS = 'gen_ai.usage.cache_creation_input_tokens';
export const GEN_AI_USAGE_CACHE_READ_INPUT_TOKENS = 'gen_ai.usage.cache_read_input_tokens';
export const GEN_AI_USAGE_REASONING_TOKENS = 'gen_ai.usage.reasoning_tokens';
export const GEN_AI_USAGE_STREAMING_TOKENS = 'gen_ai.usage.streaming_tokens';
export const GEN_AI_USAGE_TOTAL_COST = 'gen_ai.usage.total_cost';

// Token type
export const GEN_AI_TOKEN_TYPE = 'gen_ai.token.type';

// User
export const GEN_AI_USER = 'gen_ai.user';

// OpenAI specific
export const GEN_AI_OPENAI_SYSTEM_FINGERPRINT = 'gen_ai.openai.system_fingerprint';
export const GEN_AI_OPENAI_INSTRUCTIONS = 'gen_ai.openai.instructions';
export const GEN_AI_OPENAI_API_BASE = 'gen_ai.openai.api_base';
export const GEN_AI_OPENAI_API_VERSION = 'gen_ai.openai.api_version';
export const GEN_AI_OPENAI_API_TYPE = 'gen_ai.openai.api_type';

// Streaming-specific attributes
export const GEN_AI_STREAMING_TIME_TO_FIRST_TOKEN = 'gen_ai.streaming.time_to_first_token';
export const GEN_AI_STREAMING_TIME_TO_GENERATE = 'gen_ai.streaming.time_to_generate';
export const GEN_AI_STREAMING_DURATION = 'gen_ai.streaming_duration';
export const GEN_AI_STREAMING_CHUNK_COUNT = 'gen_ai.streaming.chunk_count';

// AgentOps specific attributes
export const AGENTOPS_ENTITY_OUTPUT = 'agentops.entity.output';
export const AGENTOPS_ENTITY_INPUT = 'agentops.entity.input';
export const AGENTOPS_SPAN_KIND = 'agentops.span.kind';
export const AGENTOPS_ENTITY_NAME = 'agentops.entity.name';
export const AGENTOPS_DECORATOR_SPEC = 'agentops.{entity_kind}.spec';
export const AGENTOPS_DECORATOR_INPUT = 'agentops.{entity_kind}.input';
export const AGENTOPS_DECORATOR_OUTPUT = 'agentops.{entity_kind}.output';
export const AGENTOPS_STREAMING = 'agentops.streaming';
export const AGENTOPS_TELEMETRY_ENABLED = 'agentops.telemetry.enabled';
export const AGENTOPS_INSTRUMENTATION_NAME = 'agentops.instrumentation.name';
export const AGENTOPS_INSTRUMENTATION_VERSION = 'agentops.instrumentation.version';
export const AGENTOPS_AUTO_INSTRUMENTED = 'agentops.auto_instrumented';
export const AGENTOPS_FUNCTION_NAME = 'agentops.function_name';
export const AGENTOPS_ORIGINAL_SPAN_NAME = 'agentops.original.span.name'; 