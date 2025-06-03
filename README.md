# AgentOps TypeScript SDK

A TypeScript implementation of the AgentOps SDK that exports GenAI conventional OpenTelemetry data to standards-compliant OTel collectors. This SDK provides automatic instrumentation for multiple agent frameworks and AI libraries.

## Features

- 🔌 **Plugin Architecture**: Dynamic loading and configuration of instrumentors
- 🤖 **GenAI Support**: Built-in support for OpenTelemetry GenAI semantic conventions
- 📊 **Standards Compliant**: Exports to any OpenTelemetry-compatible collector
- 🛠️ **Framework Agnostic**: Instrument multiple agent frameworks simultaneously
- 🔧 **TypeScript First**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install agentops
```

## Quick Start

### 1. Set your API key (recommended)

```bash
export AGENTOPS_API_KEY=your-api-key
```

### 2. Initialize the SDK

```typescript
import { agentops } from 'agentops';

await agentops.init();

// Your AI agent code here - instrumentation happens automatically!
```

### Alternative: Pass API key explicitly

```typescript
import { agentops } from 'agentops';

await agentops.init({
  apiKey: 'your-api-key'
});
```

## Building

To build the project from source:

```bash
npm install
npm run build
```

This will compile the TypeScript source code to JavaScript in the `dist/` directory.

## Running the Example

The repository includes an OpenAI Agents example that demonstrates the SDK in action:

```bash
cd examples/openai-agents-example
npm install
npm run dev
```

The example will:
1. Initialize AgentOps instrumentation
2. Create a weather assistant agent with tool calling capabilities
3. Execute a sample query
4. Export telemetry data to the AgentOps platform


## Creating Custom Instrumentors

Extend the `InstrumentationBase` class to create framework-specific instrumentors:

```typescript
import { InstrumentationBase } from 'agentops';

export class MyFrameworkInstrumentation extends InstrumentationBase {
  static readonly metadata = {
    name: 'my-framework',
    version: '1.0.0',
    description: 'Instrumentation for My Framework',
    targetLibrary: 'my-framework',
    targetVersions: ['>=1.0.0'],
  };

  protected setup(moduleExports: any, moduleVersion?: string): any {
    // Apply instrumentation patches to the module
    // Store original functions, wrap them with tracing, etc.
    return moduleExports;
  }

  protected teardown(moduleExports: any, moduleVersion?: string): any {
    // Clean up instrumentation patches
    return moduleExports;
  }
}
```

