/**
 * Simple test library for AgentOps instrumentation testing
 */

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResult {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Mock completion function that we can instrument
 */
export function createCompletion(prompt: string, options: CompletionOptions = {}): CompletionResult {
  const { model = 'test-model', temperature = 0.7, maxTokens = 100 } = options;
  
  console.log(`[test-lib] Creating completion for prompt: "${prompt}"`);
  console.log(`[test-lib] Options:`, { model, temperature, maxTokens });
  
  // Simulate some processing
  const response = `This is a test response to: ${prompt}`;
  
  return {
    text: response,
    usage: {
      promptTokens: prompt.split(' ').length,
      completionTokens: response.split(' ').length,
      totalTokens: prompt.split(' ').length + response.split(' ').length
    }
  };
}

