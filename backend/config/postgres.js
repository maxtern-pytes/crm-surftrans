/**
 * PostgreSQL Configuration
 * For production deployment - currently using SQLite for development
 */

const { Pool } = require('pg');

let pool = null;

/**
 * Initialize PostgreSQL connection pool
 */
async function initPostgreSQL() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/surftrans';
  
  // Check if SSL is needed (for Supabase)
  const isSupabase = connectionString.includes('supabase.co');
  
  pool = new Pool({
    connectionString,
    ssl: isSupabase ? {
      rejectUnauthorized: false,
      ca: process.env.SSL_CERT || undefined
    } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Test connection
  const client = await pool.connect();
  console.log('✅ PostgreSQL connected successfully');
  client.release();

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

/**
 * Get PostgreSQL pool instance
 */
function getPool() {
  if (!pool) {
    throw new Error('PostgreSQL not initialized. Call initPostgreSQL() first.');
  }
  return pool;
}

/**
 * Execute query and return all rows
 */
async function query(sql, params = []) {
  const pool = getPool();
  const result = await pool.query(sql, params);
  return result.rows;
}

/**
 * Execute query and return single row
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * Execute query that modifies data
 */
async function execute(sql, params = []) {
  const pool = getPool();
  const result = await pool.query(sql, params);
  return result.rowCount;
}

/**
 * Run migration scripts
 */
async function runMigration(sql) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close connection pool
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL pool closed');
  }
}

module.exports = {
  initPostgreSQL,
  getPool,
  query,
  queryOne,
  execute,
  runMigration,
  closePool
};
