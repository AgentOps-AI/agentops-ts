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


// Type for concrete instrumentor class constructors
export type ConcreteInstrumentorConstructor<T = any> = new (instrumentationName: string, instrumentationVersion: string, config: any) => T;