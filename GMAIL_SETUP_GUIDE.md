# 📧 Gmail Setup Guide - Enable AI Email Automation

## 🎯 What This Enables

Once connected to Gmail, your AI (Ollama) will **AUTOMATICALLY**:

✅ Send personalized outreach emails to new businesses  
✅ Send follow-up emails (no response after 3 days)  
✅ Send quote emails to shippers  
✅ Negotiate rates via email  
✅ Send confirmation emails  
✅ Send shipment updates  
✅ Track all email history in database  

**Complete email automation - you just approve the strategy, AI executes everything!**

---

## 🔧 Step-by-Step Setup (5 Minutes)

### **Step 1: Enable 2-Step Verification in Gmail**

1. Go to: https://myaccount.google.com/security
2. Sign in to your Gmail account
3. Find **"2-Step Verification"**
4. Click **"Turn on"**
5. Follow the setup wizard (phone number verification)
6. ✅ **2-Step Verification Enabled**

---

### **Step 2: Generate App Password**

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in again if prompted
3. Under **"Select app"**, choose **"Mail"**
4. Under **"Select device"**, choose **"Other (Custom name)"**
5. Type: **"SurfTrans Freight Broker"**
6. Click **"Generate"**
7. **COPY THE 16-CHARACTER PASSWORD** (example: `abcd efgh ijkl mnop`)
   - ⚠️ **This is the ONLY time you'll see it!**
   - Remove spaces when using: `abcdefghijklmnop`

---

### **Step 3: Update Backend Configuration**

Create or edit `backend/.env` file:

```env
# ============================================
# Gmail SMTP Configuration
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Your Gmail address
SMTP_USER=your-email@gmail.com

# The 16-character app password (NO SPACES)
SMTP_PASS=abcdefghijklmnop

# Display name in emails
FROM_NAME=SurfTrans AI Logistics
FROM_EMAIL=your-email@gmail.com

# ENABLE EMAIL SENDING (IMPORTANT!)
ENABLE_EMAIL_SENDING=true
```

**Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=john.broker@gmail.com
SMTP_PASS=qwertyuiopasdfgh
FROM_NAME=SurfTrans AI Logistics
FROM_EMAIL=john.broker@gmail.com
ENABLE_EMAIL_SENDING=true
```

---

### **Step 4: Install Dependencies**

Already installed! But if needed:

```bash
cd "d:\CRM SurfTrans\backend"
npm install nodemailer
```

---

### **Step 5: Restart Backend Server**

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

You should see:
```
✅ Gmail connected successfully - Email sending ENABLED
```

---

### **Step 6: Test Email Connection**

Create a test file `backend/test-email.js`:

```javascript
const emailSender = require('./services/email-sender');

async function testGmail() {
  console.log('Testing Gmail connection...\n');
  
  const result = await emailSender.testConnection();
  
  if (result.success) {
    console.log('✅ SUCCESS:', result.message);
    console.log('📧 Connected as:', result.user);
    console.log('\n🚀 AI can now send emails automatically!');
  } else {
    console.log('❌ FAILED:', result.message);
    console.log('\n📋 Setup Instructions:');
    console.log(result.setup_help);
  }
}

testGmail();
```

Run it:
```bash
node test-email.js
```

---

## 🚀 How AI Uses Your Gmail

### **Scenario 1: New Client Outreach**

```
1. AI discovers "GreenTech Cannabis Co" in Denver
   ↓
2. Ollama writes personalized email:
   Subject: "Streamline Your Cannabis Distribution in Colorado"
   Body: "Hi GreenTech Team, I noticed you're scaling operations..."
   ↓
3. AI sends email via YOUR Gmail ✅
   ↓
4. Email appears in your Gmail "Sent" folder
   ↓
5. AI logs it in database for tracking
```

**Recipient sees email from:** `your-email@gmail.com`  
**Not from:** some AI service - it's YOUR email!

---

### **Scenario 2: Automated Follow-Up**

```
Day 1: AI sends initial outreach
   ↓
Day 4: No response detected
   ↓
AI writes follow-up:
   "Hi, just following up on my previous email about optimizing your logistics..."
   ↓
AI sends follow-up via Gmail ✅
   ↓
