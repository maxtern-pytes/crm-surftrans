const express = require('express');
const { all, get } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/revenue-monthly - Monthly revenue data
router.get('/revenue-monthly', authenticate, (req, res) => {
  try {
    let agentFilter = '';
    const params = [];
    if (req.user.role === 'agent') {
      agentFilter = ' AND l.agent_id = ?';
      params.push(req.user.id);
    }

    const data = all(`
      SELECT strftime('%Y-%m', l.created_at) as month,
             COUNT(*) as load_count,
             COALESCE(SUM(l.shipper_rate), 0) as gross_revenue,
             COALESCE(SUM(l.brokerage_fee), 0) as brokerage_revenue,
             COALESCE(SUM(l.carrier_rate), 0) as carrier_cost
      FROM loads l
      WHERE l.status IN ('delivered','paid','invoiced')${agentFilter}
      GROUP BY strftime('%Y-%m', l.created_at)
      ORDER BY month DESC
      LIMIT 12
    `, params);

    res.json(data.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/agent-performance - Agent productivity rankings
router.get('/agent-performance', authenticate, (req, res) => {
  try {
    if (req.user.role === 'agent') {
      // Agent sees only their own stats
      const stats = get(`
        SELECT u.id, u.agent_id, u.first_name, u.last_name,
               u.commission_rate, u.cap_removed, u.total_brokerage,
               (SELECT COUNT(*) FROM loads WHERE agent_id = u.id) as total_loads,
               (SELECT COUNT(*) FROM loads WHERE agent_id = u.id AND status IN ('delivered','paid','invoiced')) as completed_loads,
               (SELECT COALESCE(SUM(brokerage_fee), 0) FROM loads WHERE agent_id = u.id AND status IN ('delivered','paid','invoiced')) as revenue,
               (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions WHERE agent_id = u.id) as earnings
        FROM users u WHERE u.id = ?
      `, [req.user.id]);
      return res.json([stats]);
    }

    const data = all(`
      SELECT u.id, u.agent_id, u.first_name, u.last_name,
             u.commission_rate, u.cap_removed, u.total_brokerage, u.status,
             (SELECT COUNT(*) FROM loads WHERE agent_id = u.id) as total_loads,
             (SELECT COUNT(*) FROM loads WHERE agent_id = u.id AND status IN ('delivered','paid','invoiced')) as completed_loads,
             (SELECT COUNT(*) FROM loads WHERE agent_id = u.id AND status IN ('booked','dispatched','in_transit')) as active_loads,
             (SELECT COALESCE(SUM(brokerage_fee), 0) FROM loads WHERE agent_id = u.id AND status IN ('delivered','paid','invoiced')) as revenue,
             (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions WHERE agent_id = u.id) as earnings,
             (SELECT COALESCE(AVG(brokerage_fee), 0) FROM loads WHERE agent_id = u.id AND status IN ('delivered','paid','invoiced')) as avg_margin
      FROM users u WHERE u.role = 'agent'
      ORDER BY revenue DESC
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/load-volume - Load volume over time
router.get('/load-volume', authenticate, (req, res) => {
  try {
    let agentFilter = '';
    const params = [];
    if (req.user.role === 'agent') {
      agentFilter = ' AND agent_id = ?';
      params.push(req.user.id);
    }

    const data = all(`
      SELECT strftime('%Y-%m', created_at) as month,
             COUNT(*) as total,
             SUM(CASE WHEN status IN ('delivered','paid','invoiced') THEN 1 ELSE 0 END) as completed,
             SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
             SUM(CASE WHEN status IN ('booked','dispatched','in_transit') THEN 1 ELSE 0 END) as active
      FROM loads
      WHERE 1=1${agentFilter}
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
      LIMIT 12
    `, params);

    res.json(data.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/top-lanes - Top shipping lanes
router.get('/top-lanes', authenticate, (req, res) => {
  try {
    let agentFilter = '';
    const params = [];
    if (req.user.role === 'agent') {
      agentFilter = ' AND agent_id = ?';
      params.push(req.user.id);
    }

    const data = all(`
      SELECT origin_state || ' -> ' || destination_state as lane,
             COUNT(*) as load_count,
             COALESCE(AVG(shipper_rate), 0) as avg_rate,
             COALESCE(AVG(brokerage_fee), 0) as avg_margin
      FROM loads
      WHERE status IN ('delivered','paid','invoiced')${agentFilter}
      GROUP BY lane
      ORDER BY load_count DESC
      LIMIT 10
    `, params);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/dashboard-summary - Quick summary for dashboard
router.get('/dashboard-summary', authenticate, (req, res) => {
  try {
    let af = '';
    const p = [];
    if (req.user.role === 'agent') {
      af = ' AND agent_id = ?';
      p.push(req.user.id);
    }

    const activeLoads = get(`SELECT COUNT(*) as count FROM loads WHERE status IN ('booked','dispatched','in_transit')${af}`, [...p]);
    const totalLoads = get(`SELECT COUNT(*) as count FROM loads WHERE 1=1${af}`, [...p]);
    const deliveredThisMonth = get(`SELECT COUNT(*) as count FROM loads WHERE status IN ('delivered','paid','invoiced') AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')${af}`, [...p]);
    const revenueThisMonth = get(`SELECT COALESCE(SUM(brokerage_fee), 0) as total FROM loads WHERE status IN ('delivered','paid','invoiced') AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')${af}`, [...p]);
    const totalRevenue = get(`SELECT COALESCE(SUM(brokerage_fee), 0) as total FROM loads WHERE status IN ('delivered','paid','invoiced')${af}`, [...p]);

    let agentCount = null;
    let shipperCount = null;
    let carrierCount = null;
    if (req.user.role === 'admin') {
      agentCount = get("SELECT COUNT(*) as count FROM users WHERE role = 'agent'").count;
      shipperCount = get("SELECT COUNT(*) as count FROM shippers").count;
      carrierCount = get("SELECT COUNT(*) as count FROM carriers").count;
    } else {
      shipperCount = get("SELECT COUNT(*) as count FROM shippers WHERE agent_id = ?", [req.user.id]).count;
      carrierCount = get("SELECT COUNT(*) as count FROM carriers WHERE agent_id = ?", [req.user.id]).count;
    }

    res.json({
      active_loads: activeLoads.count,
      total_loads: totalLoads.count,
      delivered_this_month: deliveredThisMonth.count,
      revenue_this_month: revenueThisMonth.total,
      total_revenue: totalRevenue.total,
      agent_count: agentCount,
      shipper_count: shipperCount,
      carrier_count: carrierCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
