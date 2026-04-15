# 🚀 Supabase + Gmail Production Setup Guide

## Complete setup for CRM SurfTrans with real database and email

---

## 📋 **PREREQUISITES**

1. ✅ Supabase account (https://supabase.com)
2. ✅ Gmail account with App Password
3. ✅ Ollama installed and running
4. ✅ Node.js installed

---

## 🔗 **STEP 1: Supabase Database Setup**

### **1.1 Get Your Supabase Connection String**

1. Go to https://supabase.com/dashboard
2. Select your project (or create new one)
3. Go to **Settings** → **Database**
4. Find **Connection string** section
5. Select **URI** tab
6. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

### **1.2 Update .env File**

Edit `backend/.env`:

```env
# ============================================
# SurfTrans AI - Production Configuration
# ============================================

# Server Configuration
PORT=3001
NODE_ENV=production

# ============================================
# SUPABASE POSTGRESQL DATABASE
# ============================================

# Replace with YOUR Supabase connection string
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# Database type (set to postgresql for Supabase)
DB_TYPE=postgresql

# ============================================
# GMAIL SMTP SETUP
# ============================================

# Step 1: Enable 2-Step Verification in Gmail
# Step 2: Generate App Password at: https://myaccount.google.com/apppasswords
# Step 3: Fill in your details below:

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Your Gmail address
SMTP_USER=your-email@gmail.com

# Your 16-character App Password (NO SPACES)
# Example: abcd efgh ijkl mnop → abcdefghijklmnop
SMTP_PASS=YOUR_16_CHAR_APP_PASSWORD_HERE

# Display name in emails
FROM_NAME=SurfTrans AI Logistics
FROM_EMAIL=your-email@gmail.com

# Set to 'true' to enable AI email sending
ENABLE_EMAIL_SENDING=true

# ============================================
# Ollama AI Configuration
# ============================================
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b

# ============================================
# JWT Secret (Change this to a random string)
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-this

# ============================================
# Feature Flags
# ============================================
ENABLE_REDIS_CACHE=false
ENABLE_WEB_SCRAPING=true
ENABLE_AI_TASK_ASSIGNMENT=true
ENABLE_MARKET_TRENDS=true
```

### **1.3 Run Database Migration**

```bash
cd "d:\CRM SurfTrans\backend"
npm run migrate-supabase
```

**Expected Output:**
```
🚀 Running Supabase PostgreSQL migration...
✅ Connected to Supabase PostgreSQL
📝 Starting database migration...
✅ Executed 50+ SQL statements
📊 Creating AI learning indexes...
✅ AI learning indexes created
✅ Transaction committed

🎉 SUPABASE MIGRATION COMPLETED SUCCESSFULLY!

Database Tables Created:
  ✓ users
  ✓ shippers
  ✓ carriers
  ✓ loads
  ✓ commissions
  ✓ invoices
  ✓ communication_logs
  ✓ notifications
  ✓ ai_conversations
  ✓ ai_emails
  ✓ ai_tasks
  ✓ market_leads
  ✓ user_task_assignments
  ✓ market_trends
  ✓ load_market_data
  ✓ web_scrape_logs
  ✓ ai_learning_data

Features Ready:
  ✅ AI Learning & Memory System
  ✅ Client Profile Tracking
  ✅ Email Intelligence
  ✅ Market Data Scraping
  ✅ Real-time Analytics

🚀 Your Supabase database is ready for production!
```

### **1.4 Seed Database with Demo Data (Optional)**

```bash
npm run seed
```

This creates:
- Admin user: `admin@surftrans.com` / `admin123`
- Agent user: `agent@surftrans.com` / `agent123`
- Sample shippers, carriers, and loads

---

## 📧 **STEP 2: Gmail Configuration**

### **2.1 Enable 2-Step Verification**

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required for App Passwords)

### **2.2 Generate App Password**

1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** and **Other (Custom name)**
3. Name it: `SurfTrans CRM`
4. Click **Generate**
5. Copy the 16-character password (no spaces)
   - Example: `abcdefghijklmnop`

### **2.3 Update .env with Gmail Details**

```env
SMTP_USER=youremail@gmail.com
SMTP_PASS=abcdefghijklmnop  # Your 16-char app password
FROM_NAME=SurfTrans AI Logistics
FROM_EMAIL=youremail@gmail.com
ENABLE_EMAIL_SENDING=true
```

