# AI-Driven Freight Broker Platform - Setup Guide

## Overview
The SurfTrans platform has been upgraded with AI-powered capabilities using Ollama. This guide will help you set up and run the enhanced system.

## Prerequisites

### 1. Install Ollama
1. Download Ollama from https://ollama.ai
2. Install on your system (Windows/Mac/Linux)
3. Start Ollama service

### 2. Pull an AI Model
Open terminal and run:
```bash
ollama pull llama3
```

Alternative models (smaller/faster):
```bash
ollama pull mistral
ollama pull phi3
```

### 3. Verify Ollama is Running
```bash
curl http://localhost:11434/api/tags
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies (including new multer package):
```bash
npm install
```

3. Run database migration to add AI columns:
```bash
node db/migrate.js
```

Expected output:
```
Running AI enhancement migration...
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

4. Start the backend server:
```bash
npm run dev
```

Server will start on http://localhost:3001

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will start on http://localhost:5173

## Environment Variables (Optional)

Create a `.env` file in the `backend` directory:

```env
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Server Configuration
PORT=3001
NODE_ENV=development
```

## AI Features Overview

### 1. AI-Powered Load Pricing
- Navigate to Loads → Create Load
- Enter origin and destination
- Click "Get AI Quote" button
- AI analyzes historical data and market trends
- Displays: shipper rate range, carrier rate range, expected margin, risk level, transit time
- Click "Accept Quote" to auto-fill rates

### 2. AI Load Recommendations
- On the Loads page, view AI-recommended profitable loads
- Recommendations based on your performance history and market demand
- Click "Create Load" on any recommendation to auto-fill the form

### 3. AI Client Discovery (Backend Ready)
- Endpoint: `POST /api/clients/shippers/ai-discover`
- Provide target regions, industries, and lanes
- Returns high-potential prospects with fit scores and outreach strategies

### 4. AI Carrier Matching (Backend Ready)
- Endpoint: `POST /api/clients/carriers/ai-match`
- Provide load requirements
- Returns best carrier matches with scores and suggested rates

### 5. AI Document Upload & Audit (Backend Ready)
- Endpoint: `POST /api/finance/documents/upload`
- Upload invoices, BOLs, PODs (PDF, Excel, images)
- AI extracts and validates data
- Auto-links to loads and creates invoice records

### 6. AI Financial Audit (Backend Ready)
- Endpoint: `POST /api/finance/ai-audit`
- Analyzes financial records for discrepancies
- Detects amount mismatches, missing docs, duplicates
- Provides risk scores and recommendations

## API Endpoints Added

### Loads
- `POST /api/loads/ai-quote` - Get AI pricing for a lane
- `GET /api/loads/ai-recommendations` - Get profitable load recommendations

### Clients
- `POST /api/clients/shippers/ai-discover` - Discover high-potential clients
- `POST /api/clients/shippers/:id/ai-outreach` - Generate outreach strategy
- `POST /api/clients/carriers/ai-match` - Match carriers to loads

### Finance
- `POST /api/finance/documents/upload` - Upload and parse documents
- `POST /api/finance/ai-audit` - Run AI financial audit

## Database Changes

New columns added to existing tables:

**loads table:**
- `ai_quote_data` (TEXT) - Stores AI quote JSON
- `risk_level` (TEXT) - low/medium/high
- `transit_estimate` (TEXT) - e.g., "3 days"

**shippers table:**
- `ai_score` (REAL) - AI prospect score
- `conversion_probability` (REAL) - 0-100
- `outreach_status` (TEXT) - tracking status

**carriers table:**
- `ai_match_score` (REAL) - Match score for loads
- `reliability_score` (REAL) - Reliability rating

## Troubleshooting

### AI Service Unavailable Error
1. Verify Ollama is running: `ollama list`
2. Check model is downloaded: `ollama pull llama3`
3. Test Ollama API: `curl http://localhost:11434/api/generate -d '{"model":"llama3","prompt":"test","stream":false}'`
4. Check backend logs for connection errors

### Slow AI Responses
- First request may be slow (model loading)
- Subsequent requests use 10-minute cache
- Consider using smaller models like `phi3` or `mistral`

### Document Upload Issues
- File size limit: 10MB
- Allowed types: PDF, Excel (.xlsx, .xls), JPEG, PNG
- Multer must be installed: `npm install` in backend directory

### Database Migration Errors
- If columns already exist, migration will skip them (safe to run multiple times)
- Check `backend/data/freight_broker.db` exists and is writable

## Production Deployment

1. Set environment variables:
```env
OLLAMA_URL=http://your-ollama-server:11434
OLLAMA_MODEL=llama3
NODE_ENV=production
PORT=3001
```

2. Build frontend:
```bash
cd frontend
npm run build
```

3. Start backend (serves frontend):
```bash
cd backend
npm start
```

4. Ensure Ollama is running as a service on the server

## Performance Optimization

- AI responses are cached for 10 minutes
- Common lane quotes load instantly from cache
- Historical data improves quote accuracy over time
- Recommendations update on page load

## Security Notes

- All AI endpoints require authentication (JWT)
- Role-based access maintained (admin/agent)
- File uploads validated for type and size
- AI inputs/outputs sanitized

## Next Steps

1. Install Ollama and pull a model
2. Run backend migration
3. Start both servers
4. Create a test load and try AI quote
5. Explore AI recommendations on Loads page
6. Test other AI endpoints via API client

## Support

For issues or questions:
- Check Ollama documentation: https://ollama.ai/docs
- Review backend logs for AI service errors
- Verify database migration completed successfully
- Test AI endpoints individually to isolate issues

---

**Platform Version**: 2.0.0 (AI-Enhanced)
**Last Updated**: 2026-04-14
