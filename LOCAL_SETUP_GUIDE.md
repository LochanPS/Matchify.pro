# 🏠 MATCHIFY.PRO - LOCAL DEVELOPMENT SETUP

## 📋 Prerequisites

Make sure you have installed:
- ✅ Node.js (v18 or higher)
- ✅ npm or yarn
- ✅ Git

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Backend Dependencies

```bash
cd MATCHIFY.PRO/matchify/backend
npm install
```

### Step 2: Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push

# Run setup script (creates admin user + payment settings)
node deploy.js
```

### Step 3: Start Backend Server

```bash
npm run dev
```

Expected output:
```
✅ Firebase disabled in production
✅ Database connected
✅ Server running on http://localhost:5000
```

### Step 4: Install Frontend Dependencies (New Terminal)

```bash
cd MATCHIFY.PRO/matchify/frontend
npm install
```

### Step 5: Start Frontend Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 6: Open Browser

Navigate to: **http://localhost:5173**

Login with:
- Email: `ADMIN@gmail.com`
- Password: `ADMIN@123(123)`

---

## ✅ Verification Checklist

### Backend Health Check

Open in browser or use curl:
```bash
# Health endpoint
curl http://localhost:5000/health

# API health
curl http://localhost:5000/api/health
```

Expected: `{"status":"ok"}` or `{"status":"healthy"}`

### Database Verification

Run the health check script:
```bash
cd MATCHIFY.PRO/matchify/backend
node health-check.js
```

Expected output:
```
✅ Database connected successfully
✅ Admin user exists: ADMIN@gmail.com
✅ Payment settings exist
✅ Payment math verified
🎉 Health check completed successfully!
```

### Frontend Connection

1. Open http://localhost:5173
2. Check browser console (F12) - should have no errors
3. Try logging in as admin
4. Navigate to admin dashboard

---

## 🔧 Current Configuration

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://[your-supabase-connection]
FRONTEND_URL=http://localhost:5173
JWT_SECRET=[configured]
CLOUDINARY_CLOUD_NAME=dfg8tdgmf
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

### Database
- Type: PostgreSQL (Supabase)
- Connection: Already configured in backend/.env
- Tables: Auto-created by Prisma

---

## 🎯 What Gets Created Automatically

When you run `node deploy.js`, it creates:

1. **Admin User**
   - Email: ADMIN@gmail.com
   - Password: ADMIN@123(123)
   - Roles: ADMIN,PLAYER,ORGANIZER,UMPIRE

2. **Payment Settings**
   - UPI ID: admin@matchify.pro
   - Account Holder: Matchify Pro Admin
   - Status: Active

3. **Database Tables** (via Prisma)
   - User
   - Tournament
   - Category
   - Registration
   - PaymentVerification
   - TournamentPayment
   - PaymentSettings
   - Match
   - And more...

---

## 🧪 Testing Locally

### 1. Test Admin Login
- Go to http://localhost:5173
- Click "Login"
- Email: `ADMIN@gmail.com`
- Password: `ADMIN@123(123)`
- Should redirect to dashboard

### 2. Test Admin Dashboard
- Navigate to Admin section
- Check all pages load:
  - User Management
  - Payment Verification
  - Revenue Dashboard
  - Tournament Payments
  - QR Settings

### 3. Test Payment Calculations
- Go to Revenue Dashboard
- Verify formula: 5% + 30% + 65%
- Check all numbers add up correctly

### 4. Test Tournament Creation
- Go to Tournaments
- Create a new tournament
- Add categories
- Verify it saves correctly

---

## 🐛 Troubleshooting

### Backend won't start

**Error: "Cannot find module '@prisma/client'"**
```bash
cd backend
npx prisma generate
npm run dev
```

**Error: "Database connection failed"**
- Check DATABASE_URL in backend/.env
- Verify Supabase database is running
- Test connection: `npx prisma db push`

**Error: "Port 5000 already in use"**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F

# Or change PORT in backend/.env to 5001
```

### Frontend won't start

**Error: "Cannot find module"**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Error: "Port 5173 already in use"**
- Vite will automatically use next available port (5174, 5175, etc.)
- Update FRONTEND_URL in backend/.env if needed

