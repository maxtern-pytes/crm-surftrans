# CRM SurfTrans - Freight Broker CRM

A modern CRM system for freight brokers with AI-powered features.

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: SQLite (default) / PostgreSQL (optional)
- **AI**: Together AI API

## Quick Start

### Local Development

1. **Install dependencies**:
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

2. **Setup environment variables**:
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your API keys

# Frontend (already configured for local dev)
```

3. **Run the application**:
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Deployment to Render

### One-Click Deploy

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` and deploy both services

### Manual Deploy

**Backend Service**:
- Type: Web Service
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment Variables:
  - `NODE_ENV`: `production`
  - `PORT`: `3001`
  - `DB_TYPE`: `sqlite`
  - `TOGETHER_API_KEY`: Your API key
  - `JWT_SECRET`: Random secure string

**Frontend Service**:
- Type: Static Site
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `./dist`
- Environment Variables:
  - `VITE_API_URL`: `https://your-backend.onrender.com/api`

## Project Structure

```
CRM SurfTrans/
├── backend/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── db/              # Database schema & migrations
│   ├── middleware/      # Auth middleware
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── components/  # Shared components
│   │   ├── api/         # API client
│   │   └── contexts/    # React contexts
│   └── public/          # Static assets
└── render.yaml          # Render deployment config
```

## Features

- ✅ User Authentication & Authorization
- ✅ Agent Management
- ✅ Client/Shipper Management
- ✅ Load Tracking
- ✅ Finance & Invoicing
- ✅ Analytics Dashboard
- ✅ AI-Powered Chat
- ✅ AI Client Discovery
- ✅ AI Load Quotes
- ✅ Market Intelligence
- ✅ Notifications

## API Endpoints

- `POST /api/auth/login` - User login
- `GET /api/agents` - List agents
- `GET /api/clients/shippers` - List shippers
- `GET /api/loads` - List loads
- `GET /api/finance/overview` - Finance overview
- `GET /api/analytics/dashboard-summary` - Dashboard stats
- `POST /api/ai-agent/chat` - AI chat

## License

Private - CRM SurfTrans
