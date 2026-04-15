const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const { calculateCommission } = require('../services/commission');
const { generateQuoteAnalysis, recommendLoads } = require('../services/ollama');

const router = express.Router();

// GET /api/loads - List loads
router.get('/', authenticate, (req, res) => {
  try {
    const { status, agent_id, search, page = 1, limit = 50 } = req.query;
    let sql = `SELECT l.*,
               s.company_name as shipper_name, s.contact_name as shipper_contact,
               c.company_name as carrier_name, c.contact_name as carrier_contact,
               u.first_name as agent_first, u.last_name as agent_last, u.agent_id as agent_code
               FROM loads l
               LEFT JOIN shippers s ON l.shipper_id = s.id
               LEFT JOIN carriers c ON l.carrier_id = c.id
               LEFT JOIN users u ON l.agent_id = u.id
               WHERE 1=1`;
    const params = [];

    // RBAC
    if (req.user.role === 'agent') {
      sql += ' AND l.agent_id = ?';
      params.push(req.user.id);
    } else if (agent_id) {
      sql += ' AND l.agent_id = ?';
      params.push(agent_id);
    }

    if (status) {
      sql += ' AND l.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (l.load_number LIKE ? OR l.origin_city LIKE ? OR l.destination_city LIKE ? OR l.commodity LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY l.created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const loads = all(sql, params);
    res.json(loads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/loads/stats - Load statistics
router.get('/stats', authenticate, (req, res) => {
  try {
    let agentFilter = '';
    const params = [];
    if (req.user.role === 'agent') {
      agentFilter = ' AND agent_id = ?';
      params.push(req.user.id);
    }

    const total = get(`SELECT COUNT(*) as count FROM loads WHERE 1=1${agentFilter}`, [...params]);
    const booked = get(`SELECT COUNT(*) as count FROM loads WHERE status = 'booked'${agentFilter}`, [...params]);
    const inTransit = get(`SELECT COUNT(*) as count FROM loads WHERE status = 'in_transit'${agentFilter}`, [...params]);
    const delivered = get(`SELECT COUNT(*) as count FROM loads WHERE status = 'delivered'${agentFilter}`, [...params]);
    const paid = get(`SELECT COUNT(*) as count FROM loads WHERE status = 'paid'${agentFilter}`, [...params]);
    const cancelled = get(`SELECT COUNT(*) as count FROM loads WHERE status = 'cancelled'${agentFilter}`, [...params]);
    const revenue = get(`SELECT COALESCE(SUM(brokerage_fee), 0) as total FROM loads WHERE status IN ('delivered','paid','invoiced')${agentFilter}`, [...params]);

    res.json({
      total: total.count,
      booked: booked.count,
      in_transit: inTransit.count,
      delivered: delivered.count,
      paid: paid.count,
      cancelled: cancelled.count,
      total_revenue: revenue.total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/loads/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    let sql = `SELECT l.*,
               s.company_name as shipper_name, s.contact_name as shipper_contact, s.email as shipper_email, s.phone as shipper_phone,
               c.company_name as carrier_name, c.contact_name as carrier_contact, c.email as carrier_email, c.phone as carrier_phone,
               u.first_name as agent_first, u.last_name as agent_last, u.agent_id as agent_code
               FROM loads l
               LEFT JOIN shippers s ON l.shipper_id = s.id
               LEFT JOIN carriers c ON l.carrier_id = c.id
               LEFT JOIN users u ON l.agent_id = u.id
               WHERE l.id = ?`;
    const params = [req.params.id];

    if (req.user.role === 'agent') {
      sql += ' AND l.agent_id = ?';
      params.push(req.user.id);
    }

    const load = get(sql, params);
    if (!load) return res.status(404).json({ error: 'Load not found' });

    // Get related commission
    const commission = get('SELECT * FROM commissions WHERE load_id = ?', [req.params.id]);
    // Get related invoices
    const invoices = all('SELECT * FROM invoices WHERE load_id = ?', [req.params.id]);

    res.json({ ...load, commission, invoices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/loads/ai-quote - Get AI-powered quote
router.post('/ai-quote', authenticate, async (req, res) => {
  try {
    const { origin_city, origin_state, destination_city, destination_state, commodity, weight, equipment_type } = req.body;

    if (!origin_city || !origin_state || !destination_city || !destination_state) {
      return res.status(400).json({ error: 'Origin and destination required' });
    }

    // Get historical data for this lane
    const historicalLoads = all(`
      SELECT origin_state, destination_state, shipper_rate, carrier_rate, brokerage_fee
      FROM loads
      WHERE status IN ('delivered', 'paid', 'invoiced')
        AND origin_state = ? AND destination_state = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [origin_state, destination_state]);

    // Calculate estimated miles (simplified)
    const estimatedMiles = estimateDistance(origin_state, destination_state);

    // Call AI for quote analysis
    const quoteData = await generateQuoteAnalysis(
      {
        origin_city, origin_state, destination_city, destination_state,
        commodity, weight, equipment_type, estimated_miles: estimatedMiles
      },
      historicalLoads,
      { trend: 'stable' }
    );

    if (!quoteData) {
      return res.status(503).json({ 
        error: 'AI service unavailable',
        fallback: {
          shipper_rate_min: 1000,
          shipper_rate_max: 3000,
          carrier_rate_min: 700,
          carrier_rate_max: 2500,
          expected_margin: 500,
          confidence_score: 50,
          risk_level: 'medium',
          transit_days: 3
        }
      });
    }

    res.json(quoteData);
  } catch (err) {
    console.error('AI quote error:', err);
    res.status(503).json({ error: 'AI service unavailable: ' + err.message });
  }
});

// GET /api/loads/ai-recommendations - Get AI load recommendations
router.get('/ai-recommendations', authenticate, async (req, res) => {
  try {
    // Get agent performance data
    let agentFilter = '';
    const params = [];
    if (req.user.role === 'agent') {
      agentFilter = ' AND agent_id = ?';
      params.push(req.user.id);
    }

    const agentStats = get(`
      SELECT 
        COUNT(*) as total_loads,
        COALESCE(SUM(brokerage_fee), 0) as total_revenue,
        COALESCE(AVG(brokerage_fee), 0) as avg_margin
      FROM loads
      WHERE status IN ('delivered', 'paid', 'invoiced')${agentFilter}
    `, params);

    // Get top lanes
    const topLanes = all(`
      SELECT origin_state || ' -> ' || destination_state as lane
      FROM loads
      WHERE status IN ('delivered', 'paid', 'invoiced')${agentFilter}
      GROUP BY lane
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `, params);

    // Call AI for recommendations
    const recommendations = await recommendLoads(
      {
        total_loads: agentStats?.total_loads || 0,
        total_revenue: agentStats?.total_revenue || 0,
        avg_margin: agentStats?.avg_margin || 0,
        top_lanes: topLanes.map(l => l.lane)
      },
      { trends: 'stable market' }
    );

    if (!recommendations || !recommendations.recommendations) {
      return res.json({ recommendations: [] });
    }

    res.json(recommendations);
  } catch (err) {
    console.error('AI recommendations error:', err);
    res.json({ recommendations: [], error: 'AI service unavailable' });
  }
});

// POST /api/loads - Create load
router.post('/', authenticate, (req, res) => {
  try {
    const { shipper_id, carrier_id, origin_city, origin_state, origin_zip, destination_city, destination_state, destination_zip,
            pickup_date, delivery_date, commodity, weight, equipment_type, shipper_rate, carrier_rate, notes,
            ai_quote_data, risk_level, transit_estimate } = req.body;

    if (!shipper_id || !origin_city || !origin_state || !destination_city || !destination_state || !shipper_rate) {
      return res.status(400).json({ error: 'Required: shipper_id, origin, destination, shipper_rate' });
    }

    // Generate load number
    const lastLoad = get("SELECT load_number FROM loads ORDER BY load_number DESC LIMIT 1");
    let nextNum = 1;
    if (lastLoad && lastLoad.load_number) {
      const num = parseInt(lastLoad.load_number.split('-')[1]);
      nextNum = num + 1;
    }
    const loadNumber = `LD-${String(nextNum).padStart(6, '0')}`;

    const agentId = req.user.role === 'agent' ? req.user.id : (req.body.agent_id || req.user.id);
    const id = uuidv4();

    run(`INSERT INTO loads (id, load_number, agent_id, shipper_id, carrier_id,
         origin_city, origin_state, origin_zip, destination_city, destination_state, destination_zip,
         pickup_date, delivery_date, commodity, weight, equipment_type, shipper_rate, carrier_rate, status, notes,
         ai_quote_data, risk_level, transit_estimate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'booked', ?, ?, ?, ?)`,
      [id, loadNumber, agentId, shipper_id, carrier_id || null,
       origin_city, origin_state, origin_zip, destination_city, destination_state, destination_zip,
       pickup_date, delivery_date, commodity, weight, equipment_type, shipper_rate, carrier_rate || null, notes,
       ai_quote_data ? JSON.stringify(ai_quote_data) : null, risk_level || 'medium', transit_estimate || null]);

    const created = get(`SELECT l.*, s.company_name as shipper_name, c.company_name as carrier_name
                         FROM loads l LEFT JOIN shippers s ON l.shipper_id = s.id LEFT JOIN carriers c ON l.carrier_id = c.id
                         WHERE l.id = ?`, [id]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/loads/:id - Update load
router.put('/:id', authenticate, (req, res) => {
  try {
    const load = get('SELECT * FROM loads WHERE id = ?', [req.params.id]);
    if (!load) return res.status(404).json({ error: 'Load not found' });
    if (req.user.role === 'agent' && load.agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { carrier_id, origin_city, origin_state, origin_zip, destination_city, destination_state, destination_zip,
            pickup_date, delivery_date, commodity, weight, equipment_type, shipper_rate, carrier_rate, notes } = req.body;

    run(`UPDATE loads SET carrier_id = COALESCE(?, carrier_id),
         origin_city = COALESCE(?, origin_city), origin_state = COALESCE(?, origin_state), origin_zip = COALESCE(?, origin_zip),
         destination_city = COALESCE(?, destination_city), destination_state = COALESCE(?, destination_state), destination_zip = COALESCE(?, destination_zip),
         pickup_date = COALESCE(?, pickup_date), delivery_date = COALESCE(?, delivery_date),
         commodity = COALESCE(?, commodity), weight = COALESCE(?, weight), equipment_type = COALESCE(?, equipment_type),
         shipper_rate = COALESCE(?, shipper_rate), carrier_rate = COALESCE(?, carrier_rate),
         notes = COALESCE(?, notes), updated_at = datetime('now') WHERE id = ?`,
      [carrier_id, origin_city, origin_state, origin_zip, destination_city, destination_state, destination_zip,
       pickup_date, delivery_date, commodity, weight, equipment_type, shipper_rate, carrier_rate, notes, req.params.id]);

    const updated = get('SELECT * FROM loads WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/loads/:id/status - Update load status
router.put('/:id/status', authenticate, (req, res) => {
  try {
    const load = get('SELECT * FROM loads WHERE id = ?', [req.params.id]);
    if (!load) return res.status(404).json({ error: 'Load not found' });
    if (req.user.role === 'agent' && load.agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status } = req.body;
    const validTransitions = {
      'quoted': ['booked', 'cancelled'],
      'booked': ['dispatched', 'cancelled'],
      'dispatched': ['in_transit', 'cancelled'],
      'in_transit': ['delivered'],
      'delivered': ['invoiced'],
      'invoiced': ['paid'],
    };

    const allowed = validTransitions[load.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot transition from '${load.status}' to '${status}'` });
    }

    run(`UPDATE loads SET status = ?, updated_at = datetime('now') WHERE id = ?`, [status, req.params.id]);

    // Auto-calculate commission when delivered
    if (status === 'delivered' && load.carrier_rate) {
      try {
        const commResult = calculateCommission(load.agent_id, req.params.id);
        // Auto-create invoices
        const invCount1 = get("SELECT COUNT(*) as cnt FROM invoices").cnt;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        run(`INSERT INTO invoices (id, invoice_number, load_id, type, from_entity, to_entity, amount, status, due_date)
             VALUES (?, ?, ?, 'shipper', 'SurfTrans Logistics', ?, ?, 'pending', ?)`,
          [uuidv4(), `INV-S-${String(invCount1 + 1).padStart(5, '0')}`, req.params.id,
           load.shipper_id, load.shipper_rate, dueDate.toISOString().split('T')[0]]);

        run(`INSERT INTO invoices (id, invoice_number, load_id, type, from_entity, to_entity, amount, status, due_date)
             VALUES (?, ?, ?, 'carrier', ?, 'SurfTrans Logistics', ?, 'pending', ?)`,
          [uuidv4(), `INV-C-${String(invCount1 + 2).padStart(5, '0')}`, req.params.id,
           load.carrier_id || 'Carrier', load.carrier_rate, dueDate.toISOString().split('T')[0]]);
      } catch (commErr) {
        console.error('Commission calculation error:', commErr.message);
      }
    }

    const updated = get('SELECT * FROM loads WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Helper: Estimate distance between states (simplified lookup)
function estimateDistance(originState, destState) {
  // Simplified distance matrix (average miles between state pairs)
  const distances = {
    'CA-TX': 1500, 'CA-NY': 2800, 'TX-NY': 1600, 'CA-IL': 2000,
    'TX-IL': 1000, 'NY-IL': 800, 'FL-NY': 1200, 'FL-TX': 1100,
    'CA-WA': 1200, 'TX-FL': 1100, 'IL-NY': 800, 'CA-FL': 2700
  };
  
  const key1 = `${originState}-${destState}`;
  const key2 = `${destState}-${originState}`;
  
  return distances[key1] || distances[key2] || 1000; // Default 1000 miles
}
