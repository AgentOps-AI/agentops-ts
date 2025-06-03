import { InstrumentationConfig as _InstrumentationConfig } from '@opentelemetry/instrumentation';

export interface InstrumentationConfig extends _InstrumentationConfig {
  captureContent?: boolean;
}

export type LogLevel = 'debug' | 'info' | 'error';

export interface Config {
  apiEndpoint?: string;
  otlpEndpoint?: string;
  serviceName?: string;
  apiKey?: string;
  logLevel?: LogLevel;
}

export interface InstrumentorMetadata {
  name: string;
  version: string;
  description: string;
  targetLibrary: string;
  targetVersions: string[];
  dependencies?: string[];
}

export interface GenAISpanAttributes {
  'gen_ai.system': string;
  'gen_ai.request.model': string;
  'gen_ai.request.max_tokens'?: number;
  'gen_ai.request.temperature'?: number;
  'gen_ai.request.top_p'?: number;
  'gen_ai.response.model'?: string;
  'gen_ai.response.id'?: string;
  'gen_ai.response.finish_reasons'?: string[];
  'gen_ai.usage.input_tokens'?: number;
  'gen_ai.usage.output_tokens'?: number;
  'gen_ai.usage.total_tokens'?: number;
}

export interface AgentSpanAttributes {
  'agent.name': string;
  'agent.version'?: string;
  'agent.type': 'autonomous' | 'conversational' | 'reactive' | 'proactive';
  'agent.goal'?: string;
  'agent.tools'?: string[];
  'agent.memory_type'?: string;
}

export interface GenAIEventAttributes {
  'gen_ai.system': string;
  'gen_ai.event.content.prompt'?: string;
  'gen_ai.event.content.completion'?: string;
  'gen_ai.request.model': string;
  'gen_ai.response.model'?: string;
}

// Type for concrete instrumentor class constructors
export type ConcreteInstrumentorConstructor<T = any> = new (instrumentationName: string, instrumentationVersion: string, config: any) => T;