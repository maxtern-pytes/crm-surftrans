const express = require('express');
const cors = require('cors');
const path = require('path');

// Database initialization - Use Supabase or SQLite based on config
const dbType = process.env.DB_TYPE || 'sqlite';
let dbModule;

if (dbType === 'postgresql') {
  dbModule = require('./db/database-supabase');
} else {
  dbModule = require('./db/database');
}

const { getDb } = dbModule;

const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agents');
const clientRoutes = require('./routes/clients');
const loadRoutes = require('./routes/loads');
const financeRoutes = require('./routes/finance');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const aiAgentRoutes = require('./routes/ai-agent');
const marketRoutes = require('./routes/market');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai-agent', aiAgentRoutes);
app.use('/api/market', marketRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Serve frontend in production
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Starting CRM SurfTrans with Supabase PostgreSQL');
    console.log('='.repeat(60) + '\n');
    
    await getDb();
    console.log('✅ Database initialized: Supabase PostgreSQL\n');

    app.listen(PORT, () => {
      console.log(`Freight Broker API running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
