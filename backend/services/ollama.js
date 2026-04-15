const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

// In-memory cache for AI responses
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Call Ollama API with retry logic
 */
async function callOllama(prompt, systemPrompt = '', maxRetries = 2) {
  const cacheKey = `${OLLAMA_MODEL}:${prompt.substring(0, 100)}`;
  
  // Check cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.response;
    }
    cache.delete(cacheKey);
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt || 'You are a helpful AI assistant for US freight brokerage.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 2000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.message?.content?.trim() || data.response?.trim() || '';

      if (!result) {
        throw new Error('Empty response from Ollama');
      }

      // Cache successful response
      cache.set(cacheKey, { response: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error(`Ollama call attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw new Error(`AI service unavailable after ${maxRetries} attempts. Please try manual entry.`);
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * Parse JSON from AI response with fallback
 */
function parseAIResponse(text) {
  try {
    // Try to find JSON object in response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Failed to parse AI response:', error.message);
    return null;
  }
}

/**
 * Generate AI-powered quote analysis for a lane
 */
async function generateQuoteAnalysis(laneData, historicalData = [], marketTrends = {}) {
  const systemPrompt = `You are an expert US freight broker pricing analyst. Analyze lane data and provide accurate pricing recommendations. Always respond with valid JSON only, no markdown formatting.`;

  const prompt = `Analyze this freight lane and provide pricing recommendations:

Lane Details:
- Origin: ${laneData.origin_city}, ${laneData.origin_state}
- Destination: ${laneData.destination_city}, ${laneData.destination_state}
- Commodity: ${laneData.commodity || 'General Freight'}
- Weight: ${laneData.weight || 'N/A'} lbs
- Equipment: ${laneData.equipment_type || 'Dry Van'}
- Distance: ~${laneData.estimated_miles || 'unknown'} miles

Historical Data (last 10 shipments on similar lanes):
${historicalData.length > 0 ? historicalData.map(h => 
  `- ${h.origin_state} to ${h.destination_state}: Shipper $${h.shipper_rate}, Carrier $${h.carrier_rate}, Margin $${h.brokerage_fee}`
).join('\n') : 'No historical data available'}

Market Context:
- Current month: ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
- Season: ${getSeason()}
- Market trend: ${marketTrends.trend || 'stable'}

Provide JSON response with this exact structure:
{
  "shipper_rate_min": <number>,
  "shipper_rate_max": <number>,
  "carrier_rate_min": <number>,
  "carrier_rate_max": <number>,
  "expected_margin": <number>,
  "margin_percentage": <number>,
  "confidence_score": <number between 0-100>,
  "risk_level": "low|medium|high",
  "risk_factors": ["factor1", "factor2"],
  "transit_days": <number>,
  "market_notes": "<brief explanation>",
  "recommended_shipper_rate": <number>,
  "recommended_carrier_rate": <number>
}

Consider: US freight market rates, lane popularity, seasonal demand, equipment availability, fuel costs, and typical brokerage margins (15-35%).`;

  const response = await callOllama(prompt, systemPrompt);
  return parseAIResponse(response);
}

/**
 * Analyze and recommend client prospects
 */
async function analyzeClientProspects(targetParams, existingClients = []) {
  const systemPrompt = `You are a US freight brokerage business development expert. Identify high-potential shipper prospects based on target parameters. Always respond with valid JSON only.`;

  const prompt = `Identify high-potential shipper prospects for our freight brokerage:

Target Parameters:
- Regions: ${(targetParams.target_regions || []).join(', ') || 'Nationwide'}
- Industries: ${(targetParams.industries || []).join(', ') || 'All industries'}
- Target Lanes: ${(targetParams.target_lanes || []).join(', ') || 'Any lane'}
- Budget Range: ${targetParams.budget_range ? `$${targetParams.budget_range.min} - $${targetParams.budget_range.max}` : 'Any'}

Existing Client Profile (for reference):
${existingClients.length > 0 ? existingClients.slice(0, 5).map(c => 
  `- ${c.company_name} (${c.category}): ${c.city}, ${c.state}, Revenue: $${c.total_revenue || 0}`
).join('\n') : 'No existing clients to reference'}

Generate 5-8 high-potential prospect companies that would need freight brokerage services.

Return JSON with this exact structure:
{
  "prospects": [
    {
      "company_name": "<name>",
      "industry": "<industry>",
      "location": "<city, state>",
      "estimated_annual_freight_spend": <number>,
      "fit_score": <number 0-100>,
      "conversion_probability": <number 0-100>,
      "outreach_strategy": "<specific approach>",
      "key_pain_points": ["pain1", "pain2"],
      "reasoning": "<why this is a good fit>"
    }
  ]
}`;

  const response = await callOllama(prompt, systemPrompt);
  return parseAIResponse(response);
}

/**
 * Generate outreach strategy for a specific client
 */
async function generateOutreachStrategy(clientProfile, industry) {
  const systemPrompt = `You are a freight brokerage sales expert. Create personalized outreach strategies. Always respond with valid JSON only.`;

  const prompt = `Create a personalized outreach strategy for this potential client:

Client Profile:
- Company: ${clientProfile.company_name}
- Industry: ${industry || clientProfile.category || 'General'}
- Location: ${clientProfile.city || 'Unknown'}, ${clientProfile.state || 'Unknown'}
- Contact: ${clientProfile.contact_name || 'N/A'}
- Email: ${clientProfile.email || 'N/A'}
- Phone: ${clientProfile.phone || 'N/A'}

Return JSON with this exact structure:
{
  "email_template": "<professional email template with placeholders>",
  "email_subject": "<compelling subject line>",
  "call_script": "<30-second elevator pitch>",
  "key_talking_points": ["point1", "point2", "point3"],
  "best_contact_time": "<day/time recommendation>",
  "follow_up_schedule": ["day 1: action", "day 3: action", "day 7: action"],
  "conversion_probability": <number 0-100>,
  "personalized_value_prop": "<specific value proposition for this client>"
}`;

  const response = await callOllama(prompt, systemPrompt);
  return parseAIResponse(response);
}

/**
 * Recommend profitable loads based on market analysis
 */
async function recommendLoads(agentPerformance, marketData = {}) {
  const systemPrompt = `You are a freight load optimization expert. Recommend profitable load opportunities. Always respond with valid JSON only.`;

  const prompt = `Recommend 5 profitable load opportunities based on:

Agent Performance:
- Total loads completed: ${agentPerformance.total_loads || 0}
- Total revenue: $${agentPerformance.total_revenue || 0}
- Top lanes: ${(agentPerformance.top_lanes || []).join(', ') || 'N/A'}
- Average margin: $${agentPerformance.avg_margin || 0}

Market Data:
- Current trends: ${marketData.trends || 'stable market'}
- High-demand lanes: ${(marketData.high_demand_lanes || []).join(', ') || 'N/A'}
- Season: ${getSeason()}

Return JSON with this exact structure:
{
  "recommendations": [
    {
      "origin_city": "<city>",
      "origin_state": "<state>",
      "destination_city": "<city>",
      "destination_state": "<state>",
      "estimated_margin": <number>,
      "confidence_score": <number 0-100>,
      "market_demand": "low|medium|high",
      "recommended_commodity": "<commodity>",
      "reasoning": "<why this is profitable>"
    }
  ]
}`;

  const response = await callOllama(prompt, systemPrompt);
  return parseAIResponse(response);
}

/**
 * Parse and analyze document content
 */
async function parseDocument(textContent, documentType = 'unknown') {
  const systemPrompt = `You are a document parsing expert for US freight logistics. Extract structured data from documents. Always respond with valid JSON only.`;

  const prompt = `Parse this freight document and extract structured data:

Document Type: ${documentType} (invoice, BOL, POD, bill, or unknown)

Document Content:
${textContent}

Return JSON with this exact structure:
{
  "document_type": "<detected type: invoice|bol|pod|bill>",
  "load_number": "<extracted load number or null>",
  "invoice_number": "<extracted invoice number or null>",
  "amount": <number or null>,
  "date": "<date in YYYY-MM-DD or null>",
  "from_entity": "<sender company or null>",
  "to_entity": "<recipient company or null>",
  "origin": "<origin city, state or null>",
  "destination": "<destination city, state or null>",
  "weight": <number or null>,
  "commodity": "<commodity description or null>",
  "confidence_score": <number 0-100>,
  "extracted_fields": {
    "<field_name>": "<value>"
  }
}`;

  const response = await callOllama(prompt, systemPrompt);
  return parseAIResponse(response);
}

/**
 * Run AI audit on financial records
 */
async function runAIAudit(financialData) {
  const systemPrompt = `You are a freight brokerage financial auditor. Detect discrepancies and validate records. Always respond with valid JSON only.`;

  const prompt = `Audit these financial records and detect any discrepancies:

Financial Data:
${JSON.stringify(financialData, null, 2)}

Analyze for:
- Amount mismatches between invoices and payments
- Missing documentation
- Duplicate entries
- Unusual patterns or anomalies
- Compliance issues

Return JSON with this exact structure:
{
  "audit_status": "clean|issues_found",
  "risk_score": <number 0-100>,
  "discrepancies": [
    {
      "type": "<discrepancy type>",
      "severity": "low|medium|high|critical",
      "description": "<what's wrong>",
      "affected_records": ["record1", "record2"],
      "recommended_action": "<what to do>"
    }
  ],
  "recommendations": ["recommendation1", "recommendation2"],
  "summary": "<brief audit summary>"
}`;

  const response = await callOllama(prompt, systemPrompt);
  return parseAIResponse(response);
}

/**
 * Match carriers to load requirements
 */
async function matchCarriers(loadRequirements, availableCarriers = []) {
  const systemPrompt = `You are a freight carrier matching expert. Recommend best carrier matches. Always respond with valid JSON only.`;

  const prompt = `Match carriers to this load requirement:

Load Requirements:
- Origin: ${loadRequirements.origin_city}, ${loadRequirements.origin_state}
- Destination: ${loadRequirements.destination_city}, ${loadRequirements.destination_state}
- Equipment: ${loadRequirements.equipment_type || 'Dry Van'}
- Weight: ${loadRequirements.weight || 'N/A'} lbs
- Pickup Date: ${loadRequirements.pickup_date || 'Flexible'}

Available Carriers:
${availableCarriers.length > 0 ? availableCarriers.map(c => 
  `- ${c.company_name}: ${c.equipment_types || 'Various'}, Location: ${c.city}, ${c.state}, Rating: ${c.rating || 'N/A'}`
).join('\n') : 'No carrier database provided - suggest ideal carrier profile'}

Return JSON with this exact structure:
{
  "matched_carriers": [
    {
      "carrier_name": "<name>",
      "match_score": <number 0-100>,
      "reliability_score": <number 0-100>,
      "suggested_rate": <number>,
      "strengths": ["strength1", "strength2"],
      "reasoning": "<why this carrier is a good match>"
    }
  ]
}`;

  const response = await callOllama(prompt, systemPrompt);
  return parseAIResponse(response);
}

/**
 * Helper: Get current season
 */
function getSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
}

/**
 * Clear cache (useful for testing)
 */
function clearCache() {
  cache.clear();
}

module.exports = {
  generateQuoteAnalysis,
  analyzeClientProspects,
  generateOutreachStrategy,
  recommendLoads,
  parseDocument,
  runAIAudit,
  matchCarriers,
  clearCache,
  callOllama
};
