require('dotenv').config();
const { getDb, run, get } = require('./database-supabase');
const bcrypt = require('bcryptjs');

async function seed() {
  await getDb();

  console.log('\n🌱 Seeding Supabase database with demo data...\n');

  // Check if already seeded
  const existing = await get('SELECT COUNT(*) as cnt FROM users');
  if (existing && existing.cnt > 0) {
    console.log('⚠️  Database already seeded. Skipping.\n');
    return;
  }

  // Create admin
  const adminPass = bcrypt.hashSync('admin123', 10);
  await run(`INSERT INTO users (email, password_hash, first_name, last_name, role, phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    ['admin@surftrans.com', adminPass, 'System', 'Admin', 'admin', '555-000-0001', 'active']);
  console.log('✅ Created admin user');

  // Create sample agents
  const agents = [
    { first: 'James', last: 'Mitchell', email: 'agent@surftrans.com', phone: '555-101-0001' },
    { first: 'Sarah', last: 'Chen', email: 'sarah.c@surftrans.com', phone: '555-101-0002' },
    { first: 'Marcus', last: 'Johnson', email: 'marcus.j@surftrans.com', phone: '555-101-0003' },
  ];

  for (const agent of agents) {
    const pass = bcrypt.hashSync('agent123', 10);
    await run(`INSERT INTO users (email, password_hash, first_name, last_name, role, phone, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [agent.email, pass, agent.first, agent.last, 'agent', agent.phone, 'active']);
    console.log(`✅ Created agent: ${agent.first} ${agent.last}`);
  }

  // Create sample shippers
  const shippers = [
    { name: 'Acme Manufacturing', contact: 'John Smith', email: 'john@acme.com', phone: '555-201-0001', city: 'Los Angeles', state: 'CA' },
    { name: 'Pacific Foods Inc', contact: 'Maria Garcia', email: 'maria@pacificfoods.com', phone: '555-201-0002', city: 'Houston', state: 'TX' },
    { name: 'TechSupply Co', contact: 'Robert Chen', email: 'robert@techsupply.com', phone: '555-201-0003', city: 'Chicago', state: 'IL' },
    { name: 'Global Retailers LLC', contact: 'Lisa Johnson', email: 'lisa@globalretail.com', phone: '555-201-0004', city: 'Miami', state: 'FL' },
    { name: 'Midwest Distributors', contact: 'Tom Wilson', email: 'tom@midwest.com', phone: '555-201-0005', city: 'Dallas', state: 'TX' },
  ];

  for (const shipper of shippers) {
    const result = await run(`INSERT INTO shippers (company_name, contact_name, email, phone, city, state, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [shipper.name, shipper.contact, shipper.email, shipper.phone, shipper.city, shipper.state, 'active']);
    console.log(`✅ Created shipper: ${shipper.name}`);
  }

  // Create sample carriers
  const carriers = [
    { name: 'Fast Freight Lines', contact: 'Mike Brown', mc: 'MC-123456', equipment: ['Dry Van', 'Reefer'] },
    { name: 'Reliable Transport', contact: 'Steve Davis', mc: 'MC-234567', equipment: ['Flatbed', 'Step Deck'] },
    { name: 'Prime Carriers', contact: 'Jennifer Lee', mc: 'MC-345678', equipment: ['Dry Van', 'Box Truck'] },
    { name: 'Express Logistics', contact: 'Chris Taylor', mc: 'MC-456789', equipment: ['Reefer', 'Dry Van'] },
  ];

  for (const carrier of carriers) {
    await run(`INSERT INTO carriers (company_name, contact_name, mc_number, equipment_types, status)
         VALUES ($1, $2, $3, $4, $5)`,
      [carrier.name, carrier.contact, carrier.mc, carrier.equipment, 'active']);
    console.log(`✅ Created carrier: ${carrier.name}`);
  }

  // Create sample loads
  const loads = [
    { number: 'LOAD-001', origin_city: 'Los Angeles', origin_state: 'CA', dest_city: 'Houston', dest_state: 'TX', commodity: 'Electronics', weight: 15000, rate: 3500, status: 'delivered' },
    { number: 'LOAD-002', origin_city: 'Chicago', origin_state: 'IL', dest_city: 'Miami', dest_state: 'FL', commodity: 'Food Products', weight: 25000, rate: 4200, status: 'in_transit' },
    { number: 'LOAD-003', origin_city: 'Dallas', origin_state: 'TX', dest_city: 'Seattle', dest_state: 'WA', commodity: 'Machinery', weight: 35000, rate: 5800, status: 'booked' },
  ];

  for (const load of loads) {
    await run(`INSERT INTO loads (load_number, shipper_id, carrier_id, agent_id, origin_city, origin_state, dest_city, dest_state, commodity, weight, rate, status)
         VALUES ($1, 1, 1, 2, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [load.number, load.origin_city, load.origin_state, load.dest_city, load.dest_state, load.commodity, load.weight, load.rate, load.status]);
    console.log(`✅ Created load: ${load.number}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📝 Login Credentials:');
  console.log('  Admin: admin@surftrans.com / admin123');
  console.log('  Agent: agent@surftrans.com / agent123');
  console.log('\n📊 Created:');
  console.log('  ✓ 1 Admin user');
  console.log('  ✓ 3 Agent users');
  console.log('  ✓ 5 Shippers');
  console.log('  ✓ 4 Carriers');
  console.log('  ✓ 3 Loads');
  console.log('\n🚀 Ready to use!\n');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
