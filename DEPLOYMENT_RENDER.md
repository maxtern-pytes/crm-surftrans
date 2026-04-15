# Deploy SurfTrans to Render - Complete Guide

## 🚀 Quick Deployment Steps

### Step 1: Push to GitHub

1. **Initialize Git Repository** (if not already done):
```bash
cd "d:\CRM SurfTrans"
git init
git add .
git commit -m "Initial commit - AI-powered freight broker CRM with internet-verified data"
```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository (public or private)
   - Don't initialize with README

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Render (Free Tier)

1. **Sign up for Render**:
   - Go to https://render.com
   - Sign up with your GitHub account

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the backend service:
     - **Name**: `surftrans-backend`
     - **Root Directory**: `backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Plan**: `Free`

3. **Set Environment Variables** (in Render dashboard):
```
NODE_ENV=production
PORT=3001
DB_TYPE=sqlite
TOGETHER_API_KEY=your-together-ai-api-key
AI_MODEL=meta-llama/Llama-3.2-1B-Instruct-Turbo
JWT_SECRET=your-secure-random-string-here
ENABLE_WEB_SCRAPING=true
ENABLE_AI_TASK_ASSIGNMENT=true
ENABLE_MARKET_TRENDS=true
ENABLE_EMAIL_SENDING=false
```

4. **Deploy Backend**:
   - Click "Create Web Service"
   - Wait for deployment to complete (~3-5 minutes)
   - Copy the backend URL (e.g., `https://surftrans-backend.onrender.com`)

5. **Create Frontend Static Site**:
   - Click "New +" → "Static Site"
   - Connect the same GitHub repository
   - Configure:
     - **Name**: `surftrans-frontend`
     - **Root Directory**: `frontend`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`
     - **Plan**: `Free`

6. **Set Frontend Environment Variable**:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

7. **Deploy Frontend**:
   - Click "Create Static Site"
   - Wait for deployment
   - Your app is now live!

## 🔑 Get Together AI API Key (Free)

The AI Agent needs an API key to access internet data:

1. Go to https://api.together.ai/
2. Sign up for free account
3. Get your API key (includes $25 free credit)
4. Add it to Render environment variables as `TOGETHER_API_KEY`

## 📋 Important Notes

### Free Tier Limitations:
- **Backend**: Sleeps after 15 minutes of inactivity (wakes up on next request ~30 seconds)
- **Database**: Uses SQLite (file-based, sufficient for development)
- **AI**: Together AI provides $25 free credit (~10,000+ requests)

### Data Sources:
✅ **All market data is now sourced from the internet via AI Agent**
- Diesel prices: Searched from EIA.gov and fuel price websites
- Freight rates: Searched from DAT Load Board, FreightWaves, and market reports
- All data is verified in real-time before being used

### AI Capabilities:
✅ **AI Agent now searches the internet for:**
- Current fuel prices
- Lane-specific freight rates
- Market trends and conditions
- Company information for client discovery
- Real-time news and updates

## 🔧 Post-Deployment Configuration

### Update Frontend API URL:

Edit `frontend/.env` or set in Render:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### Test the Deployment:

1. Visit your frontend URL
2. Login with admin credentials
3. Test AI Agent chat - ask for current diesel prices or freight rates
4. The AI should search the internet and provide accurate, current data

## 🐛 Troubleshooting

### AI Not Responding:
- Check that `TOGETHER_API_KEY` is set correctly in Render
- Verify the API key is valid at https://api.together.ai/
- Check Render logs for error messages

### Wrong Data Still Showing:
- Clear browser cache
- The AI searches the internet automatically - wait for response
- Check that web search is enabled (`ENABLE_WEB_SCRAPING=true`)

### Backend Not Starting:
- Check Render logs for errors
- Ensure all dependencies are in `backend/package.json`
- Verify environment variables are set correctly

## 📊 Monitoring

- **Render Dashboard**: https://dashboard.render.com
- **Backend Logs**: Available in Render dashboard
- **AI Usage**: Monitor at https://api.together.ai/ dashboard

## 🎯 Next Steps

1. **Test thoroughly** - Ask the AI agent various questions about market rates
2. **Monitor AI usage** - Track your Together API credit usage
3. **Upgrade when needed** - Move to paid Render plan for always-on backend
4. **Add custom domain** - Configure your own domain in Render settings

## 📞 Support

For issues:
1. Check Render logs first
2. Verify environment variables
3. Test API key validity
4. Review this guide for common solutions

---

**Your app is now deployed with AI-powered internet-verified data!** 🎉

All market data (diesel prices, freight rates, market trends) is sourced from real-time internet searches by the AI Agent.
