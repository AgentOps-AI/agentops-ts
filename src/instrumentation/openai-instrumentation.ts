import { InstrumentationNodeModuleDefinition, isWrapped } from '@opentelemetry/instrumentation';
import { Span, SpanStatusCode, context, trace } from '@opentelemetry/api';
import { InstrumentationBase } from './base';
import { InstrumentorMetadata, GenAISpanAttributes, GenAIEventAttributes } from '../types';

export class OpenAIInstrumentation extends InstrumentationBase {
  static readonly metadata: InstrumentorMetadata = {
    name: '@agentops/openai-instrumentation',
    version: '1.0.0',
    description: 'OpenTelemetry instrumentation for OpenAI JavaScript SDK',
    targetLibrary: 'openai',
    targetVersions: ['>=4.0.0'],
    dependencies: []
  };

  protected setup(moduleExports: any, moduleVersion?: string): any {
    console.debug(`Applying patch for openai@${moduleVersion}`);
    
    if (moduleExports?.OpenAI?.prototype?.chat?.completions?.create) {
      this._wrap(
        moduleExports.OpenAI.prototype.chat.completions,
        'create',
        this._patchChatCompletions.bind(this)
      );
    }

    return moduleExports;
  }

  protected teardown(moduleExports: any, moduleVersion?: string): any {
    console.debug(`Removing patch for openai@${moduleVersion}`);
    
    if (isWrapped(moduleExports?.OpenAI?.prototype?.chat?.completions?.create)) {
      this._unwrap(moduleExports.OpenAI.prototype.chat.completions, 'create');
    }

    return moduleExports;
  }

  private _patchChatCompletions(original: Function) {
    const instrumentation = this;
    
    return function (this: any, ...args: any[]) {
      const requestData = args[0] || {};
      
      const spanAttributes: Partial<GenAISpanAttributes> = {
        'gen_ai.system': 'openai',
        'gen_ai.request.model': requestData.model,
        'gen_ai.request.max_tokens': requestData.max_tokens,
        'gen_ai.request.temperature': requestData.temperature,
        'gen_ai.request.top_p': requestData.top_p,
      };

      const span = instrumentation.createSpan('openai.chat.completions.create', {
        'gen_ai.operation.name': 'chat_completion',
        ...spanAttributes
      });

      if (requestData.messages) {
        span.addEvent('gen_ai.prompt', {
          'gen_ai.system': 'openai',
          'gen_ai.request.model': requestData.model,
          'gen_ai.event.content.prompt': JSON.stringify(requestData.messages)
        });
      }

      return context.with(trace.setSpan(context.active(), span), () => {
        const result = original.apply(this, args);
        
        if (result && typeof result.then === 'function') {
          return result
            .then((response: any) => {
              instrumentation._recordResponse(span, response, requestData.model);
              span.setStatus({ code: SpanStatusCode.OK });
              span.end();
              return response;
            })
            .catch((error: any) => {
              span.recordException(error);
              span.setStatus({ 
                code: SpanStatusCode.ERROR, 
                message: error.message 
              });
              span.end();
              throw error;
            });
        } else {
          instrumentation._recordResponse(span, result, requestData.model);
          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
          return result;
        }
      });
    };
  }

  private _recordResponse(span: Span, response: any, requestModel: string): void {
    if (!response) return;

    span.setAttributes({
      'gen_ai.response.model': response.model || requestModel,
      'gen_ai.response.id': response.id,
      'gen_ai.response.finish_reasons': response.choices?.map((c: any) => c.finish_reason).filter(Boolean),
      'gen_ai.usage.input_tokens': response.usage?.prompt_tokens,
      'gen_ai.usage.output_tokens': response.usage?.completion_tokens,
      'gen_ai.usage.total_tokens': response.usage?.total_tokens,
    });

    if (response.choices?.length > 0) {
      const completion = response.choices.map((choice: any) => 
        choice.message?.content || choice.text
      ).join('\n');

      span.addEvent('gen_ai.completion', {
        'gen_ai.system': 'openai',
        'gen_ai.request.model': requestModel,
        'gen_ai.response.model': response.model,
        'gen_ai.event.content.completion': completion
      });
    }
  }
}