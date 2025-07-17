import { InstrumentationBase } from '../base';
import { InstrumentorMetadata } from '../../types';

export const debug = require('debug')('agentops:instrumentation:ai-sdk');

/**
 * Instrumentation for the AI SDK by Vercel.
 * 
 * The AI SDK has excellent built-in OpenTelemetry support that automatically creates spans
 * with comprehensive telemetry data. However, it uses `ai.*` attribute naming conventions
 * instead of the standard `gen_ai.*` semantic conventions.
 * 
 * **Why This Approach:**
 * 
 * 1. **Function Patching is Impossible**: The AI SDK exports functions as getter-only properties
 *    that cannot be redefined or patched. Attempting to patch them throws:
 *    `TypeError: Cannot redefine property: generateText`
 * 
 * 2. **Exporter-Based Transformation**: Instead of patching, we use a custom exporter that
 *    intercepts spans before they're sent to AgentOps and transforms all `ai.*` attributes
 *    to proper `gen_ai.*` semantic conventions.
 * 
 * 3. **Comprehensive Coverage**: This approach works for ALL AI SDK functions and any future
 *    additions without needing to patch individual functions.
 * 
 * **Supported Functions:**
 * - generateText()
 * - generateObject()
 * - streamText()
 * - streamObject()
 * - embed()
 * - embedMany()
 * - Tool calls within these functions
 * 
 * **Transformed Attributes:**
 * - `ai.model.provider` → `gen_ai.system`
 * - `ai.model.id` → `gen_ai.request.model`
 * - `ai.usage.promptTokens` → `gen_ai.usage.input_tokens`
 * - `ai.usage.completionTokens` → `gen_ai.usage.output_tokens`
 * - `ai.response.finishReason` → `gen_ai.response.finish_reasons`
 * - And many more...
 * 
 * The actual transformation logic is handled by `AISDKExporter` in the tracing core.
 */
export class AISDKInstrumentation extends InstrumentationBase {
  static readonly metadata: InstrumentorMetadata = {
    name: 'ai-sdk-instrumentation',
    version: '1.0.0',
    description: 'Instrumentation for AI SDK by Vercel - Uses exporter-based attribute transformation',
    targetLibrary: 'ai',
    targetVersions: ['*']
  };
  static readonly useRuntimeTargeting = true;

  /**
   * Setup is intentionally minimal since the AI SDK's built-in telemetry handles span creation.
   * The actual attribute transformation happens in the AISDKExporter.
   */
  protected setup(moduleExports: any, moduleVersion?: string): any {
    debug('AI SDK instrumentation registered - using exporter-based attribute transformation');
    
    // Enable AI SDK's built-in telemetry if not already enabled
    if (moduleExports.experimental_telemetry) {
      debug('AI SDK telemetry already enabled');
    } else {
      debug('AI SDK telemetry not found - spans will still be processed by exporter');
    }
    
    return moduleExports;
  }

  /**
   * Teardown is minimal since we don't patch any functions.
   */
  protected teardown(moduleExports: any, moduleVersion?: string): any {
    debug('AI SDK instrumentation teardown - no cleanup needed');
    return moduleExports;
  }
} 