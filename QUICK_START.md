# Matchify Quick Start Guide

## 🚀 Start the Application

### 1. Start Backend (Terminal 1)
```bash
cd matchify/backend
npm start
```

**Expected Output:**
```
╔═══════════════════════════════════════╗
║      MATCHIFY SERVER STARTED 🎾      ║
╠═══════════════════════════════════════╣
║  Port: 5000                          ║
║  Environment: development            ║
║  Frontend: http://localhost:5173     ║
╚═══════════════════════════════════════╝

🚀 Ready to serve badminton tournaments!
📊 Health check: http://localhost:5000/health
🔗 API docs: http://localhost:5000/api
```

### 2. Start Frontend (Terminal 2)
```bash
cd matchify/frontend
npm run dev
```

**Expected Output:**
```
VITE v5.4.21  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🌐 Access URLs

### Frontend
- **Main App:** http://localhost:5173
- **Login:** http://localhost:5173/login
- **Tournaments:** http://localhost:5173/tournaments

### Backend
- **Health Check:** http://localhost:5000/health
- **API Docs:** http://localhost:5000/api

---

## 👤 Test Accounts

### Player Account
- **Email:** testplayer@matchify.com
- **Password:** password123
- **Wallet:** ₹4,500

### Organizer Account
- **Email:** testorganizer@matchify.com
- **Password:** password123
- **Wallet:** ₹5,000

---

## 🧪 Run Tests

### All Backend Tests
```bash
cd matchify/backend

# Individual test suites
node test-auth.js                    # 12/12 tests
node test-wallet.js                  # 8/8 tests
node test-tournament.js              # 8/8 tests
node test-categories.js              # 7/7 tests
node test-tournament-discovery.js    # 12/12 tests
node test-registrations.js           # 10/10 tests

# Integration tests
node integration-test.js             # 12/12 tests
```

---

## 🎯 User Flows to Test

### 1. Player Flow
1. Open http://localhost:5173
2. Click "Login"
3. Login with testplayer@matchify.com / password123
4. View profile (top right menu)
5. Check wallet balance
6. Browse tournaments
7. View tournament details
8. Register for a tournament

### 2. Organizer Flow
1. Login with testorganizer@matchify.com / password123
2. Go to "Create Tournament"
3. Complete 6-step wizard:
   - Step 1: Basic Info
   - Step 2: Dates
   - Step 3: Posters
   - Step 4: Categories
   - Step 5: Courts & Timing
   - Step 6: Review & Publish
4. View created tournament

### 3. Browse & Search
1. Go to http://localhost:5173/tournaments
2. Use search bar
3. Apply filters (city, format, status)
4. Click on a tournament to view details

---

## 🔍 Health Check

### Quick Check
```bash
cd matchify
node backend/integration-test.js
```

**Expected:** All 12 tests pass ✅

### Manual Check
```bash
# Backend health
curl http://localhost:5000/health

# Frontend accessibility
curl http://localhost:5173

# API endpoints
curl http://localhost:5000/api

# Tournaments
curl http://localhost:5000/api/tournaments?limit=5
```

---

## 🛠️ Troubleshooting

### Backend Not Starting
```bash
cd matchify/backend
npm install
npx prisma generate
npm start
```

### Frontend Not Starting
```bash
cd matchify/frontend
npm install
npm run dev
```

### Database Issues
```bash
cd matchify/backend
npx prisma migrate dev
npx prisma db push
node seed-tournaments.js
```

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## 📚 Documentation

- **System Status:** `SYSTEM_STATUS.md`
- **Health Check:** `HEALTH_CHECK.md`
- **Testing Guide:** `TESTING_GUIDE.md`
- **Day Summaries:** `DAY_XX_COMPLETE.md`

---

## 🎉 You're Ready!

Both servers are running and connected. You can now:
- ✅ Browse tournaments
- ✅ Create an account
- ✅ Login as player or organizer
- ✅ Create tournaments (organizer)
- ✅ Register for tournaments (player)
- ✅ Manage wallet

**Happy coding!** 🚀
