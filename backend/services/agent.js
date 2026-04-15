const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');
const ollamaService = require('./ollama');
const cloudAI = require('./cloud-ai');
const emailService = require('./email');
const chatService = require('./chat');
const taskService = require('./tasks');
const aiLearningService = require('./ai-learning');

// Use cloud AI if API key is available, otherwise fallback to Ollama
const useCloudAI = !!process.env.TOGETHER_API_KEY;
const aiService = useCloudAI ? cloudAI : ollamaService;
console.log(`🤖 AI Service: ${useCloudAI ? 'Cloud AI (Together AI)' : 'Local Ollama'}`);

/**
 * AI Agent Orchestrator - Coordinates all AI services for autonomous operations
 */

/**
 * Main AI Agent - Process user request and coordinate actions
 */
async function processAgentRequest(userId, request) {
  const user = get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) throw new Error('User not found');
  
  // Analyze request intent
  const intent = await analyzeIntent(request, user);
  
  // Extract client context if mentioned
  const clientContext = await extractClientContext(request);
  
  // Route to appropriate handler
  switch (intent.primary_intent) {
    case 'create_load':
      return await handleLoadCreation(userId, user, request, intent, clientContext);
    
    case 'find_clients':
      return await handleClientDiscovery(userId, user, request, intent);
    
    case 'get_quote':
      return await handleQuoteRequest(userId, user, request, intent, clientContext);
    
    case 'email_outreach':
      return await handleEmailOutreach(userId, user, request, intent);
    
    case 'track_shipment':
      return await handleShipmentTracking(userId, user, request, intent);
    
    case 'general_question':
    default:
      return await handleGeneralQuery(userId, user, request, intent, clientContext);
  }
}

/**
 * Analyze user request intent using AI
 */
async function analyzeIntent(request, user) {
  const prompt = `Analyze this user request and determine intent. Return ONLY valid JSON:

User Request: "${request}"

User Role: ${user.role}

Classify the primary intent and extract relevant parameters.

Return JSON with this exact structure:
{
  "primary_intent": "<create_load|find_clients|get_quote|email_outreach|track_shipment|general_question>",
  "confidence": <number 0-1>,
  "extracted_params": {
    "origin": "<if applicable>",
    "destination": "<if applicable>",
    "commodity": "<if applicable>",
    "regions": ["<if client discovery>"],
    "industries": ["<if client discovery>"]
  },
  "requires_additional_info": <true/false>,
  "missing_info": ["<list of missing required information>"]
}`;

  const response = await aiService.callOllama(prompt,
    'You are an intent classification expert for freight brokerage. Always respond with valid JSON only.'
  );
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { primary_intent: 'general_question', confidence: 0.5 };
  } catch (error) {
    console.error('Intent analysis failed:', error);
    return { primary_intent: 'general_question', confidence: 0.5 };
  }
}

/**
 * Extract client context from request
 */
async function extractClientContext(request) {
  // Try to identify client name or company mentioned
  const clientMention = request.match(/(?:for|about|with)\s+([A-Z][a-zA-Z\s]+(?:Inc|LLC|Corp|Co|Company)?)/i);
  
  if (clientMention) {
    const companyName = clientMention[1].trim();
    const shipper = get('SELECT id, company_name FROM shippers WHERE company_name LIKE ?', [`%${companyName}%`]);
    
    if (shipper) {
      // Get AI memory profile for this client
      const clientProfile = aiLearningService.getAIContextForClient(shipper.id, 'shipper');
      return {
        client_id: shipper.id,
        client_type: 'shipper',
        company_name: shipper.company_name,
        profile: clientProfile
      };
    }
  }
  
  return null;
}

/**
 * Handle autonomous load creation
 */
