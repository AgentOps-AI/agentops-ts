/**
 * Tool-related span attribute constants
 * For attributes describing tool calls, function calls, and external integrations
 */

// Tool identification
export const TOOL_NAME = 'tool.name';
export const TOOL_TYPE = 'tool.type';
export const TOOL_VERSION = 'tool.version';
export const TOOL_DESCRIPTION = 'tool.description';

// Tool invocation
export const TOOL_CALL_ID = 'tool.call.id';
export const TOOL_INPUT = 'tool.input';
export const TOOL_OUTPUT = 'tool.output';
export const TOOL_PARAMETERS = 'tool.parameters';

// Function calls (specific type of tool)
export const FUNCTION_NAME = 'function.name';
export const FUNCTION_ARGUMENTS = 'function.arguments';
export const FUNCTION_RESULT = 'function.result';
export const FUNCTION_SCHEMA = 'function.schema';

// External service calls
export const SERVICE_ENDPOINT = 'service.endpoint';
export const SERVICE_METHOD = 'service.method';
export const SERVICE_REQUEST_SIZE = 'service.request.size';
export const SERVICE_RESPONSE_SIZE = 'service.response.size';

// API specifics
export const API_VERSION = 'api.version';
export const API_REQUEST_ID = 'api.request.id';
export const API_RATE_LIMIT_REMAINING = 'api.rate_limit.remaining';
export const API_RATE_LIMIT_RESET = 'api.rate_limit.reset';