### **2.4 Test Gmail Connection**

Start the backend server and check logs:
```
✅ Gmail SMTP initialized
✅ Email sending enabled
```

---

## 🤖 **STEP 3: Ollama AI Setup**

### **3.1 Ensure Ollama is Running**

```bash
# Check if Ollama is installed
ollama --version

# Start Ollama service
ollama serve

# Pull the model (if not already done)
ollama pull llama3.2:1b
```

### **3.2 Test Ollama Connection**

```bash
cd "d:\CRM SurfTrans\backend"
node test-simple.js
```

**Expected Output:**
```
Status: 200
Response: Hello! How can I help you today?
```

---

## 🚀 **STEP 4: Start the Platform**

### **4.1 Update package.json to Use Supabase**

The system automatically uses Supabase when `DB_TYPE=postgresql` in `.env`.

### **4.2 Start Backend**

```bash
cd "d:\CRM SurfTrans\backend"
npm run dev
```

**Expected Output:**
```
✅ Supabase PostgreSQL initialized
✅ Gmail SMTP initialized
✅ Email sending enabled
✅ AI Learning system ready
✅ Server running on port 3001
```

### **4.3 Start Frontend (New Terminal)**

```bash
cd "d:\CRM SurfTrans\frontend"
npm run dev
```

**Expected Output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## ✅ **STEP 5: Verify Everything Works**

### **5.1 Login to CRM**

Open browser: http://localhost:5173

Login with:
- Email: `admin@surftrans.com`
- Password: `admin123`

### **5.2 Test Database Connection**

1. Go to **Shippers** page
2. You should see the shipper list (from Supabase)
3. Try adding a new shipper
4. Verify it appears in the list

### **5.3 Test AI Features**

1. Go to **AI Agent**
2. Type: `"Create a load from Los Angeles to Houston"`
3. AI should respond with quote and details

### **5.4 Test Email (if Gmail configured)**

1. Go to **AI Operations**
2. Click **"Send Outreach Emails"**
3. Check Gmail sent folder for emails

### **5.5 Test AI Learning**

1. Go to **Shippers** → Click on any shipper
2. Click **"Generate AI Outreach"**
3. AI uses client memory profile for personalized content

---

## 🔧 **Troubleshooting**

### **Database Connection Failed**

**Error:** `Supabase connection failed`

**Fix:**
1. Check `DATABASE_URL` in `.env`
2. Verify Supabase project is active
3. Test connection string in Supabase dashboard
4. Check firewall/network settings

### **Gmail Not Sending**

**Error:** `Email sending failed`

**Fix:**
1. Verify 2-Step Verification is enabled
2. Regenerate App Password
3. Check `SMTP_USER` and `SMTP_PASS` in `.env`
4. Ensure `ENABLE_EMAIL_SENDING=true`

### **Ollama Not Responding**

**Error:** `AI service unavailable`

**Fix:**
```bash
# Check Ollama is running
ollama list

# Restart Ollama
ollama serve

# Test connection
node test-simple.js
```

### **Tables Not Created**

**Fix:**
```bash
# Re-run migration
npm run migrate-supabase

# Check Supabase dashboard → Table editor
# Verify all tables exist
```

---

## 📊 **Production Checklist**

- [x] Supabase database created and migrated
- [x] All tables created successfully
- [x] Indexes created for performance
- [x] Gmail App Password configured
- [x] Ollama running and tested
- [x] Backend connected to Supabase
- [x] Frontend running
- [x] Login working
- [x] AI features functional
- [x] Email sending tested
- [x] AI learning system active

---

## 🎯 **What You Now Have**

✅ **Real PostgreSQL Database** (Supabase)  
✅ **Production-Ready Backend**  
✅ **AI-Powered Features** (Ollama)  
✅ **Email Automation** (Gmail)  
✅ **Client Memory & Learning**  
✅ **Market Data Scraping**  
✅ **Real-Time Analytics**  
✅ **Full Audit Trail**  
✅ **Scalable Architecture**  

---

## 🌐 **Access Your CRM**

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Ollama:** http://localhost:11434

---

## 📞 **Need Help?**

1. Check Supabase dashboard for database status
2. Check backend console logs for errors
3. Check Gmail sent folder for email delivery
4. Test Ollama with `node test-simple.js`

---

**🚀 Your production-ready CRM SurfTrans is now live with Supabase and Gmail!**
