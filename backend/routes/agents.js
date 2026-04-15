const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/agents - List all agents (admin) or self (agent)
router.get('/', authenticate, (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const agents = all(`
        SELECT u.id, u.agent_id, u.email, u.first_name, u.last_name, u.phone, u.status,
               u.commission_rate, u.commission_cap, u.cap_removed, u.total_brokerage, u.created_at,
               (SELECT COUNT(*) FROM loads WHERE loads.agent_id = u.id) as total_loads,
               (SELECT COUNT(*) FROM loads WHERE loads.agent_id = u.id AND loads.status = 'paid') as paid_loads,
               (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions WHERE commissions.agent_id = u.id) as total_earnings
        FROM users u WHERE u.role = 'agent' ORDER BY u.created_at DESC
      `);
      res.json(agents);
    } else {
      const agent = get(`
        SELECT u.id, u.agent_id, u.email, u.first_name, u.last_name, u.phone, u.status,
               u.commission_rate, u.commission_cap, u.cap_removed, u.total_brokerage, u.created_at,
               (SELECT COUNT(*) FROM loads WHERE loads.agent_id = u.id) as total_loads,
               (SELECT COUNT(*) FROM loads WHERE loads.agent_id = u.id AND loads.status = 'paid') as paid_loads,
               (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions WHERE commissions.agent_id = u.id) as total_earnings
        FROM users u WHERE u.id = ?
      `, [req.user.id]);
      res.json([agent]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/:id - Get agent detail
router.get('/:id', authenticate, (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const agent = get(`
      SELECT u.id, u.agent_id, u.email, u.first_name, u.last_name, u.phone, u.status,
             u.commission_rate, u.commission_cap, u.cap_removed, u.total_brokerage, u.created_at,
             (SELECT COUNT(*) FROM loads WHERE loads.agent_id = u.id) as total_loads,
             (SELECT COUNT(*) FROM loads WHERE loads.agent_id = u.id AND loads.status IN ('delivered','paid','invoiced')) as completed_loads,
             (SELECT COALESCE(SUM(brokerage_fee), 0) FROM loads WHERE loads.agent_id = u.id AND loads.status IN ('delivered','paid','invoiced')) as revenue_generated,
             (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions WHERE commissions.agent_id = u.id) as total_earnings,
             (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions WHERE commissions.agent_id = u.id AND commissions.status = 'paid') as paid_earnings
      FROM users u WHERE u.id = ? AND u.role = 'agent'
    `, [req.params.id]);

    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents - Create new agent (admin only)
router.post('/', authenticate, adminOnly, (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Required: email, password, first_name, last_name' });
    }

    const existing = get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    // Generate next agent ID
    const lastAgent = get("SELECT agent_id FROM users WHERE role = 'agent' ORDER BY agent_id DESC LIMIT 1");
    let nextNum = 1;
    if (lastAgent && lastAgent.agent_id) {
      const num = parseInt(lastAgent.agent_id.split('-')[1]);
      nextNum = num + 1;
    }
    const agentId = `AGT-${String(nextNum).padStart(4, '0')}`;

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    run(`INSERT INTO users (id, agent_id, email, password_hash, first_name, last_name, role, phone, commission_rate, commission_cap)
         VALUES (?, ?, ?, ?, ?, ?, 'agent', ?, 0.17, 500)`,
      [id, agentId, email, passwordHash, first_name, last_name, phone || null]);

    // Send welcome notification
    run(`INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), id, 'Welcome to SurfTrans!', 'Your agent account has been created. Start by adding your first client and load.', 'success']);

    res.status(201).json({
      id, agent_id: agentId, email, first_name, last_name, phone,
      commission_rate: 0.17, commission_cap: 500
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/agents/:id - Update agent
router.put('/:id', authenticate, (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const agent = get('SELECT * FROM users WHERE id = ? AND role = ?', [req.params.id, 'agent']);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const { first_name, last_name, phone, status, commission_rate, commission_cap } = req.body;

    // Agents can only update their own basic info
    if (req.user.role === 'agent') {
      run(`UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
           phone = COALESCE(?, phone), updated_at = datetime('now') WHERE id = ?`,
        [first_name, last_name, phone, req.params.id]);
    } else {
      // Admin can update everything
      run(`UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
           phone = COALESCE(?, phone), status = COALESCE(?, status),
           commission_rate = COALESCE(?, commission_rate), commission_cap = ?,
           updated_at = datetime('now') WHERE id = ?`,
        [first_name, last_name, phone, status, commission_rate,
         commission_cap !== undefined ? commission_cap : agent.commission_cap,
         req.params.id]);
    }

    const updated = get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json({
      id: updated.id, agent_id: updated.agent_id, email: updated.email,
      first_name: updated.first_name, last_name: updated.last_name,
      phone: updated.phone, status: updated.status,
      commission_rate: updated.commission_rate, commission_cap: updated.commission_cap
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/:id/commissions - Get agent commissions
router.get('/:id/commissions', authenticate, (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const commissions = all(`
      SELECT c.*, l.origin_city, l.origin_state, l.destination_city, l.destination_state,
             l.shipper_rate, l.carrier_rate, l.status as load_status
      FROM commissions c
      JOIN loads l ON c.load_id = l.id
      WHERE c.agent_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.id]);

    res.json(commissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
