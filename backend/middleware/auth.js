const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'surftrans-freight-broker-secret-key-2024';
const JWT_EXPIRES = '24h';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, agent_id: user.agent_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function agentOrAdmin(req, res, next) {
  if (!['admin', 'agent'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

module.exports = { JWT_SECRET, generateToken, authenticate, adminOnly, agentOrAdmin };
