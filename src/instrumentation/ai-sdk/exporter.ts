import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { ExportResult, ExportResultCode } from '@opentelemetry/core';
import {
  GEN_AI_SYSTEM,
  GEN_AI_REQUEST_MODEL,
  GEN_AI_REQUEST_TEMPERATURE,
  GEN_AI_REQUEST_MAX_TOKENS,
  GEN_AI_REQUEST_TOP_P,
  GEN_AI_REQUEST_TOP_K,
  GEN_AI_REQUEST_FREQUENCY_PENALTY,
  GEN_AI_REQUEST_PRESENCE_PENALTY,
  GEN_AI_REQUEST_STOP_SEQUENCES,
  GEN_AI_REQUEST_STREAMING,
  GEN_AI_RESPONSE_MODEL,
  GEN_AI_RESPONSE_ID,
  GEN_AI_RESPONSE_FINISH_REASON,
  GEN_AI_USAGE_PROMPT_TOKENS,
  GEN_AI_USAGE_COMPLETION_TOKENS,
  GEN_AI_USAGE_TOTAL_TOKENS,
  GEN_AI_STREAMING_TIME_TO_FIRST_TOKEN,
  GEN_AI_STREAMING_TIME_TO_GENERATE,
  GEN_AI_STREAMING_CHUNK_COUNT,
} from '../../semconv/gen_ai';
import {
  GEN_AI_PROMPT_ROLE,
  GEN_AI_PROMPT_CONTENT,
} from '../../semconv/messages';

const debug = require('debug')('agentops:instrumentation:ai-sdk:exporter');

/**
 * Custom exporter that transforms AI SDK attributes to gen_ai conventions.
 * 
 * **Why This Approach:**
 * 
 * The AI SDK has excellent built-in OpenTelemetry support that automatically creates spans
 * with comprehensive telemetry data when `experimental_telemetry` is enabled. However, 
 * it uses `ai.*` attribute naming conventions instead of the standard `gen_ai.*` semantic 
 * conventions defined by OpenTelemetry.
 * 
 * Traditional function patching is impossible with the AI SDK because:
 * - Functions are exported as getter-only properties
 * - Properties are non-configurable and cannot be redefined
 * - Attempting to patch throws: `TypeError: Cannot redefine property: generateText`
 * 
 * **Solution:**
 * 
 * This exporter intercepts spans at the export stage and transforms all `ai.*` attributes
 * to proper `gen_ai.*` semantic conventions, then removes the original `ai.*` attributes.
 * This ensures that only compliant `gen_ai.*` attributes are sent to AgentOps.
 * 
 * **Benefits:**
 * - Works with ALL AI SDK functions without needing individual patches
 * - Robust against AI SDK version changes
 * - Maintains full compatibility with AI SDK's built-in telemetry
 * - Ensures proper semantic convention compliance
 * 
 * **Process:**
 * 1. Wraps the base AgentOps exporter
 * 2. Intercepts spans before export
 * 3. Identifies AI SDK spans by attribute patterns
 * 4. Maps `ai.*` attributes to `gen_ai.*` conventions
 * 5. Removes original `ai.*` attributes
 * 6. Forwards transformed spans to the wrapped exporter
 */
export class AISDKExporter implements SpanExporter {
  constructor(private readonly wrappedExporter: SpanExporter) {}

