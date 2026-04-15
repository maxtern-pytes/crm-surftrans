/**
 * PostgreSQL Schema for Supabase
 * Uses PostgreSQL-compatible syntax (TIMESTAMP, NOW())
 */

const postgresSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT CHECK (role IN ('admin', 'agent')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Shippers table
CREATE TABLE IF NOT EXISTS shippers (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  assigned_agent_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Carriers table
CREATE TABLE IF NOT EXISTS carriers (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  mc_number TEXT,
  dot_number TEXT,
  equipment_types TEXT[],
  service_areas TEXT[],
  status TEXT DEFAULT 'active',
  safety_rating TEXT,
  insurance_expiry DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Loads table
CREATE TABLE IF NOT EXISTS loads (
  id SERIAL PRIMARY KEY,
  load_number TEXT UNIQUE NOT NULL,
  shipper_id INTEGER REFERENCES shippers(id),
  carrier_id INTEGER REFERENCES carriers(id),
  agent_id INTEGER REFERENCES users(id),
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL,
  dest_city TEXT NOT NULL,
  dest_state TEXT NOT NULL,
  pickup_date DATE,
  delivery_date DATE,
  commodity TEXT,
  weight DECIMAL,
  equipment_type TEXT,
  rate DECIMAL,
  carrier_pay DECIMAL,
  status TEXT CHECK (status IN ('pending', 'booked', 'in_transit', 'delivered', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id SERIAL PRIMARY KEY,
  load_id INTEGER REFERENCES loads(id),
  agent_id INTEGER REFERENCES users(id),
  amount DECIMAL NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid')) DEFAULT 'pending',
  paid_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  load_id INTEGER REFERENCES loads(id),
  shipper_id INTEGER REFERENCES shippers(id),
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Communication logs
CREATE TABLE IF NOT EXISTS communication_logs (
  id SERIAL PRIMARY KEY,
  shipper_id INTEGER REFERENCES shippers(id),
  carrier_id INTEGER REFERENCES carriers(id),
  load_id INTEGER REFERENCES loads(id),
  user_id INTEGER REFERENCES users(id),
  type TEXT CHECK (type IN ('email', 'call', 'meeting', 'note')),
  subject TEXT,
  content TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Emails
CREATE TABLE IF NOT EXISTS ai_emails (
  id SERIAL PRIMARY KEY,
  shipper_id INTEGER REFERENCES shippers(id),
  carrier_id INTEGER REFERENCES carriers(id),
  load_id INTEGER REFERENCES loads(id),
  user_id INTEGER REFERENCES users(id),
  email_type TEXT CHECK (email_type IN ('outreach', 'follow_up', 'quote', 'confirmation', 'other')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'replied')) DEFAULT 'draft',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Tasks
CREATE TABLE IF NOT EXISTS ai_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  task_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Market Leads
CREATE TABLE IF NOT EXISTS market_leads (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  industry TEXT,
  location TEXT,
  source TEXT,
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'rejected')) DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Task Assignments
CREATE TABLE IF NOT EXISTS user_task_assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  task_id INTEGER REFERENCES ai_tasks(id),
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  status TEXT CHECK (status IN ('assigned', 'accepted', 'completed')) DEFAULT 'assigned'
);

-- Market Trends
CREATE TABLE IF NOT EXISTS market_trends (
  id SERIAL PRIMARY KEY,
  lane TEXT NOT NULL,
  avg_rate DECIMAL,
  trend TEXT,
  volume INTEGER,
  capacity TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Load Market Data
CREATE TABLE IF NOT EXISTS load_market_data (
  id SERIAL PRIMARY KEY,
  load_id INTEGER REFERENCES loads(id),
  market_rate DECIMAL,
  recommended_rate DECIMAL,
  competition_level TEXT,
  demand_level TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Web Scrape Logs
CREATE TABLE IF NOT EXISTS web_scrape_logs (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  url TEXT,
  status TEXT CHECK (status IN ('success', 'failed', 'partial')),
  data_count INTEGER,
  error_message TEXT,
  scraped_at TIMESTAMP DEFAULT NOW()
);

-- AI Learning Data
CREATE TABLE IF NOT EXISTS ai_learning_data (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  data_type TEXT NOT NULL,
  data_value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loads_agent ON loads(agent_id);
CREATE INDEX IF NOT EXISTS idx_loads_shipper ON loads(shipper_id);
CREATE INDEX IF NOT EXISTS idx_loads_carrier ON loads(carrier_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_ai_emails_shipper ON ai_emails(shipper_id);
CREATE INDEX IF NOT EXISTS idx_ai_emails_carrier ON ai_emails(carrier_id);
CREATE INDEX IF NOT EXISTS idx_ai_emails_status ON ai_emails(status);
CREATE INDEX IF NOT EXISTS idx_ai_learning_entity ON ai_learning_data(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_type ON ai_learning_data(data_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_updated ON ai_learning_data(updated_at DESC);
`;

module.exports = { postgresSQL };
