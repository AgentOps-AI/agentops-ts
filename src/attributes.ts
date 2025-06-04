import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

export type AttributeMap = Record<string, string>;
export type IndexedAttributeMap = Record<string, string>;
export type IndexedAttributeData = { i: number; j?: number };


const packageInfo = require('../package.json');

export function getPackageVersion(): string {
  return packageInfo.version;
}

export function createGlobalResourceAttributes(serviceName: string): Resource {
  return new Resource({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: getPackageVersion(),
  });
}

/**
 * Helper function to safely serialize complex objects.
 */
export function safeSerialize(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Helper function to extract attributes based on a mapping.
 */
export function extractAttributesFromMapping(data: any, mapping: AttributeMap): AttributeMap {
  const attributes: AttributeMap = {};

  for (const [target, source] of Object.entries(mapping)) {
    let value: any;

    // TODO not proud of this
    if (typeof data === 'object' && data !== null && source in data) {
      value = data[source];
    } else if (typeof data === 'object' && data !== null && typeof data[source] !== 'undefined') {
      value = data[source];
    } else {
      continue;
    }

    // Skip if value is None or empty
    if (value === null || value === undefined || (typeof value === 'string' && value === '') ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && Object.keys(value).length === 0)) {
      continue;
    }

    // Serialize complex objects
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      value = safeSerialize(value);
    }

    attributes[target] = value;
  }

  return attributes;
}

/**
 * Helper function to extract attributes based on a mapping with index.
 *
 * This function extends `extractAttributesFromMapping` by allowing for indexed keys in the attribute mapping.
 * The attribute mapping keys should contain format strings for i/j, e.g. `my_attr_{i}` or `my_attr_{i}_{j}`.
 *
 * @param data - The data object to extract attributes from.
 * @param mapping - An IndexedAttributeMap that defines how to extract attributes with indices.
 * @param i - The index for the primary attribute.
 * @param j - An optional secondary index for attributes that require it.
 * @return An AttributeMap containing the extracted attributes with formatted keys.
 */
export function extractAttributesFromMappingWithIndex(
  data: any,
  mapping: IndexedAttributeMap,
  i: number,
  j?: number
): AttributeMap {
  const attributes: AttributeMap = {};

  for (const [target, source] of Object.entries(mapping)) {
    const formatted = target.replace(/\{i\}/g, String(i)).replace(/\{j\}/g, String(j || ''));
    attributes[formatted] = source;
  }

  return extractAttributesFromMapping(data, attributes);
}

/**
 * Helper function to extract indexed attributes from an array of items.
 *
 * This function iterates over an array and applies indexed attribute mapping to each item,
 * combining all attributes into a single AttributeMap.
 *
 * @param items - An array of items to extract attributes from.
 * @param mapping - An IndexedAttributeMap that defines how to extract attributes from each item.
 * @return An AttributeMap containing all extracted attributes from the array.
 */
export function extractAttributesFromArray(items: Array<any>, mapping: IndexedAttributeMap): AttributeMap {
  const attributes: AttributeMap = {};

  items.forEach((item, i) => {
    Object.assign(attributes,
      extractAttributesFromMappingWithIndex(item, mapping, i));
  });

  return attributes;
}