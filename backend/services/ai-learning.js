const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');

/**
 * AI Learning & Client Memory System
 * Tracks client behavior, email patterns, preferences, and learns over time
 * to make the AI smarter with every interaction
 */

/**
 * Build or update client memory profile
 * Analyzes all interactions, emails, loads, and behaviors
 */
function buildClientMemoryProfile(clientId, clientType = 'shipper') {
  console.log(`[AI LEARNING] Building memory profile for ${clientType} ${clientId}`);
  
  const profile = {
    client_id: clientId,
    client_type: clientType,
    last_updated: new Date().toISOString(),
    interaction_history: {},
    communication_patterns: {},
    preferences: {},
    behavior_insights: {},
    relationship_metrics: {},
    learning_notes: []
  };

  // Get all communication logs
  const communications = all(`
    SELECT * FROM communication_logs 
    WHERE entity_id = ? AND entity_type = ?
    ORDER BY created_at DESC
    LIMIT 100
  `, [clientId, clientType]);

  // Get all emails
  const emailField = clientType === 'shipper' ? 'shipper_id' : 'carrier_id';
  const emails = all(`
    SELECT * FROM ai_emails 
    WHERE ${emailField} = ?
    ORDER BY created_at DESC
    LIMIT 100
  `, [clientId]);

  // Get all loads
  const loadField = clientType === 'shipper' ? 'shipper_id' : 'carrier_id';
  const loads = all(`
    SELECT * FROM loads 
    WHERE ${loadField} = ?
    ORDER BY created_at DESC
    LIMIT 50
  `, [clientId]);

  // Analyze communication patterns
  profile.communication_patterns = analyzeCommunicationPatterns(communications, emails);
  
  // Analyze preferences from loads and communications
  profile.preferences = analyzePreferences(loads, communications, clientType);
  
  // Analyze behavior insights
  profile.behavior_insights = analyzeBehaviorInsights(emails, loads, communications);
  
  // Calculate relationship metrics
  profile.relationship_metrics = calculateRelationshipMetrics(loads, emails, communications);
  
  // Generate learning notes for AI
  profile.learning_notes = generateLearningNotes(profile);

  // Save or update profile in database
  saveClientProfile(profile);

  return profile;
}

/**
 * Analyze communication patterns
 */
function analyzeCommunicationPatterns(communications, emails) {
  const patterns = {
    total_emails_sent: emails.filter(e => e.status === 'sent').length,
    total_emails_received: emails.filter(e => e.status === 'replied').length,
    response_rate: 0,
    avg_response_time_hours: null,
    preferred_contact_method: 'email',
    best_contact_time: null,
    email_sentiment_distribution: { positive: 0, neutral: 0, negative: 0 },
    communication_frequency: 'unknown'
  };

  // Calculate response rate
  if (patterns.total_emails_sent > 0) {
    patterns.response_rate = Math.round(
      (patterns.total_emails_received / patterns.total_emails_sent) * 100
    );
  }

  // Analyze sentiment distribution
  emails.forEach(email => {
    if (email.sentiment) {
      try {
        const sentiment = JSON.parse(email.sentiment);
        if (sentiment.sentiment === 'positive') patterns.email_sentiment_distribution.positive++;
        else if (sentiment.sentiment === 'negative') patterns.email_sentiment_distribution.negative++;
        else patterns.email_sentiment_distribution.neutral++;
      } catch (e) {}
    }
  });

  // Determine communication frequency
  if (emails.length > 0) {
    const firstEmail = new Date(emails[emails.length - 1].created_at);
    const lastEmail = new Date(emails[0].created_at);
    const daysSpan = Math.max(1, (lastEmail - firstEmail) / (1000 * 60 * 60 * 24));
    const emailsPerWeek = (emails.length / daysSpan) * 7;
    
    if (emailsPerWeek > 5) patterns.communication_frequency = 'very_active';
    else if (emailsPerWeek > 2) patterns.communication_frequency = 'active';
    else if (emailsPerWeek > 0.5) patterns.communication_frequency = 'moderate';
    else patterns.communication_frequency = 'low';
  }

  return patterns;
}

/**
 * Analyze client preferences
 */
