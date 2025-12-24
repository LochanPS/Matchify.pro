# 🎾 MATCHIFY - Badminton Tournament Platform

**India's Premier Badminton Tournament Management System**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run prisma:generate
npm run prisma:migrate
npm run dev
```
**Backend runs on:** http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
**Frontend runs on:** http://localhost:5173

## 📁 Project Structure

```
matchify/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express server
│   │   ├── routes/            # API routes
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, validation
│   │   ├── services/          # Business logic
│   │   └── utils/             # Helper functions
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js            # Test data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Route pages
│   │   ├── context/           # React Context
│   │   ├── utils/             # API calls, helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## 🎯 Day 1 Completion Checklist

- [x] Project structure created
- [x] Backend initialized (Express + Node.js)
- [x] Frontend initialized (React + Vite + Tailwind)
- [x] ESLint + Prettier configured
- [x] Environment variables template created
- [x] Basic server running
- [x] Basic frontend UI visible
- [x] Railway account ready (for database)
- [x] Vercel account ready (for frontend deployment)

## 🔥 What's Next? (Day 2-3)

- Create Prisma schema (all 12 tables)
- Set up PostgreSQL on Railway
- Run initial database migration
- Seed test data

## 📚 Tech Stack

**Backend:**
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Razorpay (Payments)
- Cloudinary (Images)

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

**Deployment:**
- Railway (Backend + DB)
- Vercel (Frontend)

## 🤝 Contributing

This is a solo project with AI assistance. Not accepting contributions at this time.

## 📄 License

MIT License - Built for the Indian Badminton Community

---

**Built with ❤️ for Indian Badminton Players**