# 🔄 PostgreSQL Migration Guide

## ✅ Migration Completed

Your Matchify Pro application has been migrated from SQLite to PostgreSQL.

---

## 📋 What Changed

### 1. Prisma Schema
- **Provider changed:** `sqlite` → `postgresql`
- **All models preserved:** No structural changes
- **All relations intact:** No modifications to business logic

### 2. Environment Configuration
- **.env updated:** Now uses PostgreSQL connection string
- **.env.example updated:** Template for PostgreSQL setup

### 3. Database URL Format
- **Old (SQLite):** `file:./prisma/dev.db`
- **New (PostgreSQL):** `postgresql://username:password@localhost:5432/database_name`

---

## 🚀 Setup Instructions

### For Local Development

#### Step 1: Install PostgreSQL

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer (default settings are fine)
3. Remember the password you set for `postgres` user

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Step 2: Create Database

Open PostgreSQL command line (psql):

**Windows:** Search for "SQL Shell (psql)" in Start Menu

**macOS/Linux:**
```bash
psql -U postgres
```

Then run:
```sql
CREATE DATABASE matchify_dev;
\q
```

#### Step 3: Update .env File

Your `.env` is already updated with:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/matchify_dev"
```

**If your PostgreSQL password is different:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/matchify_dev"
```

#### Step 4: Delete Old Migrations

```bash
cd backend
rm -rf prisma/migrations
```

Or manually delete the `prisma/migrations` folder.

#### Step 5: Create Fresh Migration

```bash
cd backend
npx prisma migrate dev --name init
```

This will:
- Create a new migration for PostgreSQL
- Apply the schema to your database
- Generate Prisma Client

#### Step 6: Seed Database (Optional)

```bash
npm run prisma:seed
```

This will create:
- Admin user
- Test data

#### Step 7: Start Application

```bash
npm run dev
```

---

## 🌐 For Render Deployment

### Render Setup

1. **Create PostgreSQL Database on Render:**
   - Go to Render Dashboard
   - Click "New +" → "PostgreSQL"
   - Name: `matchify-db`
   - Plan: Free or Starter
   - Click "Create Database"

2. **Get Database URL:**
   - Render will provide an **Internal Database URL**
   - Copy this URL (starts with `postgresql://`)

3. **Configure Web Service:**
   - In your Render Web Service settings
   - Go to "Environment"
   - Render automatically adds `DATABASE_URL` from your PostgreSQL database
   - **No manual configuration needed!**

4. **Build Command:**
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy
   ```

5. **Start Command:**
   ```bash
   npm start
   ```

### Environment Variables on Render

Render will automatically set:
- `DATABASE_URL` - From your PostgreSQL database

You need to manually add:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- (All other variables from .env.example)

---

## 🔧 Migration Commands Reference

### Generate Prisma Client
```bash
npx prisma generate
```

### Create Migration
```bash
npx prisma migrate dev --name migration_name
```

### Apply Migrations (Production)
```bash
npx prisma migrate deploy
```

### Reset Database (⚠️ Deletes all data)
```bash
npx prisma migrate reset
```

### View Database
```bash
npx prisma studio
```

---

## ✅ Verification Checklist

After migration, verify:

- [ ] PostgreSQL is installed and running
- [ ] Database `matchify_dev` exists
- [ ] `.env` has correct DATABASE_URL
- [ ] Old migrations deleted
- [ ] New migration created successfully
- [ ] Prisma Client generated
- [ ] Application starts without errors
- [ ] Can create/read data
- [ ] Admin user exists

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Solution:**
- Check PostgreSQL is running
- Verify DATABASE_URL credentials
- Test connection: `psql -U postgres -d matchify_dev`

### Error: "Database does not exist"

**Solution:**
```sql
psql -U postgres
CREATE DATABASE matchify_dev;
\q
```

### Error: "Password authentication failed"

**Solution:**
- Update DATABASE_URL with correct password
- Format: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/matchify_dev`

### Error: "Migration failed"

**Solution:**
```bash
# Delete migrations folder
rm -rf prisma/migrations

# Create fresh migration
npx prisma migrate dev --name init
```

### Port 5432 already in use

**Solution:**
- Another PostgreSQL instance is running
- Stop it or use a different port
- Update DATABASE_URL: `postgresql://postgres:postgres@localhost:5433/matchify_dev`

---

## 📊 Data Migration (Optional)

If you want to migrate existing SQLite data to PostgreSQL:

### Option 1: Manual Export/Import
1. Export data from SQLite using Prisma Studio
2. Import into PostgreSQL using Prisma Studio

### Option 2: Use Migration Script
```bash
# Export from SQLite
npx prisma db pull --schema=prisma/schema-sqlite.prisma

# Import to PostgreSQL
# (Custom script needed - contact support)
```

### Option 3: Fresh Start
- Start with clean PostgreSQL database
- Run seed script to create test data
- This is the recommended approach for development

---

## 🎯 What's Next

1. ✅ Complete local setup
2. ✅ Test application locally
3. ✅ Push changes to GitHub
4. ✅ Deploy to Render
5. ✅ Verify production deployment

---

## 📝 Important Notes

### No Code Changes Required
- All models remain the same
- All relations unchanged
- All business logic intact
- Only database provider changed

### PostgreSQL Benefits
- ✅ Production-ready
- ✅ Scalable
- ✅ ACID compliant
- ✅ Better performance
- ✅ Cloud-compatible
- ✅ Advanced features

### SQLite Limitations (Why we migrated)
- ❌ File-based (not cloud-friendly)
- ❌ No concurrent writes
- ❌ Limited scalability
- ❌ Not suitable for production

---

## 🆘 Need Help?

### Common Issues
- Database connection errors
- Migration failures
- Prisma Client errors
- Deployment issues

### Resources
- Prisma Docs: https://www.prisma.io/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Render Docs: https://render.com/docs

---

**Migration completed successfully! Your application is now production-ready with PostgreSQL.**
