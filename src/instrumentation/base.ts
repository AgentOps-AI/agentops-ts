import {
  InstrumentationBase as _InstrumentationBase,
  InstrumentationNodeModuleDefinition
} from '@opentelemetry/instrumentation';
import { Span, SpanKind, trace } from '@opentelemetry/api';
import { InstrumentorMetadata, GenAISpanAttributes, AgentSpanAttributes } from '../types';
import { InstrumentationConfig } from '@opentelemetry/instrumentation';
import { OPERATION_TYPE, OPERATION_TYPE_CHAT_COMPLETION, OPERATION_TYPE_AGENT_EXECUTION } from '../semconv/operations';

export abstract class InstrumentationBase extends _InstrumentationBase {
  static readonly metadata: InstrumentorMetadata;

  init(): InstrumentationNodeModuleDefinition | InstrumentationNodeModuleDefinition[] {
    const metadata = (this.constructor as typeof InstrumentationBase).metadata;

    return new InstrumentationNodeModuleDefinition(
      metadata.targetLibrary,
      metadata.targetVersions,
      (moduleExports, moduleVersion) => this.setup(moduleExports, moduleVersion),
      (moduleExports, moduleVersion) => this.teardown(moduleExports, moduleVersion)
    );
  }

  static get identifier(): string {
    return this.metadata.name;
  }

  static get available(): boolean {
    try {
      require.resolve(this.metadata.targetLibrary);
      return true;
    } catch (error) {
      return false;
    }
  }

  protected setup(moduleExports: any, moduleVersion?: string): any {
    // Subclasses should override this method to apply instrumentation patches
    return moduleExports;
  }

  protected teardown(moduleExports: any, moduleVersion?: string): any {
    // Subclasses should override this method to remove instrumentation patches
    return moduleExports;
  }

  protected createSpan(
    operationName: string,
    attributes: Record<string, any> = {},
    spanKind: SpanKind = SpanKind.CLIENT
  ): Span {
    const tracer = trace.getTracer(this.instrumentationName, this.instrumentationVersion);

    return tracer.startSpan(operationName, {
      kind: spanKind,
      attributes
    });
  }


}