Day 7: Still no response
   ↓
AI sends final follow-up:
   "Last follow-up - I'll stop bothering you after this! But if you need..."
```

**All automated - you don't do anything!**

---

### **Scenario 3: Quote & Negotiation**

```
Customer asks: "Can you ship 40K lbs from LA to Houston?"
   ↓
AI creates quote ($3,200)
   ↓
AI sends quote email via Gmail ✅
   ↓
Customer replies: "Too expensive, can you do $2,800?"
   ↓
AI analyzes margin (still profitable)
   ↓
AI sends negotiation response via Gmail ✅
   "I can offer $3,000 with flexible pickup dates..."
   ↓
Customer: "Deal!"
   ↓
AI sends confirmation email ✅
   "Great! Load confirmed. Details attached..."
```

**Entire conversation handled by AI through your Gmail!**

---

## 📊 Email Tracking & Analytics

### **What Gets Tracked:**

```sql
-- All emails sent
SELECT * FROM ai_emails WHERE status = 'sent';

-- Email statistics
SELECT type, COUNT(*) as count 
FROM ai_emails 
WHERE created_at >= date('now', '-30 days')
GROUP BY type;

-- Response rate
SELECT 
  COUNT(*) as total_sent,
  COUNT(CASE WHEN status = 'replied' THEN 1 END) as replied,
  ROUND(COUNT(CASE WHEN status = 'replied' THEN 1 END) * 100.0 / COUNT(*), 2) as response_rate
FROM ai_emails
WHERE type = 'outreach';
```

### **Email Types Tracked:**

- `outreach` - Initial contact emails
- `follow_up` - Follow-up emails
- `quote` - Quote deliveries
- `negotiation` - Rate negotiations
- `confirmation` - Booking confirmations

---

## 🎯 Email Sending Rules (Smart Automation)

### **Rate Limits (Avoid Spam Detection):**

```
✅ Max 50 emails per hour
✅ Max 200 emails per day
✅ 1-3 second delay between emails
✅ Personalized content (not bulk spam)
✅ Professional business emails
```

### **When AI Sends Emails:**

| Situation | AI Action |
|-----------|-----------|
| New lead discovered | ✅ Send outreach immediately |
| No response in 3 days | ✅ Send follow-up |
| No response in 7 days | ✅ Send final follow-up |
| Customer asks for quote | ✅ Send quote email |
| Customer counteroffers | ✅ Send negotiation response |
| Load booked | ✅ Send confirmation |
| Shipment dispatched | ✅ Send tracking info |
| Load delivered | ✅ Send delivery confirmation |

### **When AI Creates TASK Instead:**

| Situation | AI Action |
|-----------|-----------|
| High-value deal (>$10K) | ✋ Create CALL task for human |
| Customer very angry | ✋ Create URGENT call task |
| Complex dispute | ✋ Create DISPUTE task |
| Legal/compliance issue | ✋ Create VERIFICATION task |

---

## 🔐 Security & Best Practices

### **Gmail Safety:**

✅ **Use App Password** (not your regular password)  
✅ **2-Step Verification enabled** (required)  
✅ **Professional email content** (AI writes business emails)  
✅ **Rate limited** (won't spam)  
✅ **Logged in database** (full audit trail)  

### **Email Best Practices:**

✅ **Personalized** (not generic spam)  
✅ **Professional tone** (business correspondence)  
✅ **Relevant content** (freight logistics)  
✅ **Opt-out option** (can add unsubscribe link)  
✅ **Business hours sending** (configure if needed)  

---

## 🧪 Testing Workflow

### **Test 1: Send Test Email**

```javascript
// In Node.js console or test file
const emailSender = require('./services/email-sender');