  /**
   * Exports spans after transforming AI SDK attributes.
   */
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    const transformedSpans = spans.map(span => this.transformSpan(span));
    this.wrappedExporter.export(transformedSpans, resultCallback);
  }

  /**
   * Shuts down the wrapped exporter.
   */
  shutdown(): Promise<void> {
    return this.wrappedExporter.shutdown();
  }

  /**
   * Forces flush on the wrapped exporter.
   */
  forceFlush(): Promise<void> {
    if (this.wrappedExporter.forceFlush) {
      return this.wrappedExporter.forceFlush();
    }
    return Promise.resolve();
  }

  /**
   * Transforms a span to use only gen_ai attributes.
   */
  private transformSpan(span: ReadableSpan): ReadableSpan {
    // Check if this is an AI SDK span
    if (!this.isAISDKSpan(span)) {
      return span;
    }

    debug(`Transforming AI SDK span: ${span.name}`);

    // Create a new attributes object with transformed attributes
    const originalAttributes = span.attributes;
    const transformedAttributes = this.transformAttributes(originalAttributes);

    // Create a new span object that preserves the original prototype and methods
    const transformedSpan = Object.create(Object.getPrototypeOf(span));
    Object.assign(transformedSpan, span);
    transformedSpan.attributes = transformedAttributes;

    debug(`Transformed ${Object.keys(originalAttributes).length} attributes to ${Object.keys(transformedAttributes).length} attributes`);

    return transformedSpan;
  }

  /**
   * Checks if a span is from the AI SDK.
   */
  private isAISDKSpan(span: ReadableSpan): boolean {
    const attributes = span.attributes;
    
    // Check for AI SDK specific attributes
    return Object.keys(attributes).some(key => 
      key.startsWith('ai.') || 
      key.startsWith('gen_ai.') ||
      span.name.includes('ai.') ||
      span.instrumentationLibrary?.name?.includes('ai')
    );
  }

  /**
   * Transforms attributes from AI SDK format to gen_ai format.
   */
  private transformAttributes(attributes: Record<string, any>): Record<string, any> {
    const transformed: Record<string, any> = {};

    // First, copy all non-AI attributes
    for (const [key, value] of Object.entries(attributes)) {
      if (!key.startsWith('ai.')) {
        transformed[key] = value;
      }
    }

    // Transform AI SDK attributes to gen_ai attributes
    this.mapBasicAttributes(attributes, transformed);
    this.mapPromptMessages(attributes, transformed);
    this.mapToolCalls(attributes, transformed);
    this.mapRequestSettings(attributes, transformed);
    this.mapResponseData(attributes, transformed);
    this.mapUsageMetrics(attributes, transformed);
    this.mapStreamingMetrics(attributes, transformed);

    return transformed;
  }

  /**
   * Maps basic AI SDK attributes to gen_ai conventions.
   */
  private mapBasicAttributes(attributes: Record<string, any>, transformed: Record<string, any>): void {
    const basicMapping: Record<string, string> = {
      'ai.model.provider': GEN_AI_SYSTEM,
      'ai.model.id': GEN_AI_REQUEST_MODEL,
      'ai.response.model': GEN_AI_RESPONSE_MODEL,
      'ai.response.id': GEN_AI_RESPONSE_ID,
    };

    for (const [aiKey, genAiKey] of Object.entries(basicMapping)) {
      if (attributes[aiKey] !== undefined) {
        transformed[genAiKey] = attributes[aiKey];
      }
    }

    // Handle finish reason (convert to array format)
    if (attributes['ai.response.finishReason'] !== undefined) {
      transformed[GEN_AI_RESPONSE_FINISH_REASON] = [attributes['ai.response.finishReason']];
    }
  }

  /**
   * Maps prompt messages to indexed semantic conventions.
   */
  private mapPromptMessages(attributes: Record<string, any>, transformed: Record<string, any>): void {
    if (attributes['ai.prompt.messages'] && Array.isArray(attributes['ai.prompt.messages'])) {
      const messages = attributes['ai.prompt.messages'];
      
      messages.forEach((message: any, index: number) => {
        if (message.role) {
          transformed[GEN_AI_PROMPT_ROLE.replace('{i}', index.toString())] = message.role;
        }
        if (message.content) {
          transformed[GEN_AI_PROMPT_CONTENT.replace('{i}', index.toString())] = 
            typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
        }
      });
    }
  }

  /**
   * Maps tool calls to indexed semantic conventions.
   */
  private mapToolCalls(attributes: Record<string, any>, transformed: Record<string, any>): void {
    if (attributes['ai.request.tools'] && Array.isArray(attributes['ai.request.tools'])) {
      const tools = attributes['ai.request.tools'];
      
      tools.forEach((tool: any, index: number) => {
        if (tool.name) {
          transformed[`gen_ai.request.tools.${index}.name`] = tool.name;
        }
        if (tool.parameters) {
          transformed[`gen_ai.request.tools.${index}.arguments`] = JSON.stringify(tool.parameters);
        }
      });
    }
  }

  /**
   * Maps request settings to gen_ai conventions.
   */
  private mapRequestSettings(attributes: Record<string, any>, transformed: Record<string, any>): void {
    const settingsMapping: Record<string, string> = {
      'ai.request.temperature': GEN_AI_REQUEST_TEMPERATURE,
      'ai.request.maxTokens': GEN_AI_REQUEST_MAX_TOKENS,
      'ai.request.topP': GEN_AI_REQUEST_TOP_P,
      'ai.request.topK': GEN_AI_REQUEST_TOP_K,
      'ai.request.frequencyPenalty': GEN_AI_REQUEST_FREQUENCY_PENALTY,
      'ai.request.presencePenalty': GEN_AI_REQUEST_PRESENCE_PENALTY,
      'ai.request.stopSequences': GEN_AI_REQUEST_STOP_SEQUENCES,
    };

    for (const [aiKey, genAiKey] of Object.entries(settingsMapping)) {
      if (attributes[aiKey] !== undefined) {
        transformed[genAiKey] = attributes[aiKey];
      }
    }

    // Handle streaming boolean
    if (attributes['ai.request.streaming'] !== undefined) {
      transformed[GEN_AI_REQUEST_STREAMING] = attributes['ai.request.streaming'];
    }
  }

  /**
   * Maps response data to gen_ai conventions.
   */
  private mapResponseData(attributes: Record<string, any>, transformed: Record<string, any>): void {
    // Response text/content is typically already in gen_ai format
    // or handled by the AI SDK's built-in telemetry
    
    // Handle response metadata
    if (attributes['ai.response.text']) {
      transformed['gen_ai.response.text'] = attributes['ai.response.text'];
    }
    
    if (attributes['ai.response.timestamp']) {
      transformed['gen_ai.response.timestamp'] = attributes['ai.response.timestamp'];
    }
  }

  /**
   * Maps usage metrics to gen_ai conventions.
   */
  private mapUsageMetrics(attributes: Record<string, any>, transformed: Record<string, any>): void {
    const usageMapping: Record<string, string> = {
      'ai.usage.promptTokens': GEN_AI_USAGE_PROMPT_TOKENS,
      'ai.usage.completionTokens': GEN_AI_USAGE_COMPLETION_TOKENS,
      'ai.usage.totalTokens': GEN_AI_USAGE_TOTAL_TOKENS,
    };

    for (const [aiKey, genAiKey] of Object.entries(usageMapping)) {
      if (attributes[aiKey] !== undefined) {
        transformed[genAiKey] = attributes[aiKey];
      }
    }
  }

  /**
   * Maps streaming metrics to gen_ai conventions.
   */
  private mapStreamingMetrics(attributes: Record<string, any>, transformed: Record<string, any>): void {
    const streamingMapping: Record<string, string> = {
      'ai.streaming.timeToFirstToken': GEN_AI_STREAMING_TIME_TO_FIRST_TOKEN,
      'ai.streaming.timeToGenerate': GEN_AI_STREAMING_TIME_TO_GENERATE,
      'ai.streaming.chunkCount': GEN_AI_STREAMING_CHUNK_COUNT,
    };

    for (const [aiKey, genAiKey] of Object.entries(streamingMapping)) {
      if (attributes[aiKey] !== undefined) {
        transformed[genAiKey] = attributes[aiKey];
      }
    }
  }
} 