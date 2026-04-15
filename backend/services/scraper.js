/**
 * Web Scraping Engine
 * Core infrastructure for scraping market data, businesses, and load boards
 * with rate limiting, retry logic, and error handling
 */

const axios = require('axios');
const cheerio = require('cheerio');

class ScraperEngine {
  constructor() {
    this.rateLimiters = new Map();
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    ];
    this.defaultDelay = 2000; // 2 seconds between requests
    this.maxRetries = 3;
  }

  /**
   * Get random user agent
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Check rate limit for domain
   */
  async checkRateLimit(domain) {
    if (!this.rateLimiters.has(domain)) {
      this.rateLimiters.set(domain, {
        lastRequest: 0,
        count: 0,
        resetTime: Date.now()
      });
    }

    const limiter = this.rateLimiters.get(domain);
    const now = Date.now();

    // Reset counter every minute
    if (now - limiter.resetTime > 60000) {
      limiter.count = 0;
      limiter.resetTime = now;
    }

    // Max 30 requests per minute per domain
    if (limiter.count >= 30) {
      const waitTime = 60000 - (now - limiter.resetTime);
      if (waitTime > 0) {
        console.log(`Rate limit reached for ${domain}, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Ensure minimum delay between requests
    const timeSinceLastRequest = now - limiter.lastRequest;
    if (timeSinceLastRequest < this.defaultDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.defaultDelay - timeSinceLastRequest)
      );
    }

    limiter.lastRequest = Date.now();
    limiter.count++;
  }

  /**
   * Fetch URL with retry logic and rate limiting
   */
  async fetch(url, options = {}) {
    const domain = new URL(url).hostname;
    
    // Check rate limit
    await this.checkRateLimit(domain);

    const config = {
      timeout: options.timeout || 10000,
      headers: {
        'User-Agent': options.userAgent || this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        ...options.headers
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    };

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(url, config);
        
        if (response.status === 429) {
          // Rate limited, wait and retry
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited by ${domain}, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (response.status >= 400) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return {
          status: response.status,
          data: response.data,
          headers: response.headers
        };
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt}/${this.maxRetries} failed for ${url}:`, error.message);
        
        if (attempt < this.maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error(`Failed to fetch ${url} after ${this.maxRetries} attempts`);
  }

  /**
   * Parse HTML with Cheerio
   */
  parseHTML(html) {
    return cheerio.load(html);
  }

  /**
   * Extract text from HTML element
   */
  extractText($, selector) {
    const element = $(selector);
    return element.text().trim();
  }

  /**
   * Extract attribute from HTML element
   */
  extractAttr($, selector, attribute) {
    const element = $(selector);
    return element.attr(attribute) || '';
  }

  /**
   * Extract all matching elements
   */
  extractAll($, selector, callback) {
    const results = [];
    $(selector).each((index, element) => {
      const result = callback(index, $(element));
      if (result) results.push(result);
    });
    return results;
  }

  /**
   * Clean and normalize text
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\n\r\t]/g, '')
      .trim();
  }

  /**
   * Extract numbers from text
   */
  extractNumber(text) {
    const match = text.replace(/[^0-9.-]/g, '').match(/-?[0-9]+\.?[0-9]*/);
    return match ? parseFloat(match[0]) : null;
  }

  /**
   * Extract price from text
   */
  extractPrice(text) {
    const match = text.replace(/[^0-9.,]/g, '').match(/[0-9]+\.?[0-9]*/);
    return match ? parseFloat(match[0]) : null;
  }

  /**
   * Log scraping activity
   */
  logScrape(source, status, data = {}) {
    console.log(`[SCRAPER] ${source} - ${status} - ${JSON.stringify(data).substring(0, 100)}`);
  }

  /**
   * Validate extracted data
   */
  validateData(data, requiredFields) {
    for (const field of requiredFields) {
      if (!data[field]) {
        return false;
      }
    }
    return true;
  }
}

// Singleton instance
const scraperEngine = new ScraperEngine();

module.exports = scraperEngine;
