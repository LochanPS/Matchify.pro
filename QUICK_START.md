# 🚀 MATCHIFY.PRO - QUICK START GUIDE

## ✅ System Status: READY TO USE

Everything is properly configured and working!

---

## 🎯 START THE APPLICATION (3 EASY STEPS)

### Step 1: Open the Project Folder
Navigate to:
```
matchify pro 1\matchify backup 3\MATCHIFY.PRO\matchify
```

### Step 2: Double-Click to Start
```
START_BOTH.bat
```

This will:
- ✅ Start the backend server (Port 5000)
- ✅ Start the frontend server (Port 5173)
- ✅ Open two terminal windows

### Step 3: Open Your Browser
Go to: **http://localhost:5173**

---

## 🔐 LOGIN CREDENTIALS

### Admin Account
- **Email:** ADMIN@gmail.com
- **Password:** ADMIN@123(123)

This account has full access to all features.

---

## 📊 WHAT'S ALREADY SET UP

✅ Database with 9 test users  
✅ 1 active tournament  
✅ 8 registrations  
✅ 3 matches  
✅ 21 notifications  
✅ All dependencies installed  
✅ Environment variables configured  

---

## 🎮 WHAT YOU CAN DO

### As Admin
- View all users and tournaments
- Approve/reject organizer applications
- Manage system settings
- View all activity

### As Organizer
- Create tournaments
- Manage registrations
- Generate draws (Round Robin & Knockout)
- Assign umpires
- View tournament analytics

### As Player
- Browse tournaments
- Register for tournaments
- View draws and matches
- Check leaderboard
- Track your points

### As Umpire
- View assigned matches
- Score matches in real-time
- Track statistics

---

## 🔧 ALTERNATIVE START METHODS

### Start Backend Only
```
START_BACKEND.bat
```
Backend will run on: http://localhost:5000

### Start Frontend Only
```
START_FRONTEND.bat
```
Frontend will run on: http://localhost:5173

### Manual Start (Using Terminal)

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🧪 TEST THE SYSTEM

### Check Backend Health
Open: http://localhost:5000/health

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-18T...",
  "environment": "development",
  "version": "1.0.0"
}
```

### Run System Check
```bash
cd backend
node system-check.js
```

---

## 📱 KEY FEATURES TO TEST

1. **Login** - Use admin credentials
2. **Dashboard** - View your personalized dashboard
3. **Tournaments** - Browse available tournaments
4. **Create Tournament** - Test tournament creation (as organizer)
5. **Register** - Register for a tournament (as player)
6. **Draws** - Generate and view tournament draws
7. **Scoring** - Score matches (as umpire)
8. **Leaderboard** - Check player rankings
9. **Notifications** - View real-time notifications

---

## 🆘 TROUBLESHOOTING

### Port Already in Use
If you see "Port 5000 is already in use":
1. Close any running backend servers
2. Or change the port in `backend/.env`

### Frontend Won't Start
If frontend fails:
1. Check if port 5173 is available
2. Try: `cd frontend && npm install`

### Database Issues
If database errors occur:
```bash
cd backend
npx prisma generate
npx prisma db push
```

### Clear Everything and Restart
```bash
# Stop all servers (Ctrl+C in terminals)
# Then restart with START_BOTH.bat
```

---

## 📚 DOCUMENTATION

- **Full System Report:** `SYSTEM_STATUS_REPORT.md`
- **Feature Docs:** 200+ markdown files in project root
- **API Docs:** http://localhost:5000/api (when running)

---

## 🎯 NEXT STEPS

1. ✅ Start the servers
2. ✅ Login as admin
3. ✅ Explore the dashboard
4. ✅ Create a test tournament
5. ✅ Register some players
6. ✅ Generate draws
7. ✅ Score matches
8. ✅ Check the leaderboard

---

## 💡 TIPS

- Keep both terminal windows open while using the app
- Backend logs show API requests
- Frontend logs show in browser console (F12)
- Use Ctrl+C to stop servers
- Restart backend if you change .env files

---

## ✅ SYSTEM VERIFIED

All checks passed:
- ✅ Node.js v22.20.0 installed
- ✅ npm v11.6.2 installed
- ✅ Database connected (0.52 MB)
- ✅ Admin user exists
- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed
- ✅ Environment variables set
- ✅ Ports available (5000, 5173)

**You're ready to go! 🚀**

---

*Need help? Check SYSTEM_STATUS_REPORT.md for detailed information.*
