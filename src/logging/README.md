# Log Upload Functionality

Simple log capture and upload functionality for AgentOps TypeScript SDK, matching the Python SDK implementation.

## How it works

1. When the SDK is initialized, console methods (log, info, warn, error, debug) are automatically patched
2. All console output is captured to an in-memory buffer with timestamps
3. Logs can be uploaded to the API using `uploadLogFile(traceId)`
4. Buffer is cleared after successful upload

## Usage

```typescript
import { agentops } from 'agentops';

// Initialize SDK - starts capturing console output
await agentops.init({ apiKey: 'your-api-key' });

// Your application code - all console output is captured
console.log('Application started');
console.error('An error occurred');

// Upload logs when needed
const result = await agentops.uploadLogFile('trace-123');
if (result) {
  console.log(`Logs uploaded: ${result.id}`);
}

// Shutdown SDK
await agentops.shutdown();
```

## Implementation Details

- **Buffer**: Simple array-based buffer that stores timestamped log entries
- **Format**: `YYYY-MM-DDTHH:mm:ss.sssZ - LEVEL - message`
- **API Endpoint**: POST to `/v4/logs/upload/` with trace ID in headers
- **Cleanup**: Original console methods restored on SDK shutdown