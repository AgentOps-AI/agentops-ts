import { agentops } from '../src';
import { createCompletion } from 'agentops-test-lib';

async function main() {
  await agentops.init();

  const result = createCompletion('What is the meaning of life?', {
    model: 'gpt-4',
    temperature: 0.8,
    maxTokens: 50
  });
  console.log('createCompletion:', result);
}

if (require.main === module) {
  main().catch(console.error);
}