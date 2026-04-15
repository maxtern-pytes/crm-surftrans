# 🚀 QUICK START - Deploy to Render NOW

## ✅ What's Been Fixed

### 1. **All Data Now from Internet** ✅
- ❌ OLD: Hardcoded diesel prices ($3.50) and freight rates ($2.15/mile)
- ✅ NEW: AI searches internet for REAL current prices from EIA.gov, DAT Load Board, FreightWaves

### 2. **AI Agent Now Working** ✅
- ❌ OLD: AI not responding, using outdated training data
- ✅ NEW: AI automatically searches internet before every response

### 3. **Lane-Specific Pricing** ✅
- ❌ OLD: Same price for all lanes
- ✅ NEW: AI searches for rates specific to each lane (e.g., "CA to TX rate per mile")

## 📋 Deploy to Render - 10 Minutes

### Step 1: Get Together AI API Key (2 minutes)

1. Go to: https://api.together.ai/
2. Click "Sign Up" (free)
3. Copy your API key
4. **This gives you $25 free credit (~10,000+ AI requests)**

### Step 2: Deploy Backend to Render (4 minutes)

1. Go to: https://render.com
2. Sign in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your repository: `maxtern-pytes/crm-surftrans`
5. Configure:
   ```
   Name: surftrans-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: node server.js
   Plan: Free
   ```

6. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable":
   ```
   NODE_ENV = production
   PORT = 3001
   DB_TYPE = sqlite
   TOGETHER_API_KEY = paste-your-api-key-here
   AI_MODEL = meta-llama/Llama-3.2-1B-Instruct-Turbo
   JWT_SECRET = any-random-string-you-want
   ENABLE_WEB_SCRAPING = true
   ENABLE_AI_TASK_ASSIGNMENT = true
   ENABLE_MARKET_TRENDS = true
   ENABLE_EMAIL_SENDING = false
   ```

7. Click **"Create Web Service"**
8. Wait 3-5 minutes for deployment
9. **Copy the URL** (e.g., `https://surftrans-backend-xxxx.onrender.com`)

### Step 3: Deploy Frontend to Render (3 minutes)

1. Click **"New +"** → **"Static Site"**
2. Connect same repository: `maxtern-pytes/crm-surftrans`
3. Configure:
   ```
   Name: surftrans-frontend
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   Plan: Free
   ```

4. **Add Environment Variable**:
   ```
   VITE_API_URL = https://your-backend-url.onrender.com
   ```
   (Replace with the URL from Step 2)

5. Click **"Create Static Site"**
6. Wait 2-3 minutes

### Step 4: Test It! (1 minute)

1. Open your frontend URL
2. Login with your admin account
3. Go to AI Agent chat
4. Ask: **"What is the current diesel price?"**
5. Ask: **"What is the freight rate per mile from California to Texas?"**

✅ The AI will search the internet and give you REAL current prices!

## 🎯 What Happens Now

When you ask the AI agent anything about:
- **Diesel prices** → Searches EIA.gov, FuelFlash.com, and current fuel price sites
- **Freight rates** → Searches DAT Load Board, FreightWaves, market reports
- **Lane-specific rates** → Searches for that exact route
- **Market trends** → Searches current news and market analysis

**All data is verified from the internet in real-time!**

## ⚠️ Important Notes

### Free Tier Behavior:
- Backend **sleeps after 15 minutes** of inactivity
- Next request takes **~30 seconds** to wake up
- After that, it's fast!

### AI API Credit:
- **$25 free** from Together AI
- Enough for **10,000+ requests**
- Monitor usage at: https://api.together.ai/

### Database:
- Uses **SQLite** (file-based)
- Perfect for development/testing
- Can upgrade to PostgreSQL later

## 🐛 Troubleshooting

### "AI not responding"
1. Check Render logs for errors
2. Verify `TOGETHER_API_KEY` is correct
3. Test API key at https://api.together.ai/

### "Still showing wrong prices"
1. **Clear browser cache** (Ctrl+Shift+Delete)
2. Wait for AI to search internet (takes 5-10 seconds)
3. Check Render logs to see if web search is working

### "Backend not starting"
1. Check Render logs
2. Make sure all environment variables are set
3. Verify `TOGETHER_API_KEY` is added

## 📊 Your GitHub Repository

Your code is already pushed to:
```
https://github.com/maxtern-pytes/crm-surftrans
```

Every time you push changes, Render will **auto-deploy**!

## 🎉 You're Done!

Once deployed:
- ✅ All data from internet (no more wrong prices)
- ✅ AI Agent working with real-time search
- ✅ Lane-specific pricing
- ✅ Free hosting on Render
- ✅ Auto-deploy from GitHub

**Questions? Check DEPLOYMENT_RENDER.md for detailed guide!**
