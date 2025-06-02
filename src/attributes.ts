import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

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