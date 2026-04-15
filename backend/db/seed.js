const { getDb, run, get } = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  await getDb();

  // Check if already seeded
  const existing = get('SELECT COUNT(*) as cnt FROM users');
  if (existing && existing.cnt > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  console.log('Seeding database...');

  // Create admin
  const adminId = uuidv4();
  const adminPass = bcrypt.hashSync('admin123', 10);
  run(`INSERT INTO users (id, agent_id, email, password_hash, first_name, last_name, role, phone, commission_rate, commission_cap)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [adminId, 'ADMIN-001', 'admin@surftrans.com', adminPass, 'System', 'Admin', 'admin', '555-000-0001', 0, null]);

  // Create sample agents
  const agents = [
    { first: 'James', last: 'Mitchell', email: 'james.m@surftrans.com', phone: '555-101-0001' },
    { first: 'Sarah', last: 'Chen', email: 'sarah.c@surftrans.com', phone: '555-101-0002' },
    { first: 'Marcus', last: 'Johnson', email: 'marcus.j@surftrans.com', phone: '555-101-0003' },
    { first: 'Emily', last: 'Rodriguez', email: 'emily.r@surftrans.com', phone: '555-101-0004' },
    { first: 'David', last: 'Kim', email: 'david.k@surftrans.com', phone: '555-101-0005' },
  ];

  const agentIds = [];
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    const id = uuidv4();
    agentIds.push(id);
    const pass = bcrypt.hashSync('agent123', 10);
    const agentNum = String(i + 1).padStart(4, '0');
    run(`INSERT INTO users (id, agent_id, email, password_hash, first_name, last_name, role, phone, commission_rate, commission_cap)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, `AGT-${agentNum}`, a.email, pass, a.first, a.last, 'agent', a.phone, 0.17, 500]);
  }

  // Create sample shippers
  const shippers = [
    { company: 'Midwest Manufacturing Co.', contact: 'Tom Bradley', email: 'tom@midwestmfg.com', phone: '555-200-0001', city: 'Chicago', state: 'IL', zip: '60601', category: 'enterprise' },
    { company: 'Pacific Goods Inc.', contact: 'Linda Park', email: 'linda@pacificgoods.com', phone: '555-200-0002', city: 'Los Angeles', state: 'CA', zip: '90001', category: 'premium' },
    { company: 'Atlantic Fresh Produce', contact: 'Robert Davis', email: 'robert@atlanticfresh.com', phone: '555-200-0003', city: 'Miami', state: 'FL', zip: '33101', category: 'standard' },
    { company: 'Texan Steel Works', contact: 'Maria Gonzalez', email: 'maria@texansteel.com', phone: '555-200-0004', city: 'Houston', state: 'TX', zip: '77001', category: 'enterprise' },
    { company: 'Northern Electronics', contact: 'Bill Thompson', email: 'bill@northernelec.com', phone: '555-200-0005', city: 'Seattle', state: 'WA', zip: '98101', category: 'premium' },
    { company: 'Heartland Grain Corp', contact: 'Nancy White', email: 'nancy@heartlandgrain.com', phone: '555-200-0006', city: 'Kansas City', state: 'MO', zip: '64101', category: 'standard' },
    { company: 'East Coast Pharma', contact: 'Dr. Alex Singh', email: 'alex@ecpharma.com', phone: '555-200-0007', city: 'Boston', state: 'MA', zip: '02101', category: 'enterprise' },
    { company: 'Rocky Mountain Lumber', contact: 'Jake Morrison', email: 'jake@rmlumber.com', phone: '555-200-0008', city: 'Denver', state: 'CO', zip: '80201', category: 'standard' },
  ];

  const shipperIds = [];
  for (let i = 0; i < shippers.length; i++) {
    const s = shippers[i];
    const id = uuidv4();
    shipperIds.push(id);
    const agentOwner = agentIds[i % agentIds.length];
    run(`INSERT INTO shippers (id, company_name, contact_name, email, phone, city, state, zip, category, agent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, s.company, s.contact, s.email, s.phone, s.city, s.state, s.zip, s.category, agentOwner]);
  }

  // Create sample carriers
  const carriers = [
    { company: 'Swift Haul Logistics', mc: 'MC-123456', dot: 'DOT-789012', contact: 'Mike Johnson', email: 'mike@swifthaul.com', phone: '555-300-0001', equip: 'Dry Van,Flatbed', state: 'IL' },
    { company: 'Eagle Transport LLC', mc: 'MC-234567', dot: 'DOT-890123', contact: 'Steve Clark', email: 'steve@eagletransport.com', phone: '555-300-0002', equip: 'Reefer,Dry Van', state: 'CA' },
    { company: 'Patriot Freight Services', mc: 'MC-345678', dot: 'DOT-901234', contact: 'Karen White', email: 'karen@patriotfreight.com', phone: '555-300-0003', equip: 'Flatbed,Step Deck', state: 'TX' },
    { company: 'Blue Ridge Carriers', mc: 'MC-456789', dot: 'DOT-012345', contact: 'Jim Brown', email: 'jim@blueridgecarriers.com', phone: '555-300-0004', equip: 'Dry Van,Reefer,Flatbed', state: 'GA' },
    { company: 'Coastal Trucking Co.', mc: 'MC-567890', dot: 'DOT-123456', contact: 'Diane Lee', email: 'diane@coastaltrucking.com', phone: '555-300-0005', equip: 'Dry Van', state: 'FL' },
    { company: 'Mountain Pass Haulers', mc: 'MC-678901', dot: 'DOT-234567', contact: 'Ray Martinez', email: 'ray@mtnpass.com', phone: '555-300-0006', equip: 'Flatbed,Lowboy', state: 'CO' },
  ];

  const carrierIds = [];
  for (let i = 0; i < carriers.length; i++) {
    const c = carriers[i];
    const id = uuidv4();
    carrierIds.push(id);
    const agentOwner = agentIds[i % agentIds.length];
    run(`INSERT INTO carriers (id, company_name, mc_number, dot_number, contact_name, email, phone, equipment_types, state, rating, agent_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, c.company, c.mc, c.dot, c.contact, c.email, c.phone, c.equip, c.state, (3.5 + Math.random() * 1.5).toFixed(1), agentOwner]);
  }

  // Create sample loads with various statuses
  const statuses = ['booked', 'in_transit', 'delivered', 'paid', 'invoiced'];
  const commodities = ['Electronics', 'Auto Parts', 'Fresh Produce', 'Steel Beams', 'Pharmaceuticals', 'Lumber', 'Grain', 'Furniture'];
  const equipTypes = ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck'];

  let loadCount = 0;
  for (let i = 0; i < 30; i++) {
    loadCount++;
    const id = uuidv4();
    const agentIdx = i % agentIds.length;
    const shipperIdx = i % shipperIds.length;
    const carrierIdx = i % carrierIds.length;
    const shipperRate = 1500 + Math.floor(Math.random() * 5000);
    const margin = 200 + Math.floor(Math.random() * 800);
    const carrierRate = shipperRate - margin;
    const status = statuses[i % statuses.length];
    const loadNum = `LD-${String(loadCount).padStart(6, '0')}`;

    const origins = [
      { city: 'Chicago', state: 'IL', zip: '60601' },
      { city: 'Los Angeles', state: 'CA', zip: '90001' },
      { city: 'Houston', state: 'TX', zip: '77001' },
      { city: 'Miami', state: 'FL', zip: '33101' },
      { city: 'Seattle', state: 'WA', zip: '98101' },
    ];
    const dests = [
      { city: 'New York', state: 'NY', zip: '10001' },
      { city: 'Atlanta', state: 'GA', zip: '30301' },
      { city: 'Denver', state: 'CO', zip: '80201' },
      { city: 'Dallas', state: 'TX', zip: '75201' },
      { city: 'Phoenix', state: 'AZ', zip: '85001' },
    ];

    const orig = origins[i % origins.length];
    const dest = dests[(i + 2) % dests.length];

    // Generate dates in the recent past/future
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 30 + i * 2);
    const pickupDate = baseDate.toISOString().split('T')[0];
    baseDate.setDate(baseDate.getDate() + 2 + Math.floor(Math.random() * 3));
    const deliveryDate = baseDate.toISOString().split('T')[0];

    run(`INSERT INTO loads (id, load_number, agent_id, shipper_id, carrier_id, 
         origin_city, origin_state, origin_zip, destination_city, destination_state, destination_zip,
         pickup_date, delivery_date, commodity, weight, equipment_type, shipper_rate, carrier_rate, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, loadNum, agentIds[agentIdx], shipperIds[shipperIdx], carrierIds[carrierIdx],
       orig.city, orig.state, orig.zip, dest.city, dest.state, dest.zip,
       pickupDate, deliveryDate,
       commodities[i % commodities.length],
       10000 + Math.floor(Math.random() * 35000),
       equipTypes[i % equipTypes.length],
       shipperRate, carrierRate, status]);

    // Create commissions for delivered/paid loads
    if (['delivered', 'paid', 'invoiced'].includes(status)) {
      const brokerage = shipperRate - carrierRate;
      const agent = get('SELECT * FROM users WHERE id = ?', [agentIds[agentIdx]]);
      let commRate = agent.commission_rate;
      let commAmount = brokerage * commRate;
      let capApplied = 0;

      if (agent.commission_cap && commAmount > agent.commission_cap) {
        commAmount = agent.commission_cap;
        capApplied = 1;
      }

      const commStatus = status === 'paid' ? 'paid' : 'pending';
      run(`INSERT INTO commissions (id, agent_id, load_id, load_number, brokerage_fee, commission_rate, commission_amount, cap_applied, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), agentIds[agentIdx], id, loadNum, brokerage, commRate, commAmount, capApplied, commStatus]);

      // Update agent total brokerage
      run(`UPDATE users SET total_brokerage = total_brokerage + ? WHERE id = ?`, [brokerage, agentIds[agentIdx]]);
    }
  }

  // Auto-upgrade agents who crossed $2000 threshold to demonstrate the feature
  const agentsToUpgrade = require('./database').all("SELECT * FROM users WHERE role = 'agent' AND cap_removed = 0 AND total_brokerage >= 2000");
  for (const agent of agentsToUpgrade) {
    run(`UPDATE users SET commission_rate = 0.27, commission_cap = NULL, cap_removed = 1, updated_at = datetime('now') WHERE id = ?`, [agent.id]);
    console.log(`  Auto-upgraded ${agent.first_name} ${agent.last_name} (${agent.agent_id}) to 27% - brokerage: $${agent.total_brokerage.toFixed(2)}`);
  }

  // Create sample invoices for paid loads
  const paidLoads = require('./database').all("SELECT * FROM loads WHERE status = 'paid'");
  let invCount = 0;
  for (const load of paidLoads) {
    invCount++;
    // Shipper invoice
    run(`INSERT INTO invoices (id, invoice_number, load_id, type, from_entity, to_entity, amount, status, due_date, paid_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), `INV-S-${String(invCount).padStart(5, '0')}`, load.id, 'shipper', 'SurfTrans Logistics', 'Shipper', load.shipper_rate, 'paid', load.delivery_date, load.delivery_date]);

    invCount++;
    // Carrier invoice
    run(`INSERT INTO invoices (id, invoice_number, load_id, type, from_entity, to_entity, amount, status, due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), `INV-C-${String(invCount).padStart(5, '0')}`, load.id, 'carrier', 'Carrier', 'SurfTrans Logistics', load.carrier_rate, 'paid', load.delivery_date]);
  }

  // Create sample notifications
  for (const agentId of agentIds) {
    run(`INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), agentId, 'Welcome to SurfTrans', 'Your agent account has been activated. Start managing your loads!', 'success']);
  }

  // Notify admin
  run(`INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)`,
    [uuidv4(), adminId, 'System Initialized', '5 agents and 30 loads have been created. Platform is ready.', 'info']);

  console.log('Seeding complete!');
  console.log('  - 1 Admin (admin@surftrans.com / admin123)');
  console.log('  - 5 Agents (e.g. james.m@surftrans.com / agent123)');
  console.log('  - 8 Shippers, 6 Carriers, 30 Loads');
  console.log('  - Marcus Johnson auto-upgraded to 27% (crossed $2000 threshold)');
}

seed().catch(console.error);
