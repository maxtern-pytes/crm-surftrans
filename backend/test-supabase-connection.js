require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL.replace(/:([^@]+)@/, ':****@'));
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      ca: process.env.SSL_CERT || undefined
    }
  });

  try {
    const client = await pool.connect();
    console.log('\n✅ SUCCESS! Connected to Supabase PostgreSQL');
    
    const result = await client.query('SELECT NOW()');
    console.log('Server time:', result.rows[0].now);
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Connection test passed!');
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('\nPlease verify:');
    console.error('1. Password is correct');
    console.error('2. Supabase project is active');
    console.error('3. Try resetting database password in Supabase dashboard');
  }
}

testConnection();
