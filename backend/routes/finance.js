const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const { parseDocument, runAIAudit } = require('../services/ollama');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, and images are allowed.'));
    }
  }
});

// GET /api/finance/overview - Financial overview
router.get('/overview', authenticate, (req, res) => {
  try {
    let agentFilter = '';
    let agentFilterComm = '';
    const params = [];
    const paramsComm = [];

    if (req.user.role === 'agent') {
      agentFilter = ' AND l.agent_id = ?';
      agentFilterComm = ' AND c.agent_id = ?';
      params.push(req.user.id);
      paramsComm.push(req.user.id);
    }

    const totalRevenue = get(`SELECT COALESCE(SUM(l.brokerage_fee), 0) as total FROM loads l WHERE l.status IN ('delivered','paid','invoiced')${agentFilter}`, [...params]);
    const paidRevenue = get(`SELECT COALESCE(SUM(l.brokerage_fee), 0) as total FROM loads l WHERE l.status = 'paid'${agentFilter}`, [...params]);
    const pendingRevenue = get(`SELECT COALESCE(SUM(l.brokerage_fee), 0) as total FROM loads l WHERE l.status IN ('delivered','invoiced')${agentFilter}`, [...params]);
    const totalShipperRev = get(`SELECT COALESCE(SUM(l.shipper_rate), 0) as total FROM loads l WHERE l.status IN ('delivered','paid','invoiced')${agentFilter}`, [...params]);

    const totalCommissions = get(`SELECT COALESCE(SUM(c.commission_amount), 0) as total FROM commissions c WHERE 1=1${agentFilterComm}`, [...paramsComm]);
    const paidCommissions = get(`SELECT COALESCE(SUM(c.commission_amount), 0) as total FROM commissions c WHERE c.status = 'paid'${agentFilterComm}`, [...paramsComm]);
    const pendingCommissions = get(`SELECT COALESCE(SUM(c.commission_amount), 0) as total FROM commissions c WHERE c.status = 'pending'${agentFilterComm}`, [...paramsComm]);

    const pendingInvoicesCount = get(`SELECT COUNT(*) as count FROM invoices WHERE status IN ('pending','sent')`);
    const overdueInvoicesCount = get(`SELECT COUNT(*) as count FROM invoices WHERE status = 'overdue'`);

    res.json({
      total_brokerage_revenue: totalRevenue.total,
      paid_revenue: paidRevenue.total,
      pending_revenue: pendingRevenue.total,
      total_shipper_revenue: totalShipperRev.total,
      total_commissions: totalCommissions.total,
      paid_commissions: paidCommissions.total,
      pending_commissions: pendingCommissions.total,
      company_net_revenue: totalRevenue.total - totalCommissions.total,
      pending_invoices: pendingInvoicesCount.count,
      overdue_invoices: overdueInvoicesCount.count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/documents/upload - Upload and parse document
router.post('/documents/upload', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { load_id, document_type } = req.body;

    // Extract text from file (simplified - in production use pdf-parse, tesseract, etc.)
    let textContent = '';
    if (req.file.mimetype === 'application/pdf') {
      textContent = `[PDF Document - ${req.file.originalname}]`;
    } else if (req.file.mimetype.includes('image')) {
      textContent = `[Image Document - ${req.file.originalname}]`;
    } else {
      textContent = `[Excel Document - ${req.file.originalname}]`;
    }

    // Call AI to parse document
    const parsedData = await parseDocument(textContent, document_type || 'unknown');

    if (!parsedData) {
      return res.status(503).json({ error: 'AI parsing failed' });
    }

    // Try to match to a load if load_number was extracted
    let matchedLoadId = load_id || null;
    if (parsedData.load_number && !load_id) {
      const matchedLoad = get('SELECT id FROM loads WHERE load_number = ?', [parsedData.load_number]);
      if (matchedLoad) {
        matchedLoadId = matchedLoad.id;
      }
    }

    // If it's an invoice and matched to a load, create invoice record
    if (parsedData.document_type === 'invoice' && matchedLoadId && parsedData.amount) {
      const load = get('SELECT * FROM loads WHERE id = ?', [matchedLoadId]);
      if (load) {
        const invCount = get("SELECT COUNT(*) as cnt FROM invoices").cnt;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        run(`INSERT INTO invoices (id, invoice_number, load_id, type, from_entity, to_entity, amount, status, due_date)
             VALUES (?, ?, ?, 'shipper', ?, ?, 'pending', ?)`,
          [uuidv4(), `INV-AI-${String(invCount + 1).padStart(5, '0')}`, matchedLoadId,
           parsedData.from_entity || 'Unknown', parsedData.amount, dueDate.toISOString().split('T')[0]]);
      }
    }

    res.json({
      ...parsedData,
      matched_load_id: matchedLoadId,
      file_name: req.file.originalname,
      file_size: req.file.size
    });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/ai-audit - Run AI audit on financial records
router.post('/ai-audit', authenticate, async (req, res) => {
  try {
    const { load_id, document_ids } = req.body;

    // Gather financial data for audit
    let auditData = {};

    if (load_id) {
      const load = get(`
        SELECT l.*, 
          s.company_name as shipper_name, c.company_name as carrier_name
        FROM loads l
        LEFT JOIN shippers s ON l.shipper_id = s.id
        LEFT JOIN carriers c ON l.carrier_id = c.id
        WHERE l.id = ?
      `, [load_id]);

      if (!load) {
        return res.status(404).json({ error: 'Load not found' });
      }

      const invoices = all('SELECT * FROM invoices WHERE load_id = ?', [load_id]);
      const commission = get('SELECT * FROM commissions WHERE load_id = ?', [load_id]);

      auditData = {
        load,
        invoices,
        commission,
        audit_type: 'single_load'
      };
    } else {
      // Audit all recent transactions
      const recentLoads = all(`
        SELECT * FROM loads 
        WHERE status IN ('delivered', 'invoiced', 'paid')
        ORDER BY updated_at DESC
        LIMIT 20
      `);

      const recentInvoices = all(`
        SELECT * FROM invoices 
        ORDER BY created_at DESC
        LIMIT 50
      `);

      auditData = {
        loads: recentLoads,
        invoices: recentInvoices,
        audit_type: 'bulk_audit'
      };
    }

    // Run AI audit
    const auditResult = await runAIAudit(auditData);

    if (!auditResult) {
      return res.status(503).json({ error: 'AI audit failed' });
    }

    res.json(auditResult);
  } catch (err) {
    console.error('AI audit error:', err);
    res.status(503).json({ error: 'AI service unavailable: ' + err.message });
  }
});

// GET /api/finance/invoices
router.get('/invoices', authenticate, (req, res) => {
  try {
    const { status, type, page = 1, limit = 50 } = req.query;
    let sql = `SELECT i.*, l.load_number, l.agent_id,
               u.first_name as agent_first, u.last_name as agent_last
               FROM invoices i
               JOIN loads l ON i.load_id = l.id
               LEFT JOIN users u ON l.agent_id = u.id
               WHERE 1=1`;
    const params = [];

    if (req.user.role === 'agent') {
      sql += ' AND l.agent_id = ?';
      params.push(req.user.id);
    }

    if (status) { sql += ' AND i.status = ?'; params.push(status); }
    if (type) { sql += ' AND i.type = ?'; params.push(type); }

    sql += ' ORDER BY i.created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const invoices = all(sql, params);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/finance/invoices/:id/status
router.put('/invoices/:id/status', authenticate, adminOnly, (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'sent', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const invoice = get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const updates = { status };
    if (status === 'paid') {
      updates.paid_date = new Date().toISOString().split('T')[0];
      run(`UPDATE invoices SET status = ?, paid_date = ? WHERE id = ?`, [status, updates.paid_date, req.params.id]);
    } else {
      run(`UPDATE invoices SET status = ? WHERE id = ?`, [status, req.params.id]);
    }

    const updated = get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/commissions
router.get('/commissions', authenticate, (req, res) => {
  try {
    const { status, agent_id, page = 1, limit = 50 } = req.query;
    let sql = `SELECT c.*, u.first_name as agent_first, u.last_name as agent_last, u.agent_id as agent_code,
               l.origin_city, l.origin_state, l.destination_city, l.destination_state, l.shipper_rate, l.carrier_rate
               FROM commissions c
               JOIN users u ON c.agent_id = u.id
               JOIN loads l ON c.load_id = l.id
               WHERE 1=1`;
    const params = [];

    if (req.user.role === 'agent') {
      sql += ' AND c.agent_id = ?';
      params.push(req.user.id);
    } else if (agent_id) {
      sql += ' AND c.agent_id = ?';
      params.push(agent_id);
    }

    if (status) { sql += ' AND c.status = ?'; params.push(status); }

    sql += ' ORDER BY c.created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const commissions = all(sql, params);
    res.json(commissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/finance/commissions/:id/approve
router.put('/commissions/:id/approve', authenticate, adminOnly, (req, res) => {
  try {
    const commission = get('SELECT * FROM commissions WHERE id = ?', [req.params.id]);
    if (!commission) return res.status(404).json({ error: 'Commission not found' });

    run(`UPDATE commissions SET status = 'approved' WHERE id = ?`, [req.params.id]);
    const updated = get('SELECT * FROM commissions WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/finance/commissions/:id/pay
router.put('/commissions/:id/pay', authenticate, adminOnly, (req, res) => {
  try {
    const commission = get('SELECT * FROM commissions WHERE id = ?', [req.params.id]);
    if (!commission) return res.status(404).json({ error: 'Commission not found' });

    run(`UPDATE commissions SET status = 'paid' WHERE id = ?`, [req.params.id]);

    // Notify agent
    run(`INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), commission.agent_id, 'Commission Paid',
       `Your commission of $${commission.commission_amount.toFixed(2)} for load ${commission.load_number} has been paid.`,
       'success']);

    const updated = get('SELECT * FROM commissions WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
