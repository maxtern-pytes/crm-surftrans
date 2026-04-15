const { getDb, run, get } = require('./database');

/**
 * Migration: Add AI metadata columns to existing tables
 * Run this once to upgrade existing database schema
 */
async function runMigration() {
  console.log('Running AI enhancement migration...');

  try {
    // Initialize database first
    await getDb();
    console.log('Database initialized');

    // Add columns to loads table
    const loadColumns = [
      { name: 'ai_quote_data', type: 'TEXT' },
      { name: 'risk_level', type: 'TEXT DEFAULT \'medium\'' },
      { name: 'transit_estimate', type: 'TEXT' }
    ];

    for (const col of loadColumns) {
      try {
        run(`ALTER TABLE loads ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✓ Added loads.${col.name}`);
      } catch (e) {
        if (e.message.includes('duplicate column')) {
          console.log(`- loads.${col.name} already exists`);
        } else {
          console.error(`✗ Failed to add loads.${col.name}:`, e.message);
        }
      }
    }

    // Add columns to shippers table
    const shipperColumns = [
      { name: 'ai_score', type: 'REAL' },
      { name: 'conversion_probability', type: 'REAL' },
      { name: 'outreach_status', type: 'TEXT DEFAULT \'not_contacted\'' }
    ];

    for (const col of shipperColumns) {
      try {
        run(`ALTER TABLE shippers ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✓ Added shippers.${col.name}`);
      } catch (e) {
        if (e.message.includes('duplicate column')) {
          console.log(`- shippers.${col.name} already exists`);
        } else {
          console.error(`✗ Failed to add shippers.${col.name}:`, e.message);
        }
      }
    }

    // Add columns to carriers table
    const carrierColumns = [
      { name: 'ai_match_score', type: 'REAL' },
      { name: 'reliability_score', type: 'REAL' }
    ];

    for (const col of carrierColumns) {
      try {
        run(`ALTER TABLE carriers ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✓ Added carriers.${col.name}`);
      } catch (e) {
        if (e.message.includes('duplicate column')) {
          console.log(`- carriers.${col.name} already exists`);
        } else {
          console.error(`✗ Failed to add carriers.${col.name}:`, e.message);
        }
      }
    }

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
