# Render Deployment - PostgreSQL Database Fix

## Problem
The staging API deployment is failing with 500 errors on `/api/authentication/register` and `/api/authentication/login` because PostgreSQL database is not configured.

## Root Cause
The `render.yaml` file was missing:
1. PostgreSQL database service definition
2. `DATABASE_URL` environment variable connecting API to database
3. `CORS_ORIGINS` environment variable for frontend access

## Changes Made

### Updated `render.yaml`
```yaml
services:
  # NEW: Added PostgreSQL database service
  - type: pserv
    name: knowledge-ask-db
    plan: free
    databaseName: knowledge_ask_db
    databaseUser: knowledge_ask_user

  # UPDATED: Added DATABASE_URL and CORS_ORIGINS
  - type: web
    name: knowledge-ask-api
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: knowledge-ask-db
          property: connectionString
      - key: CORS_ORIGINS
        value: https://knowledge-ask-frontend.onrender.com,http://localhost:5174
```

## Post-Deployment Steps

### 1. Enable pgvector Extension (REQUIRED)
After Render creates the database, connect and run:
```bash
# In Render dashboard, open Shell for knowledge-ask-db
psql $DATABASE_URL
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 2. Verify Database Initialization
Check API logs after deployment:
```
✓ Database schema initialized successfully
```

### 3. Test Authentication Endpoints
```bash
# Register should return 201 (not 500)
curl -X POST https://knowledge-ask-api.onrender.com/api/authentication/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'

# Expected: HTTP 201 with user object and token
```

## Related
- Frontend PR: https://github.com/RusselTheCreator/knowledge-ask-frontend/pull/1
- QA Report: `docs/qa/STAGING-ACCEPTANCE-2026-09-25.md` (in frontend repo)

## Impact
- ✅ Fixes authentication 500 errors
- ✅ Enables user registration and login
- ✅ Unblocks all E2E tests
- ✅ Makes staging environment functional