async function handleLoadCreation(userId, user, request, intent, clientContext) {
  // Check if we have all required information
  if (intent.requires_additional_info) {
    return {
      type: 'need_more_info',
      message: `I can help you create a load. I need the following information: ${intent.missing_info.join(', ')}`,
      missing_info: intent.missing_info,
      next_step: 'gather_requirements'
    };
  }
  
  // Extract load details from request
  const loadDetails = await chatService.createLoadFromChat(aiService, userId, 'agent-session', request);
  
  if (!loadDetails || !loadDetails.origin_city || !loadDetails.destination_city) {
    return {
      type: 'need_more_info',
      message: 'Please provide origin and destination for the load.',
      next_step: 'gather_requirements'
    };
  }
  
  // Use client memory profile if available
  let quoteContext = {};
  if (clientContext && clientContext.profile) {
    quoteContext = {
      client_preferences: clientContext.profile.preferences,
      client_history: clientContext.profile.relationship_metrics,
      pricing_strategy: clientContext.profile.behavior_insights.price_sensitivity
    };
  }
  
  // Generate AI quote with client context
  const quote = await aiService.generateQuoteAnalysis(loadDetails, [], quoteContext);
  
  if (!quote) {
    return {
      type: 'error',
      message: 'Unable to generate quote at this time. Please try again or contact support.'
    };
  }
  
  // Check if human approval needed
  const handoffCheck = taskService.requiresHumanHandoff(quote.confidence_score / 100, 'new_load', {
    deal_value: quote.recommended_shipper_rate,
    is_new_customer: true
  });
  
  if (handoffCheck.requires_handoff) {
    taskService.createTask({
      user_id: userId,
      task_type: 'approval_needed',
      title: 'Load Creation Requires Review',
      description: `AI-generated load for ${loadDetails.origin_city} → ${loadDetails.destination_city} needs human review before creation.`,
      priority: 'medium',
      context: { loadDetails, quote, handoff_reasons: handoffCheck.reasons }
    });
    
    return {
      type: 'pending_approval',
      message: 'I\'ve prepared the load details. A team member will review and finalize it shortly.',
      load_details: loadDetails,
      quote: quote
    };
  }
  
  // Return ready-to-create load
  return {
    type: 'ready_to_create',
    message: `Great! I've prepared your load:\n\n📍 Route: ${loadDetails.origin_city}, ${loadDetails.origin_state} → ${loadDetails.destination_city}, ${loadDetails.destination_state}\n📦 Commodity: ${loadDetails.commodity}\n💰 Estimated Rate: $${quote.recommended_shipper_rate}\n📅 Transit: ${quote.transit_days} days\n⚠️ Risk: ${quote.risk_level}\n\nShall I create this load?`,
    load_details: loadDetails,
    quote: quote,
    next_step: 'confirm_creation'
  };
}

/**
 * Handle autonomous client discovery
 */
async function handleClientDiscovery(userId, user, request, intent) {
  const params = intent.extracted_params;
  
  // Call AI to discover clients
  const prospects = await aiService.analyzeClientProspects({
    target_regions: params.regions || ['United States'],
    industries: params.industries || [],
    target_lanes: [],
    budget_range: {}
  }, []);
  
  if (!prospects || !prospects.prospects || prospects.prospects.length === 0) {
    return {
      type: 'no_results',
      message: 'I couldn\'t find specific prospects right now. Try providing more details about target regions or industries.'
    };
  }
  
  // Store leads in database
  const storedLeads = prospects.prospects.slice(0, 5).map(prospect => {
    const leadId = uuidv4();
    run(`INSERT INTO market_leads (id, company_name, industry, location, city, state, email, lead_score, source, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ai_discovery', 'new')`,
      [
        leadId,
        prospect.company_name,
        prospect.industry,
        prospect.location,
        prospect.location?.split(',')[0] || '',
        prospect.location?.split(',')[1] || '',
        prospect.email || null,
        prospect.fit_score || 50,
      ]
    );
    return { id: leadId, ...prospect };
  });
  
  // Generate outreach emails for top prospects
  const outreachEmails = [];
  for (const lead of storedLeads.slice(0, 3)) {
    const email = await emailService.generateOutreachEmail(aiService, lead);
    if (email) {
      outreachEmails.push({ lead, email });
    }
  }
  
  return {
    type: 'prospects_found',
    message: `I found ${storedLeads.length} high-potential prospects! Here are the top matches:`,
    prospects: storedLeads,
    outreach_emails: outreachEmails,
    next_step: 'review_and_send'
  };
}

/**
 * Handle quote request
 */
async function handleQuoteRequest(userId, user, request, intent) {
  const loadDetails = intent.extracted_params;
  
  if (!loadDetails.origin || !loadDetails.destination) {
    return {
      type: 'need_more_info',
      message: 'I can provide a quote! Please tell me the origin and destination.',
      next_step: 'gather_requirements'
    };
  }
  
  const quote = await aiService.generateQuoteAnalysis(loadDetails);
  
  if (!quote) {
    return {
      type: 'error',
      message: 'Unable to generate quote. Please try again.'
    };
  }
  
  return {
    type: 'quote_ready',
    message: `Here's your AI-generated quote:\n\n💵 Shipper Rate: $${quote.recommended_shipper_rate}\n🚛 Carrier Rate: $${quote.recommended_carrier_rate}\n📊 Margin: $${quote.expected_margin}\n📅 Transit: ${quote.transit_days} days\n⚠️ Risk: ${quote.risk_level}\n\nWould you like me to create a load with this quote?`,
    quote: quote,
    next_step: 'create_load_or_negotiate'
  };
}

/**
 * Handle email outreach
 */
async function handleEmailOutreach(userId, user, request, intent) {
  // Get pending follow-ups
  const followUps = emailService.getPendingFollowUps();
  
  const actions = [];
  
  // Process follow-ups
  for (const followUp of followUps.slice(0, 5)) {
    const daysSince = Math.floor((Date.now() - new Date(followUp.sent_at).getTime()) / (1000 * 60 * 60 * 24));
    
    const followUpEmail = await emailService.generateFollowUpEmail(aiService, followUp, followUp, daysSince);
    
    if (followUpEmail) {
      emailService.logEmail({
        load_id: followUp.load_id,
        shipper_id: followUp.shipper_id,
        from_email: 'ai@surftrans.com',
        to_email: followUp.to_email,
        subject: followUpEmail.subject,
        body: followUpEmail.body,
        type: 'follow_up',
        status: 'draft',
        ai_generated: true
      });
      
      actions.push({
        type: 'follow_up_generated',
        recipient: followUp.to_email,
        email: followUpEmail
      });
    }
  }
  
  return {
    type: 'outreach_complete',
    message: `I've generated ${actions.length} follow-up emails ready for review.`,
    actions: actions,
    next_step: 'review_and_send'
  };
}

