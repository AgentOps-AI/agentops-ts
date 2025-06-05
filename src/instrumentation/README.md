# Creating Custom Instrumentors

Extend the `InstrumentationBase` class to create framework-specific instrumentors:

```typescript
import { InstrumentationBase } from '../base';
import { InstrumentorMetadata } from '../../types';

export class MyFrameworkInstrumentation extends InstrumentationBase {
  static readonly metadata: InstrumentorMetadata = {
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

## Registration

Add your instrumentor to the registry in `index.ts`:

```typescript
import { MyFrameworkInstrumentation } from './my-framework';

// Add to the AVAILABLE_INSTRUMENTORS array
export const AVAILABLE_INSTRUMENTORS: (typeof InstrumentationBase)[] = [
  ...
  MyFrameworkInstrumentation,
];
```

## OpenTelemetry Semantic Conventions

AgentOps follows [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) for consistent observability. Import semantic constants from the `semconv` modules:

```typescript
import {
  GEN_AI_REQUEST_MODEL,
  GEN_AI_USAGE_INPUT_TOKENS
} from '../../semconv/model';
```

## Attribute Mapping Utilities

Use the provided utilities to map framework data to OpenTelemetry attributes:

```typescript
import {
  extractAttributesFromMapping,
  AttributeMap
} from '../../attributes';

// Define mapping from semantic conventions to your data structure
const MODEL_ATTRIBUTES: AttributeMap = {
  [GEN_AI_REQUEST_MODEL]: 'model_name',
  [GEN_AI_USAGE_INPUT_TOKENS]: 'input_tokens',
};

// Extract attributes from your framework's data
const spanData = { model_name: 'gpt-4', input_tokens: 150 };
const attributes = extractAttributesFromMapping(spanData, MODEL_ATTRIBUTES);
// Result: { 'gen_ai.request.model': 'gpt-4', 'gen_ai.usage.input_tokens': 150 }
```
