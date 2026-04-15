const express = require('express');
const { authenticate } = require('../middleware/auth');
const marketAnalytics = require('../services/market-analytics');
const taskAssignment = require('../services/task-assignment');
const businessScraper = require('../services/scrapers/business-scraper');
const marketScraper = require('../services/scrapers/market-data-scraper');

const router = express.Router();

// ============================================
// MARKET TRENDS ENDPOINTS
// ============================================

// GET /api/market/dashboard - Full market dashboard
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const dashboard = await marketAnalytics.getMarketDashboard();
    res.json(dashboard);
  } catch (err) {
    console.error('Market dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/summary - Market summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const summary = await marketAnalytics.getMarketSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/lane/:origin/:destination - Lane-specific analytics
router.get('/lane/:origin/:destination', authenticate, (req, res) => {
  try {
    const analytics = marketAnalytics.getLaneAnalytics(req.params.origin, req.params.destination);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/forecast/:origin/:destination - Rate forecasting
router.get('/forecast/:origin/:destination', authenticate, (req, res) => {
  try {
    const { days = 30 } = req.query;
    const forecast = marketAnalytics.forecastLaneRates(
      req.params.origin,
      req.params.destination,
      parseInt(days)
    );
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/fuel-prices - Current fuel prices
router.get('/fuel-prices', authenticate, async (req, res) => {
  try {
    const fuelData = await marketScraper.scrapeFuelPrices();
    res.json(fuelData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/commodities - Commodity trends
router.get('/commodities', authenticate, (req, res) => {
  try {
    const trends = marketAnalytics.getCommodityTrends();
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/capacity - Capacity indicators
router.get('/capacity', authenticate, (req, res) => {
  try {
    const capacity = marketAnalytics.getCapacityIndicators();
    res.json(capacity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/seasonal - Seasonal insights
router.get('/seasonal', authenticate, (req, res) => {
  try {
    const insights = marketAnalytics.getSeasonalInsights();
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TASK ASSIGNMENT ENDPOINTS
// ============================================

// GET /api/tasks/my-tasks - Get tasks for current user
router.get('/tasks/my-tasks', authenticate, (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const tasks = taskAssignment.getUserTasks(req.user.id, status);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/urgent - Get urgent tasks
router.get('/tasks/urgent', authenticate, (req, res) => {
  try {
    const tasks = taskAssignment.getUrgentTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id/status - Update task status
router.put('/tasks/:id/status', authenticate, (req, res) => {
  try {
    const { status, outcome_notes } = req.body;
    taskAssignment.updateTaskStatus(req.params.id, status, outcome_notes);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/analytics - Task performance analytics
router.get('/tasks/analytics', authenticate, (req, res) => {
  try {
    const analytics = taskAssignment.getTaskAnalytics(req.user.id);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// BUSINESS DISCOVERY ENDPOINTS
// ============================================

// POST /api/market/discover-businesses - Discover new businesses
router.post('/discover-businesses', authenticate, async (req, res) => {
  try {
    const { 
      type = 'all', // 'traditional', 'emerging', 'all'
      industries,
      regions,
      signals,
      limit = 50
    } = req.body;

    let businesses = [];

    if (type === 'traditional' || type === 'all') {
      const traditional = await businessScraper.discoverTraditionalBusinesses({
        industries: industries || ['manufacturing', 'wholesale', 'distribution'],
        regions: regions || [],
        limit: Math.floor(limit / 2)
      });
      businesses = businesses.concat(traditional);
    }

    if (type === 'emerging' || type === 'all') {
      const emerging = await businessScraper.discoverEmergingBusinesses({
        industries: industries || [],
        signals: signals || ['recent_funding', 'hiring', 'product_launch'],
        limit: Math.floor(limit / 2)
      });
      businesses = businesses.concat(emerging);
    }

    res.json({
      total: businesses.length,
      businesses: businesses.slice(0, limit)
    });
  } catch (err) {
    console.error('Business discovery error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/business-stats - Get business discovery stats
router.get('/business-stats', authenticate, (req, res) => {
  try {
    const stats = businessScraper.getEmergingBusinessStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// EMAIL TRACKING ENDPOINTS
// ============================================

// GET /api/market/email-stats - Get email statistics
router.get('/email-stats', authenticate, (req, res) => {
  try {
    const emailSender = require('../services/email-sender');
    const stats = emailSender.getEmailStats(30);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/recent-emails - Get recent emails
router.get('/recent-emails', authenticate, (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const emailSender = require('../services/email-sender');
    const emails = emailSender.getSentEmails(parseInt(limit));
    res.json(emails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// MARKET DATA REFRESH
// ============================================

// POST /api/market/refresh - Refresh market data
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const { type = 'all' } = req.body;
    const results = {};

    if (type === 'fuel' || type === 'all') {
      results.fuel_prices = await marketScraper.scrapeFuelPrices();
    }

    if (type === 'trends' || type === 'all') {
      results.market_trends = await marketScraper.scrapeMarketTrends();
    }

    res.json({
      success: true,
      refreshed: Object.keys(results),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
