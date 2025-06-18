import { InstrumentationBase } from '../src/instrumentation/base';
import { Client } from '../src/client';

class RuntimeInst extends InstrumentationBase {
  static readonly metadata = {
    name: 'runtime-inst',
    version: '1.0.0',
    description: 'runtime',
    targetLibrary: 'fs',
    targetVersions: ['*'],
  };
  static readonly useRuntimeTargeting = true;
  setupRuntimeTargeting = jest.fn();
}

class SimpleInst extends InstrumentationBase {
  static readonly metadata = {
    name: 'simple-inst',
    version: '1.0.0',
    description: 'simple',
    targetLibrary: 'fs',
    targetVersions: ['*'],
  };
}

describe('InstrumentationRegistry', () => {
  it('initializes and creates runtime instrumentations', () => {
    jest.isolateModules(() => {
      jest.doMock('../src/instrumentation/index', () => ({
        AVAILABLE_INSTRUMENTORS: [RuntimeInst, SimpleInst]
      }));
      const { InstrumentationRegistry } = require('../src/instrumentation/registry');
      const registry = new InstrumentationRegistry(new Client());
      registry.initialize();
      expect(registry.getAvailable().length).toBe(2);
      const active = registry.getActiveInstrumentors();
      expect(active.some((i: any) => i instanceof RuntimeInst)).toBe(true);
      expect(active.some((i: any) => i instanceof SimpleInst)).toBe(true);
    });
  });
});
