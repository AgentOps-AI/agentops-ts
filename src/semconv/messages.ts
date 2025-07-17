/**
 * Message-related semantic conventions.
 * Based on AgentOps Python SDK message.py conventions.
 */

// Basic message attributes
export const GEN_AI_MESSAGE_ROLE = 'gen_ai.message.role';
export const GEN_AI_MESSAGE_CONTENT = 'gen_ai.message.content';
export const GEN_AI_MESSAGE_NAME = 'gen_ai.message.name';
export const GEN_AI_MESSAGE_FUNCTION_CALL_NAME = 'gen_ai.message.function_call.name';
export const GEN_AI_MESSAGE_FUNCTION_CALL_ARGUMENTS = 'gen_ai.message.function_call.arguments';
export const GEN_AI_MESSAGE_TOOL_CALLS = 'gen_ai.message.tool_calls';

// Indexed prompt messages (with {i} for interpolation)
export const GEN_AI_PROMPT_ROLE = 'gen_ai.prompt.{i}.role';
export const GEN_AI_PROMPT_CONTENT = 'gen_ai.prompt.{i}.content';
export const GEN_AI_PROMPT_TYPE = 'gen_ai.prompt.{i}.type';
export const GEN_AI_PROMPT_SPEAKER = 'gen_ai.prompt.{i}.speaker';

// Indexed function calls (with {i} for interpolation)
export const GEN_AI_TOOL_CALL_ID = 'gen_ai.request.tools.{i}.id';
export const GEN_AI_TOOL_CALL_TYPE = 'gen_ai.request.tools.{i}.type';
export const GEN_AI_TOOL_CALL_NAME = 'gen_ai.request.tools.{i}.name';
export const GEN_AI_TOOL_CALL_DESCRIPTION = 'gen_ai.request.tools.{i}.description';
export const GEN_AI_TOOL_CALL_ARGUMENTS = 'gen_ai.request.tools.{i}.arguments';

// Indexed completions (with {i} for interpolation)
export const GEN_AI_COMPLETION_ID = 'gen_ai.completion.{i}.id';
export const GEN_AI_COMPLETION_TYPE = 'gen_ai.completion.{i}.type';
export const GEN_AI_COMPLETION_ROLE = 'gen_ai.completion.{i}.role';
export const GEN_AI_COMPLETION_CONTENT = 'gen_ai.completion.{i}.content';
export const GEN_AI_COMPLETION_FINISH_REASON = 'gen_ai.completion.{i}.finish_reason';
export const GEN_AI_COMPLETION_SPEAKER = 'gen_ai.completion.{i}.speaker';

// Indexed tool calls (with {i}/{j} for nested interpolation)
export const GEN_AI_COMPLETION_TOOL_CALL_ID = 'gen_ai.completion.{i}.tool_calls.{j}.id';
export const GEN_AI_COMPLETION_TOOL_CALL_TYPE = 'gen_ai.completion.{i}.tool_calls.{j}.type';
export const GEN_AI_COMPLETION_TOOL_CALL_STATUS = 'gen_ai.completion.{i}.tool_calls.{j}.status';
export const GEN_AI_COMPLETION_TOOL_CALL_NAME = 'gen_ai.completion.{i}.tool_calls.{j}.name';
export const GEN_AI_COMPLETION_TOOL_CALL_DESCRIPTION = 'gen_ai.completion.{i}.tool_calls.{j}.description';
export const GEN_AI_COMPLETION_TOOL_CALL_ARGUMENTS = 'gen_ai.completion.{i}.tool_calls.{j}.arguments';

// Indexed annotations (with {i}/{j} for nested interpolation)
export const GEN_AI_COMPLETION_ANNOTATION_START_INDEX = 'gen_ai.completion.{i}.annotations.{j}.start_index';
export const GEN_AI_COMPLETION_ANNOTATION_END_INDEX = 'gen_ai.completion.{i}.annotations.{j}.end_index';
export const GEN_AI_COMPLETION_ANNOTATION_TITLE = 'gen_ai.completion.{i}.annotations.{j}.title';
export const GEN_AI_COMPLETION_ANNOTATION_TYPE = 'gen_ai.completion.{i}.annotations.{j}.type';
export const GEN_AI_COMPLETION_ANNOTATION_URL = 'gen_ai.completion.{i}.annotations.{j}.url';