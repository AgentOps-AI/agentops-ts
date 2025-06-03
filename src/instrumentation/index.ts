import { InstrumentationBase } from './base';
import { TestInstrumentation } from './test-instrumentation';

// registry of all available instrumentors
export const AVAILABLE_INSTRUMENTORS: (typeof InstrumentationBase)[] = [
  TestInstrumentation,
];
