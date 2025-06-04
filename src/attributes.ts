import { Resource } from '@opentelemetry/resources';
import { detectResourcesSync } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

export type AttributeMap = Record<string, string>;
export type IndexedAttributeMap = Record<string, string>;
export type IndexedAttributeData = { i: number; j?: number };


const packageInfo = require('../package.json');

/**
  * Returns the version of the AgentOps SDK package.
  * @returns {string} - The version string from package.json
 */
export function getPackageVersion(): string {
  return packageInfo.version;
}

/**
  * Creates a global resource attributes object for OpenTelemetry SDK.
  *
  * This includes service name and version, along with any detected resources.
  * Waits for async resource detection to complete to avoid accessing attributes
  * before they are settled.
  *
  * @param serviceName - The name of the service being instrumented
  * @returns A Promise resolving to a Resource object containing global attributes
 */
export async function getGlobalResource(serviceName: string): Promise<Resource> {
  const detectedResource = detectResourcesSync();
  await detectedResource.waitForAsyncAttributes?.();

  return new Resource({
    ...detectedResource.attributes,
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: getPackageVersion()
  });
}

/**
 * Helper function to check if a value is empty or null/undefined.
 *
 * @param value - The value to check
 * @return True if the value should be considered empty
 */
function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Helper function to safely serialize complex objects.
 *
 * @param value - The value to serialize
 * @return A string representation of the value
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
 *
 * @param data - The data object to extract attributes from
 * @param mapping - An AttributeMap that defines how to extract attributes
 * @return An AttributeMap containing the extracted attributes
 */
export function extractAttributesFromMapping(data: any, mapping: AttributeMap): AttributeMap {
  const attributes: AttributeMap = {};

  for (const [target, source] of Object.entries(mapping)) {
    let value: any;

    if (typeof data === 'object' && data !== null && source in data) {
      value = data[source];
    } else {
      continue;
    }

    if (isEmptyValue(value)) {
      continue;
    }

    if (typeof value !== 'string') {
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