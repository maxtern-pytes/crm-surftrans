const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');
const aiLearningService = require('./ai-learning');

/**
 * AI Email Service - Automated outreach, follow-ups, and negotiation
 * In production, integrate with SendGrid, AWS SES, or similar
 * For now, logs emails and simulates sending
 */

/**
 * Generate AI-powered outreach email
 */
async function generateOutreachEmail(aiService, lead, context = {}) {
  const prompt = `Generate a professional freight brokerage outreach email for this potential client:

Company: ${lead.company_name}
Industry: ${lead.industry || 'General'}
Location: ${lead.city || ''}, ${lead.state || ''}
Contact: ${lead.email}

Context:
- We are SurfTrans Logistics, a US freight brokerage
- We specialize in finding optimal carriers and competitive rates
- We want to establish a business relationship
- Focus on their likely pain points based on industry

Generate a personalized, professional email that:
1. Has a compelling subject line
2. Introduces our value proposition
3. Addresses their likely freight challenges
4. Includes a clear call-to-action
5. Is concise (150-200 words max)

Return JSON with this exact structure:
{
  "subject": "<email subject>",
  "body": "<email body with professional greeting and sign-off>",
  "follow_up_days": <number of days to wait before follow-up>
}`;

  const response = await aiService.callOllama(prompt, 'You are a freight brokerage sales expert. Write compelling outreach emails. Always respond with valid JSON only.');
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Failed to parse outreach email:', error);
    return null;
  }
}

/**
 * Generate AI follow-up email
 */
async function generateFollowUpEmail(aiService, previousEmail, lead, daysSinceLastContact) {
  const prompt = `Generate a follow-up email for freight brokerage outreach:

Previous Email Subject: ${previousEmail.subject}
Previous Email Body: ${previousEmail.body.substring(0, 200)}...

Company: ${lead.company_name}
Days Since Last Contact: ${daysSinceLastContact}

Create a polite, value-add follow-up that:
1. References previous outreach
2. Adds new value or insight
3. Maintains professional tone
4. Includes gentle call-to-action
5. Is shorter than initial email (100-150 words)

Return JSON:
{
  "subject": "<follow-up subject>",
  "body": "<follow-up email body>"
}`;

  const response = await aiService.callOllama(prompt, 'You are a freight brokerage sales expert. Write effective follow-up emails. Always respond with valid JSON only.');
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Failed to parse follow-up email:', error);
    return null;
  }
}

/**
 * Generate AI quote email
 */
async function generateQuoteEmail(aiService, load, quoteData, shipper) {
  const prompt = `Generate a professional freight quote email:

Load Details:
- Origin: ${load.origin_city}, ${load.origin_state}
- Destination: ${load.destination_city}, ${load.destination_state}
- Commodity: ${load.commodity || 'General Freight'}
- Weight: ${load.weight || 'N/A'} lbs
- Equipment: ${load.equipment_type || 'Dry Van'}

Quote Details:
- Shipper Rate: $${load.shipper_rate}
- Transit Time: ${quoteData?.transit_days || 'N/A'} days
- Valid Until: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

Company: ${shipper.company_name}
Contact: ${shipper.contact_name}

Create a professional quote email that:
1. Presents the quote clearly
2. Highlights value and service
3. Includes all key details
4. Has clear next steps
5. Is professional and concise

Return JSON:
{
  "subject": "<quote subject with lane and rate>",
  "body": "<quote email body>"
}`;

  const response = await aiService.callOllama(prompt, 'You are a freight brokerage operations expert. Write clear, professional quote emails. Always respond with valid JSON only.');
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Failed to parse quote email:', error);
    return null;
  }
}

/**
 * Generate AI negotiation response
 */
