import { BatchTraceProcessor, addTraceProcessor, setTraceProcessors, setTracingDisabled } from '@openai/agents';
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
    console.debug('[openai-agents] setup() called - instance ID:', this.instrumentationName);
    console.debug('[openai-agents] available exports:', Object.keys(moduleExports).slice(0, 10));

    try {
      // Enable tracing and patch key functions
      setTracingDisabled(false);
      
      console.debug('[openai-agents] creating new exporter for instance:', this.instrumentationName);
      const exporter = new OpenAIAgentsTracingExporter(this);

      console.debug('[openai-agents] creating BatchTraceProcessor');
      const processor = new BatchTraceProcessor(exporter, {
        maxBatchSize: 1
      });

      console.debug('[openai-agents] replacing trace processors with our processor');
      setTraceProcessors([processor]);
      console.debug('[openai-agents] processor set successfully');
      
      // Patch processor lifecycle methods to see what's happening
      const originalOnTraceStart = processor.onTraceStart;
      processor.onTraceStart = function(trace: any) {
        console.debug('[openai-agents] processor.onTraceStart() called with trace:', trace?.traceId);
        return originalOnTraceStart.call(this, trace);
      };
      
      const originalOnTraceEnd = processor.onTraceEnd;
      processor.onTraceEnd = function(trace: any) {
        console.debug('[openai-agents] processor.onTraceEnd() called with trace:', trace?.traceId);
        return originalOnTraceEnd.call(this, trace);
      };
      
      const originalOnSpanStart = processor.onSpanStart;
      processor.onSpanStart = function(span: any) {
        console.debug('[openai-agents] processor.onSpanStart() called with span:', span?.spanId);
        return originalOnSpanStart.call(this, span);
      };
      
      const originalOnSpanEnd = processor.onSpanEnd;
      processor.onSpanEnd = function(span: any) {
        console.debug('[openai-agents] processor.onSpanEnd() called with span:', span?.spanId);
        return originalOnSpanEnd.call(this, span);
      };
      
      // Debug available functions
      const { getGlobalTraceProvider, createAgentSpan, createFunctionSpan, createResponseSpan, createGenerationSpan, TraceProvider } = moduleExports;
      console.debug('[openai-agents-core] found TraceProvider:', typeof TraceProvider);
      
      // Patch both the TraceProvider class and existing instances
      if (moduleExports.TraceProvider) {
        const TraceProviderClass = moduleExports.TraceProvider;
        const originalCreateTrace = TraceProviderClass.prototype.createTrace;
        TraceProviderClass.prototype.createTrace = function(...args: any[]) {
          console.debug('[openai-agents-core] TraceProvider.createTrace() called on instance');
          const result = originalCreateTrace.apply(this, args);
          console.debug('[openai-agents-core] TraceProvider.createTrace() returned trace:', result?.traceId);
          return result;
        };
        console.debug('[openai-agents-core] patched TraceProvider.prototype.createTrace');
        
        // Also patch the global instance if it exists
        if (getGlobalTraceProvider) {
          const globalProvider = getGlobalTraceProvider();
          console.debug('[openai-agents-core] global provider after patch:', globalProvider?.constructor?.name);
          
          // Try patching the instance methods too
          if (globalProvider && typeof globalProvider.createTrace === 'function') {
            const originalInstanceCreateTrace = globalProvider.createTrace;
            globalProvider.createTrace = function(...args: any[]) {
              console.debug('[openai-agents-core] global instance createTrace() called');
              const result = originalInstanceCreateTrace.apply(this, args);
              console.debug('[openai-agents-core] global instance createTrace() returned:', result?.traceId);
              return result;
            };
            console.debug('[openai-agents-core] patched global instance createTrace');
          }
          
          // Force our processor to be called by manually adding it to the global provider
          if (globalProvider && typeof globalProvider.registerProcessor === 'function') {
            globalProvider.registerProcessor(processor);
            console.debug('[openai-agents] manually registered processor with global provider');
          }
        }
        
        // Final attempt: patch the default exporter directly by replacing the ConsoleSpanExporter
        if (moduleExports.ConsoleSpanExporter) {
          const OriginalConsoleSpanExporter = moduleExports.ConsoleSpanExporter;
          const originalExport = OriginalConsoleSpanExporter.prototype.export;
          OriginalConsoleSpanExporter.prototype.export = async function(items: any[]) {
            console.debug('[openai-agents-core] ConsoleSpanExporter.export() intercepted with', items.length, 'items');
            // Send to our exporter
            await exporter.export(items);
            // Call original to maintain console output
            return originalExport.call(this, items);
          };
          console.debug('[openai-agents-core] patched ConsoleSpanExporter.prototype.export');
        }
      }
      
      console.debug('[openai-agents] trace processor added successfully');
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