import { InstrumentationConfig } from '@opentelemetry/instrumentation';

export interface AgentOpsInstrumentationConfig extends InstrumentationConfig {
  captureContent?: boolean;
}

export interface AgentOpsConfig {
  endpoint?: string;
  headers?: Record<string, string>;
  serviceName?: string;
  sampling?: {
    rate?: number;
    rules?: SamplingRule[];
  };
}

export interface SamplingRule {
  condition: (span: any) => boolean;
  action: 'include' | 'exclude';
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