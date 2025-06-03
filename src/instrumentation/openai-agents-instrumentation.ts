import { InstrumentationBase } from './base';
import { InstrumentorMetadata } from '../types';

/**
 * AgentOps TracingExporter that bridges openai-agents tracing to OpenTelemetry
 */
class AgentOpsTracingExporter {
  async export(items: any[]): Promise<void> {
    for (const item of items) {
      if (item.type === 'trace') {
        console.log(`[AgentOps] 🔍 Trace: ${item.name} (${item.traceId})`);
        console.log(`  Status: ${item.status}, Duration: ${item.endTime - item.startTime}ms`);
      } else if (item.type === 'span') {
        console.log(`[AgentOps] 📊 Span: ${item.name} (${item.spanId})`);
        console.log(`  Type: ${item.spanType}, Duration: ${item.endTime ? item.endTime - item.startTime : 'ongoing'}ms`);
      }
    }
  }
}

export class OpenAIAgentsInstrumentation extends InstrumentationBase {
  static readonly metadata: InstrumentorMetadata = {
    name: 'openai-agents-instrumentation',
    version: '1.0.0',
    description: 'Instrumentation for OpenAI Agents framework',
    targetLibrary: 'openai-agents',
    targetVersions: ['*']
  };
  static readonly useRuntimeTargeting = true;

  protected setup(moduleExports: any, moduleVersion?: string): any {
    console.log('[openai-agents-instrumentation] Setting up OpenAI Agents tracing integration...');

    try {
      const { addTraceProcessor, BatchTraceProcessor } = moduleExports;

      if (addTraceProcessor && BatchTraceProcessor) {
        // Create our custom exporter
        const agentOpsExporter = new AgentOpsTracingExporter();

        // Create a batch processor with our exporter
        const processor = new BatchTraceProcessor(agentOpsExporter, {
          maxBatchSize: 5,
          scheduleDelay: 500
        });

        // Register our processor
        addTraceProcessor(processor);

        console.log('[openai-agents-instrumentation] ✅ Tracing integration successful');
      } else {
        console.warn('[openai-agents-instrumentation] ⚠️  Tracing functions not found in openai-agents module');
        console.log('[openai-agents-instrumentation] Available exports:', Object.keys(moduleExports));
      }
    } catch (error) {
      console.error('[openai-agents-instrumentation] ❌ Failed to setup tracing:', error);
    }

    return moduleExports;
  }

  protected teardown(moduleExports: any, moduleVersion?: string): any {
    console.log('[openai-agents-instrumentation] Tearing down OpenAI Agents instrumentation');
    return moduleExports;
  }
}