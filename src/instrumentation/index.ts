import { InstrumentationBase } from './base';
import { OpenAIInstrumentation } from './openai-instrumentation';
// Import other instrumentors here as they're added
// import { LangChainInstrumentation } from './langchain-instrumentation';
// import { AnthropicInstrumentation } from './anthropic-instrumentation';

// Module-level registry of all available instrumentors
export const AVAILABLE_INSTRUMENTORS: (typeof InstrumentationBase)[] = [
  OpenAIInstrumentation,
  // LangChainInstrumentation,
  // AnthropicInstrumentation,
];