function analyzePreferences(loads, communications, clientType) {
  const preferences = {
    preferred_lanes: [],
    preferred_commodities: [],
    preferred_equipment: [],
    price_sensitivity: 'unknown',
    booking_speed: 'unknown',
    seasonal_patterns: []
  };

  if (loads.length === 0) return preferences;

  // Analyze preferred lanes
  const laneCounts = {};
  loads.forEach(load => {
    const lane = `${load.origin_state} → ${load.destination_state}`;
    laneCounts[lane] = (laneCounts[lane] || 0) + 1;
  });
  
  preferences.preferred_lanes = Object.entries(laneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lane, count]) => ({ lane, count }));

  // Analyze preferred commodities
  const commodityCounts = {};
  loads.forEach(load => {
    if (load.commodity) {
      commodityCounts[load.commodity] = (commodityCounts[load.commodity] || 0) + 1;
    }
  });
  
  preferences.preferred_commodities = Object.entries(commodityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([commodity, count]) => ({ commodity, count }));

  // Analyze preferred equipment
  const equipmentCounts = {};
  loads.forEach(load => {
    if (load.equipment_type) {
      equipmentCounts[load.equipment_type] = (equipmentCounts[load.equipment_type] || 0) + 1;
    }
  });
  
  preferences.preferred_equipment = Object.entries(equipmentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([equipment, count]) => ({ equipment, count }));

  // Analyze price sensitivity (compare shipper_rate vs carrier_rate margins)
  const margins = loads
    .filter(l => l.carrier_rate && l.shipper_rate)
    .map(l => ((l.shipper_rate - l.carrier_rate) / l.shipper_rate) * 100);
  
  if (margins.length > 0) {
    const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length;
    if (avgMargin < 15) preferences.price_sensitivity = 'high';
    else if (avgMargin < 25) preferences.price_sensitivity = 'medium';
    else preferences.price_sensitivity = 'low';
  }

  // Analyze booking speed (time from quoted to booked)
  const bookedLoads = loads.filter(l => l.status === 'booked' || l.status === 'delivered');
  if (bookedLoads.length > 0) {
    preferences.booking_speed = 'fast'; // Can be enhanced with actual timestamp analysis
  }

  return preferences;
}

/**
 * Analyze behavior insights
 */
function analyzeBehaviorInsights(emails, loads, communications) {
  const insights = {
    negotiation_style: 'unknown',
    decision_maker: 'unknown',
    reliability_score: 50,
    payment_behavior: 'unknown',
    communication_style: 'professional',
    requires_personal_touch: false,
    technology_adoption: 'medium',
    growth_potential: 'medium'
  };

  // Analyze negotiation style from email patterns
  const negotiationEmails = emails.filter(e => e.type === 'negotiation');
  if (negotiationEmails.length > 0) {
    const repliedNegotiations = negotiationEmails.filter(e => e.status === 'replied');
    if (repliedNegotiations.length > negotiationEmails.length * 0.7) {
      insights.negotiation_style = 'engaged';
    } else {
      insights.negotiation_style = 'resistant';
    }
  }

  // Calculate reliability score based on load completion
  if (loads.length > 0) {
    const completedLoads = loads.filter(l => 
      l.status === 'delivered' || l.status === 'paid' || l.status === 'invoiced'
    ).length;
    const cancelledLoads = loads.filter(l => l.status === 'cancelled').length;
    
    insights.reliability_score = Math.round(
      ((completedLoads - cancelledLoads) / loads.length) * 100
    );
    insights.reliability_score = Math.max(0, Math.min(100, insights.reliability_score));
  }

  // Analyze payment behavior
  const paidLoads = loads.filter(l => l.status === 'paid').length;
  const invoicedLoads = loads.filter(l => l.status === 'invoiced').length;
  if (loads.length > 0) {
    const paymentRate = (paidLoads / loads.length) * 100;
    if (paymentRate > 80) insights.payment_behavior = 'excellent';
    else if (paymentRate > 60) insights.payment_behavior = 'good';
    else if (paymentRate > 40) insights.payment_behavior = 'fair';
    else insights.payment_behavior = 'poor';
  }

  // Determine if requires personal touch
  const callCommunications = communications.filter(c => c.type === 'call').length;
  if (callCommunications > emails.length * 0.3) {
    insights.requires_personal_touch = true;
  }

  // Assess growth potential
  if (loads.length > 5 && insights.reliability_score > 70) {
    insights.growth_potential = 'high';
  } else if (loads.length > 2) {
    insights.growth_potential = 'medium';
  } else {
    insights.growth_potential = 'low';
  }

  return insights;
}

