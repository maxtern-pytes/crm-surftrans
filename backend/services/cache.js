/**
 * Intelligent Caching Service
 * Manages caching for AI responses, market data, and scraped data
 */

const redisCache = require('../config/redis');

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  AI_RESPONSE: 600,           // 10 minutes
  MARKET_DATA: 3600,          // 1 hour
  SCRAPED_DATA: 1800,         // 30 minutes
  QUOTE_DATA: 900,            // 15 minutes
  CLIENT_PROSPECTS: 7200,     // 2 hours
  CARRIER_DATA: 3600,         // 1 hour
  LOAD_RECOMMENDATIONS: 1800, // 30 minutes
  EMAIL_TEMPLATES: 86400,     // 24 hours
  USER_SESSIONS: 86400,       // 24 hours
};

/**
 * Generate cache key with namespace
 */
function generateKey(namespace, ...parts) {
  const keyParts = ['surftrans', namespace, ...parts.filter(Boolean)];
  return keyParts.join(':');
}

/**
 * Cache AI response
 */
async function cacheAIResponse(prompt, response) {
  const key = generateKey('ai', hashPrompt(prompt));
  await redisCache.set(key, {
    response,
    timestamp: Date.now(),
    prompt: prompt.substring(0, 100)
  }, CACHE_TTL.AI_RESPONSE);
}

/**
 * Get cached AI response
 */
async function getAIResponse(prompt) {
  const key = generateKey('ai', hashPrompt(prompt));
  return await redisCache.get(key);
}

/**
 * Cache market data
 */
async function cacheMarketData(lane, data) {
  const key = generateKey('market', lane);
  await redisCache.set(key, {
    ...data,
    timestamp: Date.now()
  }, CACHE_TTL.MARKET_DATA);
}

/**
 * Get cached market data
 */
async function getMarketData(lane) {
  const key = generateKey('market', lane);
  return await redisCache.get(key);
}

/**
 * Cache scraped load board data
 */
async function cacheScrapedLoads(source, loads) {
  const key = generateKey('scraped', 'loads', source);
  await redisCache.set(key, {
    loads,
    count: loads.length,
    timestamp: Date.now()
  }, CACHE_TTL.SCRAPED_DATA);
}

/**
 * Get cached scraped loads
 */
async function getScrapedLoads(source) {
  const key = generateKey('scraped', 'loads', source);
  return await redisCache.get(key);
}

/**
 * Cache quote analysis
 */
async function cacheQuote(quoteKey, quoteData) {
  const key = generateKey('quote', quoteKey);
  await redisCache.set(key, {
    ...quoteData,
    timestamp: Date.now()
  }, CACHE_TTL.QUOTE_DATA);
}

/**
 * Get cached quote
 */
async function getQuote(quoteKey) {
  const key = generateKey('quote', quoteKey);
  return await redisCache.get(key);
}

/**
 * Cache client prospects
 */
async function cacheProspects(searchParams, prospects) {
  const key = generateKey('prospects', hashPrompt(JSON.stringify(searchParams)));
  await redisCache.set(key, {
    prospects,
    count: prospects.length,
    timestamp: Date.now()
  }, CACHE_TTL.CLIENT_PROSPECTS);
}

/**
 * Get cached prospects
 */
async function getProspects(searchParams) {
  const key = generateKey('prospects', hashPrompt(JSON.stringify(searchParams)));
  return await redisCache.get(key);
}

/**
 * Cache carrier matches
 */
async function cacheCarrierMatches(loadId, carriers) {
  const key = generateKey('carrier_matches', loadId);
  await redisCache.set(key, {
    carriers,
    count: carriers.length,
    timestamp: Date.now()
  }, CACHE_TTL.CARRIER_DATA);
}

/**
 * Get cached carrier matches
 */
async function getCarrierMatches(loadId) {
  const key = generateKey('carrier_matches', loadId);
  return await redisCache.get(key);
}

/**
 * Cache load recommendations
 */
async function cacheRecommendations(agentId, recommendations) {
  const key = generateKey('recommendations', agentId);
  await redisCache.set(key, {
    recommendations,
    count: recommendations.length,
    timestamp: Date.now()
  }, CACHE_TTL.LOAD_RECOMMENDATIONS);
}

/**
 * Get cached recommendations
 */
async function getRecommendations(agentId) {
  const key = generateKey('recommendations', agentId);
  return await redisCache.get(key);
}

/**
 * Invalidate cache by pattern
 */
async function invalidatePattern(pattern) {
  if (!redisCache.isAvailable()) return;
  
  try {
    const client = redisCache.getClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`Invalidated ${keys.length} cache keys matching ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error.message);
  }
}

/**
 * Clear all cache (use with caution)
 */
async function clearAll() {
  if (!redisCache.isAvailable()) return;
  
  try {
    const client = redisCache.getClient();
    const keys = await client.keys('surftrans:*');
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`Cleared ${keys.length} cache keys`);
    }
  } catch (error) {
    console.error('Cache clear error:', error.message);
  }
}

/**
 * Get cache statistics
 */
async function getStats() {
  if (!redisCache.isAvailable()) {
    return { available: false };
  }
  
  try {
    const client = redisCache.getClient();
    const info = await client.info();
    
    return {
      available: true,
      info: parseRedisInfo(info)
    };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

/**
 * Hash prompt for cache key (simplified)
 */
function hashPrompt(prompt) {
  let hash = 0;
  const str = prompt.substring(0, 200);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Parse Redis INFO command output
 */
function parseRedisInfo(info) {
  const lines = info.split('\r\n');
  const parsed = {};
  
  for (const line of lines) {
    const [key, value] = line.split(':');
    if (key && value) {
      parsed[key] = value;
    }
  }
  
  return parsed;
}

/**
 * Smart cache wrapper for async functions
 */
function smartCache(namespace, ttl, generatorFn) {
  return async function(...args) {
    const key = generateKey(namespace, ...args.map(a => typeof a === 'string' ? a : JSON.stringify(a)));
    
    // Try cache first
    const cached = await redisCache.get(key);
    if (cached) {
      return cached;
    }
    
    // Generate new data
    const result = await generatorFn(...args);
    
    // Cache it
    if (result) {
      await redisCache.set(key, {
        ...result,
        timestamp: Date.now()
      }, ttl);
    }
    
    return result;
  };
}

module.exports = {
  CACHE_TTL,
  generateKey,
  cacheAIResponse,
  getAIResponse,
  cacheMarketData,
  getMarketData,
  cacheScrapedLoads,
  getScrapedLoads,
  cacheQuote,
  getQuote,
  cacheProspects,
  getProspects,
  cacheCarrierMatches,
  getCarrierMatches,
  cacheRecommendations,
  getRecommendations,
  invalidatePattern,
  clearAll,
  getStats,
  smartCache
};
