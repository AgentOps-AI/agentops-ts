import { getSpanName, getSpanKind } from '../src/instrumentation/openai-agents/attributes';
import { SpanKind } from '@opentelemetry/api';

describe('OpenAI converters', () => {
  it('getSpanName returns name or type', () => {
    expect(getSpanName({ type:'generation', name:'test-name'} as any)).toBe('test-name');
    expect(getSpanName({ type:'generation'} as any)).toBe('Generation');
    expect(getSpanName({ type:'agent', name:'my-agent'} as any)).toBe('my-agent');
    expect(getSpanName({ type:'function'} as any)).toBe('Function');
  });

  it('getSpanKind returns correct span kind', () => {
    expect(getSpanKind({ type:'generation'} as any)).toBe(SpanKind.INTERNAL);
    expect(getSpanKind({ type:'agent'} as any)).toBe(SpanKind.INTERNAL);
    expect(getSpanKind({ type:'function'} as any)).toBe(SpanKind.INTERNAL);
  });
});
