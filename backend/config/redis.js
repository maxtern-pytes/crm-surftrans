/**
 * Redis Configuration
 * Used for caching, session management, and job queues
 */

const redis = require('redis');

let client = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection
 */
async function initRedis() {
  if (client) return client;

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    client = redis.createClient({
      url: redisUrl,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.warn('⚠️  Redis connection refused - running without Redis cache');
          isRedisAvailable = false;
          return new Error('Redis server not available');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return new Error('Redis max retries reached');
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    client.on('error', (err) => {
      console.warn('⚠️  Redis error:', err.message);
      isRedisAvailable = false;
    });

    client.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isRedisAvailable = true;
    });

    await client.connect();
    return client;
  } catch (error) {
    console.warn('⚠️  Redis not available, continuing without caching:', error.message);
    isRedisAvailable = false;
    return null;
  }
}

/**
 * Get Redis client instance
 */
function getClient() {
  return client;
}

/**
 * Check if Redis is available
 */
function isAvailable() {
  return isRedisAvailable && client;
}

/**
 * Get value from cache
 */
async function get(key) {
  if (!isAvailable()) return null;
  
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis GET error:', error.message);
    return null;
  }
}

/**
 * Set value in cache with optional TTL (in seconds)
 */
async function set(key, value, ttl = 600) {
  if (!isAvailable()) return false;
  
  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await client.setEx(key, ttl, serialized);
    } else {
      await client.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error('Redis SET error:', error.message);
    return false;
  }
}

/**
 * Delete value from cache
 */
async function del(key) {
  if (!isAvailable()) return false;
  
  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis DEL error:', error.message);
    return false;
  }
}

/**
 * Check if key exists
 */
async function exists(key) {
  if (!isAvailable()) return false;
  
  try {
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    console.error('Redis EXISTS error:', error.message);
    return false;
  }
}

/**
 * Set cache with hash
 */
async function hSet(key, field, value) {
  if (!isAvailable()) return false;
  
  try {
    await client.hSet(key, field, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis HSET error:', error.message);
    return false;
  }
}

/**
 * Get field from hash
 */
async function hGet(key, field) {
  if (!isAvailable()) return null;
  
  try {
    const value = await client.hGet(key, field);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis HGET error:', error.message);
    return null;
  }
}

/**
 * Get all fields from hash
 */
async function hGetAll(key) {
  if (!isAvailable()) return {};
  
  try {
    const hash = await client.hGetAll(key);
    const result = {};
    for (const [field, value] of Object.entries(hash)) {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = value;
      }
    }
    return result;
  } catch (error) {
    console.error('Redis HGETALL error:', error.message);
    return {};
  }
}

/**
 * Increment counter
 */
async function incr(key) {
  if (!isAvailable()) return null;
  
  try {
    return await client.incr(key);
  } catch (error) {
    console.error('Redis INCR error:', error.message);
    return null;
  }
}

/**
 * Set key expiration
 */
async function expire(key, seconds) {
  if (!isAvailable()) return false;
  
  try {
    await client.expire(key, seconds);
    return true;
  } catch (error) {
    console.error('Redis EXPIRE error:', error.message);
    return false;
  }
}

/**
 * Close Redis connection
 */
async function close() {
  if (client) {
    await client.quit();
    client = null;
    isRedisAvailable = false;
    console.log('Redis connection closed');
  }
}

module.exports = {
  initRedis,
  getClient,
  isAvailable,
  get,
  set,
  del,
  exists,
  hSet,
  hGet,
  hGetAll,
  incr,
  expire,
  close
};