await emailSender.sendEmail({
  to_email: 'test@example.com',
  subject: 'Test from SurfTrans AI',
  body: '<h1>Hello!</h1><p>This is a test email from your AI freight broker.</p>',
  type: 'test'
});
```

### **Test 2: AI Agent Email**

1. Login to platform
2. Go to AI Agent chat
3. Type: "Find me cannabis businesses in Denver and send outreach emails"
4. AI will:
   - Discover businesses
   - Write emails
   - **SEND THEM** via your Gmail ✅
   - Show you what was sent

### **Test 3: Check Gmail**

1. Open your Gmail
2. Check **"Sent"** folder
3. You should see emails sent by AI
4. Check database: `SELECT * FROM ai_emails ORDER BY created_at DESC LIMIT 10;`

---

## 📈 Expected Email Volume

### **Conservative Estimate:**

```
Week 1: 20-30 emails (testing phase)
Week 2: 50-75 emails (ramping up)
Month 1: 200-300 emails (full operation)

Breakdown:
- Outreach emails: 60%
- Follow-ups: 25%
- Quotes: 10%
- Negotiations: 5%
```

### **Gmail Limits:**

```
✅ Gmail allows: 500 emails/day
✅ Our system uses: 50-100 emails/day
✅ Well within limits!
```

---

## 🚨 Troubleshooting

### **Error: "Invalid login"**

```
Problem: Wrong app password
Solution: 
  1. Generate new app password
  2. Update .env file
  3. Restart server
```

### **Error: "Connection timeout"**

```
Problem: Network/firewall issue
Solution:
  1. Check internet connection
  2. Verify SMTP_HOST=smtp.gmail.com
  3. Check firewall allows port 587
```

### **Emails not sending**

```
Check:
  1. ENABLE_EMAIL_SENDING=true in .env
  2. SMTP credentials correct
  3. Server restarted after .env changes
  4. Check logs for errors
```

### **Emails going to spam**

```
Solutions:
  1. Personalize emails (AI already does this)
  2. Don't send too many at once (rate limited)
  3. Use professional content (AI does this)
  4. Warm up Gmail account gradually
```

---

## 🎉 After Setup - What Happens

### **Day 1:**
```
✅ AI discovers 50 emerging businesses
✅ AI writes 50 personalized emails
✅ AI sends 50 emails via your Gmail
✅ All logged in database
✅ You see them in Gmail "Sent" folder
```

### **Day 4:**
```
✅ AI detects 35 non-responders
✅ AI writes 35 follow-up emails
✅ AI sends them automatically
✅ 15 responses received!
```

### **Day 7:**
```
✅ 15 responses analyzed by AI
✅ 8 interested → AI sends quotes
✅ 7 not interested → AI marks as "not now"
✅ AI schedules next follow-up for 30 days
```

### **Day 14:**
```
✅ 8 quotes sent
✅ 5 negotiations happening
✅ 2 deals closed!
✅ AI creates loads automatically
✅ AI sends confirmations
```

**Result: 2 new clients, ZERO manual email work from you!**

---

## 📞 Quick Reference

### **Setup Checklist:**

- [ ] Enable 2-Step Verification in Gmail
- [ ] Generate App Password
- [ ] Create `.env` file with SMTP credentials
- [ ] Set `ENABLE_EMAIL_SENDING=true`
- [ ] Restart backend server
- [ ] Test connection: `node test-email.js`
- [ ] Check Gmail "Sent" folder for test email
- [ ] AI is now sending emails automatically! ✅

### **Important Files:**

- `backend/services/email-sender.js` - Gmail integration
- `backend/services/email.js` - AI email generation (Ollama)
- `backend/.env` - Your Gmail credentials
- `backend/services/agent.js` - AI orchestrator (decides when to send)

### **Commands:**

```bash
# Test connection
node test-email.js

# View sent emails (SQL)
sqlite3 backend/data/freight_broker.db "SELECT * FROM ai_emails ORDER BY created_at DESC LIMIT 10;"

# Check email stats
curl http://localhost:3001/api/market/email-stats
```

---

## 🚀 YOU'RE READY!

Once you complete the Gmail setup:

1. **Ollama writes emails** ✅ (already working)
2. **AI sends emails** ✅ (after Gmail setup)
3. **AI follows up** ✅ (automated)
4. **AI negotiates** ✅ (strategic responses)
5. **AI closes deals** ✅ (creates loads)
6. **You just monitor** ✅ (minimal intervention)

**Your Gmail + Ollama = Fully Autonomous Freight Brokerage!** 🎉

---

**Need help?** Check `HOW_OLLAMA_WORKS.md` for complete AI workflow documentation.
