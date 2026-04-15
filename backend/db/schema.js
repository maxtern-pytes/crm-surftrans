const initSQL = `
-- Users table (admins and agents)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  agent_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','agent')),
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','suspended')),
  commission_rate REAL NOT NULL DEFAULT 0.17,
  commission_cap REAL DEFAULT 500,
  cap_removed INTEGER NOT NULL DEFAULT 0,
  total_brokerage REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Shippers (clients)
CREATE TABLE IF NOT EXISTS shippers (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  category TEXT DEFAULT 'standard' CHECK(category IN ('standard','premium','enterprise')),
  credit_rating TEXT DEFAULT 'good' CHECK(credit_rating IN ('excellent','good','fair','poor')),
  notes TEXT,
  agent_id TEXT,
  ai_score REAL,
  conversion_probability REAL,
  outreach_status TEXT DEFAULT 'not_contacted',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Carriers
CREATE TABLE IF NOT EXISTS carriers (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  mc_number TEXT,
  dot_number TEXT,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  equipment_types TEXT,
  insurance_expiry TEXT,
  rating REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','blacklisted')),
  notes TEXT,
  agent_id TEXT,
  ai_match_score REAL,
  reliability_score REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Loads
CREATE TABLE IF NOT EXISTS loads (
  id TEXT PRIMARY KEY,
  load_number TEXT UNIQUE NOT NULL,
  agent_id TEXT NOT NULL,
  shipper_id TEXT NOT NULL,
  carrier_id TEXT,
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL,
  origin_zip TEXT,
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  destination_zip TEXT,
  pickup_date TEXT,
  delivery_date TEXT,
  commodity TEXT,
  weight REAL,
  equipment_type TEXT,
  shipper_rate REAL NOT NULL,
  carrier_rate REAL,
  brokerage_fee REAL GENERATED ALWAYS AS (shipper_rate - COALESCE(carrier_rate, 0)) STORED,
  status TEXT NOT NULL DEFAULT 'quoted' CHECK(status IN ('quoted','booked','dispatched','in_transit','delivered','invoiced','paid','cancelled')),
  notes TEXT,
  ai_quote_data TEXT,
  risk_level TEXT DEFAULT 'medium',
  transit_estimate TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (shipper_id) REFERENCES shippers(id),
  FOREIGN KEY (carrier_id) REFERENCES carriers(id)
);

-- Commission ledger
CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  load_id TEXT NOT NULL,
  load_number TEXT NOT NULL,
  brokerage_fee REAL NOT NULL,
  commission_rate REAL NOT NULL,
  commission_amount REAL NOT NULL,
  cap_applied INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','paid')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (load_id) REFERENCES loads(id)
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  load_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('shipper','carrier')),
  from_entity TEXT NOT NULL,
  to_entity TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','paid','overdue')),
  due_date TEXT,
  paid_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (load_id) REFERENCES loads(id)
);

-- Communication logs
CREATE TABLE IF NOT EXISTS communication_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('shipper','carrier','agent')),
  entity_id TEXT NOT NULL,
  agent_id TEXT,
  type TEXT NOT NULL CHECK(type IN ('call','email','note','meeting')),
  subject TEXT,
  body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Notifications / Alerts
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info','warning','success','error')),
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- AI Email Logs
CREATE TABLE IF NOT EXISTS ai_emails (
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
);

-- AI Tasks (Human Handoffs)
CREATE TABLE IF NOT EXISTS ai_tasks (
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
);

-- Market Intelligence Leads
CREATE TABLE IF NOT EXISTS market_leads (
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
);

-- User Task Assignments (for manual tasks requiring human intervention)
CREATE TABLE IF NOT EXISTS user_task_assignments (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES ai_tasks(id),
  assigned_to TEXT REFERENCES users(id),
  assigned_by TEXT REFERENCES users(id) DEFAULT 'system',
  assigned_at TEXT DEFAULT (datetime('now')),
  due_date TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled','escalated')),
  task_category TEXT, -- phone_call, dispute, approval, relationship, verification, exception
  action_required TEXT,
  contact_info TEXT,
  script_talking_points TEXT,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  outcome_notes TEXT,
  auto_assigned INTEGER DEFAULT 1,
  assignment_reason TEXT,
  escalation_level INTEGER DEFAULT 0,
  requires_callback INTEGER DEFAULT 0,
  callback_scheduled TEXT,
  context TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Market Trends Data
CREATE TABLE IF NOT EXISTS market_trends (
  id TEXT PRIMARY KEY,
  lane TEXT,
  data_type TEXT NOT NULL, -- fuel_prices, spot_rates, capacity, seasonal
  spot_rate REAL,
  contract_rate REAL,
  fuel_price REAL,
  capacity_status TEXT,
  load_to_truck_ratio REAL,
  trend TEXT, -- increasing, stable, decreasing
  volatility REAL,
  data TEXT, -- Full JSON data
  scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Load Market Data (lane-specific analytics)
CREATE TABLE IF NOT EXISTS load_market_data (
  id TEXT PRIMARY KEY,
  data_type TEXT NOT NULL, -- fuel_prices, market_trends, scraped_loads
  lane TEXT,
  origin_state TEXT,
  destination_state TEXT,
  commodity TEXT,
  avg_rate REAL,
  min_rate REAL,
  max_rate REAL,
  data TEXT, -- Full JSON data
  scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Web Scrape Logs
CREATE TABLE IF NOT EXISTS web_scrape_logs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  records_scraped INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  data TEXT,
  scraped_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI Learning Data
CREATE TABLE IF NOT EXISTS ai_learning_data (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL, -- quote_accuracy, email_response, conversion
  input_data TEXT,
  predicted_outcome TEXT,
  actual_outcome TEXT,
  accuracy_score REAL,
  learned_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loads_agent ON loads(agent_id);
CREATE INDEX IF NOT EXISTS idx_loads_shipper ON loads(shipper_id);
CREATE INDEX IF NOT EXISTS idx_loads_carrier ON loads(carrier_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_shippers_agent ON shippers(agent_id);
CREATE INDEX IF NOT EXISTS idx_carriers_agent ON carriers(agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_load ON invoices(load_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_emails_status ON ai_emails(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user ON ai_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_market_leads_status ON market_leads(status);
CREATE INDEX IF NOT EXISTS idx_market_leads_score ON market_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON user_task_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON user_task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_market_trends_lane ON market_trends(lane);
CREATE INDEX IF NOT EXISTS idx_market_trends_type ON market_trends(data_type);
CREATE INDEX IF NOT EXISTS idx_load_market_data_lane ON load_market_data(lane);
`;

module.exports = { initSQL };