/**
 * Calculate relationship metrics
 */
function calculateRelationshipMetrics(loads, emails, communications) {
  const metrics = {
    total_loads: loads.length,
    total_revenue: 0,
    avg_load_value: 0,
    relationship_duration_days: 0,
    engagement_score: 0,
    loyalty_score: 0,
    lifetime_value: 0
  };

  // Calculate revenue
  metrics.total_revenue = loads
    .filter(l => l.shipper_rate)
    .reduce((sum, l) => sum + l.shipper_rate, 0);

  // Average load value
  if (loads.length > 0) {
    metrics.avg_load_value = metrics.total_revenue / loads.length;
  }

  // Relationship duration
  if (loads.length > 0) {
    const firstLoad = new Date(loads[loads.length - 1].created_at);
    const lastLoad = new Date(loads[0].created_at);
    metrics.relationship_duration_days = Math.round((lastLoad - firstLoad) / (1000 * 60 * 60 * 24));
  }

  // Engagement score (0-100)
  const interactionCount = emails.length + communications.length;
  metrics.engagement_score = Math.min(100, Math.round((interactionCount / 10) * 100));

  // Loyalty score based on repeat business
  if (loads.length > 3) {
    metrics.loyalty_score = Math.min(100, loads.length * 10);
  } else {
    metrics.loyalty_score = loads.length * 20;
  }

  // Lifetime value
  metrics.lifetime_value = metrics.total_revenue;

  return metrics;
}

/**
 * Generate AI learning notes
 */
function generateLearningNotes(profile) {
  const notes = [];

  // Communication preferences
  if (profile.communication_patterns.response_rate > 70) {
    notes.push('Highly responsive to emails - prioritize email communication');
  } else if (profile.communication_patterns.response_rate < 30) {
    notes.push('Low email response rate - consider phone calls or alternative contact methods');
  }

  // Pricing strategy
  if (profile.preferences.price_sensitivity === 'high') {
    notes.push('Price-sensitive client - offer competitive rates and highlight cost savings');
  } else if (profile.preferences.price_sensitivity === 'low') {
    notes.push('Less price-sensitive - focus on service quality and reliability');
  }

  // Relationship building
  if (profile.behavior_insights.requires_personal_touch) {
    notes.push('Values personal relationships - schedule regular check-in calls');
  }

  // Growth opportunities
  if (profile.behavior_insights.growth_potential === 'high') {
    notes.push('High growth potential - consider premium services and dedicated support');
  }

  // Negotiation approach
  if (profile.behavior_insights.negotiation_style === 'engaged') {
    notes.push('Open to negotiations - present multiple options and be flexible');
  } else if (profile.behavior_insights.negotiation_style === 'resistant') {
    notes.push('Resistant to negotiations - provide data-driven justification for rates');
  }

  // Seasonal patterns
  if (profile.preferences.preferred_lanes.length > 0) {
    const topLane = profile.preferences.preferred_lanes[0];
    notes.push(`Primary lane: ${topLane.lane} (${topLane.count} loads)`);
  }

  return notes;
}

/**
 * Save client profile to database
 */
function saveClientProfile(profile) {
  const profileJson = JSON.stringify(profile);
  const field = profile.client_type === 'shipper' ? 'ai_score' : 'ai_match_score';
  const table = profile.client_type === 'shipper' ? 'shippers' : 'carriers';

  // Update existing profile
  run(`UPDATE ${table} SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`,
    [profile.relationship_metrics.engagement_score, profile.client_id]
  );

  // Store full profile in ai_learning_data
  const id = uuidv4();
  run(`INSERT OR REPLACE INTO ai_learning_data 
       (id, entity_type, entity_id, data_type, data, created_at, updated_at)
       VALUES (?, ?, ?, 'client_profile', ?, datetime('now'), datetime('now'))`,
    [id, profile.client_type, profile.client_id, profileJson]
  );
}

/**
 * Get client memory profile
 */
