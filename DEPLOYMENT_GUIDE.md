# 🚀 Deploy CRM SurfTrans to Cloud with Internet-Enabled AI

## Overview
This guide will help you deploy your AI-powered freight brokerage CRM to the cloud with an AI agent that can surf the internet.

---

## 📋 Deployment Architecture

```
Frontend (Vercel) → Backend (Railway/Render) → AI Service (Together AI / Groq)
                                                    ↓
                                              Internet Search
```

---

## Option 1: **Railway + Vercel** (Recommended)

### Step 1: Deploy Backend to Railway

1. **Go to [Railway](https://railway.app/)**
   - Sign up with your GitHub account
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `maxtern-pytes/crm-surftrans`

2. **Configure Backend Service**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`

3. **Add Environment Variables in Railway**
   ```
   NODE_ENV=production
   PORT=3001
   DB_TYPE=sqlite
   JWT_SECRET=your-secret-key-here
   OLLAMA_URL=https://api.together.xyz
   OLLAMA_MODEL=meta-llama/Llama-3.2-1B-Instruct-Turbo
   TOGETHER_API_KEY=get-from-together-ai
   ENABLE_EMAIL_SENDING=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=orders@offcomfrt.tech
   SMTP_PASS=your-gmail-app-password
   FROM_NAME=SurfTrans AI Logistics
   FROM_EMAIL=orders@offcomfrt.tech
   ```

4. **Deploy** - Railway will automatically deploy and give you a URL like:
   `https://surftrans-backend.railway.app`

### Step 2: Deploy Frontend to Vercel

1. **Go to [Vercel](https://vercel.com/)**
   - Sign up with GitHub
   - Click "New Project"
   - Import `maxtern-pytes/crm-surftrans`

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variable**
   ```
   VITE_API_URL=https://surftrans-backend.railway.app/api
   ```

4. **Deploy** - Vercel will give you:
   `https://crm-surftrans.vercel.app`

---

## Option 2: **Render** (All-in-One)

### Deploy Both on Render

1. **Go to [Render](https://render.com/)**
   - Connect GitHub account
   - New Web Service → Select repo

2. **Backend Configuration**
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `node server.js`
   - Add environment variables (same as Railway above)

3. **Frontend Configuration**
   - Create another service
   - Root Directory: `frontend`
   - Build: `npm install && npm run build`
   - Static files: `dist`

---

## 🌐 Enable Internet-Capable AI

### Option A: Together AI (Recommended - FREE TIER)

1. **Sign up at [Together AI](https://api.together.ai/)**
   - Get your API key (free tier: $25 credit)

2. **Update Backend** - I'll create a new service file that uses Together AI instead of local Ollama

3. **Benefits:**
   - ✅ Internet access through AI training data
   - ✅ No RAM limitations
   - ✅ Faster responses
   - ✅ Production-ready

### Option B: Groq (Ultra-Fast)

1. **Sign up at [Groq](https://console.groq.com/)**
   - Free tier available
   - Lightning-fast inference

2. **Use models like:**
   - `llama-3.1-8b-instant`
   - `mixtral-8x7b-32768`

### Option C: OpenRouter (Multiple Models)

1. **Sign up at [OpenRouter](https://openrouter.ai/)**
   - Access to 100+ models
   - Pay-per-use

---

## 🔧 Update API Configuration

After getting your AI service API key, you'll need to update the backend to use cloud AI instead of local Ollama.

I'll create the integration files for you once you choose which AI service to use.

---

## 📊 Database Options

### For Production:

**Option 1: SQLite** (Current - Simple)
- Good for testing
- Not recommended for production

**Option 2: Supabase PostgreSQL** (Recommended)
- You already have the connection string
- Free tier: 500MB database
- Just update `DB_TYPE=postgresql` and `DATABASE_URL`

**Option 3: Railway MySQL/PostgreSQL**
- Add database from Railway dashboard
- One-click setup

---

## 🎯 Quick Deploy Commands

After setting up hosting, update your frontend API URL:

```bash
# Update frontend/src/api/index.js
const API_BASE_URL = 'https://your-backend-url.railway.app/api';
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] AI service configured (Together AI / Groq)
- [ ] Database connected
- [ ] Email SMTP configured
- [ ] Test login works
- [ ] Test AI chat works
- [ ] Test load creation works
- [ ] Test client discovery works

---

## 🔐 Security Notes

1. **Never commit `.env` files** - Already in `.gitignore` ✅
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -hex 32`
3. **Enable HTTPS** - Vercel/Railway do this automatically ✅
4. **Set up CORS** - Update backend to allow your frontend domain

---

## 💡 Next Steps

1. Choose your hosting platform (Railway + Vercel recommended)
2. Choose your AI service (Together AI recommended for internet access)
3. I'll create the cloud AI integration code
4. Deploy and test!

---

## 🆘 Need Help?

Common issues:
- **CORS errors**: Update backend CORS configuration
- **AI not responding**: Check API key and service URL
- **Database errors**: Verify connection string
- **Email not sending**: Verify SMTP credentials

---

**Ready to deploy? Let me know which hosting and AI service you prefer!**