async function generateNegotiationResponse(aiService, customerEmail, currentQuote, marketData) {
  const prompt = `Analyze this negotiation email and generate a response:

Customer's Email:
${customerEmail}

Current Quote:
- Rate: $${currentQuote.shipper_rate}
- Lane: ${currentQuote.origin_city}, ${currentQuote.origin_state} → ${currentQuote.destination_city}, ${currentQuote.destination_state}

Market Context:
- Market trend: ${marketData?.trend || 'stable'}
- Capacity: ${marketData?.capacity || 'balanced'}
- Our margin: ${currentQuote.brokerage_fee || 'N/A'}

Analyze their request and generate a response that:
1. Acknowledges their concerns
2. Explains our pricing rationale
3. Offers alternatives if possible
4. Maintains professional relationship
5. Moves toward agreement

Return JSON:
{
  "subject": "<response subject>",
  "body": "<negotiation response>",
  "can_adjust_rate": <true/false>,
  "suggested_adjustment": <amount or null>,
  "requires_human_review": <true/false>,
  "reasoning": "<explanation>"
}`;

  const response = await aiService.callOllama(prompt, 'You are a freight brokerage negotiation expert. Respond professionally to rate negotiations. Always respond with valid JSON only.');
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Failed to parse negotiation response:', error);
    return null;
  }
}

/**
 * Log email in database
 */
function logEmail(emailData) {
  const id = uuidv4();
  
  run(`INSERT INTO ai_emails (id, load_id, shipper_id, carrier_id, from_email, to_email, subject, body, type, status, ai_generated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      emailData.load_id || null,
      emailData.shipper_id || null,
      emailData.carrier_id || null,
      emailData.from_email,
      emailData.to_email,
      emailData.subject,
      emailData.body,
      emailData.type || 'outreach',
      emailData.status || 'draft',
      emailData.ai_generated !== false ? 1 : 0
    ]
  );
  
  return id;
}

/**
 * Mark email as sent
 */
function markEmailSent(emailId) {
  run(`UPDATE ai_emails SET status = 'sent', sent_at = datetime('now') WHERE id = ?`, [emailId]);
}

/**
 * Record email reply and learn from it
 */
async function recordEmailReply(emailId, replyContent, sentiment, aiService) {
  run(`UPDATE ai_emails SET status = 'replied', replied_content = ?, sentiment = ? WHERE id = ?`,
    [replyContent, sentiment, emailId]);
  
  // Track interaction for AI learning
  if (aiService && sentiment) {
    const parsedSentiment = typeof sentiment === 'string' ? JSON.parse(sentiment) : sentiment;
    aiLearningService.trackEmailInteraction(emailId, replyContent, parsedSentiment);
  }
}

/**
 * Get pending follow-ups
 */
function getPendingFollowUps() {
  return all(`
    SELECT e.*, s.company_name as shipper_name, s.email as shipper_email
    FROM ai_emails e
    LEFT JOIN shippers s ON e.shipper_id = s.id
    WHERE e.status = 'sent'
      AND e.type IN ('outreach', 'follow_up')
      AND datetime(e.sent_at, '+' || 
        (SELECT CAST(json_extract(e.metadata, '$.follow_up_days') AS INTEGER) FROM ai_emails WHERE id = e.id) || ' days') <= datetime('now')
      AND e.id NOT IN (
        SELECT e2.id FROM ai_emails e2 
        WHERE e2.shipper_id = e.shipper_id 
          AND e2.type = 'follow_up' 
          AND e2.created_at > e.created_at
      )
  `);
}

/**
 * Analyze email sentiment using AI
 */
async function analyzeSentiment(aiService, emailContent) {
  const prompt = `Analyze the sentiment and intent of this email:

${emailContent}

Classify:
1. Sentiment: positive, neutral, or negative
2. Intent: interested, not_interested, needs_more_info, negotiating, ready_to_book
3. Urgency: low, medium, high
4. Requires human attention: true or false

Return JSON:
{
  "sentiment": "<positive|neutral|negative>",
  "intent": "<intent classification>",
  "urgency": "<low|medium|high>",
  "requires_human": <true/false>,
  "key_points": ["point1", "point2"],
  "recommended_action": "<what to do next>"
}`;

  const response = await aiService.callOllama(prompt, 'You are an email analysis expert for freight brokerage. Always respond with valid JSON only.');
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Failed to analyze sentiment:', error);
    return null;
  }
}

module.exports = {
  generateOutreachEmail,
  generateFollowUpEmail,
  generateQuoteEmail,
  generateNegotiationResponse,
  logEmail,
  markEmailSent,
  recordEmailReply,
  getPendingFollowUps,
  analyzeSentiment,
};
