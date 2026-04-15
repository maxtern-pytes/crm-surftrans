const { getDb, run, get } = require('./database');

/**
 * Migration: Create AI Learning & Memory tables
 */
async function runMigration() {
  console.log('Running AI Learning & Memory migration...');

  try {
    await getDb();
    console.log('Database initialized');

    // Create ai_learning_data table
    try {
      run(`CREATE TABLE IF NOT EXISTS ai_learning_data (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        data_type TEXT NOT NULL,
        data TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      console.log('✓ Created ai_learning_data table');
    } catch (e) {
      console.log('- ai_learning_data table may already exist');
    }

    // Create indexes for performance
    try {
      run(`CREATE INDEX IF NOT EXISTS idx_ai_learning_entity ON ai_learning_data(entity_type, entity_id)`);
      run(`CREATE INDEX IF NOT EXISTS idx_ai_learning_type ON ai_learning_data(data_type)`);
      run(`CREATE INDEX IF NOT EXISTS idx_ai_learning_updated ON ai_learning_data(updated_at DESC)`);
      console.log('✓ Created indexes');
    } catch (e) {
      console.log('- Indexes may already exist');
    }

    // Add sentiment column to communication_logs if not exists
    try {
      run(`ALTER TABLE communication_logs ADD COLUMN sentiment TEXT`);
      console.log('✓ Added sentiment column to communication_logs');
    } catch (e) {
      console.log('- sentiment column may already exist in communication_logs');
    }

    // Add interaction_count to shippers
    try {
      run(`ALTER TABLE shippers ADD COLUMN interaction_count INTEGER DEFAULT 0`);
      console.log('✓ Added interaction_count to shippers');
    } catch (e) {
      console.log('- interaction_count may already exist in shippers');
    }

    // Add interaction_count to carriers
    try {
      run(`ALTER TABLE carriers ADD COLUMN interaction_count INTEGER DEFAULT 0`);
      console.log('✓ Added interaction_count to carriers');
    } catch (e) {
      console.log('- interaction_count may already exist in carriers');
    }

    console.log('\n✅ AI Learning & Memory migration completed successfully!');
    console.log('\nNew capabilities:');
    console.log('  - Client memory profiles');
    console.log('  - Behavior tracking');
    console.log('  - Email pattern analysis');
    console.log('  - Preference learning');
    console.log('  - Portfolio insights');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };
