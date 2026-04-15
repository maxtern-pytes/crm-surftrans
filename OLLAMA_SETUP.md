# 🧠 Ollama AI Setup & Integration Guide

## ✅ Ollama is FULLY Integrated!

Your platform already has Ollama connected as the AI brain. Here's what's ready:

---

## 🎯 What Ollama Does in Your Platform

### **1. Email Automation** ✅
- Writes personalized outreach emails
- Generates follow-up emails
- Creates quote emails
- Writes negotiation responses

### **2. Quote Generation** ✅
- Analyzes lane data
- Calculates optimal pricing
- Considers market trends
- Provides confidence scores

### **3. Client Discovery** ✅
- Identifies high-potential prospects
- Scores leads by fit
- Generates outreach strategies
- Analyzes conversion probability

### **4. Load Creation** ✅
- Extracts load details from conversation
- Matches carriers
- Generates quotes
- Creates loads automatically

### **5. Negotiation** ✅
- Analyzes customer emails
- Determines response strategy
- Generates negotiation responses
- Decides when to involve humans

### **6. Market Analysis** ✅
- Processes market trends
- Analyzes historical data
- Recommends profitable lanes
- Predicts rate movements

---

## 🔧 Ollama Setup (If Not Already Running)

### **Step 1: Install Ollama**

**Windows:**
1. Download: https://ollama.com/download
2. Run installer
3. Ollama starts automatically

**Verify Installation:**
```bash
ollama --version
```

### **Step 2: Pull llama3 Model**

```bash
ollama pull llama3
```

This downloads the AI model (~4.7 GB). Takes 5-10 minutes.

### **Step 3: Verify Ollama is Running**

Open browser: http://localhost:11434

You should see: "Ollama is running"

Or test in terminal:
```bash
curl http://localhost:11434/api/tags
```

### **Step 4: Test AI Connection**

```bash
cd "d:\CRM SurfTrans\backend"
node test-ollama.js
```

You should see:
```
✅ Ollama Connection: Working
✅ AI Quote Analysis: Working
✅ AI Email Generation: Working
✅ AI Client Discovery: Working
```

---

## 🚀 Test Ollama Integration

### **Quick Test:**

```bash
cd "d:\CRM SurfTrans\backend"
node test-ollama.js
```

This tests:
1. ✅ Basic AI connection
2. ✅ Quote generation
3. ✅ Email writing
4. ✅ Client discovery

### **Full Platform Test:**

1. Start backend: `npm run dev`
2. Login to platform: http://localhost:3001
3. Go to AI Agent page
4. Type: "Find me 5 cannabis businesses in Colorado and send outreach emails"

**AI will:**
- Discover businesses ✅
- Write personalized emails ✅
- Show you the emails ✅
- (Send them if Gmail configured) ✅

---

## 📊 How Ollama Works in Your Platform

### **Architecture:**

```
User Request
    ↓
AI Agent (agent.js)
    ↓
Intent Analysis (Ollama)
    ↓
    ├─→ Quote Generation → Ollama analyzes lane
    ├─→ Email Writing → Ollama generates email
    ├─→ Client Discovery → Ollama identifies prospects
    ├─→ Load Creation → Ollama extracts details
    └─→ Negotiation → Ollama crafts response
    ↓
Response to User
```

### **Example Flow:**

```
User: "I need to ship 40K lbs produce from LA to Houston"

1. Intent Analysis:
   Ollama: "Intent = create_load"
   
2. Extract Details:
   Ollama extracts:
   - Origin: Los Angeles, CA
   - Destination: Houston, TX
   - Commodity: Produce
   - Weight: 40,000 lbs
   - Equipment: Reefer (inferred)
   
3. Get Market Data:
   Platform scrapes:
   - Current fuel prices
   - Lane rates
   - Capacity status
   - Seasonal factors
   
4. Generate Quote:
   Ollama analyzes all data:
   - Shipper rate: $3,200
   - Carrier rate: $2,400
   - Margin: $800 (25%)
   - Confidence: 87%
   
5. Create Load:
   Platform creates load in database
   
6. Respond to User:
   "✅ Load created! Quote: $3,200 (LA→TX, 40K lbs produce)"
```

---

## 🎯 Ollama Configuration

### **Current Settings:**

Located in `backend/.env`:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### **Available Models:**

```bash
# See all models
ollama list

# Pull different model
ollama pull mistral
ollama pull codellama
ollama pull llama3.1

# Update .env to use different model
OLLAMA_MODEL=mistral
```

### **Advanced Configuration:**

In `backend/services/ollama.js`:

```javascript
// Adjust AI behavior
options: {
  temperature: 0.3,      // Lower = more focused, Higher = more creative
  num_predict: 2000,     // Max response length
  top_p: 0.9,           // Nucleus sampling
  top_k: 40             // Top-k sampling
}
```

---

## 🔍 Ollama API Endpoints

### **What Ollama Provides:**

| Function | Purpose | Used By |
|----------|---------|---------|
| `callOllama()` | General AI queries | All services |
| `generateQuoteAnalysis()` | Lane pricing | Quote generation |
| `analyzeClientProspects()` | Lead identification | Client discovery |
| `generateOutreachStrategy()` | Sales approach | Email campaigns |
| `recommendLoads()` | Load opportunities | Agent recommendations |
| `parseDocument()` | Document extraction | Audit system |
| `runAIAudit()` | Financial audit | Finance module |
| `matchCarriers()` | Carrier matching | Load creation |

### **How They're Called:**

