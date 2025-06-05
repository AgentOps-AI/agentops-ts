# Creating Custom Instrumentors

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

## Registration

Add your instrumentor to the registry in `registry.ts`:

```typescript
import { MyFrameworkInstrumentation } from './my-framework';

// Add to the instrumentations array
const instrumentations = [
  MyFrameworkInstrumentation,
  // ... other instrumentors
];
```

## Best Practices

- Follow OpenTelemetry semantic conventions for attributes
- Use the provided attribute mapping utilities
- Implement proper cleanup in teardown methods
- Test with different versions of the target library
- Document any specific configuration requirements