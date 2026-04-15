/**
 * Supabase PostgreSQL Database Adapter
 * Replaces SQLite with real PostgreSQL for production
 */

const { initPostgreSQL, query, queryOne, execute } = require('../config/postgres');

/**
 * Initialize Supabase PostgreSQL
 */
async function initDatabase() {
  try {
    await initPostgreSQL();
    console.log('✅ Supabase PostgreSQL initialized');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    throw error;
  }
}

/**
 * Run SQL query (replaces SQLite run)
 */
function run(sql, params = []) {
  return execute(sql, params);
}

/**
 * Get all rows (replaces SQLite all)
 */
async function all(sql, params = []) {
  return await query(sql, params);
}

/**
 * Get single row (replaces SQLite get)
 */
async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * Save database (not needed for PostgreSQL, but kept for compatibility)
 */
function saveDb() {
  // PostgreSQL auto-saves, no action needed
}

/**
 * Get database instance (for compatibility)
 */
async function getDb() {
  return await initDatabase();
}

module.exports = { 
  initDatabase,
  getDb, 
  saveDb, 
  run, 
  all, 
  get 
};
