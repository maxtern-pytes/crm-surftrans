# Quick Start Guide - AI-Enhanced Freight Broker Platform

## 🚀 Get Started in 5 Minutes

### Step 1: Install Ollama (1 minute)
1. Download: https://ollama.ai
2. Install and launch
3. Open terminal and run:
```bash
ollama pull llama3
```

### Step 2: Install Dependencies (1 minute)
```bash
# Backend
cd backend
npm install

# Frontend (if not already done)
cd ../frontend
npm install
```

### Step 3: Run Database Migration (30 seconds)
```bash
cd backend
node db/migrate.js
```

Expected output:
```
✓ Added loads.ai_quote_data
✓ Added loads.risk_level
✓ Added loads.transit_estimate
✓ Added shippers.ai_score
✓ Added shippers.conversion_probability
✓ Added shippers.outreach_status
✓ Added carriers.ai_match_score
✓ Added carriers.reliability_score
Migration completed successfully!
```

### Step 4: Start Servers (30 seconds)

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### Step 5: Test AI Features (2 minutes)

1. Open browser: http://localhost:5173
2. Login with your credentials
3. Navigate to **Loads** page
4. Click **"Create Load"**
5. Enter:
   - Origin: Los Angeles, CA
   - Destination: Houston, TX
   - Commodity: Electronics
   - Weight: 35000
6. Click **"Get AI Quote"** ✨
7. Wait for AI analysis (5-10 seconds)
8. Review pricing and risk assessment
9. Click **"Accept Quote"**
10. Complete and create load

---

## ✅ Verification Checklist

- [ ] Ollama is running (`ollama list` shows models)
- [ ] Backend started on port 3001
- [ ] Frontend started on port 5173
- [ ] Database migration completed
- [ ] AI Quote button works
- [ ] AI recommendations appear on Loads page
- [ ] No console errors

---

## 🎯 What You'll See

### AI Quote Display:
```
┌─────────────────────────────────────────┐
│  ✨ AI Pricing Analysis                 │
├─────────────────────────────────────────┤
│  Shipper Rate: $2,500 - $3,200          │
│  Carrier Rate: $1,800 - $2,400          │
│  Expected Margin: $800                  │
│  Transit: 3 days                        │
├─────────────────────────────────────────┤
│  ⚠️  Risk: Medium  •  Confidence: 78%  │
│  "Stable lane with consistent demand..."│
└─────────────────────────────────────────┘
```

### AI Recommendations:
```
┌─────────────────────────────────────────┐
│  📈 AI Load Recommendations             │
├─────────────────────────────────────────┤
│  Chicago, IL → Dallas, TX    [85%]     │
│  Est. Margin: $950                      │
│  "High demand lane with good margins"   │
│  [Create Load]                          │
└─────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### "AI service unavailable" error
```bash
# Check Ollama is running
ollama list

# Test Ollama API
curl http://localhost:11434/api/generate -d '{"model":"llama3","prompt":"test","stream":false}'

# Restart Ollama if needed
```

### Slow AI responses
- First request: 10-15 seconds (model loading)
- Subsequent requests: 3-5 seconds (cached)
- Use smaller model: `ollama pull phi3`

### Database errors
```bash
# Re-run migration (safe to run multiple times)
cd backend
node db/migrate.js
```

---

## 📚 Full Documentation

- `AI_SETUP_GUIDE.md` - Complete setup guide
- `IMPLEMENTATION_SUMMARY.md` - What was implemented
- `backend/services/ollama.js` - AI service code

---

## 🎓 Next Steps

1. ✅ Test AI load pricing
2. ✅ Explore AI recommendations
3. ✅ Try different lanes and commodities
4. ✅ Review quote accuracy over time
5. ✅ Use AI data for better decision making

---

**Ready to broker smarter with AI! 🚀**
