const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const agentService = require('../services/agent');
const chatService = require('../services/chat');
const emailService = require('../services/email');
const taskService = require('../services/tasks');
const aiLearningService = require('../services/ai-learning');

const router = express.Router();

// POST /api/ai-agent/chat - Main AI agent chat endpoint
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, session_id } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Start new session or use existing
    const sessionId = session_id || chatService.startSession(req.user.id);
    
    // Process through AI agent
    const result = await agentService.processAgentRequest(req.user.id, message);
    
    res.json({
      ...result,
      session_id: sessionId
    });
  } catch (err) {
    console.error('AI agent chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai-agent/create-load - Autonomous load creation
router.post('/create-load', authenticate, async (req, res) => {
  try {
    const { requirements } = req.body;
    
    if (!requirements) {
      return res.status(400).json({ error: 'Requirements are required' });
    }
    
    const result = await agentService.handleLoadCreation(req.user.id, req.user, requirements, {
      primary_intent: 'create_load',
      requires_additional_info: false
    });
    
    res.json(result);
  } catch (err) {
    console.error('AI load creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai-agent/discover-clients - Autonomous client discovery
router.post('/discover-clients', authenticate, async (req, res) => {
  try {
    const { target_regions, industries, target_lanes } = req.body;
    
    const result = await agentService.handleClientDiscovery(req.user.id, req.user, 
      `Find clients in ${target_regions?.join(', ') || 'US'} for ${industries?.join(', ') || 'all industries'}`,
      {
        primary_intent: 'find_clients',
        extracted_params: { target_regions, industries, target_lanes }
      }
    );
    
    res.json(result);
  } catch (err) {
    console.error('AI client discovery error:', err);
    res.json({ prospects: [], error: 'AI service unavailable' });
  }
});

// POST /api/ai-agent/send-outreach - Send AI-generated outreach emails
router.post('/send-outreach', authenticate, async (req, res) => {
  try {
    const { lead_id, email_content } = req.body;
    
    // Log and mark as sent (in production, integrate with email service)
    emailService.logEmail({
      shipper_id: lead_id,
      from_email: `${req.user.email}@surftrans.com`,
      to_email: email_content.to_email,
      subject: email_content.subject,
      body: email_content.body,
      type: 'outreach',
      status: 'sent',
      ai_generated: true
    });
    
    // Update lead status
    run(`UPDATE market_leads SET status = 'contacted', contacted_at = datetime('now') WHERE id = ?`, [lead_id]);
    
    res.json({ success: true, message: 'Outreach email sent successfully' });
  } catch (err) {
    console.error('Send outreach error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai-agent/tasks - Get AI-generated tasks
router.get('/tasks', authenticate, (req, res) => {
  try {
    const { status } = req.query;
    const tasks = taskService.getUserTasks(req.user.id, status || 'pending');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/ai-agent/tasks/:id - Update task status
router.put('/tasks/:id', authenticate, (req, res) => {
  try {
    const { status } = req.body;
    taskService.updateTaskStatus(req.params.id, status);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai-agent/leads - Get market intelligence leads
router.get('/leads', authenticate, (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    let sql = `SELECT * FROM market_leads WHERE 1=1`;
    const params = [];
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    
    sql += ` ORDER BY lead_score DESC, created_at DESC`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    
    const leads = all(sql, params);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai-agent/dashboard - AI agent dashboard summary
router.get('/dashboard', authenticate, (req, res) => {
  try {
    const taskStats = taskService.getTaskStats(req.user.id);
    
    const activeConversations = get(`
      SELECT COUNT(DISTINCT session_id) as count
      FROM ai_conversations
      WHERE user_id = ?
        AND created_at > datetime('now', '-7 days')
    `, [req.user.id]);
    
    const emailsSent = get(`
      SELECT COUNT(*) as count
      FROM ai_emails
      WHERE status = 'sent'
        AND created_at > datetime('now', '-30 days')
    `, [req.user.id]);
    
    const leadsConverted = get(`
      SELECT COUNT(*) as count
      FROM market_leads
      WHERE status = 'converted'
    `, [req.user.id]);
    
    res.json({
      tasks: taskStats,
      active_conversations: activeConversations.count,
      emails_sent_30d: emailsSent.count,
      leads_converted: leadsConverted.count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai-agent/run-operations - Run daily autonomous operations
router.post('/run-operations', authenticate, async (req, res) => {
  try {
    const results = await agentService.runDailyOperations();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai-agent/client/:id/profile - Get AI client memory profile
router.get('/client/:id/profile', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'shipper' } = req.query;
    
    // Build or get client profile
    let profile = aiLearningService.getClientProfile(id, type);
    
    if (!profile) {
      // Build profile if doesn't exist
      profile = aiLearningService.buildClientMemoryProfile(id, type);
    }
    
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai-agent/client/:id/learn - Trigger AI learning for client
router.post('/client/:id/learn', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'shipper' } = req.body;
    
    const profile = aiLearningService.buildClientMemoryProfile(id, type);
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai-agent/portfolio/insights - Get AI portfolio insights
router.get('/portfolio/insights', authenticate, (req, res) => {
  try {
    const insights = aiLearningService.analyzePortfolioInsights();
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai-agent/learn/load-outcome - Learn from load outcome
router.post('/learn/load-outcome', authenticate, (req, res) => {
  try {
    const { load_id, outcome } = req.body;
    
    if (!load_id || !outcome) {
      return res.status(400).json({ error: 'load_id and outcome are required' });
    }
    
    aiLearningService.learnFromLoadOutcome(load_id, outcome);
    res.json({ success: true, message: 'AI learning updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
