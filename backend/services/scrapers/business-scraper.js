/**
 * Business Directory Scraper
 * Discovers traditional and emerging businesses that need logistics support
 * Scrapes business registries, startup databases, and growth signals
 */

const scraper = require('../scraper');
const { run, get, all } = require('../../db/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Discover traditional businesses by industry and location
 */
async function discoverTraditionalBusinesses(params = {}) {
  const {
    industries = ['manufacturing', 'wholesale', 'distribution'],
    regions = [],
    limit = 50
  } = params;

  console.log(`[BUSINESS SCRAPER] Discovering traditional businesses: ${industries.join(', ')}`);

  // Generate business leads based on industry patterns
  // In production, this would scrape actual business directories
  const businesses = generateTraditionalLeads(industries, regions, limit);

  // Store discovered businesses
  for (const business of businesses) {
    storeBusinessLead(business, 'traditional');
  }

  scraper.logScrape('Traditional Businesses', 'success', { count: businesses.length });
  return businesses;
}

/**
 * Discover NEW & EMERGING businesses with high growth potential
 * Focus on startups, funded companies, and trending industries
 */
async function discoverEmergingBusinesses(params = {}) {
  const {
    sources = ['crunchbase', 'shopify', 'linkedin', 'funding_news'],
    signals = ['recent_funding', 'hiring', 'product_launch'],
    industries = [],
    limit = 100
  } = params;

  console.log(`[BUSINESS SCRAPER] Discovering emerging businesses`);

  // Generate emerging business leads
  const businesses = generateEmergingLeads(industries, signals, limit);

  // Store and score emerging businesses
  for (const business of businesses) {
    storeBusinessLead(business, 'emerging');
  }

  scraper.logScrape('Emerging Businesses', 'success', { count: businesses.length });
  return businesses;
}

/**
 * Generate traditional business leads (simulated scraping)
 * In production, replace with actual web scraping
 */
function generateTraditionalLeads(industries, regions, limit) {
  const businesses = [];
  
  const industryCompanies = {
    manufacturing: [
      { name: 'Precision Parts Manufacturing', city: 'Detroit', state: 'MI', freight_spend: 250000 },
      { name: 'Midwest Steel Works', city: 'Chicago', state: 'IL', freight_spend: 500000 },
      { name: 'Texas Manufacturing Co', city: 'Houston', state: 'TX', freight_spend: 350000 },
      { name: 'Pacific Electronics', city: 'Los Angeles', state: 'CA', freight_spend: 180000 },
      { name: 'Carolina Textiles', city: 'Charlotte', state: 'NC', freight_spend: 120000 },
    ],
    wholesale: [
      { name: 'National Wholesale Distributors', city: 'Atlanta', state: 'GA', freight_spend: 400000 },
      { name: 'West Coast Wholesale', city: 'Seattle', state: 'WA', freight_spend: 280000 },
      { name: 'Eastern Wholesale Supply', city: 'Philadelphia', state: 'PA', freight_spend: 320000 },
      { name: 'Central States Wholesale', city: 'Kansas City', state: 'MO', freight_spend: 220000 },
      { name: 'Southern Wholesale Group', city: 'Miami', state: 'FL', freight_spend: 190000 },
    ],
    distribution: [
      { name: 'FastTrack Distribution', city: 'Dallas', state: 'TX', freight_spend: 450000 },
      { name: 'Metro Logistics Partners', city: 'Denver', state: 'CO', freight_spend: 310000 },
      { name: 'Coastal Distribution Centers', city: 'Long Beach', state: 'CA', freight_spend: 520000 },
      { name: 'Heartland Distribution', city: 'Minneapolis', state: 'MN', freight_spend: 240000 },
      { name: 'Southeast Distribution Hub', city: 'Nashville', state: 'TN', freight_spend: 275000 },
    ]
  };

  let count = 0;
  for (const industry of industries) {
    const companies = industryCompanies[industry] || [];
    for (const company of companies) {
      if (count >= limit) break;
      
      if (regions.length === 0 || regions.includes(company.state)) {
        businesses.push({
          id: uuidv4(),
          company_name: company.name,
          industry: industry,
          city: company.city,
          state: company.state,
          location: `${company.city}, ${company.state}`,
          estimated_annual_freight_spend: company.freight_spend,
          fit_score: calculateFitScore(company.freight_spend, industry),
          conversion_probability: Math.min(60, company.freight_spend / 10000),
          source: 'traditional_directory',
          is_emerging: false,
          growth_signals: [],
          contact_name: 'Operations Manager',
          email: `contact@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: null,
          website: `www.${company.name.toLowerCase().replace(/\s+/g, '')}.com`
        });
        count++;
      }
    }
  }

  return businesses;
}

/**
 * Generate emerging business leads with growth signals
 * Simulates scraping from Crunchbase, funding news, job postings, etc.
 */
function generateEmergingLeads(targetIndustries, signals, limit) {
  const businesses = [];

  // High-growth emerging industries
  const emergingIndustries = [
    { industry: 'cannabis', growth_rate: 0.30, avg_funding: 2000000 },
    { industry: 'ev_battery', growth_rate: 0.50, avg_funding: 5000000 },
    { industry: 'renewable_energy', growth_rate: 0.40, avg_funding: 3000000 },
    { industry: 'food_tech', growth_rate: 0.35, avg_funding: 1500000 },
    { industry: 'health_wellness', growth_rate: 0.25, avg_funding: 800000 },
    { industry: 'pet_industry', growth_rate: 0.20, avg_funding: 600000 },
    { industry: 'dtc_brands', growth_rate: 0.45, avg_funding: 1000000 },
    { industry: 'tech_hardware', growth_rate: 0.30, avg_funding: 2500000 },
  ];

  const cities = [
    { city: 'Los Angeles', state: 'CA', hub: 'tech' },
    { city: 'San Francisco', state: 'CA', hub: 'startup' },
    { city: 'Austin', state: 'TX', hub: 'tech' },
    { city: 'Denver', state: 'CO', hub: 'cannabis' },
    { city: 'Seattle', state: 'WA', hub: 'tech' },
    { city: 'Miami', state: 'FL', hub: 'dtc' },
    { city: 'Chicago', state: 'IL', hub: 'manufacturing' },
    { city: 'New York', state: 'NY', hub: 'dtc' },
    { city: 'Portland', state: 'OR', hub: 'sustainable' },
    { city: 'Phoenix', state: 'AZ', hub: 'ev' },
  ];

  const companyPrefixes = {
    cannabis: ['Green', 'Canna', 'Hemp', 'Leaf', 'Nature'],
    ev_battery: ['Volt', 'Power', 'Energy', 'Tesla', 'Charge'],
    renewable_energy: ['Solar', 'Wind', 'Green', 'Eco', 'Clean'],
    food_tech: ['Fresh', 'Organic', 'Meal', 'Food', 'Kitchen'],
    health_wellness: ['Vital', 'Health', 'Wellness', 'Life', 'Pure'],
    pet_industry: ['Paw', 'Pet', 'Tail', 'Fur', 'Bark'],
    dtc_brands: ['Direct', 'Modern', 'Urban', 'Style', 'Craft'],
    tech_hardware: ['Tech', 'Smart', 'Digital', 'Inno', 'Next']
  };

  const companySuffixes = ['Tech', 'Co', 'Labs', 'Inc', 'Solutions', 'Systems', 'Brands', 'Supply'];

  let count = 0;
  for (const ind of emergingIndustries) {
    if (targetIndustries.length > 0 && !targetIndustries.includes(ind.industry)) {
      continue;
    }

    const numCompanies = Math.min(10, Math.ceil(limit / emergingIndustries.length));
    
    for (let i = 0; i < numCompanies && count < limit; i++) {
      const cityInfo = cities[Math.floor(Math.random() * cities.length)];
      const prefix = companyPrefixes[ind.industry][Math.floor(Math.random() * companyPrefixes[ind.industry].length)];
      const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
      const companyName = `${prefix}${suffix}`;

      // Random growth signals
      const companySignals = [];
      if (Math.random() > 0.3) companySignals.push('recent_funding');
      if (Math.random() > 0.4) companySignals.push('hiring_logistics');
      if (Math.random() > 0.5) companySignals.push('product_launch');
      if (Math.random() > 0.6) companySignals.push('facility_expansion');
      if (Math.random() > 0.7) companySignals.push('retail_partnership');

      const fundingAmount = companySignals.includes('recent_funding') 
        ? ind.avg_funding * (0.5 + Math.random()) 
        : 0;

      const estimatedFreightSpend = fundingAmount > 0 
        ? fundingAmount * 0.15 // 15% of funding goes to logistics
        : ind.avg_funding * 0.05;

      businesses.push({
        id: uuidv4(),
        company_name: companyName,
        industry: ind.industry,
        city: cityInfo.city,
        state: cityInfo.state,
        location: `${cityInfo.city}, ${cityInfo.state}`,
        estimated_annual_freight_spend: Math.round(estimatedFreightSpend),
        fit_score: calculateEmergingFitScore(ind, companySignals, estimatedFreightSpend),
        conversion_probability: calculateEmergingConversionProbability(ind, companySignals),
        source: 'emerging_discovery',
        is_emerging: true,
        growth_signals: companySignals,
        funding_amount: Math.round(fundingAmount),
        funding_stage: fundingAmount > 2000000 ? 'Series A' : fundingAmount > 500000 ? 'Seed' : 'Pre-seed',
        growth_rate: ind.growth_rate,
        contact_name: 'Founder / CEO',
        email: `hello@${companyName.toLowerCase()}.com`,
        phone: null,
        website: `www.${companyName.toLowerCase()}.com`,
        linkedin: `linkedin.com/company/${companyName.toLowerCase()}`,
        employee_count: Math.floor(10 + Math.random() * 90),
        year_founded: 2020 + Math.floor(Math.random() * 4)
      });

      count++;
    }
  }

  return businesses;
}

/**
 * Calculate fit score for traditional businesses
 */
function calculateFitScore(freightSpend, industry) {
  let score = 50;
  
  // Higher freight spend = better fit
  if (freightSpend > 400000) score += 30;
  else if (freightSpend > 200000) score += 20;
  else if (freightSpend > 100000) score += 10;

  // Industry demand
  const highDemandIndustries = ['manufacturing', 'distribution'];
  if (highDemandIndustries.includes(industry)) score += 10;

  return Math.min(100, score);
}

/**
 * Calculate fit score for emerging businesses
 * Boosts score based on growth signals
 */
function calculateEmergingFitScore(industry, signals, freightSpend) {
  let score = 40; // Base score for emerging

  // Funding boost
  if (signals.includes('recent_funding')) score += 20;

  // Hiring signals
  if (signals.includes('hiring_logistics')) score += 15;

  // Multiple growth signals
  score += signals.length * 5;

  // Industry growth rate
  score += industry.growth_rate * 50;

  // Freight spend potential
  if (freightSpend > 100000) score += 10;
  if (freightSpend > 50000) score += 5;

  return Math.min(100, score);
}

/**
 * Calculate conversion probability for emerging businesses
 */
function calculateEmergingConversionProbability(industry, signals) {
  let probability = 15; // Base conversion rate

  // Recent funding increases likelihood
  if (signals.includes('recent_funding')) probability += 15;

  // Hiring for logistics = immediate need
  if (signals.includes('hiring_logistics')) probability += 20;

  // Industry growth
  probability += industry.growth_rate * 20;

  return Math.min(85, probability);
}

/**
 * Store business lead in database
 */
function storeBusinessLead(business, source) {
  try {
    run(`INSERT OR IGNORE INTO market_leads 
         (id, company_name, industry, location, city, state, email, phone, website, lead_score, source, status, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, datetime('now'))`,
      [
        business.id,
        business.company_name,
        business.industry,
        business.location,
        business.city,
        business.state,
        business.email,
        business.phone,
        business.website,
        business.fit_score,
        source,
        JSON.stringify({
          is_emerging: business.is_emerging,
          growth_signals: business.growth_signals,
          funding_amount: business.funding_amount,
          estimated_freight_spend: business.estimated_annual_freight_spend,
          conversion_probability: business.conversion_probability
        })
      ]
    );
  } catch (error) {
    console.error(`Failed to store lead ${business.company_name}:`, error.message);
  }
}

/**
 * Search for businesses by criteria
 */
function searchBusinesses(params = {}) {
  const {
    industry,
    is_emerging,
    min_fit_score,
    growth_signal,
    city,
    state,
    limit = 50
  } = params;

  let sql = `SELECT * FROM market_leads WHERE 1=1`;
  const queryParams = [];

  if (industry) {
    sql += ` AND industry = ?`;
    queryParams.push(industry);
  }

  if (is_emerging !== undefined) {
    sql += ` AND json_extract(notes, '$.is_emerging') = ?`;
    queryParams.push(is_emerging ? 1 : 0);
  }

  if (min_fit_score) {
    sql += ` AND lead_score >= ?`;
    queryParams.push(min_fit_score);
  }

  if (growth_signal) {
    sql += ` AND json_extract(notes, '$.growth_signals') LIKE ?`;
    queryParams.push(`%${growth_signal}%`);
  }

  if (city) {
    sql += ` AND city = ?`;
    queryParams.push(city);
  }

  if (state) {
    sql += ` AND state = ?`;
    queryParams.push(state);
  }

  sql += ` ORDER BY lead_score DESC LIMIT ?`;
  queryParams.push(limit);

  return all(sql, queryParams);
}

/**
 * Get emerging business statistics
 */
function getEmergingBusinessStats() {
  const stats = get(`
    SELECT 
      COUNT(*) as total_leads,
      COUNT(CASE WHEN json_extract(notes, '$.is_emerging') = 1 THEN 1 END) as emerging_count,
      AVG(lead_score) as avg_score,
      AVG(json_extract(notes, '$.estimated_freight_spend')) as avg_freight_spend,
      COUNT(CASE WHEN json_extract(notes, '$.funding_amount') > 1000000 THEN 1 END) as funded_over_1m
    FROM market_leads
    WHERE source IN ('emerging_discovery', 'ai_discovery')
  `);

  return stats;
}

module.exports = {
  discoverTraditionalBusinesses,
  discoverEmergingBusinesses,
  searchBusinesses,
  getEmergingBusinessStats,
  generateTraditionalLeads,
  generateEmergingLeads
};
