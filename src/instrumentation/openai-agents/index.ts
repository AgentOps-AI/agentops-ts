import { BatchTraceProcessor, addTraceProcessor, setTracingDisabled } from '@openai/agents';
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
  static readonly useRuntimeTargeting = true;

  protected setup(moduleExports: any, moduleVersion?: string): any {
    try {
      // always ensure tracing is enabled
      setTracingDisabled(false);

      const exporter = new OpenAIAgentsTracingExporter(this);
      const processor = new BatchTraceProcessor(exporter, {
        maxBatchSize: 1
      });

      // this is the official method for registering a trace processor, but it
      // does not work.
      // addTraceProcessor(processor);
      // instead, we get a reference to the global trace provider and register it directly.
      const { getGlobalTraceProvider } = moduleExports;
      const globalProvider = getGlobalTraceProvider();
      globalProvider.registerProcessor(processor);
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