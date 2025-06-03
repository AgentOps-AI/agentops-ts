# Test Library

Simple test package for verifying AgentOps instrumentation functionality.

## Purpose

This library provides a mock AI completion function that can be instrumented to test that:
- OpenTelemetry spans are generated correctly
- GenAI semantic conventions are applied
- Telemetry data is exported to AgentOps

## Usage

```typescript
const testLib = require('./test-lib');

const result = testLib.createCompletion('What is the meaning of life?', {
  model: 'gpt-4',
  temperature: 0.8,
  maxTokens: 50
});
```

## Building

```bash
npx tsc index.ts --target ES2018 --module CommonJS --declaration
```

This compiles the TypeScript to JavaScript so it can be required by the test examples.