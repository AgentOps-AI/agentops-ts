/**
 * Core attributes applicable to all spans.
 * Based on AgentOps Python SDK core conventions.
 */

// Error attributes
export const ERROR_TYPE = 'error.type';
export const ERROR_MESSAGE = 'error.message';

// AgentOps specific
export const AGENTOPS_TAGS = 'agentops.tags';

// Trace context attributes
export const TRACE_ID = 'trace.id';
export const SPAN_ID = 'span.id';
export const PARENT_ID = 'parent.id';
export const GROUP_ID = 'group.id';

// Operation attributes
export const OPERATION_NAME = 'operation.name';
export const OPERATION_VERSION = 'operation.version';

// Session/Trace attributes
export const AGENTOPS_SESSION_END_STATE = 'agentops.session.end_state'; 