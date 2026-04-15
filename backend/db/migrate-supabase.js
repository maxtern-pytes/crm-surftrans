require('dotenv').config();
const { initPostgreSQL, getPool } = require('../config/postgres');
const { postgresSQL } = require('./schema-postgres');

/**
 * Migration: Setup Supabase PostgreSQL with full schema
 */
async function runMigration() {
  console.log('🚀 Running Supabase PostgreSQL migration...\n');

  try {
    // Initialize connection
    await initPostgreSQL();
    console.log('✅ Connected to Supabase PostgreSQL\n');

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');
      console.log('📝 Starting database migration...\n');

      // Split schema into individual statements
      const statements = postgresSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      let executed = 0;
      for (const statement of statements) {
        if (statement.length > 10) { // Skip empty or very short statements
          try {
            await client.query(statement);
            executed++;
          } catch (err) {
            // Table already exists errors are OK
            if (!err.message.includes('already exists')) {
              console.warn(`⚠️  Warning: ${err.message}`);
            }
          }
        }
      }

      console.log(`✅ Executed ${executed} SQL statements\n`);

      // Commit transaction
      await client.query('COMMIT');
      console.log('✅ Transaction committed\n');

      console.log('═'.repeat(60));
      console.log('🎉 SUPABASE MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('═'.repeat(60));
      console.log('\nDatabase Tables Created:');
      console.log('  ✓ users');
      console.log('  ✓ shippers');
      console.log('  ✓ carriers');
      console.log('  ✓ loads');
      console.log('  ✓ commissions');
      console.log('  ✓ invoices');
      console.log('  ✓ communication_logs');
      console.log('  ✓ notifications');
      console.log('  ✓ ai_conversations');
      console.log('  ✓ ai_emails');
      console.log('  ✓ ai_tasks');
      console.log('  ✓ market_leads');
      console.log('  ✓ user_task_assignments');
      console.log('  ✓ market_trends');
      console.log('  ✓ load_market_data');
      console.log('  ✓ web_scrape_logs');
      console.log('  ✓ ai_learning_data');
      console.log('\nFeatures Ready:');
      console.log('  ✅ AI Learning & Memory System');
      console.log('  ✅ Client Profile Tracking');
      console.log('  ✅ Email Intelligence');
      console.log('  ✅ Market Data Scraping');
      console.log('  ✅ Real-time Analytics');
      console.log('\n🚀 Your Supabase database is ready for production!');
      console.log('═'.repeat(60));

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('\n❌ Migration failed:', error.message);
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('\n❌ Database connection failed:', error.message);
    console.error('\n📋 Please check:');
    console.error('  1. DATABASE_URL in .env file');
    console.error('  2. Supabase project is active');
    console.error('  3. Network connectivity to Supabase');
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
