require('dotenv').config();
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

// Middleware - CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://surftrans-frontend.onrender.com',
      'https://surftrans-frontend.vercel.app'
    ];
    
    // Add CORS_ORIGINS from environment variable
    if (process.env.CORS_ORIGINS) {
      const envOrigins = process.env.CORS_ORIGINS.split(',').map(u => u.trim());
      allowedOrigins.push(...envOrigins);
    }
    
    // Allow all onrender.com domains
    const isRenderDomain = origin.endsWith('.onrender.com');
    
    if (allowedOrigins.indexOf(origin) !== -1 || isRenderDomain || process.env.FRONTEND_URL === origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Pre-flight cache for 10 minutes
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
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

// ONLY serve frontend in production if frontend/dist exists locally
// (This is NOT needed when frontend and backend are separate Render services)
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');

if (fs.existsSync(path.join(frontendPath, 'index.html'))) {
  console.log('🌐 Serving frontend from:', frontendPath);
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
} else {
  console.log('🔌 Frontend not found - running as API-only mode (frontend deployed separately)');
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Starting CRM SurfTrans');
    console.log(`📊 Database: ${dbType === 'postgresql' ? 'PostgreSQL' : 'SQLite'}`);
    console.log('='.repeat(60) + '\n');
    
    await getDb();
    console.log(`✅ Database initialized: ${dbType === 'postgresql' ? 'PostgreSQL' : 'SQLite'}\n`);

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

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - keep server running
});
