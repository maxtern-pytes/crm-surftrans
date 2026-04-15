const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const { initSQL } = require('./schema');

const DB_PATH = path.join(__dirname, '..', 'data', 'freight_broker.db');

let db = null;

async function getDb() {
  if (db) return db;

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable WAL mode equivalent and foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Run schema
  db.run(initSQL);

  // Persist
  saveDb();

  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper: run a query that modifies data (INSERT/UPDATE/DELETE)
function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call getDb() first.');
  db.run(sql, params);
  saveDb();
  return { changes: db.getRowsModified() };
}

// Helper: get all rows
function all(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call getDb() first.');
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: get single row
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

module.exports = { getDb, saveDb, run, all, get };
