/**
 * Operation-related span attribute constants
 * For attributes describing the type and flow of operations
 */

// Operation identification
export const OPERATION_TYPE = 'operation.type';
export const OPERATION_NAME = 'operation.name';
export const OPERATION_ID = 'operation.id';

// Operation timing
export const OPERATION_DURATION_MS = 'operation.duration.ms';
export const OPERATION_START_TIME = 'operation.start_time';
export const OPERATION_END_TIME = 'operation.end_time';

// Operation status
export const OPERATION_STATUS = 'operation.status';

// Operation flow
export const OPERATION_PARENT_ID = 'operation.parent.id';
export const OPERATION_CHAIN_ID = 'operation.chain.id';
export const OPERATION_SEQUENCE = 'operation.sequence';

// GenAI specific operation types
export const OPERATION_TYPE_CHAT_COMPLETION = 'gen_ai.chat.completion';
export const OPERATION_TYPE_TEXT_COMPLETION = 'gen_ai.text.completion';
export const OPERATION_TYPE_EMBEDDING = 'gen_ai.embedding';
export const OPERATION_TYPE_IMAGE_GENERATION = 'gen_ai.image.generation';
export const OPERATION_TYPE_SPEECH_TO_TEXT = 'gen_ai.speech.to_text';
export const OPERATION_TYPE_TEXT_TO_SPEECH = 'gen_ai.text.to_speech';

// Agent specific operation types
export const OPERATION_TYPE_AGENT_EXECUTION = 'agent.execution';
export const OPERATION_TYPE_AGENT_PLANNING = 'agent.planning';
export const OPERATION_TYPE_AGENT_TOOL_USE = 'agent.tool.use';
export const OPERATION_TYPE_AGENT_MEMORY_ACCESS = 'agent.memory.access';