### Frontend can't connect to backend

**Error: "Network Error" or "CORS Error"**
1. Check backend is running on http://localhost:5000
2. Check VITE_API_URL in frontend/.env
3. Check FRONTEND_URL in backend/.env
4. Restart both servers

### Admin login fails

**Error: "Invalid credentials"**
1. Run health check: `node backend/health-check.js`
2. Verify admin user exists
3. Try running deploy.js again: `node backend/deploy.js`
4. Check exact credentials: `ADMIN@gmail.com` / `ADMIN@123(123)`

### Database tables missing

**Error: "Table does not exist"**
```bash
cd backend
npx prisma db push
node deploy.js
```

---

## 📊 Development Workflow

### Daily Development

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Make Changes**
   - Backend changes auto-reload (nodemon)
   - Frontend changes auto-reload (Vite HMR)

4. **Test Changes**
   - Check browser console for errors
   - Test API endpoints
   - Verify database changes

### Database Changes

When you modify `backend/prisma/schema.prisma`:

```bash
cd backend

# Push changes to database
npx prisma db push

# Regenerate Prisma Client
npx prisma generate

# Restart backend server
npm run dev
```

### View Database

```bash
cd backend
npx prisma studio
```

Opens at: http://localhost:5555

---

## 🎯 Testing Features Locally

### Test Payment Verification

1. Create test users (or use existing 128 users)
2. Register for tournament
3. Upload payment screenshot
4. Login as admin
5. Go to Payment Verification page
6. Approve/reject payments
7. Check revenue dashboard updates

### Test Tournament Management

1. Login as admin
2. Create tournament
3. Add categories
4. Publish tournament
5. Register users
6. Generate draw
7. Create matches
8. Test scoring

### Test Match Scoring

1. Create tournament with matches
2. Assign umpire
3. Login as umpire
4. Go to match scoring page
5. Enter scores
6. Complete match
7. Verify results

---

## 📝 Important Notes

### Payment Formula (CRITICAL!)
```
Platform Fee: 5% of total revenue
First Payout: 30% of organizer share (95%)
Second Payout: 65% of organizer share (95%)

Example: ₹160,000 total
→ Platform: ₹8,000 (5%)
→ Organizer: ₹152,000 (95%)
→ First: ₹45,600 (30% of ₹152,000)
→ Second: ₹98,800 (65% of ₹152,000)
```

### Admin Account (NEVER DELETE!)
```
Email: ADMIN@gmail.com
Password: ADMIN@123(123)
```

### Firebase
- Disabled in development
- No Firebase setup needed locally
- Safe to ignore Firebase warnings

---

## 🚀 Ready for Production?

Once everything works perfectly on localhost:

1. ✅ All features tested
2. ✅ No console errors
3. ✅ Payment calculations correct
4. ✅ Admin dashboard working
5. ✅ Database operations successful

Then follow: **DEPLOYMENT_GUIDE_COMPLETE.md**

---

## 🆘 Need Help?

### Quick Fixes

**Reset Everything:**
```bash
# Backend
cd backend
rm -rf node_modules
npm install
npx prisma generate
npx prisma db push
node deploy.js
npm run dev

# Frontend
cd frontend
rm -rf node_modules
npm install
npm run dev
```

**Reset Database Only:**
```bash
cd backend
npx prisma db push --force-reset
node deploy.js
```

**Check Logs:**
- Backend: Terminal where `npm run dev` is running
- Frontend: Browser console (F12)
- Database: `npx prisma studio`

---

## ✅ Success Criteria

Your local setup is working when:

- ✅ Backend starts without errors
- ✅ Frontend starts without errors
- ✅ Can login as admin
- ✅ Admin dashboard loads
- ✅ Payment verification page works
- ✅ Revenue dashboard shows correct math
- ✅ Can create tournaments
- ✅ Database operations work
- ✅ No CORS errors
- ✅ No console errors

---

## 🎉 You're Ready!

Follow the steps above and your local development environment will be running perfectly in ~5 minutes!

Happy coding! 🚀
