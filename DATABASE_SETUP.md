# 🗄️ DATABASE SETUP GUIDE

## ✅ What's Ready (Day 2-3 Complete)

- [x] Prisma schema created with all 12 tables
- [x] Seed script ready with 5 test users + 2 tournaments
- [x] Test queries script ready
- [x] Environment variables configured

## 🚀 Next Steps: Choose Your Database

### Option 1: Railway PostgreSQL (Recommended)

1. **Go to Railway.app**
   ```
   https://railway.app
   ```

2. **Create New Project**
   - Click "New Project"
   - Select "Provision PostgreSQL"
   - Wait for deployment

3. **Get Database URL**
   - Click on PostgreSQL service
   - Go to "Variables" tab
   - Copy the `DATABASE_URL`

4. **Update .env file**
   ```bash
   # Replace this line in backend/.env:
   DATABASE_URL="your-railway-postgresql-url-here"
   ```

5. **Run Migration**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

6. **Seed Database**
   ```bash
   npx prisma db seed
   ```

### Option 2: Local PostgreSQL

1. **Install PostgreSQL**
   - Windows: Download from postgresql.org
   - Mac: `brew install postgresql`
   - Linux: `sudo apt install postgresql`

2. **Create Database**
   ```sql
   createdb matchify
   ```

3. **Update .env**
   ```
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/matchify?schema=public"
   ```

4. **Run Migration & Seed**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

## 🧪 Test Your Database

After setting up, run:

```bash
node test-db.js
```

Expected output:
```
🧪 Testing database queries...

✅ Total users: 5
   Users: Rajesh Kumar (PLAYER), Priya Sharma (PLAYER), Amit Patel (ORGANIZER), Suresh Reddy (UMPIRE), Admin User (ADMIN)

✅ Total tournaments: 2
   Tournament 1: Bangalore Open Badminton Championship 2025
   Organizer: Amit Patel
   Categories: 3

✅ Total transactions: 2
   Rajesh Kumar: TOPUP ₹1000
   Priya Sharma: TOPUP ₹2000

✅ Player stats:
   Rajesh Kumar: 450 pts, ₹1000 wallet
   Priya Sharma: 320 pts, ₹2000 wallet

🎉 All database tests passed!
```

## 📊 Database Schema Overview

### 12 Tables Created:

1. **Users** - Players, organizers, umpires, admins
2. **Tournaments** - Tournament information
3. **TournamentPosters** - Tournament images
4. **Categories** - Singles/doubles categories
5. **Registrations** - Tournament registrations
6. **WalletTransactions** - Payment history
7. **Draws** - Seeding information
8. **Matches** - Match details and scores
9. **MatchifyPointsLog** - Points tracking
10. **Notifications** - User notifications
11. **AdminInvites** - Admin invitation system
12. **AuditLogs** - Admin action logs

## 🎯 Test Data Included

- **5 Users**: 2 players, 1 organizer, 1 umpire, 1 admin
- **2 Tournaments**: Bangalore Open & Mumbai Masters
- **3 Categories**: Men's Singles, Women's Singles, Men's Doubles
- **2 Wallet Transactions**: ₹1000 and ₹2000 top-ups

## 🔧 Useful Commands

```bash
# Generate Prisma client
npx prisma generate

# View database in browser
npx prisma studio

# Reset database (careful!)
npx prisma migrate reset

# Deploy to production
npx prisma migrate deploy
```

## 🎉 Day 2-3 Complete!

Your database foundation is solid. Tomorrow (Day 4) we'll build authentication on top of this schema.