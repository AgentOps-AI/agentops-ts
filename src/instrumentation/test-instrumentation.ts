import { InstrumentationBase } from './base';
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { InstrumentorMetadata } from '../types';
import { OPERATION_TYPE } from '../semconv/operations';

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
      const initialAttributes = {
        [OPERATION_TYPE]: 'completion',
        'gen_ai.request.model': options.model || 'test-model',
        'gen_ai.request.max_tokens': options.maxTokens || 100,
        'gen_ai.request.temperature': options.temperature || 0.7,
        'gen_ai.prompt': prompt,
      };
      console.log('[test-instrumentation] Creating span with attributes:', initialAttributes);

      const span = this.createSpan('test_completion', initialAttributes, SpanKind.CLIENT);

      try {
        const result = originalCreateCompletion.call(this, prompt, options);

        // Add response attributes
        const responseAttributes = {
          'gen_ai.response.model': options.model || 'test-model',
          'gen_ai.completion': result.text,
          'gen_ai.usage.prompt_tokens': result.usage.promptTokens,
          'gen_ai.usage.completion_tokens': result.usage.completionTokens,
          'gen_ai.usage.total_tokens': result.usage.totalTokens,
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