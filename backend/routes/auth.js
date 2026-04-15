const express = require('express');
const bcrypt = require('bcryptjs');
const { get } = require('../db/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is ' + user.status });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        agent_id: user.agent_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        commission_rate: user.commission_rate,
        commission_cap: user.commission_cap,
        cap_removed: !!user.cap_removed,
        total_brokerage: user.total_brokerage,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const user = get('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      agent_id: user.agent_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone,
      status: user.status,
      commission_rate: user.commission_rate,
      commission_cap: user.commission_cap,
      cap_removed: !!user.cap_removed,
      total_brokerage: user.total_brokerage,
      created_at: user.created_at,
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
