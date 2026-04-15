const { getDb, run, get } = require('./database');

/**
 * Migration: Create AI Agent tables
 */
async function runMigration() {
  console.log('Running AI Agent migration...');

  try {
    await getDb();
    console.log('Database initialized');

    // Create ai_conversations table
    try {
      run(`CREATE TABLE IF NOT EXISTS ai_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
        content TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);
      console.log('✓ Created ai_conversations table');
    } catch (e) {
      console.log('- ai_conversations table may already exist');
    }

    // Create ai_emails table
    try {
      run(`CREATE TABLE IF NOT EXISTS ai_emails (
        id TEXT PRIMARY KEY,
        load_id TEXT,
        shipper_id TEXT,
        carrier_id TEXT,
        from_email TEXT NOT NULL,
        to_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('outreach','follow_up','quote','negotiation','confirmation')),
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sent','replied','failed')),
        ai_generated INTEGER NOT NULL DEFAULT 1,
        replied_content TEXT,
        sentiment TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        sent_at TEXT,
        FOREIGN KEY (load_id) REFERENCES loads(id),
        FOREIGN KEY (shipper_id) REFERENCES shippers(id),
        FOREIGN KEY (carrier_id) REFERENCES carriers(id)
      )`);
      console.log('✓ Created ai_emails table');
    } catch (e) {
      console.log('- ai_emails table may already exist');
    }

    // Create ai_tasks table
    try {
      run(`CREATE TABLE IF NOT EXISTS ai_tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        task_type TEXT NOT NULL CHECK(task_type IN ('call_required','approval_needed','exception','follow_up','negotiation','verification')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled')),
        context TEXT,
        related_load_id TEXT,
        related_client_id TEXT,
        due_date TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);
      console.log('✓ Created ai_tasks table');
    } catch (e) {
      console.log('- ai_tasks table may already exist');
    }

    // Create market_leads table
    try {
      run(`CREATE TABLE IF NOT EXISTS market_leads (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        industry TEXT,
        location TEXT,
        city TEXT,
        state TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        lead_score REAL,
        source TEXT DEFAULT 'ai_discovery',
        status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','qualified','converted','rejected')),
        notes TEXT,
        contacted_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      console.log('✓ Created market_leads table');
    } catch (e) {
      console.log('- market_leads table may already exist');
    }

    // Create indexes
    try {
      run(`CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id)`);
      run(`CREATE INDEX IF NOT EXISTS idx_ai_emails_status ON ai_emails(status)`);
      run(`CREATE INDEX IF NOT EXISTS idx_ai_tasks_user ON ai_tasks(user_id)`);
      run(`CREATE INDEX IF NOT EXISTS idx_market_leads_status ON market_leads(status)`);
      console.log('✓ Created indexes');
    } catch (e) {
      console.log('- Indexes may already exist');
    }

    console.log('\nAI Agent migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
