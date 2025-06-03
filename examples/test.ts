import { agentops } from '../src';

async function main() {
  const testLib = require('agentops-test-lib');

  await agentops.init({ apiKey: '55931aa5-ca2e-4936-91ea-2d93f40fac4d' });

  const result = testLib.createCompletion('What is the meaning of life?', {
    model: 'gpt-4',
    temperature: 0.8,
    maxTokens: 50
  });
  console.log('testLib.createCompletion:', result);
}

if (require.main === module) {
  main().catch(console.error);
}