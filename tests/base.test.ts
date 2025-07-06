import { InstrumentationBase } from '../src/instrumentation/base';
import { Client } from '../src/client';

class DummyInstrumentation extends InstrumentationBase {
  static readonly metadata = {
    name: 'dummy',
    version: '1.0.0',
    description: 'dummy',
    targetLibrary: 'fs',
    targetVersions: ['*']
  };
  setup = jest.fn((mod) => mod);
}

class RuntimeInstrumentation extends DummyInstrumentation {
  static readonly metadata = {
    ...DummyInstrumentation.metadata,
    name: 'runtime',
  };
  static readonly useRuntimeTargeting = true;
}

describe('InstrumentationBase', () => {
  let mockClient: Client;

  beforeEach(() => {
    mockClient = new Client();
  });

  it('reports availability of target module', () => {
    expect(DummyInstrumentation.available).toBe(true);
    class Missing extends DummyInstrumentation { static readonly metadata = { ...DummyInstrumentation.metadata, targetLibrary: 'nonexistentlib' }; }
    expect(Missing.available).toBe(false);
  });

  it('runtime targeting runs setup only once', () => {
    const inst = new RuntimeInstrumentation(mockClient);
    inst.setupRuntimeTargeting();
    expect(inst.setup).toHaveBeenCalledTimes(1);
    inst.setupRuntimeTargeting();
    expect(inst.setup).toHaveBeenCalledTimes(1);
    inst.teardownRuntimeTargeting();
    expect(inst.setup).toHaveBeenCalledTimes(1);
  });
});
