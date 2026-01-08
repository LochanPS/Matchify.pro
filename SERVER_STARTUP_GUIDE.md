# Server Startup Guide

## Issue Fixed ✅

**Problem:** "ERR_CONNECTION_REFUSED" - Frontend couldn't connect to backend

**Cause:** Backend server was not running

**Solution:** Started both backend and frontend servers

---

## Current Status

### Backend Server ✅
- **Status:** Running
- **Port:** 5000
- **URL:** http://localhost:5000
- **Health Check:** http://localhost:5000/health
- **API:** http://localhost:5000/api
- **WebSocket:** ws://localhost:5000

### Frontend Server ✅
- **Status:** Running
- **Port:** 5173
- **URL:** http://localhost:5173

---

## How to Start Servers Manually

### Option 1: Using Two Terminals (Recommended)

**Terminal 1 - Backend:**
```bash
cd matchify/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd matchify/frontend
npm run dev
```

### Option 2: Using One Terminal (Windows)

```bash
# Start backend in background
cd matchify/backend
start cmd /k npm run dev

# Start frontend in background
cd ../frontend
start cmd /k npm run dev
```

---

## Verify Servers Are Running

### Check Backend:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-27T...",
  "environment": "development",
  "version": "1.0.0"
}
```

### Check Frontend:
Open browser: http://localhost:5173

---

## Common Issues & Solutions

### Issue 1: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=5001
```

### Issue 2: Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
cd matchify/backend
npm install

cd ../frontend
npm install
```

### Issue 3: Database Connection Error

**Error:** `Can't reach database server`

**Solution:**
- Check DATABASE_URL in backend/.env
- For development, using SQLite: `DATABASE_URL="file:./dev.db"`
- Run migrations: `cd backend && npx prisma migrate dev`

### Issue 4: CORS Error

**Error:** `Access to XMLHttpRequest blocked by CORS`

**Solution:**
- Check FRONTEND_URL in backend/.env matches frontend URL
- Default: `FRONTEND_URL=http://localhost:5173`

---

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Stopping Servers

### If Started Manually:
- Press `Ctrl + C` in each terminal

### If Started in Background:
```bash
# Windows
taskkill /F /IM node.exe

# Or close the command windows
```

---

## Development Workflow

1. **Start servers** (both backend and frontend)
2. **Open browser** to http://localhost:5173
3. **Make changes** to code
4. **Auto-reload** happens automatically
5. **Check console** for errors

---

## Logs Location

### Backend Logs:
- Console output in terminal
- Check for errors in red

### Frontend Logs:
- Browser console (F12)
- Terminal output for build errors

---

## Quick Health Check

Run this to verify everything is working:

```bash
# Check backend
curl http://localhost:5000/health

# Check frontend (in browser)
http://localhost:5173

# Check WebSocket (in browser console)
# Should see: "✅ Socket connected: <socket-id>"
```

---

## Next Steps

Now that servers are running:

1. **Login** to the application
2. **Navigate** to scoring console: `/scoring/{matchId}`
3. **Test** Day 40 enhancements:
   - Match timer
   - Pause/Resume
   - Game point indicators
   - Doubles rotation (if doubles match)

---

## Troubleshooting Commands

```bash
# Check if backend is running
curl http://localhost:5000/health

# Check if frontend is running
curl http://localhost:5173

# Check Node.js version
node --version

# Check npm version
npm --version

# Reinstall dependencies
cd matchify/backend && npm install
cd ../frontend && npm install

# Clear npm cache
npm cache clean --force

# Reset database (if needed)
cd matchify/backend
npx prisma migrate reset
npx prisma migrate dev
```

---

## Success Indicators

✅ Backend shows: "MATCHIFY SERVER STARTED 🎾"
✅ Frontend shows: "VITE ready in XXX ms"
✅ Browser loads: http://localhost:5173
✅ No console errors
✅ Can navigate pages
✅ API calls work

---

**Servers are now running! You can access the application at http://localhost:5173** 🎾
