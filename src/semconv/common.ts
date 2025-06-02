/**
 * Common semantic convention constants
 * Shared attributes used across multiple telemetry contexts
 */

// Service identification (used in both resources and spans)
// Use SEMRESATTRS_SERVICE_NAME from '@opentelemetry/semantic-conventions'
// Use SEMRESATTRS_SERVICE_VERSION from '@opentelemetry/semantic-conventions'  
// Use SEMRESATTRS_SERVICE_INSTANCE_ID from '@opentelemetry/semantic-conventions'

// Error attributes (used across operations, tools, agents)
// Use ATTR_ERROR_TYPE from '@opentelemetry/semantic-conventions'
export const ERROR_MESSAGE = 'error.message';
export const ERROR_STACK = 'error.stack';