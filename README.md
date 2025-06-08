# AgentOps TypeScript SDK

<div align="center">
  <a href="https://agentops.ai?ref=gh">
    <img src="https://raw.githubusercontent.com/AgentOps-AI/agentops/main/docs/images/external/logo/github-banner.png" alt="Logo">
  </a>
</div>

<div align="center">
  <em>Observability and DevTool platform for AI Agents</em>
</div>

<br />

<div align="center">
  <a href="https://github.com/agentops-ai/agentops-ts/issues">
  <img src="https://img.shields.io/github/commit-activity/m/agentops-ai/agentops-ts" alt="git commit activity">
  </a>
  <img src="https://img.shields.io/npm/v/agentops?&color=3670A0" alt="NPM - Version">
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

<div align="center">
  <img src="https://raw.githubusercontent.com/AgentOps-AI/agentops/main/docs/images/external/app_screenshots/session-replay.png" alt="AgentOps Dashboard" width="650">
</div>

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

## OpenAI Agents Support

AgentOps provides first-class support for the [OpenAI Agents SDK](https://github.com/openai/openai-agents-js/), automatically instrumenting:

- **Agent Lifecycle**: Track agent creation, execution, and completion
- **LLM Generation**: Capture model requests, responses, and token usage
- **Function Calls**: Monitor tool usage and function execution
- **Audio Processing**: Observe speech-to-text and text-to-speech operations
- **Handoffs**: Track agent-to-agent communication and workflow transitions
- **Custom Events**: Capture domain-specific agent behaviors

### Automatic Instrumentation

Simply initialize AgentOps before using the OpenAI Agents SDK:

```typescript
import { agentops } from 'agentops';
import { Agent, run } from '@openai/agents';

// Initialize AgentOps first
await agentops.init();

// Create your agent with tools and instructions
const agent = new Agent({
  name: 'My Assistant',
  instructions: 'You are a helpful assistant.',
  tools: [/* your tools */],
});

// Run the agent - instrumentation happens automatically
const result = await run(agent, "Hello, how can you help me?");
console.log(result.finalOutput);
```

All agent interactions will be automatically captured and exported to your AgentOps dashboard with full OpenTelemetry semantic conventions.

## Debug Logging

To see detailed instrumentation and tracing logs:

```bash
DEBUG=agentops:* node your-app.js
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

