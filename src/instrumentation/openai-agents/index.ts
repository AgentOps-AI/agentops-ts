import { BatchTraceProcessor, setTraceProcessors, setTracingDisabled } from '@openai/agents';
import { InstrumentationBase } from '../base';
import { InstrumentorMetadata } from '../../types';
import { OpenAIAgentsTracingExporter } from './exporter';


export class OpenAIAgentsInstrumentation extends InstrumentationBase {
  static readonly metadata: InstrumentorMetadata = {
    name: 'openai-agents-instrumentation',
    version: '1.0.0',
    description: 'Instrumentation for OpenAI Agents framework',
    targetLibrary: '@openai/agents',
    targetVersions: ['*']
  };
  // runtime targeting works better with this library and lets us have less strict import patterns.
  static readonly useRuntimeTargeting = true;

  protected setup(moduleExports: any, moduleVersion?: string): any {
    try {
      // Enable tracing
      setTracingDisabled(false);
      
      const exporter = new OpenAIAgentsTracingExporter(this);
      const processor = new BatchTraceProcessor(exporter, {
        maxBatchSize: 1
      });

      // Replace existing processors with our own to ensure traces go through our exporter
      setTraceProcessors([processor]);
      
      // Also register with the global provider if available for redundancy
      const { getGlobalTraceProvider } = moduleExports;
      if (getGlobalTraceProvider) {
        const globalProvider = getGlobalTraceProvider();
        if (globalProvider && typeof globalProvider.registerProcessor === 'function') {
          globalProvider.registerProcessor(processor);
        }
      }
      
      // Patch the ConsoleSpanExporter to intercept traces that use the default export path
      if (moduleExports.ConsoleSpanExporter) {
        const OriginalConsoleSpanExporter = moduleExports.ConsoleSpanExporter;
        const originalExport = OriginalConsoleSpanExporter.prototype.export;
        OriginalConsoleSpanExporter.prototype.export = async function(items: any[]) {
          // Send to our exporter
          await exporter.export(items);
          // Call original to maintain console output
          return originalExport.call(this, items);
        };
      }
    } catch (error) {
      console.error('[openai-agents] failed: ', error);
    }

    return moduleExports;
  }

  protected teardown(moduleExports: any, moduleVersion?: string): any {
    // TODO removeTraceProcessor?
    return moduleExports;
  }
}