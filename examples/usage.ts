import { agentops } from '../src';

async function main() {
  // Set your API key via environment variable (preferred):
  // export AGENTOPS_API_KEY=your-api-key
  // 
  // Or pass it explicitly in init():
  // await agentops.init({ apiKey: 'your-api-key' });
  
  await agentops.init();

  const openai = require('openai');
  const client = new openai.OpenAI({ apiKey: 'your-api-key' });

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, world!' }],
      max_tokens: 100,
      temperature: 0.7
    });

    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error);
  }
  // Shutdown happens automatically on process exit
}

if (require.main === module) {
  main().catch(console.error);
}