# Backend Fix Instructions

Since I don't have write access to the knowledge-ask-api repository, the fix files are provided here for manual application.

## Quick Summary
The backend API returns 500 errors because PostgreSQL is not configured in `render.yaml`.

## How to Apply Fix

### Option 1: Use git patch (from backend-fix directory)
```bash
cd /path/to/knowledge-ask-api
git checkout -b fix/add-database-config
cp /path/to/this/render.yaml render.yaml
git add render.yaml
git commit -m "Fix Render deployment: add PostgreSQL database configuration"
git push origin fix/add-database-config
# Create PR on GitHub
```

### Option 2: Manual edit
1. Open `knowledge-ask-api/render.yaml`
2. Replace content with `backend-fix/render.yaml` from this directory
3. Commit and push
4. After Render deploys, enable pgvector extension:
   ```bash
   psql $DATABASE_URL
   CREATE EXTENSION IF NOT EXISTS vector;
   \q
   ```

### Option 3: Render Dashboard (No code changes)
1. Go to Render dashboard
2. Create new PostgreSQL database: `knowledge-ask-db`
3. Enable pgvector extension
4. Go to knowledge-ask-api service → Environment
5. Add: `DATABASE_URL` = <database internal connection string>
6. Add: `CORS_ORIGINS` = `https://knowledge-ask-frontend.onrender.com,http://localhost:5174`
7. Save and redeploy

## Files Provided
- `render.yaml` - Updated configuration with PostgreSQL
- `RENDER-DATABASE-FIX.md` - Detailed deployment instructions

## Expected Result After Fix
```bash
# This should return 201 instead of 500:
curl -X POST https://knowledge-ask-api.onrender.com/api/authentication/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test123!"}'
```

## Then Re-run E2E Tests
```bash
cd knowledge-ask-frontend
npm run test
# All 6 tests should pass ✅
```
