# ⚡ Matchify.pro - Quick Reference Guide

## 🎯 What You Need to Know

### Project Type
Full-stack badminton tournament management platform

### Tech Stack
- **Backend**: Node.js + Express + PostgreSQL + Prisma
- **Frontend**: React + Vite + Tailwind CSS
- **Deployment**: Vercel (Frontend + Backend)

---

## 📂 Project Structure

```
Matchify.pro/
├── backend/          # Node.js API (Port 5000)
│   ├── src/         # Source code
│   ├── prisma/      # Database schema
│   └── api/         # Vercel serverless entry
│
└── frontend/        # React app (Port 5173)
    ├── src/         # Source code
    └── public/      # Static files
```

---

## 🚀 Local Development

### Start Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Database Setup
```bash
cd backend
npx prisma generate
npx prisma migrate dev
npx prisma studio  # Open database GUI
```

---

## 🌐 Deploy to Vercel

### Backend Deployment
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import GitHub repo
3. **Root Directory**: `backend`
4. Add environment variables (see below)
5. Deploy

### Frontend Deployment
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import GitHub repo
3. **Root Directory**: `frontend`
4. Add environment variables (see below)
5. Deploy

---

## 🔐 Environment Variables

### Backend (Vercel)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENDGRID_API_KEY=...
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.vercel.app/api
VITE_RAZORPAY_KEY_ID=...
```

---

## 📋 Key API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Tournaments
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/:id` - Get tournament details
- `PUT /api/tournaments/:id` - Update tournament

### Matches
- `GET /api/matches` - List matches
- `PUT /api/matches/:id/score` - Update match score
- `GET /api/matches/:id` - Get match details

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/leaderboard` - Get leaderboard

---

## 🗄️ Database Tables

- **User** - Users (players, organizers, umpires, admins)
- **Tournament** - Tournament details
- **Category** - Tournament categories
- **Registration** - Player registrations
- **Match** - Match details and scores
- **Draw** - Tournament brackets
- **Payment** - Payment records
- **Notification** - User notifications

---

## 🎮 User Roles

1. **Player** - Register, play, view stats
2. **Organizer** - Create tournaments, manage
3. **Umpire** - Score matches
4. **Admin** - Full system access

---

## 🔧 Common Commands

### Git
```bash
git add .
git commit -m "message"
git push origin main
```

### Database
```bash
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations (dev)
npx prisma migrate deploy # Run migrations (prod)
npx prisma studio        # Open database GUI
```

### Vercel
```bash
npm install -g vercel    # Install CLI
vercel login             # Login
vercel --prod            # Deploy to production
vercel logs              # View logs
```

---

## 📚 Documentation Files

1. **README.md** - Quick start guide
2. **ARCHITECTURE.md** - System architecture
3. **DEPLOYMENT_GUIDE_COMPLETE.md** - Full deployment guide
4. **VERCEL_DEPLOYMENT_STEPS.md** - Step-by-step Vercel
5. **PROJECT_SUMMARY.md** - Project overview
6. **QUICK_REFERENCE.md** - This file

---

## 🐛 Troubleshooting

### Backend won't start
- Check `DATABASE_URL` is correct
- Run `npm install`
- Check port 5000 is free

### Frontend won't start
- Run `npm install`
- Check `VITE_API_URL` in `.env`
- Check port 5173 is free

### Database errors
- Run `npx prisma generate`
- Run `npx prisma migrate dev`
- Check PostgreSQL is running

### CORS errors
- Update `CORS_ORIGIN` in backend
- Ensure URLs match exactly
- Redeploy backend

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] Database created and connected
- [ ] Environment variables set
- [ ] CORS configured correctly
- [ ] Database migrations run
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test tournament creation

---

## 🎯 Quick Links

- **GitHub**: https://github.com/LochanPS/Matchify.pro
- **Vercel**: https://vercel.com
- **Prisma Docs**: https://www.prisma.io/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com

---

## 📞 Need Help?

1. Check documentation files
2. Review Vercel logs
3. Test locally first
4. Check environment variables
5. Verify database connection

---

**Built with ❤️ for Indian Badminton Community**
