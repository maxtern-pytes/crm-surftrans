const { search } = require('duck-duck-scrape');
const fetch = require('node-fetch');

/**
 * Web Search Service - Gives local Ollama internet access
 * Searches the web and extracts relevant information
 */

/**
 * Search the web and return results
 */
async function webSearch(query, maxResults = 5) {
  try {
    console.log(`🔍 Searching web for: ${query}`);
    
    // Add a small delay to avoid being blocked
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const searchResults = await search(query, { 
      safeSearch: 'OFF',
      maxResults: maxResults 
    });

    const results = searchResults.results.map(result => ({
      title: result.title,
      snippet: result.description,
      url: result.url,
    }));

    console.log(`✅ Found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('Web search error:', error.message);
    // Return empty array but don't crash
    return [];
  }
}

/**
 * Fetch and extract content from a URL
 */
async function fetchWebpage(url) {
  try {
    console.log(`📄 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Extract text content (simple extraction)
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000); // Limit to 3000 chars

    console.log(`✅ Fetched ${text.length} characters`);
    return { url, text: text.substring(0, 3000) };
  } catch (error) {
    console.error('Fetch webpage error:', error.message);
    return null;
  }
}

/**
 * Search and get a comprehensive answer from multiple sources
 */
async function searchAndGetAnswer(query, maxResults = 3) {
  console.log(`🌐 Internet search for: ${query}`);
  
  // Add delay before search to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Step 1: Search the web
  const searchResults = await webSearch(query, maxResults);
  
  if (searchResults.length === 0) {
    console.log('⚠️ No search results found, AI will use training data');
    return {
      query,
      sources: [],
      context: '',
      summary: 'No search results found. Using AI training data.'
    };
  }

  // Step 2: Fetch content from top results (with delays)
  const fetchedContent = [];
  for (const result of searchResults.slice(0, 2)) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between fetches
    const content = await fetchWebpage(result.url);
    if (content) {
      fetchedContent.push({
        url: content.url,
        title: result.title,
        content: content.text
      });
    }
  }

  // Step 3: Compile search results
  const context = searchResults.map((r, i) => 
    `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`
  ).join('\n\n');

  return {
    query,
    sources: searchResults,
    fetched_content: fetchedContent,
    context: context
  };
}

/**
 * Get current market rates by searching the web
 */
async function getFreightMarketRates(origin, destination, commodity = 'general freight') {
  const searchQuery = `freight rate ${origin} to ${destination} ${commodity} 2024 2025 per mile`;
  
  const searchData = await searchAndGetAnswer(searchQuery, 3);
  
  return {
    query: searchQuery,
    market_data: searchData
  };
}

/**
 * Find company information from the web
 */
async function findCompanyInfo(companyName) {
  const searchQuery = `${companyName} freight shipping logistics contact email`;
  
  const searchData = await searchAndGetAnswer(searchQuery, 5);
  
  return searchData;
}

/**
 * Get news and trends for freight industry
 */
async function getFreightNews(topic = 'freight brokerage') {
  const searchQuery = `${topic} news trends 2024 2025`;
  
  const searchData = await searchAndGetAnswer(searchQuery, 5);
  
  return searchData;
}

module.exports = {
  webSearch,
  fetchWebpage,
  searchAndGetAnswer,
  getFreightMarketRates,
  findCompanyInfo,
  getFreightNews
};
