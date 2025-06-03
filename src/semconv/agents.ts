/**
 * Agent-related span attribute constants
 * For attributes describing agent behavior, state, and lifecycle
 */

// Agent identification
export const AGENT_NAME = 'agent.name';
export const AGENT_TYPE = 'agent.type';
export const AGENT_VERSION = 'agent.version';
export const AGENT_ID = 'agent.id';
export const AGENT_SESSION_ID = 'agent.session.id';

// Agent state and context
export const AGENT_STATE = 'agent.state';
export const AGENT_GOAL = 'agent.goal';
export const AGENT_TASK = 'agent.task';
export const AGENT_CONTEXT = 'agent.context';
export const AGENT_MEMORY_SIZE = 'agent.memory.size';

// Agent planning and reasoning
export const AGENT_PLAN = 'agent.plan';
export const AGENT_REASONING = 'agent.reasoning';
export const AGENT_DECISION = 'agent.decision';
export const AGENT_CONFIDENCE = 'agent.confidence';

// Agent execution
export const AGENT_ITERATION = 'agent.iteration';
export const AGENT_MAX_ITERATIONS = 'agent.max_iterations';
export const AGENT_STEP = 'agent.step';
export const AGENT_STEP_TYPE = 'agent.step.type';

// Agent collaboration
export const AGENT_TEAM_ID = 'agent.team.id';
export const AGENT_ROLE_IN_TEAM = 'agent.role.in_team';
export const AGENT_COLLABORATION_TYPE = 'agent.collaboration.type';

// Agent handoffs (indexed)
export const AGENT_HANDOFF_FROM = 'agent.handoff.{i}.from';
export const AGENT_HANDOFF_TO = 'agent.handoff.{i}.to';

// Agent tools (indexed)
export const AGENT_TOOL_NAME = 'agent.tool.{i}.name';
export const AGENT_TOOL_DESCRIPTION = 'agent.tool.{i}.description';
export const AGENT_OUTPUT_TYPE = 'agent.output_type';

// Function calls
export const FUNCTION_NAME = 'function.name';
export const FUNCTION_INPUT = 'function.input';
export const FUNCTION_OUTPUT = 'function.output';
export const FUNCTION_MCP_DATA = 'function.mcp_data';

// Response data
export const RESPONSE_ID = 'response.id';
export const RESPONSE_INPUT = 'response.input';

// Custom spans
export const CUSTOM_NAME = 'custom.name';
export const CUSTOM_DATA = 'custom.data';

// Guardrails
export const GUARDRAIL_NAME = 'guardrail.name';
export const GUARDRAIL_TRIGGERED = 'guardrail.triggered';

// Audio/Speech
export const AUDIO_INPUT_DATA = 'audio.input.data';
export const AUDIO_INPUT_FORMAT = 'audio.input.format';
export const AUDIO_OUTPUT_DATA = 'audio.output.data';
export const AUDIO_OUTPUT_FORMAT = 'audio.output.format';

// MCP Tools
export const MCP_SERVER = 'mcp.server';
export const MCP_TOOLS_RESULT = 'mcp.tools.result';