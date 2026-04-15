const { getDb } = require('./db/database');

async function checkTables() {
  await getDb();
  const sqlite3 = require('sqlite3');
  const path = require('path');
  const fs = require('fs');
  
  const dbPath = path.join(__dirname, 'data', 'freight_broker.db');
  
  if (!fs.existsSync(dbPath)) {
    console.log('Database file not found');
    process.exit(1);
  }
  
  const db = new sqlite3.Database(dbPath);
  
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('Tables in database:');
      rows.forEach(row => console.log(' -', row.name));
    }
    db.close();
    process.exit(0);
  });
}

checkTables();
