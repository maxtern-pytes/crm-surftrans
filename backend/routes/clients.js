const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const { analyzeClientProspects, generateOutreachStrategy, matchCarriers } = require('../services/ollama');

const router = express.Router();

// ==================== SHIPPERS ====================

// POST /api/clients/shippers/ai-discover - AI client discovery
router.post('/shippers/ai-discover', authenticate, async (req, res) => {
  try {
    const { target_regions, industries, target_lanes, budget_range } = req.body;

    // Get existing clients for pattern analysis
    let existingClients = all(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM loads WHERE loads.shipper_id = s.id) as total_loads,
        (SELECT COALESCE(SUM(shipper_rate), 0) FROM loads WHERE loads.shipper_id = s.id AND loads.status IN ('delivered','paid','invoiced')) as total_revenue
      FROM shippers s
      WHERE 1=1
    `);

    // If agent, filter to their clients
    if (req.user.role === 'agent') {
      existingClients = existingClients.filter(c => c.agent_id === req.user.id);
    }

    // Call AI for prospect analysis
    const prospects = await analyzeClientProspects(
      { target_regions, industries, target_lanes, budget_range },
      existingClients
    );

    if (!prospects || !prospects.prospects) {
      return res.json({ prospects: [] });
    }

    res.json(prospects);
  } catch (err) {
    console.error('AI client discovery error:', err);
    res.json({ prospects: [], error: 'AI service unavailable' });
  }
});

// POST /api/clients/shippers/:id/ai-outreach - Generate outreach strategy
router.post('/shippers/:id/ai-outreach', authenticate, async (req, res) => {
  try {
    const shipper = get('SELECT * FROM shippers WHERE id = ?', [req.params.id]);
    if (!shipper) return res.status(404).json({ error: 'Shipper not found' });

    // Generate AI outreach strategy
    const strategy = await generateOutreachStrategy(shipper, shipper.category);

    if (!strategy) {
      return res.status(503).json({ error: 'AI service unavailable' });
    }

    res.json(strategy);
  } catch (err) {
    console.error('AI outreach error:', err);
    res.status(503).json({ error: 'AI service unavailable: ' + err.message });
  }
});

// POST /api/clients/carriers/ai-match - AI carrier matching
router.post('/carriers/ai-match', authenticate, async (req, res) => {
  try {
    const { origin_city, origin_state, destination_city, destination_state, equipment_type, weight, pickup_date } = req.body;

    if (!origin_state || !destination_state) {
      return res.status(400).json({ error: 'Origin and destination states required' });
    }

    // Get available carriers
    const carriers = all(`
      SELECT * FROM carriers WHERE status = 'active'
      ORDER BY rating DESC
      LIMIT 20
    `);

    // Call AI for matching
    const matches = await matchCarriers(
      { origin_city, origin_state, destination_city, destination_state, equipment_type, weight, pickup_date },
      carriers
    );

    if (!matches || !matches.matched_carriers) {
      return res.json({ matched_carriers: [] });
    }

    res.json(matches);
  } catch (err) {
    console.error('AI carrier matching error:', err);
    res.json({ matched_carriers: [], error: 'AI service unavailable' });
  }
});

// GET /api/clients/shippers
router.get('/shippers', authenticate, (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    let sql = `SELECT s.*, u.first_name as agent_first, u.last_name as agent_last, u.agent_id as agent_code,
               (SELECT COUNT(*) FROM loads WHERE loads.shipper_id = s.id) as total_loads,
               (SELECT COALESCE(SUM(shipper_rate), 0) FROM loads WHERE loads.shipper_id = s.id AND loads.status IN ('delivered','paid','invoiced')) as total_revenue
               FROM shippers s LEFT JOIN users u ON s.agent_id = u.id WHERE 1=1`;
    const params = [];

    // RBAC: agents see only their shippers
    if (req.user.role === 'agent') {
      sql += ' AND s.agent_id = ?';
      params.push(req.user.id);
    }

    if (search) {
      sql += ' AND (s.company_name LIKE ? OR s.contact_name LIKE ? OR s.email LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (category) {
      sql += ' AND s.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY s.created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const shippers = all(sql, params);
    res.json(shippers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/shippers/:id
router.get('/shippers/:id', authenticate, (req, res) => {
  try {
    let sql = `SELECT s.*, u.first_name as agent_first, u.last_name as agent_last, u.agent_id as agent_code
               FROM shippers s LEFT JOIN users u ON s.agent_id = u.id WHERE s.id = ?`;
    const params = [req.params.id];

    if (req.user.role === 'agent') {
      sql += ' AND s.agent_id = ?';
      params.push(req.user.id);
    }

    const shipper = get(sql, params);
    if (!shipper) return res.status(404).json({ error: 'Shipper not found' });

    // Get load history
    const loads = all(`SELECT * FROM loads WHERE shipper_id = ? ORDER BY created_at DESC LIMIT 20`, [req.params.id]);
    // Get communication logs
    const logs = all(`SELECT * FROM communication_logs WHERE entity_type = 'shipper' AND entity_id = ? ORDER BY created_at DESC LIMIT 20`, [req.params.id]);

    res.json({ ...shipper, loads, communication_logs: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients/shippers
router.post('/shippers', authenticate, (req, res) => {
  try {
    const { company_name, contact_name, email, phone, address, city, state, zip, category, notes } = req.body;
    if (!company_name || !contact_name) {
      return res.status(400).json({ error: 'company_name and contact_name required' });
    }

    const id = uuidv4();
    const agentId = req.user.role === 'agent' ? req.user.id : (req.body.agent_id || null);

    run(`INSERT INTO shippers (id, company_name, contact_name, email, phone, address, city, state, zip, category, notes, agent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, company_name, contact_name, email, phone, address, city, state, zip, category || 'standard', notes, agentId]);

    const created = get('SELECT * FROM shippers WHERE id = ?', [id]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clients/shippers/:id
router.put('/shippers/:id', authenticate, (req, res) => {
  try {
    const shipper = get('SELECT * FROM shippers WHERE id = ?', [req.params.id]);
    if (!shipper) return res.status(404).json({ error: 'Shipper not found' });
    if (req.user.role === 'agent' && shipper.agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { company_name, contact_name, email, phone, address, city, state, zip, category, credit_rating, notes } = req.body;
    run(`UPDATE shippers SET company_name = COALESCE(?, company_name), contact_name = COALESCE(?, contact_name),
         email = COALESCE(?, email), phone = COALESCE(?, phone), address = COALESCE(?, address),
         city = COALESCE(?, city), state = COALESCE(?, state), zip = COALESCE(?, zip),
         category = COALESCE(?, category), credit_rating = COALESCE(?, credit_rating),
         notes = COALESCE(?, notes), updated_at = datetime('now') WHERE id = ?`,
      [company_name, contact_name, email, phone, address, city, state, zip, category, credit_rating, notes, req.params.id]);

    const updated = get('SELECT * FROM shippers WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CARRIERS ====================

// GET /api/clients/carriers
router.get('/carriers', authenticate, (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    let sql = `SELECT c.*, u.first_name as agent_first, u.last_name as agent_last, u.agent_id as agent_code,
               (SELECT COUNT(*) FROM loads WHERE loads.carrier_id = c.id) as total_loads
               FROM carriers c LEFT JOIN users u ON c.agent_id = u.id WHERE 1=1`;
    const params = [];

    if (req.user.role === 'agent') {
      sql += ' AND c.agent_id = ?';
      params.push(req.user.id);
    }

    if (search) {
      sql += ' AND (c.company_name LIKE ? OR c.contact_name LIKE ? OR c.mc_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY c.created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const carriers = all(sql, params);
    res.json(carriers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clients/carriers/:id
router.get('/carriers/:id', authenticate, (req, res) => {
  try {
    let sql = `SELECT c.*, u.first_name as agent_first, u.last_name as agent_last
               FROM carriers c LEFT JOIN users u ON c.agent_id = u.id WHERE c.id = ?`;
    const params = [req.params.id];

    if (req.user.role === 'agent') {
      sql += ' AND c.agent_id = ?';
      params.push(req.user.id);
    }

    const carrier = get(sql, params);
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

    const loads = all(`SELECT * FROM loads WHERE carrier_id = ? ORDER BY created_at DESC LIMIT 20`, [req.params.id]);
    const logs = all(`SELECT * FROM communication_logs WHERE entity_type = 'carrier' AND entity_id = ? ORDER BY created_at DESC LIMIT 20`, [req.params.id]);

    res.json({ ...carrier, loads, communication_logs: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clients/carriers
router.post('/carriers', authenticate, (req, res) => {
  try {
    const { company_name, contact_name, mc_number, dot_number, email, phone, address, city, state, zip, equipment_types, insurance_expiry, notes } = req.body;
    if (!company_name || !contact_name) {
      return res.status(400).json({ error: 'company_name and contact_name required' });
    }

    const id = uuidv4();
    const agentId = req.user.role === 'agent' ? req.user.id : (req.body.agent_id || null);

    run(`INSERT INTO carriers (id, company_name, mc_number, dot_number, contact_name, email, phone, address, city, state, zip, equipment_types, insurance_expiry, notes, agent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, company_name, mc_number, dot_number, contact_name, email, phone, address, city, state, zip,
       Array.isArray(equipment_types) ? equipment_types.join(',') : equipment_types, insurance_expiry, notes, agentId]);

    const created = get('SELECT * FROM carriers WHERE id = ?', [id]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clients/carriers/:id
router.put('/carriers/:id', authenticate, (req, res) => {
  try {
    const carrier = get('SELECT * FROM carriers WHERE id = ?', [req.params.id]);
    if (!carrier) return res.status(404).json({ error: 'Carrier not found' });
    if (req.user.role === 'agent' && carrier.agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { company_name, contact_name, mc_number, dot_number, email, phone, address, city, state, zip, equipment_types, insurance_expiry, rating, status, notes } = req.body;
    run(`UPDATE carriers SET company_name = COALESCE(?, company_name), contact_name = COALESCE(?, contact_name),
         mc_number = COALESCE(?, mc_number), dot_number = COALESCE(?, dot_number),
         email = COALESCE(?, email), phone = COALESCE(?, phone), address = COALESCE(?, address),
         city = COALESCE(?, city), state = COALESCE(?, state), zip = COALESCE(?, zip),
         equipment_types = COALESCE(?, equipment_types), insurance_expiry = COALESCE(?, insurance_expiry),
         rating = COALESCE(?, rating), status = COALESCE(?, status),
         notes = COALESCE(?, notes), updated_at = datetime('now') WHERE id = ?`,
      [company_name, contact_name, mc_number, dot_number, email, phone, address, city, state, zip,
       equipment_types ? (Array.isArray(equipment_types) ? equipment_types.join(',') : equipment_types) : null,
       insurance_expiry, rating, status, notes, req.params.id]);

    const updated = get('SELECT * FROM carriers WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== COMMUNICATION LOGS ====================

// POST /api/clients/communications
router.post('/communications', authenticate, (req, res) => {
  try {
    const { entity_type, entity_id, type, subject, body } = req.body;
    if (!entity_type || !entity_id || !type) {
      return res.status(400).json({ error: 'entity_type, entity_id, and type required' });
    }

    const id = uuidv4();
    run(`INSERT INTO communication_logs (id, entity_type, entity_id, agent_id, type, subject, body)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, entity_type, entity_id, req.user.id, type, subject, body]);

    const created = get('SELECT * FROM communication_logs WHERE id = ?', [id]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
