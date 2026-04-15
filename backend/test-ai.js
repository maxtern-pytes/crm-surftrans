// Test Ollama AI Service
require('dotenv').config();
const ollamaService = require('./services/ollama');

async function testOllama() {
  console.log('🧪 Testing Ollama AI Service...\n');
  console.log('OLLAMA_URL:', process.env.OLLAMA_URL);
  console.log('OLLAMA_MODEL:', process.env.OLLAMA_MODEL);
  console.log('TOGETHER_API_KEY:', process.env.TOGETHER_API_KEY ? 'SET' : 'NOT SET');
  console.log('\n');

  try {
    console.log('📤 Sending test request to Ollama...');
    
    const response = await ollamaService.callOllama(
      'Hello, are you working? Respond briefly.',
      'You are a helpful assistant.'
    );

    console.log('✅ SUCCESS! Ollama responded:');
    console.log('-----------------------------------');
    console.log(response);
    console.log('-----------------------------------\n');
    
  } catch (error) {
    console.error('❌ FAILED! Error:');
    console.error(error.message);
    console.error('\nFull error:', error);
  }
}

testOllama();
