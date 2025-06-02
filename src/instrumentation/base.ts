import { 
  InstrumentationBase, 
  InstrumentationNodeModuleDefinition
} from '@opentelemetry/instrumentation';
import { Span, SpanKind, trace } from '@opentelemetry/api';
import { InstrumentorMetadata, GenAISpanAttributes, AgentSpanAttributes } from '../types';
import { InstrumentationConfig } from '@opentelemetry/instrumentation';
import { OPERATION_TYPE, OPERATION_TYPE_CHAT_COMPLETION, OPERATION_TYPE_AGENT_EXECUTION } from '../semconv/operations';

export class AgentOpsInstrumentationBase extends InstrumentationBase {
  static readonly metadata: InstrumentorMetadata = {
    name: '@agentops/base-instrumentation',
    version: '1.0.0', 
    description: 'Base instrumentor',
    targetLibrary: 'unknown',
    targetVersions: ['*']
  };

  constructor(instrumentationName: string, instrumentationVersion: string, config: InstrumentationConfig = {}) {
    super(instrumentationName, instrumentationVersion, config);
  }

  init(): InstrumentationNodeModuleDefinition | InstrumentationNodeModuleDefinition[] {
    // Default implementation - subclasses should override
    return new InstrumentationNodeModuleDefinition(
      'default',
      ['*'],
      (moduleExports) => moduleExports,
      (moduleExports) => moduleExports
    );
  }

  protected createGenAISpan(
    operationName: string, 
    attributes: Partial<GenAISpanAttributes>
  ): Span {
    const tracer = trace.getTracer(this.instrumentationName, this.instrumentationVersion);
    
    return tracer.startSpan(operationName, {
      kind: SpanKind.CLIENT,
      attributes: {
        [OPERATION_TYPE]: OPERATION_TYPE_CHAT_COMPLETION,
        ...attributes
      }
    });
  }

  protected createAgentSpan(
    operationName: string,
    attributes: Partial<AgentSpanAttributes>
  ): Span {
    const tracer = trace.getTracer(this.instrumentationName, this.instrumentationVersion);
    
    return tracer.startSpan(operationName, {
      kind: SpanKind.INTERNAL,
      attributes: {
        [OPERATION_TYPE]: OPERATION_TYPE_AGENT_EXECUTION,
        ...attributes
      }
    });
  }

  protected shouldCaptureContent(): boolean {
    return process.env.OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT === 'true';
  }

  protected recordGenAIEvent(span: Span, eventType: string, attributes: Record<string, any>): void {
    span.addEvent(`gen_ai.${eventType}`, attributes);
  }

  getMetadata(): InstrumentorMetadata {
    return (this.constructor as any).metadata;
  }

  static isAvailable(): boolean {
    try {
      const metadata = (this as any).metadata;
      if (!metadata?.targetLibrary) return false;
      
      require.resolve(metadata.targetLibrary);
      return true;
    } catch (error) {
      return false;
    }
  }
}