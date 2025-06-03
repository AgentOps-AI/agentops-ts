import { InstrumentationBase } from './base';
import { TestInstrumentation } from './test-instrumentation';
import { OpenAIAgentsInstrumentation } from './openai-agents';

// registry of all available instrumentors
export const AVAILABLE_INSTRUMENTORS: (typeof InstrumentationBase)[] = [
  TestInstrumentation,
  OpenAIAgentsInstrumentation,
];
