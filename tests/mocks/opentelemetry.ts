// Mock @openai/agents components
jest.mock('@openai/agents', () => ({
  BatchTraceProcessor: jest.fn(),
  setTraceProcessors: jest.fn(),
  setTracingDisabled: jest.fn(),
}));

// Mock OpenTelemetry components
export const mockNodeSDK = {
  start: jest.fn(),
  shutdown: jest.fn().mockResolvedValue(undefined),
};

export const mockInstrumentation = {
  getInstrumentations: jest.fn().mockReturnValue([]),
};

// Mock the NodeSDK constructor
jest.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: jest.fn().mockImplementation(() => mockNodeSDK),
}));

// Mock instrumentation base
jest.mock('@opentelemetry/instrumentation', () => ({
  InstrumentationBase: class MockInstrumentationBase {},
}));