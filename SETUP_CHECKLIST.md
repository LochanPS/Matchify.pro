# 📋 PostgreSQL Setup Checklist

## Quick Setup Guide

Follow these steps in order to complete the PostgreSQL migration:

---

## ✅ Step 1: Install PostgreSQL

### Windows
- [ ] Download PostgreSQL from https://www.postgresql.org/download/windows/
- [ ] Run installer (keep default settings)
- [ ] Set password for `postgres` user (remember this!)
- [ ] Verify installation: Open "SQL Shell (psql)" from Start Menu

### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Linux
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## ✅ Step 2: Create Database

Open PostgreSQL command line:

**Windows:** Search "SQL Shell (psql)" in Start Menu

**macOS/Linux:**
```bash
psql -U postgres
```

Then run:
```sql
CREATE DATABASE matchify_dev;
\q
```

---

## ✅ Step 3: Update Environment

Check your `backend/.env` file:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/matchify_dev"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

---

## ✅ Step 4: Delete Old Migrations

```bash
cd backend
```

**Windows:**
```bash
rmdir /s /q prisma\migrations
```

**macOS/Linux:**
```bash
rm -rf prisma/migrations
```

---

## ✅ Step 5: Run Setup

### Option A: Automated (Windows)
```bash
setup-postgresql.bat
```

### Option B: Manual
```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Seed database (optional)
npm run prisma:seed
```

---

## ✅ Step 6: Verify Setup

```bash
# View database
npx prisma studio
```

This should open a browser showing your database tables.

---

## ✅ Step 7: Start Application

```bash
npm run dev
```

Expected output:
```
✅ Cloudinary configured
✅ Socket.IO initialized
╔═══════════════════════════════════════╗
║   Matchify.pro SERVER STARTED 🎾      ║
╠═══════════════════════════════════════╣
║  Port: 5000                           ║
║  Environment: development             ║
║  Frontend: http://localhost:5173      ║
║  WebSocket: ✅ Enabled                ║
╚═══════════════════════════════════════╝
```

---

## 🐛 Common Issues

### Issue: "Can't reach database server"
**Solution:**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Test connection: `psql -U postgres -d matchify_dev`

### Issue: "Database does not exist"
**Solution:**
```sql
psql -U postgres
CREATE DATABASE matchify_dev;
\q
```

### Issue: "Password authentication failed"
**Solution:**
- Update DATABASE_URL with correct password
- Format: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/matchify_dev`

### Issue: "Migration failed"
**Solution:**
```bash
# Delete migrations
rm -rf prisma/migrations

# Try again
npx prisma migrate dev --name init
```

---

## 📚 Need More Help?

See detailed documentation:
- `POSTGRESQL_MIGRATION_GUIDE.md` - Complete guide
- `MIGRATION_COMPLETE.md` - What changed
- Prisma Docs: https://www.prisma.io/docs

---

## ✅ Final Checklist

Before considering setup complete:

- [ ] PostgreSQL installed and running
- [ ] Database `matchify_dev` created
- [ ] `.env` has correct DATABASE_URL
- [ ] Old migrations deleted
- [ ] New migration created successfully
- [ ] Prisma Client generated
- [ ] Database seeded (optional)
- [ ] Application starts without errors
- [ ] Can access http://localhost:5000/health
- [ ] Prisma Studio shows tables

---

**Once all checkboxes are complete, your PostgreSQL setup is done!**

Next: Start the frontend and test the full application.
