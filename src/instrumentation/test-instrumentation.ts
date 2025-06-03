import { InstrumentationBase } from './base';
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { InstrumentorMetadata } from '../types';
import {
  GEN_AI_REQUEST_MODEL,
  GEN_AI_REQUEST_MAX_TOKENS,
  GEN_AI_REQUEST_TEMPERATURE,
  GEN_AI_RESPONSE_MODEL,
  GEN_AI_USAGE_INPUT_TOKENS,
  GEN_AI_USAGE_OUTPUT_TOKENS,
  GEN_AI_USAGE_TOTAL_TOKENS
} from '../semconv/model';
import {
  GEN_AI_PROMPT_ROLE,
  GEN_AI_PROMPT_CONTENT,
  GEN_AI_COMPLETION_ROLE,
  GEN_AI_COMPLETION_CONTENT
} from '../semconv/messages';

/**
 * Test instrumenter that generates sample spans without instrumenting any real libraries.
 * Useful for verifying that span generation and export works correctly.
 */
export class TestInstrumentation extends InstrumentationBase {
  static readonly metadata: InstrumentorMetadata = {
    name: 'test-instrumentation',
    version: '1.0.0',
    description: 'Test instrumentation for generating sample spans',
    targetLibrary: 'agentops-test-lib',
    targetVersions: ['*']
  };


  protected setup(moduleExports: any, moduleVersion?: string): any {
    console.log('Test instrumentation enabled - patching agentops-test-lib');

    // Store original function
    const originalCreateCompletion = moduleExports.createCompletion;

    // Patch createCompletion function
    moduleExports.createCompletion = (prompt: string, options: any = {}) => {
      // Create attributes similar to generation.ts but with hard-coded test data
      const attributes: Record<string, any> = {
        'gen_ai.operation.name': 'chat',
        'gen_ai.system': 'test-system',
        [GEN_AI_REQUEST_MODEL]: options.model || 'test-model',
        [GEN_AI_REQUEST_MAX_TOKENS]: options.maxTokens || 100,
        [GEN_AI_REQUEST_TEMPERATURE]: options.temperature || 0.7,
        
        // Indexed input message (simulating user prompt)
        'gen_ai.prompt.0.role': 'user',
        'gen_ai.prompt.0.content': prompt,
      };
      
      console.log('[test-instrumentation] Creating span with attributes:', attributes);

      const span = this.tracer.startSpan('test_completion', {
        kind: SpanKind.CLIENT,
        attributes
      });

      try {
        const result = originalCreateCompletion.call(this, prompt, options);

        // Add response attributes (indexed completion and usage)
        const responseAttributes = {
          [GEN_AI_RESPONSE_MODEL]: options.model || 'test-model',
          
          // Indexed completion message
          'gen_ai.completion.0.role': 'assistant',
          'gen_ai.completion.0.content': result.text,
          
          // Usage tokens
          [GEN_AI_USAGE_INPUT_TOKENS]: result.usage.promptTokens,
          [GEN_AI_USAGE_OUTPUT_TOKENS]: result.usage.completionTokens,
          [GEN_AI_USAGE_TOTAL_TOKENS]: result.usage.totalTokens,
        };
        console.log('[test-instrumentation] Adding response attributes:', responseAttributes);
        span.setAttributes(responseAttributes);

        span.setStatus({ code: SpanStatusCode.OK });
        console.log('[test-instrumentation] Ending span:', span.spanContext().spanId);
        span.end();
        console.debug('[test-instrumentation] Span ended, should be exported now');
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message
        });
        span.end();
        throw error;
      }
    };

    return moduleExports;
  }

  protected teardown(moduleExports: any, moduleVersion?: string): any {
    console.log('Test instrumentation disabled');
    return moduleExports;
  }
}