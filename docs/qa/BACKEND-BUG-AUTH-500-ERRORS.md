# Backend API - Critical Bug Report

## Issue Summary
**Severity:** CRITICAL BLOCKER  
**Component:** Backend API (knowledge-ask-api)  
**Environment:** Staging (https://knowledge-ask-api.onrender.com)  
**Date:** 2026-09-25  
**Status:** BLOCKING all user flows requiring authentication

## Problem Description
Both `/api/authentication/register` and `/api/authentication/login` endpoints return `500 Internal Server Error` with generic error messages. This prevents:
- User registration
- User login
- All authenticated features (file upload, Q&A, file management)

## Reproduction Steps

### Register Endpoint Failure
```bash
curl -X POST https://knowledge-ask-api.onrender.com/api/authentication/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPassword123!"}'
```

**Actual Response:**
```json
HTTP/2 500
{"error":"Failed to register user. Please try again."}
```

**Expected Response:**
```json
HTTP/2 201
{
  "message": "User registered successfully",
  "user": { "id": 1, "name": "Test User", "email": "test@example.com", "role": "User", "createdAt": "..." }
}
```

### Login Endpoint Failure
```bash
curl -X POST https://knowledge-ask-api.onrender.com/api/authentication/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
```

**Actual Response:**
```json
HTTP/2 500
{"error":"Failed to login. Please try again."}
```

**Expected Response:**
```json
HTTP/2 401
{"error":"Invalid email or password"}
```

## Root Cause Analysis

After reviewing the backend code at `/tmp/knowledge-ask-api/routes/authentication.js`:

1. **Database Connection Issue**: The authentication routes depend on PostgreSQL via `pool.query()` calls (lines 78-80, 175-177)
2. **Missing Configuration**: The API expects environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - For token generation
   - `NODE_ENV` - Environment mode

3. **500 Error Indicates**: Database operations are failing (likely connection timeout, missing tables, or authentication failure to Postgres)

## Required Backend Fixes

### 1. Verify Database Configuration on Render
```bash
# Check these environment variables are set in Render dashboard:
DATABASE_URL=postgresql://user:pass@host:port/knowledge_ask_db
JWT_SECRET=<strong-random-secret>
NODE_ENV=production
```

### 2. Ensure Database Schema is Initialized
The `users` table must exist with this schema:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'User',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Verify Render PostgreSQL Service
- Check if PostgreSQL addon is provisioned in Render
- Verify connection pooling limits
- Check database logs for connection errors

### 4. Add Better Error Logging
Recommended patch for `routes/authentication.js`:

```javascript
// Line 117-122 (register error handler)
catch (error) {
  console.error('Registration error:', {
    message: error.message,
    code: error.code,  // PostgreSQL error code
    stack: error.stack
  });
  res.status(500).json({
    error: 'Failed to register user. Please try again.',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    errorCode: error.code  // Include PG error code in dev mode
  });
}
```

## Workaround
None available. Backend must be fixed before E2E acceptance testing can complete.

## Impact
- E2E tests: 3/6 passing (only UI-only tests pass)
- User flows: 0% functional (all require authentication)
- Staging environment: NOT READY for manual testing

## Next Steps
1. ✅ Document bug with reproduction (this file)
2. ⏳ Verify Render PostgreSQL service is running and accessible
3. ⏳ Check DATABASE_URL and JWT_SECRET are set correctly
4. ⏳ Run database migrations if tables don't exist
5. ⏳ Test API health after fixes
6. ⏳ Re-run E2E test suite