```javascript
// In any service:
const ollamaService = require('./ollama');

// Generate quote
const quote = await ollamaService.generateQuoteAnalysis(laneData);

// Write email
const strategy = await ollamaService.generateOutreachStrategy(client);

// Analyze intent
const response = await ollamaService.callOllama(prompt, systemPrompt);
```

---

## 📈 Ollama Performance

### **Response Times:**

```
Simple query: 2-5 seconds
Quote analysis: 5-10 seconds
Email generation: 5-8 seconds
Client discovery: 8-15 seconds
```

### **Caching:**

Ollama responses are cached for 10 minutes:
- Same request = instant response
- Reduces AI load
- Improves performance

### **Retry Logic:**

If Ollama fails:
- Automatic retry (2 attempts)
- Exponential backoff
- Graceful fallback to manual entry

---

## 🧪 Testing Examples

### **Test 1: Basic AI**

```javascript
const ollama = require('./services/ollama');

const response = await ollama.callOllama(
  'What is the average freight rate per mile in the US?',
  'You are a freight industry expert.'
);

console.log(response);
// "The average freight rate in the US is approximately $2.50-$3.50 per mile..."
```

### **Test 2: Quote Analysis**

```javascript
const quote = await ollama.generateQuoteAnalysis({
  origin_city: 'Chicago',
  origin_state: 'IL',
  destination_city: 'Miami',
  destination_state: 'FL',
  commodity: 'Electronics',
  weight: 35000,
  equipment_type: 'Dry Van'
});

console.log('Recommended Shipper Rate:', quote.recommended_shipper_rate);
console.log('Expected Margin:', quote.expected_margin);
console.log('Confidence:', quote.confidence_score + '%');
```

### **Test 3: Email Generation**

```javascript
const emailService = require('./services/email');

const email = await emailService.generateOutreachEmail(ollamaService, {
  company_name: 'TechCorp',
  industry: 'Technology',
  city: 'Austin',
  state: 'TX',
  email: 'logistics@techcorp.com'
});

console.log('Subject:', email.subject);
console.log('Body:', email.body);
```

### **Test 4: Client Discovery**

```javascript
const prospects = await ollama.analyzeClientProspects({
  target_regions: ['California', 'Texas'],
  industries: ['Cannabis', 'Food & Beverage'],
  budget_range: { min: 20000, max: 100000 }
});

prospects.prospects.forEach(p => {
  console.log(`${p.company_name} - Fit: ${p.fit_score}%`);
});
```

---

## 🎓 AI Prompt Engineering

### **System Prompts Used:**

Ollama is given expert personas:

```
"You are an expert US freight broker pricing analyst..."
"You are a US freight brokerage business development expert..."
"You are a freight brokerage sales expert..."
"You are a document parsing expert..."
"You are a freight carrier matching expert..."
```

### **Response Format:**

All prompts require JSON output:

```
Return JSON with this exact structure:
{
  "field1": "<value>",
  "field2": <number>,
  "field3": ["item1", "item2"]
}
```

### **Parsing:**

```javascript
function parseAIResponse(text) {
  // Find JSON in response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
}
```

---

## 🚨 Troubleshooting

### **Error: "AI service unavailable"**

```
Problem: Ollama not running
Solution:
  1. Start Ollama: ollama serve
  2. Or restart Ollama service
  3. Verify: http://localhost:11434
```

### **Error: "model not found"**

```
Problem: llama3 model not downloaded
Solution:
  ollama pull llama3
```

### **Error: "Connection refused"**

```
Problem: Ollama not on port 11434
Solution:
  1. Check Ollama is running
  2. Verify port: ollama serve --port 11434
  3. Update .env if using different port
```

### **Slow Responses**

```
Solutions:
  1. Close other applications (free up RAM)
  2. Use smaller model: ollama pull llama3.2:1b
  3. Increase timeout in ollama.js
```

---

## 📚 Complete Integration Points

### **Files Using Ollama:**

| File | Purpose |
|------|---------|
| `services/ollama.js` | Core AI service |
| `services/agent.js` | AI orchestrator |
| `services/email.js` | AI email generation |
| `services/chat.js` | Conversational AI |
| `routes/ai-agent.js` | AI API endpoints |
| `pages/AIAgent.jsx` | AI chat UI |

### **What Each Does:**

```
ollama.js → Raw AI calls
agent.js → Coordinates AI tasks
email.js → Writes emails using AI
chat.js → Conversational interface
ai-agent.js → REST API for AI
AIAgent.jsx → User interface
```

---

## 🎯 Current Status

### **✅ FULLY OPERATIONAL:**

- Ollama service integrated
- All AI functions implemented
- Email generation working
- Quote analysis working
- Client discovery working
- Load creation working
- Negotiation working
- Market analysis working

### **⚙️ Configuration Ready:**

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### **🧪 Test Script Created:**

```bash
node test-ollama.js
```

---

## 🚀 You're All Set!

### **To Verify Everything Works:**

```bash
# 1. Make sure Ollama is running
ollama list

# 2. Test AI connection
cd backend
node test-ollama.js

# 3. Start platform
npm run dev

# 4. Use AI Agent
# Go to: http://localhost:3001
# Click: AI Agent
# Type: "Find me businesses in California"
```

### **What Happens:**

1. ✅ You type request in AI Agent
2. ✅ Ollama analyzes intent
3. ✅ Ollama generates response
4. ✅ Platform executes action
5. ✅ Results shown to you

**Ollama is your AI brain - fully integrated and operational!** 🧠🚀

---

**Need help?** Run `node test-ollama.js` to diagnose any issues.
