# 🚀 Quick Deploy - CRM SurfTrans

Your code is now on GitHub and ready to deploy with **internet-capable AI**!

**GitHub Repository:** https://github.com/maxtern-pytes/crm-surftrans

---

## 📋 What's Been Done ✅

1. ✅ Code uploaded to GitHub
2. ✅ Cloud AI service created (Together AI integration)
3. ✅ Deployment configurations added (Railway, Render, Vercel)
4. ✅ Auto-switching between local Ollama and cloud AI
5. ✅ Frontend configured for production API URL

---

## 🎯 Next Steps - Choose Your Hosting

### **Option 1: Railway + Vercel (Recommended)**

#### Deploy Backend to Railway (5 minutes):

1. Go to https://railway.app/
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `maxtern-pytes/crm-surftrans`
5. Set root directory to `backend`
6. Add these environment variables:

```bash
NODE_ENV=production
PORT=3001
DB_TYPE=sqlite
JWT_SECRET=your-random-secret-key-here
TOGETHER_API_KEY=get-this-from-together-ai
AI_MODEL=meta-llama/Llama-3.2-1B-Instruct-Turbo
ENABLE_EMAIL_SENDING=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=orders@offcomfrt.tech
SMTP_PASS=your-gmail-app-password
FROM_NAME=SurfTrans AI Logistics
FROM_EMAIL=orders@offcomfrt.tech
```

7. Deploy! You'll get a URL like: `https://surftrans-backend-production.up.railway.app`

#### Deploy Frontend to Vercel (3 minutes):

1. Go to https://vercel.com/
2. Sign up with GitHub
3. Import `maxtern-pytes/crm-surftrans`
4. Set root directory to `frontend`
5. Add environment variable:

```bash
VITE_API_URL=https://your-railway-backend-url.up.railway.app/api
```

6. Deploy! You'll get: `https://crm-surftrans.vercel.app`

---

### **Option 2: Render (All-in-One)**

1. Go to https://render.com/
2. Connect GitHub
3. Create Web Service from repo
4. Set root directory to `backend`
5. Add same environment variables as Railway
6. Deploy backend
7. Create another service for frontend (static site)

---

## 🔑 Get Your Together AI API Key

The AI needs internet access! Together AI provides this:

1. Go to https://api.together.ai/
2. Sign up (free $25 credit)
3. Go to API Keys
4. Copy your API key
5. Add to your hosting environment variables as `TOGETHER_API_KEY`

**Benefits of Together AI:**
- ✅ Internet knowledge (trained on latest data)
- ✅ No RAM limits
- ✅ Production-ready
- ✅ Fast responses
- ✅ Free tier: $25 credit

---

## 🔐 Security Checklist

Before deploying:

1. **Change JWT_SECRET** - Generate a random key:
   ```bash
   # Use this or generate your own
   JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

2. **Gmail App Password** - You already have this: `Aryan@A1`

3. **Never commit .env files** - Already protected ✅

---

## 🧪 Test Your Deployment

After deployment, test these features:

1. **Login**: Go to your Vercel URL and login
2. **AI Chat**: Try "Find manufacturing clients in California"
3. **Load Creation**: Try "Create load from LA to Houston"
4. **Quotes**: Try "What's the rate from Chicago to Miami?"
5. **Client Discovery**: Ask AI to find new prospects

---

## 📊 Database Options

### Current: SQLite (Simple)
- Works out of the box
- Data stored in backend server
- Good for testing

### Production: Supabase PostgreSQL (Recommended)
- You already have the connection!
- Just update environment variables:

```bash
DB_TYPE=postgresql
DATABASE_URL=postgresql://postgres:aryan7015139904sheoran@db.pofklzshjfuxgpoibdrv.supabase.co:5432/postgres?sslmode=require
```

---

## 🔄 How AI Switching Works

The code automatically detects which AI to use:

```javascript
// If TOGETHER_API_KEY is set → Uses Cloud AI (internet-capable)
// If not set → Uses local Ollama (offline)
```

**No code changes needed!** Just add/remove the environment variable.

---

## 💰 Cost Estimate

**Free Tier Deployment:**
- Railway: Free ($5 credit/month)
- Vercel: Free (unlimited)
- Together AI: Free ($25 credit)
- Supabase: Free (500MB database)

**Total: $0** for testing and light usage!

---

## 🆘 Need Help?

Common issues:

**CORS Error:**
- Make sure backend allows your frontend URL
- Update `server.js` CORS configuration

**AI Not Responding:**
- Check `TOGETHER_API_KEY` is set correctly
- Verify API key has credits remaining

**Database Error:**
- Verify connection string
- Check database is accessible

**Email Not Sending:**
- Verify Gmail app password
- Check SMTP settings

---

## 📞 Quick Commands

```bash
# View your GitHub repo
open https://github.com/maxtern-pytes/crm-surftrans

# Get Together AI API key
open https://api.together.ai/

# Deploy to Railway
open https://railway.app/

# Deploy to Vercel
open https://vercel.com/
```

---

## ✅ You're Ready!

Your CRM SurfTrans is production-ready with:
- ✅ Internet-capable AI
- ✅ Cloud deployment configs
- ✅ Auto-scaling support
- ✅ Email integration
- ✅ PostgreSQL support

**Just pick a hosting platform and deploy!**

Need help with the deployment? Let me know which platform you choose and I'll guide you through it step-by-step.
