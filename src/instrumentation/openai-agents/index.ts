import { BatchTraceProcessor } from '@openai/agents';

import { InstrumentationBase } from '../base';
import { InstrumentorMetadata } from '../../types';

import { OpenAIAgentsTracingExporter } from './exporter';

/**
 * Instrumentation for openai-agents framework
 * Uses runtime targeting to bypass OpenTelemetry module hooking
 */
export class OpenAIAgentsInstrumentation extends InstrumentationBase {
  static readonly metadata: InstrumentorMetadata = {
    name: 'openai-agents-instrumentation',
    version: '1.0.0',
    description: 'Instrumentation for OpenAI Agents framework',
    targetLibrary: '@openai/agents',
    targetVersions: ['*']
  };

  static readonly useRuntimeTargeting = true;

  protected setup(moduleExports: any, moduleVersion?: string): any {
    console.log('[openai-agents-instrumentation] Setting up OpenAI Agents tracing integration...');

    try {
      const { addTraceProcessor } = moduleExports;

      if (addTraceProcessor) {
        // Create our custom exporter with access to this instrumentation's tracer
        const agentOpsExporter = new OpenAIAgentsTracingExporter(this);

        // Create a batch processor with our exporter
        const processor = new BatchTraceProcessor(agentOpsExporter, {
          maxBatchSize: 1
          // ,
          // scheduleDelay: 500
        });

        // Register our processor
        addTraceProcessor(processor);

        console.log('[openai-agents-instrumentation] ✅ Tracing integration successful');
      } else {
        console.warn('[openai-agents-instrumentation] ⚠️  addTraceProcessor not found in openai-agents module');
        console.log('[openai-agents-instrumentation] Available exports:', Object.keys(moduleExports));
      }
    } catch (error) {
      console.error('[openai-agents-instrumentation] ❌ Failed to setup tracing:', error);
    }

    return moduleExports;
  }

  protected teardown(moduleExports: any, moduleVersion?: string): any {
    // TODO
    console.log('[openai-agents-instrumentation] Tearing down OpenAI Agents instrumentation');
    return moduleExports;
  }
}