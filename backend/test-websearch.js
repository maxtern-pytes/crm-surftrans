// Test Web Search
require('dotenv').config();
const webSearch = require('./services/web-search');

async function testWebSearch() {
  console.log('🧪 Testing Web Search Service...\n');

  try {
    console.log('🔍 Searching for current diesel prices...');
    
    const result = await webSearch.searchAndGetAnswer(
      'current US national average diesel fuel price today 2024 2025',
      3
    );

    console.log('✅ Web search successful!');
    console.log('Query:', result.query);
    console.log('Sources found:', result.sources?.length || 0);
    console.log('\nContext preview:');
    console.log('-----------------------------------');
    console.log(result.context?.substring(0, 500) + '...');
    console.log('-----------------------------------\n');
    
  } catch (error) {
    console.error('❌ Web search failed!');
    console.error('Error:', error.message);
  }
}

testWebSearch();
