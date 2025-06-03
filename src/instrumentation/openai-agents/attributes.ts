/**
 * Common utilities for converting span data to semantic convention attributes.
 */

/**
 * Applies attribute mappings to source data and returns semantic convention attributes.
 * 
 * @param sourceData - The source object to extract data from
 * @param mappings - Object mapping semantic convention attribute names to source field names
 * @returns Object with semantic convention attributes
 */
export function applyAttributeMappings(
  sourceData: Record<string, any>,
  mappings: Record<string, string>
): Record<string, any> {
  const attributes: Record<string, any> = {};

  for (const [attributeName, sourceField] of Object.entries(mappings)) {
    const value = sourceData[sourceField];
    
    if (value !== undefined) {
      attributes[attributeName] = value;
    }
  }

  return attributes;
}