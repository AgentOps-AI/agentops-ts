/**
 * Message-related span attribute constants
 * For attributes describing chat messages, prompts, and completions
 */

// Message identification and content
export const MESSAGE_ROLE = 'gen_ai.message.role';
export const MESSAGE_CONTENT = 'gen_ai.message.content';
export const MESSAGE_NAME = 'gen_ai.message.name';
export const MESSAGE_FUNCTION_CALL_NAME = 'gen_ai.message.function_call.name';
export const MESSAGE_FUNCTION_CALL_ARGUMENTS = 'gen_ai.message.function_call.arguments';
export const MESSAGE_TOOL_CALLS = 'gen_ai.message.tool_calls';

// Prompt engineering
export const PROMPT_TEMPLATE = 'gen_ai.prompt.template';
export const PROMPT_VARIABLES = 'gen_ai.prompt.variables';
export const PROMPT_TOKENS = 'gen_ai.prompt.tokens';
export const PROMPT_CHARACTER_COUNT = 'gen_ai.prompt.character_count';

// Completion data
export const COMPLETION_TOKENS = 'gen_ai.completion.tokens';
export const COMPLETION_CHARACTER_COUNT = 'gen_ai.completion.character_count';
export const COMPLETION_CHOICES = 'gen_ai.completion.choices';

// Token usage and billing
export const USAGE_INPUT_TOKENS = 'gen_ai.usage.input_tokens';
export const USAGE_OUTPUT_TOKENS = 'gen_ai.usage.output_tokens';
export const USAGE_TOTAL_TOKENS = 'gen_ai.usage.total_tokens';
export const USAGE_COST = 'gen_ai.usage.cost';