function getClientProfile(clientId, clientType = 'shipper') {
  const result = get(`
    SELECT * FROM ai_learning_data 
    WHERE entity_id = ? AND entity_type = ? AND data_type = 'client_profile'
    ORDER BY updated_at DESC
    LIMIT 1
  `, [clientId, clientType]);

  if (result) {
    try {
      return JSON.parse(result.data);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Track email interaction and learn from it
 */
function trackEmailInteraction(emailId, response, sentiment) {
  // Update email record
  run(`UPDATE ai_emails 
       SET replied_content = ?, sentiment = ?, status = 'replied', updated_at = datetime('now')
       WHERE id = ?`,
    [response, JSON.stringify(sentiment), emailId]
  );

  // Get associated client
  const email = get('SELECT shipper_id, carrier_id FROM ai_emails WHERE id = ?', [emailId]);
  
  if (email) {
    const clientId = email.shipper_id || email.carrier_id;
    const clientType = email.shipper_id ? 'shipper' : 'carrier';
    
    // Rebuild profile with new data
    buildClientMemoryProfile(clientId, clientType);
  }
}

/**
 * Learn from load outcomes
 */
function learnFromLoadOutcome(loadId, outcome) {
  const load = get('SELECT * FROM loads WHERE id = ?', [loadId]);
  
  if (!load) return;

  // Update shipper profile
  if (load.shipper_id) {
    buildClientMemoryProfile(load.shipper_id, 'shipper');
  }

  // Update carrier profile
  if (load.carrier_id) {
    buildClientMemoryProfile(load.carrier_id, 'carrier');
  }

  // Store learning data
  const id = uuidv4();
  run(`INSERT INTO ai_learning_data 
       (id, entity_type, entity_id, data_type, data, created_at)
       VALUES (?, 'load', ?, 'outcome_learning', ?, datetime('now'))`,
    [id, loadId, JSON.stringify({
      load_id: loadId,
      outcome: outcome,
      shipper_rate: load.shipper_rate,
      carrier_rate: load.carrier_rate,
      margin: load.brokerage_fee,
      learned_at: new Date().toISOString()
    })]
  );
}

/**
 * Get AI context for client interactions
 * Returns comprehensive client memory for AI to use in conversations
 */
function getAIContextForClient(clientId, clientType = 'shipper') {
  const profile = getClientProfile(clientId, clientType);
  
  if (!profile) {
    // Build profile if doesn't exist
    return buildClientMemoryProfile(clientId, clientType);
  }

  return profile;
}

/**
 * Analyze all clients and generate portfolio insights
 */
function analyzePortfolioInsights() {
  const insights = {
    total_clients: 0,
    high_value_clients: [],
    at_risk_clients: [],
    growth_opportunities: [],
    market_trends: {},
    ai_recommendations: []
  };

  // Get all shippers with AI scores
  const shippers = all(`
    SELECT * FROM shippers 
    WHERE ai_score IS NOT NULL
    ORDER BY ai_score DESC
  `);

  insights.total_clients = shippers.length;

  // Identify high-value clients
  insights.high_value_clients = shippers
    .filter(s => s.ai_score >= 70)
    .slice(0, 10)
    .map(s => ({
      id: s.id,
      name: s.company_name,
      score: s.ai_score,
      category: s.category
    }));

  // Identify at-risk clients (low engagement)
  insights.at_risk_clients = shippers
    .filter(s => s.ai_score < 30)
    .slice(0, 10)
    .map(s => ({
      id: s.id,
      name: s.company_name,
      score: s.ai_score,
      last_activity: s.updated_at
    }));

  // Generate AI recommendations
  if (insights.high_value_clients.length > 0) {
    insights.ai_recommendations.push(
      `Focus on ${insights.high_value_clients.length} high-value clients for upsell opportunities`
    );
  }

  if (insights.at_risk_clients.length > 0) {
    insights.ai_recommendations.push(
      `Re-engage ${insights.at_risk_clients.length} at-risk clients with personalized outreach`
    );
  }

  return insights;
}

module.exports = {
  buildClientMemoryProfile,
  getClientProfile,
  trackEmailInteraction,
  learnFromLoadOutcome,
  getAIContextForClient,
  analyzePortfolioInsights
};
