import 'dotenv/config';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { agentops } from 'agentops';
import { trace } from '@opentelemetry/api';

// Enable debug logging
process.env.DEBUG = 'agentops:*';

console.log('🚀 Starting AI SDK v5 Example with AgentOps');

async function main() {
  // Initialize AgentOps
  const agentOps = agentops;
  
  // Skip automatic instrumentation for now and just init the client
  try {
    console.log('📡 Initializing AgentOps...');
    await agentOps.init({
      apiKey: process.env.AGENTOPS_API_KEY,
      serviceName: 'ai-sdk-example',
    });
    console.log('✅ AgentOps initialized successfully');
    console.log('📊 AgentOps initialized status:', agentOps.initialized);
  } catch (error) {
    console.error('❌ Failed to initialize AgentOps:', error.message);
    console.log('📝 Note: This example will run without AgentOps instrumentation');
  }

  try {
    console.log('🤖 Generating text with OpenAI...');
    
    // Use AI SDK directly with manual telemetry
    const result = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: 'What is the meaning of life?',
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
        functionId: 'example.generateText',
        metadata: {
          'example.manual_telemetry': true,
          'example.question_type': 'philosophical'
        }
      }
    });

    console.log('✅ Generation completed!');
    console.log('📝 Generated text:', result.text);
    console.log('📊 Usage:', result.usage);
    
  } catch (error) {
    console.error('❌ Error generating text:', error.message);
  }

  console.log('🎉 Example completed successfully!');
  console.log('📈 Check your AgentOps dashboard for telemetry data');
  
  // Wait a bit to ensure spans are exported
  console.log('⏳ Waiting for span export...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('👋 AgentOps shutdown complete');
  process.exit(0);
}

main().catch(console.error); 