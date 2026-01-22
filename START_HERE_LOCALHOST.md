# 🏠 START HERE - LOCALHOST SETUP

## 🚀 Quick Start (Choose One Method)

### Method 1: Automatic Setup (Recommended)

**Double-click this file:**
```
setup-local.bat
```

This will automatically:
- Install all dependencies
- Setup database
- Create admin user
- Verify everything works

**Time: ~3-5 minutes**

---

### Method 2: Manual Setup

#### Step 1: Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
node deploy.js
```

#### Step 2: Frontend Setup

```bash
cd frontend
npm install
```

---

## ▶️ Starting the Application

### Option A: Use Start Scripts (Easy!)

**Terminal 1 - Backend:**
Double-click: `start-backend.bat`

**Terminal 2 - Frontend:**
Double-click: `start-frontend.bat`

### Option B: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🌐 Access the Application

Once both servers are running:

**Frontend:** http://localhost:5173

**Backend API:** http://localhost:5000

**Admin Login:**
- Email: `ADMIN@gmail.com`
- Password: `ADMIN@123(123)`

---

## ✅ Verify Everything Works

### 1. Check Backend Health

Open in browser: http://localhost:5000/health

Should see: `{"status":"ok"}`

### 2. Check Database

```bash
cd backend
node health-check.js
```

Should see:
```
✅ Database connected successfully
✅ Admin user exists: ADMIN@gmail.com
✅ Payment settings exist
✅ Payment math verified
🎉 Health check completed successfully!
```

### 3. Check Frontend

1. Open http://localhost:5173
2. Should load without errors
3. Check browser console (F12) - no red errors
4. Try logging in as admin

---

## 🎯 What to Test

### Admin Dashboard
- Login as admin
- Navigate to Admin section
- Check all pages load:
  - User Management
  - Payment Verification
  - Revenue Dashboard
  - Tournament Payments
  - QR Settings

### Payment System
- Go to Revenue Dashboard
- Verify calculations: **5% + 30% + 65% = 100%**
- Check payment tracking works

### Tournament Management
- Create a new tournament
- Add categories
- Publish tournament
- Verify it appears in list

---

## 🐛 Common Issues & Fixes

### Backend won't start

**Error: "Cannot find module '@prisma/client'"**
```bash
cd backend
npx prisma generate
npm run dev
```

**Error: "Port 5000 already in use"**
```bash
# Find and kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F
```

### Frontend won't start

**Error: "Cannot find module"**
```bash
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

### Can't login as admin

**Run this:**
```bash
cd backend
node deploy.js
npm run dev
```

Then try logging in again with:
- Email: `ADMIN@gmail.com`
- Password: `ADMIN@123(123)`

### Database connection fails

Check `backend/.env` file has correct DATABASE_URL:
```
DATABASE_URL=postgresql://postgres:Matchify.pro@db.euiltolaoeqszmrcjoze.supabase.co:5432/postgres
```

---

## 📊 Current Configuration

### Backend (.env)
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://[your-supabase-connection]
FIREBASE_ENABLED=false
ADMIN_EMAIL=ADMIN@gmail.com
ADMIN_PASSWORD=ADMIN@123(123)
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

---

## 🎯 Success Checklist

Your localhost is working when:

- ✅ Backend starts on port 5000
- ✅ Frontend starts on port 5173
- ✅ http://localhost:5000/health returns OK
- ✅ Can login as admin
- ✅ Admin dashboard loads
- ✅ No console errors
- ✅ Payment verification page works
- ✅ Revenue dashboard shows correct math
- ✅ Can create tournaments

---

## 📚 Need More Help?

See detailed guide: **LOCAL_SETUP_GUIDE.md**

---

## 🎉 You're Ready!

Once everything works on localhost, you can deploy to production using:
**DEPLOYMENT_GUIDE_COMPLETE.md**

Happy coding! 🚀
