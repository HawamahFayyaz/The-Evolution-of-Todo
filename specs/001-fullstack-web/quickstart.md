# Quickstart: Phase II Full-Stack Web Application

**Feature**: 001-fullstack-web
**Created**: 2026-01-15

This guide helps developers set up the Phase II full-stack todo application locally.

---

## Prerequisites

- **Python**: 3.13+ with UV package manager
- **Node.js**: 20+ with pnpm/npm
- **PostgreSQL**: Neon account (free tier)
- **Git**: For version control

---

## 1. Database Setup (Neon)

### Create Neon Project
1. Go to [neon.tech](https://neon.tech)
2. Sign up / Sign in
3. Click "Create Project"
4. Name: `hackathon-todo` (or your choice)
5. Region: Choose closest to you
6. Click "Create Project"

### Get Connection String
1. On project dashboard, find "Connection Details"
2. Copy the connection string (starts with `postgresql://`)
3. Format: `postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require`

**Save this string** - you'll need it for both backend and frontend.

---

## 2. Generate Shared Secret

Generate a secure secret for JWT authentication (minimum 32 characters):

```bash
# Option 1: Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Option 2: Using OpenSSL
openssl rand -base64 32

# Option 3: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Save this secret** - MUST be identical in both backend and frontend.

---

## 3. Backend Setup

### Navigate to Backend Directory
```bash
cd backend
```

### Create Environment File
Create `backend/.env`:
```bash
# Database
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require

# Authentication (MUST match frontend)
BETTER_AUTH_SECRET=your-generated-secret-minimum-32-characters

# CORS (add production URL when deploying)
ALLOWED_ORIGINS=http://localhost:3000

# Server
HOST=0.0.0.0
PORT=8000
```

### Install Dependencies
```bash
# Using UV (recommended)
uv pip install -r requirements.txt

# Or using pip
pip install -r requirements.txt
```

### Start Backend Server
```bash
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Verify Backend
- Open http://localhost:8000/docs for OpenAPI docs
- Check http://localhost:8000/health for health status

---

## 4. Frontend Setup

### Navigate to Frontend Directory
```bash
cd frontend
```

### Create Environment File
Create `frontend/.env.local`:
```bash
# Public URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication (MUST match backend - CRITICAL!)
BETTER_AUTH_SECRET=your-generated-secret-minimum-32-characters

# Database (for Better Auth user management)
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
```

**CRITICAL**: `BETTER_AUTH_SECRET` must be IDENTICAL to the backend value!

### Install Dependencies
```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### Start Frontend Server
```bash
# Development mode
pnpm dev

# Or
npm run dev
```

### Verify Frontend
- Open http://localhost:3000
- You should see the landing page

---

## 5. Verify Full Stack

### Test Authentication Flow
1. Go to http://localhost:3000/signup
2. Create a new account (email, password, name)
3. You should be redirected to /dashboard
4. Check that you see the welcome message

### Test Task Operations
1. Click "Add Task"
2. Enter a title and optional description
3. Click "Create"
4. Verify task appears in list
5. Click checkbox to mark complete
6. Click edit to modify
7. Click delete to remove (soft delete)

### Test Data Persistence
1. Create a few tasks
2. Sign out
3. Sign back in
4. Verify all tasks are still there

### Test User Isolation
1. Create a second account with different email
2. Verify you see NO tasks from the first account
3. Create tasks for second account
4. Switch back to first account
5. Verify you only see first account's tasks

---

## 6. Common Issues

### "Invalid Token" Error
**Cause**: BETTER_AUTH_SECRET mismatch between frontend and backend
**Fix**: Ensure both `.env` files have IDENTICAL secrets

### CORS Errors
**Cause**: Frontend URL not in backend ALLOWED_ORIGINS
**Fix**: Add `http://localhost:3000` to backend ALLOWED_ORIGINS

### Database Connection Failed
**Cause**: Invalid DATABASE_URL or network issues
**Fix**:
1. Check Neon dashboard for correct connection string
2. Ensure `?sslmode=require` is in URL
3. Check network connectivity

### "Module not found" Errors
**Cause**: Dependencies not installed
**Fix**: Run `pip install -r requirements.txt` (backend) or `pnpm install` (frontend)

### Port Already in Use
**Cause**: Another process using port 8000 or 3000
**Fix**:
```bash
# Find process on port
lsof -i :8000

# Kill process
kill -9 <PID>
```

---

## 7. Development Workflow

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests (when implemented)
cd frontend
pnpm test
```

### Database Reset
To reset database and start fresh:
1. Go to Neon dashboard
2. Delete and recreate tables, or
3. Create a new database branch

### Checking Logs
```bash
# Backend logs are in terminal running uvicorn
# Frontend logs are in terminal running next dev
# Browser console for client-side errors
```

---

## 8. Environment Summary

| Variable | Backend | Frontend | Notes |
|----------|---------|----------|-------|
| DATABASE_URL | ✅ Required | ✅ Required | Same value |
| BETTER_AUTH_SECRET | ✅ Required | ✅ Required | MUST match! |
| ALLOWED_ORIGINS | ✅ Required | - | Frontend URL |
| NEXT_PUBLIC_APP_URL | - | ✅ Required | Frontend URL |
| NEXT_PUBLIC_API_URL | - | ✅ Required | Backend URL |
| HOST | ✅ Required | - | 0.0.0.0 |
| PORT | ✅ Required | - | 8000 |

---

## 9. Useful Commands

```bash
# Start both servers (from root)
# Terminal 1:
cd backend && uvicorn main:app --reload

# Terminal 2:
cd frontend && pnpm dev

# Check backend health
curl http://localhost:8000/health

# View OpenAPI docs
open http://localhost:8000/docs

# View frontend
open http://localhost:3000
```

---

## Next Steps

After setup is complete:
1. Explore the OpenAPI documentation at `/docs`
2. Test all CRUD operations
3. Review the code structure in `backend/` and `frontend/`
4. Make changes and see hot-reload in action
5. Run tests to verify nothing breaks
