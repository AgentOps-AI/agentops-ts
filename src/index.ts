import { Client } from './client';

export const agentops = new Client();

export * from './types';
export { InstrumentationBase } from './instrumentation/base';