/**
 * Handle shipment tracking
 */
async function handleShipmentTracking(userId, user, request, intent) {
  // Extract load number or ID from request
  const loadMatch = request.match(/(?:load|shipment)?\s*#?(\w+-?\w*)/i);
  
  if (!loadMatch) {
    return {
      type: 'need_more_info',
      message: 'Please provide the load number you want to track.',
      next_step: 'get_load_number'
    };
  }
  
  const load = get(`
    SELECT l.*, s.company_name as shipper_name, c.company_name as carrier_name
    FROM loads l
    LEFT JOIN shippers s ON l.shipper_id = s.id
    LEFT JOIN carriers c ON l.carrier_id = c.id
    WHERE l.load_number = ? OR l.id = ?
  `, [loadMatch[1], loadMatch[1]]);
  
  if (!load) {
    return {
      type: 'not_found',
      message: `Load ${loadMatch[1]} not found.`
    };
  }
  
  const statusMessages = {
    'booked': 'Load is booked and awaiting dispatch',
    'dispatched': 'Carrier has been dispatched',
    'in_transit': 'Shipment is currently in transit',
    'delivered': 'Shipment has been delivered',
    'invoiced': 'Invoice has been sent',
    'paid': 'Payment completed'
  };
  
  return {
    type: 'tracking_info',
    message: `📦 Load ${load.load_number}\n\n📍 Route: ${load.origin_city}, ${load.origin_state} → ${load.destination_city}, ${load.destination_state}\n📊 Status: ${statusMessages[load.status] || load.status}\n🏢 Shipper: ${load.shipper_name}\n🚛 Carrier: ${load.carrier_name || 'Not assigned'}\n💰 Rate: $${load.shipper_rate}`,
    load: load,
    next_step: 'none'
  };
}

/**
 * Handle general queries
 */
async function handleGeneralQuery(userId, user, request, intent, clientContext) {
  // Build context with client memory if available
  let contextPrompt = request;
  
  if (clientContext && clientContext.profile) {
    const profile = clientContext.profile;
    contextPrompt = `
Context about ${clientContext.company_name}:
- Relationship: ${profile.relationship_metrics.total_loads} loads, $${profile.relationship_metrics.total_revenue.toLocaleString()} revenue
- Preferences: ${profile.preferences.preferred_commodities.map(c => c.commodity).join(', ') || 'N/A'}
- Communication: ${profile.communication_patterns.communication_frequency} engagement, ${profile.communication_patterns.response_rate}% response rate
- Key insights: ${profile.learning_notes.slice(0, 3).join('; ')}

User query: ${request}
`;
  }
  
  const response = await aiService.callOllama(contextPrompt,
    'You are SurfTrans AI, a helpful freight broker assistant with deep client knowledge. Be concise and professional.'
  );
  
  return {
    type: 'general_response',
    message: response,
    next_step: 'none'
  };
}

/**
 * Run autonomous daily operations
 */
async function runDailyOperations() {
  console.log('Running AI daily operations...');
  
  // 1. Process pending follow-ups
  const followUps = emailService.getPendingFollowUps();
  console.log(`Found ${followUps.length} pending follow-ups`);
  
  // 2. Check for leads that need contact
  const newLeads = all(`
    SELECT * FROM market_leads 
    WHERE status = 'new' 
    AND created_at < datetime('now', '-1 day')
    LIMIT 10
  `);
  
  console.log(`Found ${newLeads.length} new leads to contact`);
  
  // 3. Generate tasks for urgent items
  const urgentLoads = all(`
    SELECT * FROM loads 
    WHERE status = 'booked' 
    AND pickup_date <= date('now', '+1 day')
    AND carrier_id IS NULL
  `);
  
  for (const load of urgentLoads) {
    taskService.createTask({
      user_id: load.agent_id,
      task_type: 'exception',
      title: `Urgent: Load ${load.load_number} needs carrier`,
      description: `Pickup is tomorrow but no carrier assigned. Immediate action required.`,
      priority: 'urgent',
      related_load_id: load.id,
      due_date: load.pickup_date
    });
  }
  
  return {
    follow_ups_processed: followUps.length,
    leads_identified: newLeads.length,
    urgent_tasks_created: urgentLoads.length
  };
}

module.exports = {
  processAgentRequest,
  runDailyOperations,
  handleLoadCreation,
  handleClientDiscovery,
  handleQuoteRequest,
  handleEmailOutreach,
  handleShipmentTracking,
  handleGeneralQuery,
  analyzeIntent
};
