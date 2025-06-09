import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { OpenAIAgentsTracingExporter } from './exporter';
import { patchAgent } from './agent';
import { patchOpenAIProvider, patchOpenAIResponsesModelClass } from './response';

import { InstrumentationBase } from '../base';
import { InstrumentorMetadata } from '../../types';

const tracer = trace.getTracer('agentops', '0.1.0');

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


    try {
      // Create the exporter
      const exporter = new OpenAIAgentsTracingExporter(this);
      
      // Register our exporter with OpenAI agents tracing system
      if (moduleExports.BatchTraceProcessor && moduleExports.addTraceProcessor) {

        const processor = new moduleExports.BatchTraceProcessor(exporter, {
          maxBatchSize: 1  // Export immediately for real-time tracking
        });
        moduleExports.addTraceProcessor(processor);

      } else {
        console.warn('BatchTraceProcessor or addTraceProcessor not found in module exports');
      }
      
      // Patch OpenAI client first (if available)
      this.patchOpenAIClient();

      // Patch @openai/agents-core components
      this.patchAgentsCore(exporter);

      // Patch @openai/agents-openai components
      this.patchAgentsOpenAI(exporter);

      // Also patch the main module exports
      if (moduleExports.Agent) {
        patchAgent(exporter, moduleExports);
      }
      if (moduleExports.OpenAIResponsesModel) {
        patchOpenAIResponsesModelClass(exporter, moduleExports);
      }
      if (moduleExports.OpenAIProvider) {
        patchOpenAIProvider(exporter, moduleExports);
      }


    } catch (error) {
      console.error('[agentops.instrumentation.openai-agents] failed: ', error);
    }

    return moduleExports;
  }

  protected teardown(moduleExports: any, moduleVersion?: string): any {
    // TODO: Implement teardown if needed
    return moduleExports;
  }

  private patchOpenAIClient(): void {
    // OpenAI client patching removed - we capture model info at the provider level instead

  }

  private patchAgentsCore(exporter: any): void {
    try {
      const agentsCore = require('@openai/agents-core');

      
      patchAgent(exporter, agentsCore);
      

    } catch (error) {
      console.warn('Failed to patch @openai/agents-core:', error);
    }
  }

  private patchAgentsOpenAI(exporter: any): void {
    try {
      const agentsOpenAI = require('@openai/agents-openai');

      
      // Patch the class first
      patchOpenAIResponsesModelClass(exporter, agentsOpenAI);
      
      // Then patch provider
      patchOpenAIProvider(exporter, agentsOpenAI);

    } catch (error) {
      console.warn('Failed to patch @openai/agents-openai:', error);
    }
  }
}

// Export the function-based initialization for backward compatibility
export function initializeOpenAIAgentsInstrumentation(config?: {
  apiKey?: string;
  endpoint?: string;
  debug?: boolean;
}) {
  console.warn('initializeOpenAIAgentsInstrumentation called (deprecated, use class-based approach)');
  // This function is now deprecated in favor of the class-based approach
  // but we keep it for backward compatibility
}

// Export the tracer for use in other modules
export { tracer, context, SpanStatusCode };

// Re-export the exporter
export { OpenAIAgentsTracingExporter };