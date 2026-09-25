# Backend Deployment Fix - PostgreSQL Configuration Missing

## Root Cause Identified ✅

The `render.yaml` file in the knowledge-ask-api repository **does not include a PostgreSQL database**. The backend code expects a `DATABASE_URL` environment variable to connect to PostgreSQL, but this is not configured in the Render deployment.

## Current render.yaml (INCOMPLETE)
```yaml
services:
  - type: web
    name: knowledge-ask-api
    runtime: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      # ❌ DATABASE_URL is MISSING
```

## Required Fix for render.yaml

Add the PostgreSQL database to `render.yaml`:

```yaml
services:
  # Add PostgreSQL database FIRST
  - type: pserv
    name: knowledge-ask-db
    plan: free  # Free tier includes 90-day data retention
    databaseName: knowledge_ask_db
    databaseUser: knowledge_ask_user
    region: oregon  # Use same region as web service
    ipAllowList: []  # Empty = allow from Render services only
    # pgvector extension must be enabled manually in Render dashboard after creation

  # Existing web service with DATABASE_URL added
  - type: web
    name: knowledge-ask-api
    runtime: node
    plan: free
    branch: main
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: knowledge-ask-db
          property: connectionString
      - key: LLM_PROVIDER
        value: mock
      - key: EMBEDDING_PROVIDER
        value: mock
      - key: MAX_FILE_SIZE_MB
        value: 10
      - key: CHUNK_SIZE
        value: 600
      - key: CHUNK_OVERLAP
        value: 100
      - key: TOP_K_CHUNKS
        value: 5
    healthCheckPath: /health
```

## Manual Steps if render.yaml Can't Be Used

If the database was already created manually outside render.yaml:

1. **In Render Dashboard:**
   - Go to knowledge-ask-api service
   - Click "Environment" tab
   - Add new environment variable:
     ```
     Key: DATABASE_URL
     Value: <copy from knowledge-ask-db Internal Database URL>
     ```
   - Save and redeploy

2. **Enable pgvector Extension:**
   ```bash
   # Connect to database via Render shell or psql
   psql $DATABASE_URL
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Verify Database Connection:**
   After redeploy, check logs:
   ```
   ✓ Database schema initialized successfully
   ```

## Quick Verification After Fix

```bash
# 1. Health check should still work
curl https://knowledge-ask-api.onrender.com/health

# 2. Register should now return 201 (not 500)
curl -X POST https://knowledge-ask-api.onrender.com/api/authentication/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"testverify@example.com","password":"TestPass123!"}'

# Expected: HTTP 201 with user object and token
```

## Implementation Options

### Option 1: Update render.yaml (RECOMMENDED)
1. Edit `render.yaml` in knowledge-ask-api repo
2. Add database service configuration (see above)
3. Commit and push to main branch
4. Render will auto-detect and prompt to create database

### Option 2: Manual Render Dashboard Setup
1. Create PostgreSQL database in Render dashboard
2. Enable pgvector extension
3. Add DATABASE_URL to web service environment
4. Redeploy web service

### Option 3: Alternative Database Provider
If Render PostgreSQL is unavailable:
- Use Supabase (free tier with pgvector)
- Use Railway (free tier PostgreSQL)
- Use Neon (free tier serverless Postgres)
- Update DATABASE_URL to point to external provider

## After Fix - Re-run E2E Tests

Once backend is fixed:
```bash
cd /workspace
npm run test
```

All 6 tests should pass ✅
