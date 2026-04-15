# 🚀 DEPLOYMENT CHECKLIST - CRM SurfTrans

## ✅ PRE-DEPLOYMENT VERIFICATION (COMPLETED)

### Code Quality
- [x] Frontend builds successfully (`npm run build`)
- [x] Backend loads without errors
- [x] `_redirects` file included in dist folder
- [x] All environment variables configured
- [x] CORS properly configured for production
- [x] JWT_SECRET secured (using Render's sync:false)
- [x] dotenv loaded in server.js
- [x] Database configuration correct (SQLite)

### Security
- [x] `.env` files in `.gitignore`
- [x] Database files in `.gitignore`
- [x] `node_modules` in `.gitignore`
- [x] JWT_SECRET not hardcoded in render.yaml
- [x] CORS restricted to specific domains

### Git Status
- [x] All changes committed
- [x] All changes pushed to GitHub
- [x] Latest commit: "Fix: Critical deployment issues - add dotenv, improve CORS, secure JWT"

---

## 🎯 DEPLOYMENT STEPS

### Option 1: FIRST TIME DEPLOYMENT (Using Render Blueprint)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Login to your account

2. **Create Blueprint**
   - Click **"New +"** → **"Blueprint"**
   - Connect GitHub repository: `maxtern-pytes/crm-surftrans`
   - Render will auto-detect `render.yaml`

3. **Review Services**
   - **surftrans-backend** (Web Service)
     - Root: `backend`
     - Build: `npm install`
     - Start: `node server.js`
   
   - **surftrans-frontend** (Static Site)
     - Root: `frontend`
     - Build: `npm install && npm run build`
     - Publish: `./dist`

4. **Set Required Environment Variables**

   **Backend (surftrans-backend):**
   ```
   NODE_ENV = production
   PORT = 3001
   DB_TYPE = sqlite
   TOGETHER_API_KEY = [Your Together AI API Key]
   AI_MODEL = meta-llama/Llama-3.2-1B-Instruct-Turbo
   JWT_SECRET = [Click "Generate" for secure random string]
   ENABLE_EMAIL_SENDING = false
   ENABLE_WEB_SCRAPING = true
   ENABLE_AI_TASK_ASSIGNMENT = true
   ENABLE_MARKET_TRENDS = true
   CORS_ORIGINS = https://surftrans-frontend.onrender.com,http://localhost:5173
   ```

   **Frontend (surftrans-frontend):**
   ```
   VITE_API_URL = https://surftrans-backend.onrender.com/api
   ```

5. **Deploy**
   - Click **"Apply"**
   - Wait 10-15 minutes for both services to deploy
   - Monitor deployment logs

---

### Option 2: REDEPLOY (If services already exist)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com

2. **Redeploy Backend**
   - Click on `surftrans-backend`
   - Click **"Manual Deploy"** → **"Deploy latest commit"**
   - Wait for deployment to complete

3. **Redeploy Frontend**
   - Click on `surftrans-frontend`
   - Go to **"Environment"** tab
   - Verify `VITE_API_URL` is set to `https://surftrans-backend.onrender.com/api`
   - Click **"Manual Deploy"** → **"Deploy latest commit"**
   - Wait for deployment to complete

---

## 🧪 POST-DEPLOYMENT TESTING

### 1. Test Backend Health
```
Visit: https://surftrans-backend.onrender.com/api/health
Expected: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

### 2. Test Frontend
```
Visit: https://surftrans-frontend.onrender.com
Expected: Login page loads without errors
```

### 3. Test API Connection
- Open browser console (F12)
- Try to login
- Check for any 404 or CORS errors
- Network tab should show successful API calls to `surftrans-backend.onrender.com`

### 4. Test Routes
```
- /login → Login page
- /dashboard → Should redirect to login if not authenticated
- /* → All routes should load (SPA routing via _redirects)
```

---

## ⚠️ COMMON ISSUES & FIXES

### Issue: 404 Errors on API Calls
**Fix:** Check that `VITE_API_URL` environment variable is set correctly in frontend service

### Issue: CORS Errors
**Fix:** 
1. Verify `CORS_ORIGINS` is set in backend
2. Check that frontend URL matches exactly (no trailing slash)
3. Redeploy backend after CORS changes

### Issue: Frontend Can't Connect to Backend
**Fix:**
1. Verify backend is running (check /api/health)
2. Check `VITE_API_URL` in frontend environment
3. Ensure both services are deployed successfully

### Issue: Database Errors
**Fix:**
1. Check `DB_TYPE=sqlite` in backend environment
2. Verify `data/` folder exists in backend
3. Check deployment logs for database initialization errors

---

## 📊 MONITORING

### Check Deployment Status
- Backend: https://dashboard.render.com → surftrans-backend → Logs
- Frontend: https://dashboard.render.com → surftrans-frontend → Logs

### View Application Logs
- Backend logs show: API requests, database operations, errors
- Frontend logs show: Build status, deployment status

---

## 🔧 ENVIRONMENT VARIABLES REFERENCE

### Backend (surftrans-backend)
| Variable | Value | Required | Notes |
|----------|-------|----------|-------|
| NODE_ENV | production | ✅ | Sets production mode |
| PORT | 3001 | ✅ | Render assigns this automatically |
| DB_TYPE | sqlite | ✅ | Use sqlite for simplicity |
| TOGETHER_API_KEY | [Your Key] | ✅ | For AI features |
| AI_MODEL | meta-llama/Llama-3.2-1B-Instruct-Turbo | ✅ | AI model to use |
| JWT_SECRET | [Generate] | ✅ | Click "Generate" in Render |
| ENABLE_EMAIL_SENDING | false | ✅ | Set to true when SMTP configured |
| ENABLE_WEB_SCRAPING | true | ✅ | Enable market data scraping |
| ENABLE_AI_TASK_ASSIGNMENT | true | ✅ | Enable AI task features |
| ENABLE_MARKET_TRENDS | true | ✅ | Enable market analytics |
| CORS_ORIGINS | https://surftrans-frontend.onrender.com | ✅ | Comma-separated URLs |

### Frontend (surftrans-frontend)
| Variable | Value | Required | Notes |
|----------|-------|----------|-------|
| VITE_API_URL | https://surftrans-backend.onrender.com/api | ✅ | Backend API URL |

---

## 🎉 SUCCESS CRITERIA

Your deployment is successful when:
- ✅ Both services show "Live" status in Render
- ✅ Backend health check returns 200 OK
- ✅ Frontend loads without errors
- ✅ Login works and redirects to dashboard
- ✅ No 404 or CORS errors in browser console
- ✅ API calls successfully reach backend
- ✅ All routes work (refresh on any page should work)

---

## 📝 NOTES

- **Auto-deploy is enabled**: Every push to `main` branch will trigger automatic deployment
- **SQLite database**: Stored in backend's `data/` folder (not persisted across redeployments)
- **For production database**: Consider upgrading to PostgreSQL for data persistence
- **JWT_SECRET**: Must be manually generated in Render dashboard (sync: false)
- **AI Features**: Require valid TOGETHER_API_KEY to work

---

**Last Updated:** April 16, 2026
**Status:** ✅ READY FOR DEPLOYMENT
