import { BatchTraceProcessor, addTraceProcessor } from '@openai/agents';
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
      const exporter = new OpenAIAgentsTracingExporter(this);
      // this is the OpenAI Agents exporter, so we have it immediately export traces
      // into our own queue.
      const processor = new BatchTraceProcessor(exporter, {
        maxBatchSize: 1
      });

      addTraceProcessor(processor);
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