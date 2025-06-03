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
export function extractAttributesFromMapping(spanData: any, attributeMapping: AttributeMap): AttributeMap {
  const attributes: AttributeMap = {};

  for (const [targetAttr, sourceAttr] of Object.entries(attributeMapping)) {
    let value: any;

    if (typeof spanData === 'object' && spanData !== null && sourceAttr in spanData) {
      value = spanData[sourceAttr];
    } else if (typeof spanData === 'object' && spanData !== null && typeof spanData[sourceAttr] !== 'undefined') {
      value = spanData[sourceAttr];
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

    attributes[targetAttr] = value;
  }

  return attributes;
}

/**
 * Helper function to extract attributes based on a mapping with index.
 *
 * This function extends `extractAttributesFromMapping` by allowing for indexed keys in the attribute mapping.
 * The attribute mapping keys should contain format strings for i/j, e.g. `my_attr_{i}` or `my_attr_{i}_{j}`.
 */
export function extractAttributesFromMappingWithIndex(
  spanData: any,
  attributeMapping: IndexedAttributeMap,
  i: number,
  j?: number
): AttributeMap {
  // `i` is required for formatting the attribute keys, `j` is optional
  const formatData: IndexedAttributeData = { i };
  if (j !== undefined) {
    formatData.j = j;
  }

  // Update the attribute mapping to include the index for the span
  const attributeMappingWithIndex: AttributeMap = {};
  for (const [targetAttr, sourceAttr] of Object.entries(attributeMapping)) {
    const formattedTargetAttr = targetAttr.replace(/\{i\}/g, String(i)).replace(/\{j\}/g, String(j || ''));
    attributeMappingWithIndex[formattedTargetAttr] = sourceAttr;
  }

  return extractAttributesFromMapping(spanData, attributeMappingWithIndex);
}

/**
 * Helper function to extract indexed attributes from an array of items.
 *
 * This function iterates over an array and applies indexed attribute mapping to each item,
 * combining all attributes into a single AttributeMap.
 */
export function extractAttributesFromArray(
  items: Array<Record<string, any>>,
  attributeMapping: IndexedAttributeMap
): AttributeMap {
  const attributes: AttributeMap = {};

  items.forEach((item, index) => {
    const itemAttributes = extractAttributesFromMappingWithIndex(
      item,
      attributeMapping,
      index
    );
    Object.assign(attributes, itemAttributes);
  });

  return attributes;
}