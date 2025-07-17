/**
 * AI SDK specific semantic conventions.
 * These conventions are specific to the AI SDK by Vercel and should only be used
 * for AI SDK instrumentations. For general AI conventions, use gen_ai.ts.
 */

// AI SDK Operation identification
export const AI_OPERATION_NAME = 'ai.operation.name';
export const AI_OPERATION_TYPE = 'ai.operation.type';
export const AI_OPERATION_ID = 'ai.operation.id';

// AI SDK Generation attributes
export const AI_GENERATION_TYPE = 'ai.generation.type';
export const AI_GENERATION_MODE = 'ai.generation.mode';
export const AI_GENERATION_STREAMING = 'ai.generation.streaming';

// AI SDK Model attributes (specific to AI SDK)
export const AI_MODEL_PROVIDER = 'ai.model.provider';
export const AI_MODEL_ID = 'ai.model.id';
export const AI_MODEL_VERSION = 'ai.model.version';

// AI SDK Response attributes (specific to AI SDK)
export const AI_RESPONSE_TIMESTAMP = 'ai.response.timestamp';
export const AI_RESPONSE_TEXT = 'ai.response.text';
export const AI_RESPONSE_OBJECT = 'ai.response.object';

// AI SDK Embedding attributes
export const AI_EMBEDDING_MODEL = 'ai.embedding.model';
export const AI_EMBEDDING_DIMENSIONS = 'ai.embedding.dimensions';
export const AI_EMBEDDING_INPUT = 'ai.embedding.input';
export const AI_EMBEDDING_OUTPUT = 'ai.embedding.output';
export const AI_EMBEDDING_USAGE_TOKENS = 'ai.embedding.usage.tokens';

// AI SDK Schema attributes (for structured output)
export const AI_SCHEMA_NAME = 'ai.schema.name';
export const AI_SCHEMA_DESCRIPTION = 'ai.schema.description';
export const AI_SCHEMA_TYPE = 'ai.schema.type';
export const AI_SCHEMA_DEFINITION = 'ai.schema.definition';

// AI SDK Stream attributes
export const AI_STREAM_TYPE = 'ai.stream.type';
export const AI_STREAM_CHUNK_COUNT = 'ai.stream.chunk_count';
export const AI_STREAM_FIRST_CHUNK_TIME = 'ai.stream.first_chunk_time';
export const AI_STREAM_LAST_CHUNK_TIME = 'ai.stream.last_chunk_time';

// AI SDK Telemetry attributes
export const AI_TELEMETRY_FUNCTION_ID = 'ai.telemetry.function_id';
export const AI_TELEMETRY_METADATA = 'ai.telemetry.metadata';
export const AI_TELEMETRY_RECORD_INPUTS = 'ai.telemetry.record_inputs';
export const AI_TELEMETRY_RECORD_OUTPUTS = 'ai.telemetry.record_outputs';

// AI SDK Provider attributes
export const AI_PROVIDER_NAME = 'ai.provider.name';
export const AI_PROVIDER_VERSION = 'ai.provider.version';
export const AI_PROVIDER_METADATA = 'ai.provider.metadata';

// AI SDK Settings attributes
export const AI_SETTINGS_MAX_RETRIES = 'ai.settings.max_retries';
export const AI_SETTINGS_TIMEOUT = 'ai.settings.timeout';
export const AI_SETTINGS_ABORT_SIGNAL = 'ai.settings.abort_signal'; 