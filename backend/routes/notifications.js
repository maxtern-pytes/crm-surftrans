const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', authenticate, (req, res) => {
  try {
    const { unread_only } = req.query;
    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];

    if (unread_only === 'true') {
      sql += ' AND read = 0';
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';
    const notifications = all(sql, params);
    const unreadCount = get('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0', [req.user.id]);

    res.json({ notifications, unread_count: unreadCount.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, (req, res) => {
  try {
    run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticate, (req, res) => {
  try {
    run('UPDATE notifications SET read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
