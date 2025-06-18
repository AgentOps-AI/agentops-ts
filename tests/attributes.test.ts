import { getPackageVersion, safeSerialize, extractAttributesFromMapping, extractAttributesFromMappingWithIndex, extractAttributesFromArray, getGlobalResource } from '../src/attributes';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { Resource, detectResourcesSync } from '@opentelemetry/resources';

declare const jest: any;

jest.mock('@opentelemetry/resources', () => {
  const actual = jest.requireActual('@opentelemetry/resources');
  return {
    ...actual,
    detectResourcesSync: jest.fn(() => {
      const res = new actual.Resource({ existing: 'attr' });
      res.waitForAsyncAttributes = jest.fn().mockResolvedValue(undefined);
      return res;
    }),
  };
});

describe('attributes helpers', () => {
  it('safeSerialize handles objects and errors gracefully', () => {
    expect(safeSerialize({ a: 1 })).toBe('{"a":1}');
    const cyclic: any = {}; cyclic.self = cyclic;
    expect(safeSerialize(cyclic)).toBe('[object Object]');
  });

  it('extractAttributesFromMapping converts values', () => {
    const data = { a: 1, b: 'str', c: { foo: 'bar' } };
    const mapping = { x: 'a', y: 'b', z: 'c' };
    expect(extractAttributesFromMapping(data, mapping)).toEqual({
      x: '1',
      y: 'str',
      z: '{"foo":"bar"}'
    });
  });

  it('extractAttributesFromMappingWithIndex formats keys', () => {
    const data = { val: 'a' };
    const mapping = { 'item_{i}_{j}': 'val' };
    expect(extractAttributesFromMappingWithIndex(data, mapping, 2, 3)).toEqual({
      'item_2_3': 'a'
    });
  });

  it('extractAttributesFromArray merges indexed mappings', () => {
    const items = [{ name: 'a' }, { name: 'b' }];
    const mapping = { 'n_{i}': 'name' };
    expect(extractAttributesFromArray(items, mapping)).toEqual({
      'n_0': 'a',
      'n_1': 'b'
    });
  });

  it('getGlobalResource merges detected attributes with service info', async () => {
    const resource = await getGlobalResource('svc');
    expect((detectResourcesSync as jest.Mock)).toHaveBeenCalled();
    expect(resource.attributes['existing']).toBe('attr');
    expect(resource.attributes[SEMRESATTRS_SERVICE_NAME]).toBe('svc');
    expect(resource.attributes[SEMRESATTRS_SERVICE_VERSION]).toBe(getPackageVersion());
  });
});
