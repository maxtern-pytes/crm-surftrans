const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');

/**
 * AI Chat Service - Conversational freight broker assistant
 * Maintains conversation history and context
 */

/**
 * Start new conversation session
 */
function startSession(userId) {
  const sessionId = uuidv4();
  
  // Store system message
  run(`INSERT INTO ai_conversations (id, user_id, session_id, role, content, metadata)
       VALUES (?, ?, ?, 'system', ?, ?)`,
    [
      uuidv4(),
      userId,
      sessionId,
      'You are SurfTrans AI, an intelligent freight broker assistant. You can: (1) Create loads by gathering requirements conversationally, (2) Provide pricing quotes, (3) Find carriers, (4) Track shipments, (5) Answer questions about freight brokerage. Always be professional, concise, and helpful. When creating loads, ask for: origin, destination, commodity, weight, and equipment type.',
      JSON.stringify({ type: 'system_prompt' })
    ]
  );
  
  return sessionId;
}

/**
 * Get conversation history for a session
 */
function getConversationHistory(sessionId, limit = 20) {
  return all(`
    SELECT role, content, metadata, created_at
    FROM ai_conversations
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `, [sessionId, limit]).reverse();
}

/**
 * Add message to conversation
 */
function addMessage(userId, sessionId, role, content, metadata = {}) {
  const id = uuidv4();
  
  run(`INSERT INTO ai_conversations (id, user_id, session_id, role, content, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, sessionId, role, content, JSON.stringify(metadata)]
  );
  
  return id;
}

/**
 * Generate AI response to user message
 */
async function generateResponse(ollamaService, userId, sessionId, userMessage) {
  // Get conversation history
  const history = getConversationHistory(sessionId, 10);
  
  // Save user message
  addMessage(userId, sessionId, 'user', userMessage);
  
  // Get user context
  const user = get('SELECT * FROM users WHERE id = ?', [userId]);
  const isAgent = user?.role === 'agent';
  
  // Build context-aware prompt
  const contextPrompt = buildContextualPrompt(history, userMessage, user);
  
  // Call Ollama
  const response = await ollamaService.callOllama(contextPrompt, 
    'You are SurfTrans AI, a professional freight broker assistant. Be concise, helpful, and action-oriented. When users want to create loads, guide them through the process. Always respond in a conversational tone.'
  );
  
  // Save AI response
  addMessage(userId, sessionId, 'assistant', response, { model: 'ollama' });
  
  // Extract any structured data (like load creation intent)
  const extractedData = extractStructuredData(response);
  
  return {
    response,
    extracted_data: extractedData,
    session_id: sessionId
  };
}

/**
 * Build contextual prompt with conversation history
 */
function buildContextualPrompt(history, currentMessage, user) {
  let prompt = `Current conversation:\n\n`;
  
  // Add recent history
  history.slice(-6).forEach(msg => {
    if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n`;
    } else if (msg.role === 'assistant') {
      prompt += `Assistant: ${msg.content}\n`;
    }
  });
  
  prompt += `\nUser: ${currentMessage}\n\nAssistant: `;
  
  return prompt;
}

/**
 * Extract structured data from AI response (load details, quotes, etc.)
 */
function extractStructuredData(response) {
  const extracted = {};
  
  // Look for load creation data
  const loadPatterns = {
    origin_city: /origin[:\s]+([A-Za-z\s]+)/i,
    origin_state: /origin state[:\s]+([A-Z]{2})/i,
    destination_city: /destination[:\s]+([A-Za-z\s]+)/i,
    destination_state: /destination state[:\s]+([A-Z]{2})/i,
    commodity: /commodity[:\s]+(.+?)(?:\n|$)/i,
    weight: /weight[:\s]+(\d+)/i,
    equipment: /equipment[:\s]+(.+?)(?:\n|$)/i,
    rate: /rate[:\s]+\$?([\d,]+)/i
  };
  
  for (const [key, pattern] of Object.entries(loadPatterns)) {
    const match = response.match(pattern);
    if (match) {
      extracted[key] = match[1].trim();
    }
  }
  
  // Detect intent
  if (response.includes('create a load') || response.includes('set up a shipment')) {
    extracted.intent = 'create_load';
  } else if (response.includes('quote') || response.includes('pricing')) {
    extracted.intent = 'get_quote';
  } else if (response.includes('find carrier') || response.includes('match carrier')) {
    extracted.intent = 'find_carrier';
  } else if (response.includes('track') || response.includes('status')) {
    extracted.intent = 'track_shipment';
  }
  
  return Object.keys(extracted).length > 0 ? extracted : null;
}

/**
 * Create load from conversation
 */
async function createLoadFromChat(ollamaService, userId, sessionId, conversationData) {
  // Extract load details from conversation
  const history = getConversationHistory(sessionId, 20);
  const fullConversation = history.map(h => `${h.role}: ${h.content}`).join('\n');
  
  const prompt = `Extract load details from this conversation. Return ONLY valid JSON:

${fullConversation}

Extract and return JSON with this exact structure:
{
  "origin_city": "<city>",
  "origin_state": "<state code>",
  "destination_city": "<city>",
  "destination_state": "<state code>",
  "commodity": "<commodity>",
  "weight": <number or null>,
  "equipment_type": "<equipment>",
  "pickup_date": "<date or null>",
  "notes": "<any special requirements>"
}`;

  const response = await ollamaService.callOllama(prompt, 
    'You are a data extraction expert. Always respond with valid JSON only, no markdown.'
  );
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Failed to extract load data:', error);
    return null;
  }
}

/**
 * Generate quote response in conversation
 */
async function generateChatQuote(ollamaService, loadDetails) {
  const prompt = `Provide a freight quote for this load. Return ONLY valid JSON:

Origin: ${loadDetails.origin_city}, ${loadDetails.origin_state}
Destination: ${loadDetails.destination_city}, ${loadDetails.destination_state}
Commodity: ${loadDetails.commodity || 'General Freight'}
Weight: ${loadDetails.weight || 'N/A'} lbs
Equipment: ${loadDetails.equipment_type || 'Dry Van'}

Return JSON with this exact structure:
{
  "shipper_rate": <number>,
  "carrier_rate": <number>,
  "margin": <number>,
  "transit_days": <number>,
  "risk_level": "<low|medium|high>",
  "message": "<conversational response with quote details>"
}`;

  const response = await ollamaService.callOllama(prompt,
    'You are a freight pricing expert. Always respond with valid JSON only.'
  );
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Failed to generate chat quote:', error);
    return null;
  }
}

/**
 * Get active sessions for a user
 */
function getUserSessions(userId) {
  return all(`
    SELECT DISTINCT session_id, 
           MAX(created_at) as last_activity,
           COUNT(*) as message_count
    FROM ai_conversations
    WHERE user_id = ?
    GROUP BY session_id
    ORDER BY last_activity DESC
    LIMIT 10
  `, [userId]);
}

/**
 * Clear conversation session
 */
function clearSession(sessionId) {
  run(`DELETE FROM ai_conversations WHERE session_id = ?`, [sessionId]);
}

module.exports = {
  startSession,
  getConversationHistory,
  addMessage,
  generateResponse,
  createLoadFromChat,
  generateChatQuote,
  getUserSessions,
  clearSession,
  buildContextualPrompt,
  extractStructuredData
};
