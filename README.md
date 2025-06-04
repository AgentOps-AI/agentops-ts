# AgentOps TypeScript SDK

<div align="center">
  <a href="https://agentops.ai?ref=gh">
    <img src="docs/images/logo/github-banner.png" alt="Logo">
  </a>
</div>

<div align="center">
  <em>Observability and DevTool platform for AI Agents</em>
</div>

<br />

<div align="center">
  <a href="https://github.com/agentops-ai/agentops/issues">
  <img src="https://img.shields.io/github/commit-activity/m/agentops-ai/agentops-ts" alt="git commit activity">
  </a>
  <img src="https://img.shields.io/pypi/v/agentops?&color=3670A0" alt="PyPI - Version">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?&color=3670A0" alt="License: MIT">
  </a>
</div>

<p align="center">
  <a href="https://twitter.com/agentopsai/">
    <img src="https://img.shields.io/twitter/follow/agentopsai?style=social" alt="Twitter" style="height: 20px;">
  </a>
  <a href="https://discord.gg/FagdcwwXRR">
    <img src="https://img.shields.io/badge/discord-7289da.svg?style=flat-square&logo=discord" alt="Discord" style="height: 20px;">
  </a>
  <a href="https://app.agentops.ai/?ref=gh">
    <img src="https://img.shields.io/badge/Dashboard-blue.svg?style=flat-square" alt="Dashboard" style="height: 20px;">
  </a>
  <a href="https://docs.agentops.ai/introduction">
    <img src="https://img.shields.io/badge/Documentation-orange.svg?style=flat-square" alt="Documentation" style="height: 20px;">
  </a>
  <a href="https://entelligence.ai/AgentOps-AI&agentops">
    <img src="https://img.shields.io/badge/Chat%20with%20Docs-green.svg?style=flat-square" alt="Chat with Docs" style="height: 20px;">
  </a>
</p>

A TypeScript implementation of the AgentOps SDK that exports GenAI conventional OpenTelemetry data to standards-compliant OTel collectors. This SDK provides automatic instrumentation for multiple agent frameworks and AI libraries.

## Features

- 🔌 **Plugin Architecture**: Dynamic loading and configuration of instrumentors
- 🤖 **GenAI Support**: Built-in support for OpenTelemetry GenAI semantic conventions
- 📊 **Standards Compliant**: Exports to any OpenTelemetry-compatible collector
- 🛠️ **Framework Agnostic**: Instrument multiple agent frameworks simultaneously
- 🔧 **TypeScript First**: Full TypeScript support with comprehensive type definitions
- 💸 **LLM Cost Management**: Track spend with LLM foundation model providers
- 🧪 **Agent Benchmarking**: Test your agents against 1,000+ evals
- 🔐 **Compliance and Security**: Detect common prompt injection and data exfiltration exploits

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

1. First, create a `.env` file in the `examples/openai-agents-example` directory:

```bash
cd examples/openai-agents-example
cat > .env << EOF
AGENTOPS_API_KEY=your-agentops-api-key
OPENAI_API_KEY=your-openai-api-key
EOF
```

2. Then run the example:

```bash
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

## Why AgentOps? 🤔

Without the right tools, AI agents are slow, expensive, and unreliable. Our mission is to bring your agent from prototype to production. Here's why AgentOps stands out:

- **Comprehensive Observability**: Track your AI agents' performance, user interactions, and API usage.
- **Real-Time Monitoring**: Get instant insights with session replays, metrics, and live monitoring tools.
- **Cost Control**: Monitor and manage your spend on LLM and API calls.
- **Failure Detection**: Quickly identify and respond to agent failures and multi-agent interaction issues.
- **Tool Usage Statistics**: Understand how your agents utilize external tools with detailed analytics.
- **Session-Wide Metrics**: Gain a holistic view of your agents' sessions with comprehensive statistics.

AgentOps is designed to make agent observability, testing, and monitoring easy.

## Star History

Check out our growth in the community:

<img src="https://api.star-history.com/svg?repos=AgentOps-AI/agentops&type=Date" style="max-width: 500px" width="50%" alt="Logo">

