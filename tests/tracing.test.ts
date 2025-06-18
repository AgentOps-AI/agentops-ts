import './mocks/opentelemetry';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { TracingCore } from '../src/tracing';
import { BearerToken } from '../src/api';
import { Resource } from '@opentelemetry/resources';

const config = { otlpEndpoint: 'https://otlp.example', logLevel: 'debug', serviceName: 'svc' } as any;

describe('TracingCore', () => {
  it('starts and shuts down sdk', async () => {
    const core = new TracingCore(config, new BearerToken('t'), [], new Resource({}));
    await core.shutdown();
    const instance = (NodeSDK as jest.Mock).mock.results[0].value;
    expect(instance.shutdown).toHaveBeenCalled();
  });
});
