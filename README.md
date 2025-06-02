# AgentOps TypeScript SDK

A TypeScript implementation of the AgentOps SDK that exports GenAI conventional OpenTelemetry data to standards-compliant OTel collectors. This SDK provides automatic instrumentation for multiple agent frameworks and AI libraries.

## Features

- 🔌 **Plugin Architecture**: Dynamic loading and configuration of instrumentors
- 🤖 **GenAI Support**: Built-in support for OpenTelemetry GenAI semantic conventions
- 📊 **Standards Compliant**: Exports to any OpenTelemetry-compatible collector
- 🛠️ **Framework Agnostic**: Instrument multiple agent frameworks simultaneously
- 🔧 **TypeScript First**: Full TypeScript support with comprehensive type definitions
- 🔐 **Secure Authentication**: JWT token-based authentication with AgentOps API
- 🔄 **Auto-Shutdown**: Automatic cleanup on process exit

## Installation

```bash
npm install agentops-ts
```

## Quick Start

### 1. Set your API key (recommended)

```bash
export AGENTOPS_API_KEY=your-api-key
```

### 2. Initialize the SDK

```typescript
import { agentops } from 'agentops-ts';

// Initialize with environment variable API key
await agentops.init();

// Your AI agent code here - instrumentation happens automatically!
// No manual shutdown needed - cleanup happens automatically on exit
```

### Alternative: Pass API key explicitly

```typescript
import { agentops } from 'agentops-ts';

await agentops.init({
  apiKey: 'your-api-key'
});
```

## Configuration

The SDK supports these configuration options:

```typescript
await agentops.init({
  // Authentication
  apiKey: 'your-api-key',              // Or use AGENTOPS_API_KEY env var
  
  // Service identification
  serviceName: 'my-agent-service',     // Default: 'agentops'
  
  // Endpoints (defaults provided)
  apiEndpoint: 'https://api.agentops.ai',           // AgentOps API
  otlpEndpoint: 'https://otlp.agentops.ai/v1/traces' // Telemetry endpoint
});
```

## Authentication

The SDK uses JWT token-based authentication with the AgentOps API:

1. **API Key**: Provided via environment variable or config
2. **Token Exchange**: API key is exchanged for JWT token automatically
3. **Auto-Refresh**: Tokens are refreshed when expired
4. **Secure Headers**: JWT token sent as `Authorization: Bearer <token>`

## Automatic Cleanup

The SDK automatically handles cleanup on process exit:

- **Normal exit**: `process.on('exit')`
- **Interruption**: `process.on('SIGINT')` (Ctrl+C)
- **Termination**: `process.on('SIGTERM')`
- **Uncaught errors**: `process.on('uncaughtException')`
- **Unhandled promises**: `process.on('unhandledRejection')`

No manual `shutdown()` calls required!

## Creating Custom Instrumentors

Extend the `AgentOpsInstrumentationBase` class to create framework-specific instrumentors:

```typescript
import { AgentOpsInstrumentationBase } from 'agentops-ts';

export class MyFrameworkInstrumentation extends AgentOpsInstrumentationBase {
  protected readonly metadata = {
    name: 'my-framework',
    version: '1.0.0',
    description: 'Instrumentation for My Framework',
    targetLibrary: 'my-framework',
    targetVersions: ['>=1.0.0'],
  };

  init() {
    return new InstrumentationNodeModuleDefinition(
      'my-framework',
      ['>=1.0.0'],
      (moduleExports) => {
        // Patch the module
        return moduleExports;
      }
    );
  }
}
```

## Semantic Conventions

The SDK uses centralized semantic conventions organized by data type:

- **Resource**: `src/semconv/resource.ts` - Service and deployment attributes
- **Operations**: `src/semconv/operations.ts` - Operation lifecycle and flow
- **Model**: `src/semconv/model.ts` - AI model identification and config
- **Messages**: `src/semconv/messages.ts` - Chat messages and completions
- **Tools**: `src/semconv/tools.ts` - Tool calls and function invocations
- **Agents**: `src/semconv/agents.ts` - Agent behavior and state

## GenAI Telemetry

The SDK automatically follows OpenTelemetry GenAI semantic conventions:

- **Spans**: `gen_ai.completion`, `agent.execution`
- **Attributes**: Model info, token usage, parameters
- **Events**: Prompts and completions (when content capture is enabled)
- **Metrics**: Token usage, latency, error rates

## Architecture

### Core Components

1. **AgentOps**: Main singleton class for initialization and configuration
2. **InstrumentationRegistry**: Manages instrumentor discovery and loading
3. **AgentOpsInstrumentationBase**: Base class for all instrumentors
4. **AgentOpsAPI**: Handles authentication with AgentOps API
5. **BearerToken**: JWT token management with expiry handling

### Authentication Flow

1. Initialize with API key (env var or config)
2. Exchange API key for JWT token via `/v3/auth/token`
3. Set `Authorization: Bearer <token>` header for telemetry
4. Auto-refresh token when expired

### Data Flow

1. Instrumentors capture GenAI operations
2. Telemetry data sent to AgentOps OTLP endpoint
3. JWT authentication headers included automatically
4. Auto-cleanup on process exit

## Privacy and Security

- API keys can be set via environment variables (recommended)
- JWT tokens have automatic expiry and refresh
- Content capture is configurable
- No secrets or keys are captured in telemetry data

## License

MIT