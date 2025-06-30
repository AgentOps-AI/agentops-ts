import { convertGenerationSpan } from '../src/instrumentation/openai-agents/generation';
import { convertAgentSpan } from '../src/instrumentation/openai-agents/agent';
import { convertFunctionSpan } from '../src/instrumentation/openai-agents/function';
import { convertResponseSpan } from '../src/instrumentation/openai-agents/response';
import { convertHandoffSpan } from '../src/instrumentation/openai-agents/handoff';
import { convertCustomSpan } from '../src/instrumentation/openai-agents/custom';
import { convertGuardrailSpan } from '../src/instrumentation/openai-agents/guardrail';
import { convertTranscriptionSpan, convertSpeechSpan, convertSpeechGroupSpan } from '../src/instrumentation/openai-agents/audio';
import { convertMCPListToolsSpan } from '../src/instrumentation/openai-agents/mcp';
import { getSpanName, getSpanKind, getSpanAttributes } from '../src/instrumentation/openai-agents/attributes';
import { SpanKind } from '@opentelemetry/api';

// Minimal helpers mirroring removed SDK exports
function createEnhancedResponseSpanData(request: any, response: any) {
  return {
    type: 'response',
    response_id: response.responseId,
    _input: request.input,
    _response: {
      id: response.responseId,
      model: request.model,
      usage: {
        input_tokens: response.usage?.inputTokens,
        output_tokens: response.usage?.outputTokens,
        total_tokens: response.usage?.totalTokens,
      },
    },
  } as any;
}

function convertEnhancedResponseSpan(data: any) {
  return convertResponseSpan(data);
}

const genData = {
  type: 'generation',
  model: { model: 'gpt4' },
  model_config: { temperature: 0.5, max_tokens: 10 },
  input: [{ role: 'user', content: 'hi' }],
  output: [{ role: 'assistant', content: 'ok' }],
  usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 }
};

describe('OpenAI converters', () => {
  it('converts generation data', () => {
    const attrs = convertGenerationSpan(genData as any);
    expect(attrs['gen_ai.request.model']).toBe('gpt4');
    expect(attrs['gen_ai.completion.0.content']).toBe('ok');
  });

  it('converts other span types', () => {
    expect(convertFunctionSpan({ type:'function', name:'n', input:'i', output:'o' } as any)['function.name']).toBe('n');
    expect(convertAgentSpan({ type:'agent', name:'a', tools:[{name:'t'}] } as any)['agent.name']).toBe('a');
    expect(convertHandoffSpan({ type:'handoff', from_agent:'a', to_agent:'b' } as any)['agent.handoff.{i}.from']).toBe('a');
    expect(convertCustomSpan({ type:'custom', name:'n', data:{} } as any)['custom.name']).toBe('n');
    expect(convertGuardrailSpan({ type:'guardrail', name:'n', triggered:true } as any)['guardrail.name']).toBe('n');
    expect(convertTranscriptionSpan({ type:'transcription', input:{data:'d',format:'f'}, output:'o', model:'m'} as any)['audio.output.data']).toBe('o');
    expect(convertSpeechSpan({ type:'speech', output:{data:'d',format:'f'}, model:'m'} as any)['audio.output.data']).toBe('d');
    expect(convertSpeechGroupSpan({ type:'speech_group', input:'i'} as any)['audio.input.data']).toBe('i');
    expect(convertMCPListToolsSpan({ type:'mcp_tools', server:'s', result:['x'] } as any)['mcp.server']).toBe('s');
  });

  it('getSpanName and kind', () => {
    expect(getSpanName({ type:'generation', name:'n'} as any)).toBe('n');
    expect(getSpanName({ type:'custom'} as any)).toBe('Custom');
    expect(getSpanKind('generation')).toBe(SpanKind.CLIENT);
  });

  it('getSpanAttributes merges attributes', () => {
    const span = { spanId:'a', traceId:'b', spanData: genData } as any;
    const attrs = getSpanAttributes(span);
    expect(attrs['openai_agents.span_id']).toBe('a');
    expect(attrs['gen_ai.request.model']).toBe('gpt4');
  });
});
