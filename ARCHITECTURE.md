# 🏗️ Matchify.pro Architecture

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React Frontend (Vite + Tailwind CSS)         │   │
│  │  - Player Dashboard    - Organizer Dashboard         │   │
│  │  - Admin Panel         - Tournament Pages            │   │
│  │  - Live Match Tracking - Leaderboards                │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↕ HTTPS                           │
└─────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Express.js Backend (Node.js)                 │   │
│  │  - REST API Endpoints  - JWT Authentication          │   │
│  │  - WebSocket (Socket.io) - Rate Limiting             │   │
│  │  - Middleware Stack    - Error Handling              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                     │
│  ┌──────────────┬──────────────┬──────────────┬─────────┐   │
│  │ Controllers  │  Services    │  Validators  │ Utils   │   │
│  │              │              │              │         │   │
│  │ - Auth       │ - Tournament │ - Input      │ - Email │   │
│  │ - Tournament │ - Match      │ - Schema     │ - SMS   │   │
│  │ - Match      │ - Payment    │ - Rules      │ - Image │   │
│  │ - User       │ - Scoring    │              │         │   │
│  └──────────────┴──────────────┴──────────────┴─────────┘   │
└─────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Prisma ORM (Type-Safe)                  │   │
│  │  - Schema Definition  - Query Builder                │   │
│  │  - Migrations         - Relations                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                     │   │
│  │  - Users          - Tournaments    - Matches         │   │
│  │  - Registrations  - Payments       - Notifications   │   │
│  │  - Leaderboards   - Categories     - Draws           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌──────────────┬──────────────┬──────────────┬─────────┐   │
│  │  Razorpay    │  Cloudinary  │  SendGrid    │ Twilio  │   │
│  │  (Payments)  │  (Images)    │  (Email)     │ (SMS)   │   │
│  └──────────────┴──────────────┴──────────────┴─────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. User Registration Flow
```
User → Frontend → POST /api/auth/register → Backend
                                           ↓
                                    Validate Input
                                           ↓
                                    Hash Password
                                           ↓
                                    Save to Database
                                           ↓
                                    Send OTP (Email/SMS)
                                           ↓
                                    Return JWT Token
                                           ↓
Frontend ← Response ← Backend
```

### 2. Tournament Creation Flow
```
Organizer → Frontend → POST /api/tournaments → Backend
                                              ↓
                                       Check Auth (JWT)
                                              ↓
                                       Validate Data
                                              ↓
                                       Upload Images (Cloudinary)
                                              ↓
                                       Create Tournament (DB)
                                              ↓
                                       Return Tournament Data
                                              ↓
Frontend ← Response ← Backend
```

### 3. Match Scoring Flow
```
Umpire → Frontend → PUT /api/matches/:id/score → Backend
                                                ↓
                                         Check Auth
                                                ↓
                                         Validate Score
                                                ↓
                                         Update Match (DB)
                                                ↓
                                         Calculate Points
                                                ↓
                                         Update Leaderboard
                                                ↓
                                         Emit WebSocket Event
                                                ↓
Frontend ← Real-time Update ← Socket.io ← Backend
```

---

## 📂 Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── server.js              # Entry point
│   ├── config/                # Configuration files
│   │   ├── database.js        # DB connection
│   │   ├── cloudinary.js      # Image upload config
│   │   └── razorpay.js        # Payment config
│   ├── routes/                # API routes
│   │   ├── auth.routes.js     # Authentication
│   │   ├── tournament.routes.js
│   │   ├── match.routes.js
│   │   ├── user.routes.js
│   │   └── admin.routes.js
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.js
│   │   ├── tournament.controller.js
│   │   ├── match.controller.js
│   │   └── user.controller.js
│   ├── services/              # Business logic
│   │   ├── tournament.service.js
│   │   ├── match.service.js
│   │   ├── payment.service.js
│   │   └── notification.service.js
│   ├── middleware/            # Express middleware
│   │   ├── auth.middleware.js # JWT verification
│   │   ├── validate.middleware.js
│   │   └── error.middleware.js
│   ├── utils/                 # Helper functions
│   │   ├── email.js
│   │   ├── sms.js
│   │   └── upload.js
│   └── validators/            # Input validation
│       └── schemas.js
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Test data
└── package.json
```

### Frontend Structure
```
frontend/
├── src/
│   ├── main.jsx               # Entry point
│   ├── App.jsx                # Root component
│   ├── pages/                 # Route pages
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── TournamentDetails.jsx
│   │   ├── OrganizerDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── components/            # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── TournamentCard.jsx
│   │   ├── MatchCard.jsx
│   │   ├── Leaderboard.jsx
│   │   └── Modal.jsx
│   ├── contexts/              # React Context
│   │   ├── AuthContext.jsx    # User authentication
│   │   └── SocketContext.jsx  # WebSocket connection
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.js
│   │   └── useSocket.js
│   ├── utils/                 # Helper functions
│   │   ├── api.js             # Axios instance
│   │   ├── constants.js
│   │   └── helpers.js
│   └── services/              # API calls
│       ├── authService.js
│       ├── tournamentService.js
│       └── matchService.js
└── package.json
```

---

## 🗄️ Database Schema (Key Tables)

### Users
```
- id (UUID)
- name
- email
- phone
- password (hashed)
- roles (PLAYER, ORGANIZER, UMPIRE, ADMIN)
- playerCode
- umpireCode
- experienceLevel
- tournamentPoints
- createdAt
```

### Tournaments
```
- id (UUID)
- name
- description
- startDate
- endDate
- venue
- entryFee
- maxParticipants
- organizerId (FK → Users)
- status (DRAFT, PUBLISHED, ONGOING, COMPLETED)
- format (KNOCKOUT, ROUND_ROBIN, MIXED)
- createdAt
```

### Matches
```
- id (UUID)
- tournamentId (FK → Tournaments)
- categoryId (FK → Categories)
- player1Id (FK → Users)
- player2Id (FK → Users)
- umpireId (FK → Users)
- stage (ROUND_ROBIN, KNOCKOUT)
- round
- matchNumber
- scoreJson (JSON)
- status (PENDING, ONGOING, COMPLETED)
- winnerId (FK → Users)
- scheduledAt
- completedAt
```

### Registrations
```
- id (UUID)
- tournamentId (FK → Tournaments)
- userId (FK → Users)
- categoryId (FK → Categories)
- partnerId (FK → Users) [for doubles]
- status (PENDING, APPROVED, REJECTED)
- paymentStatus (PENDING, PAID, REFUNDED)
- registeredAt
```

---

## 🔐 Authentication Flow

1. **User Registration**
   - User submits email/phone + password
   - Backend hashes password with bcrypt
   - Generates unique player/umpire codes
   - Sends OTP for verification
   - Returns JWT token

2. **User Login**
   - User submits credentials
   - Backend verifies password
   - Generates JWT token (7 days expiry)
   - Returns token + user data

3. **Protected Routes**
   - Frontend sends JWT in Authorization header
   - Backend middleware verifies token
   - Extracts user info from token
   - Allows/denies access based on roles

---

## 🎮 Key Features & Flows

### Tournament Management
1. Organizer creates tournament
2. Sets categories, format, dates
3. Players register and pay
4. Organizer approves registrations
5. System generates draws/brackets
6. Matches are scheduled
7. Umpires score matches
8. Leaderboards update in real-time
9. Tournament completes
10. Points awarded to players

### Match Scoring
1. Umpire assigned to match
2. Umpire receives notification
3. Opens match scoring interface
4. Enters scores set-by-set
5. System validates scores
6. Match marked as completed
7. Winner advances (knockout)
8. Points calculated (round-robin)
9. Leaderboard updated
10. Players notified

### Payment Processing
1. Player registers for tournament
2. Razorpay payment gateway opens
3. Player completes payment
4. Webhook confirms payment
5. Registration status updated
6. Organizer receives 65%
7. Platform receives 30%
8. Admin receives 5%
9. Payment recorded in database

---

## 🚀 Deployment Architecture

### Production Setup
```
┌─────────────────────────────────────────┐
│         Vercel (Frontend)               │
│  - Static hosting                       │
│  - CDN distribution                     │
│  - Automatic HTTPS                      │
│  - Environment variables                │
└─────────────────────────────────────────┘
                  ↓ API Calls
┌─────────────────────────────────────────┐
│         Vercel (Backend)                │
│  - Serverless functions                 │
│  - Auto-scaling                         │
│  - Environment variables                │
│  - API routes                           │
└─────────────────────────────────────────┘
                  ↓ Database Queries
┌─────────────────────────────────────────┐
│      PostgreSQL Database                │
│  - Vercel Postgres / External           │
│  - Connection pooling                   │
│  - Automated backups                    │
│  - SSL connections                      │
└─────────────────────────────────────────┘
```

---

## 🔧 Technology Choices

### Why Node.js + Express?
- Fast, scalable, non-blocking I/O
- Large ecosystem (npm)
- JavaScript everywhere (frontend + backend)
- Great for real-time features (Socket.io)

### Why React?
- Component-based architecture
- Virtual DOM for performance
- Large community and ecosystem
- Easy state management

### Why PostgreSQL?
- ACID compliance
- Complex queries and relations
- JSON support for flexible data
- Reliable and battle-tested

### Why Prisma?
- Type-safe database access
- Auto-generated types
- Easy migrations
- Great developer experience

### Why Vercel?
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Serverless functions
- Great for Next.js/React/Node.js

---

## 📊 Performance Considerations

- **Database Indexing**: Key fields indexed for fast queries
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for session/leaderboard caching (future)
- **CDN**: Static assets served via Vercel CDN
- **Lazy Loading**: Frontend components loaded on demand
- **Pagination**: Large lists paginated
- **WebSocket**: Real-time updates without polling

---

## 🔒 Security Measures

- JWT tokens with expiration
- Password hashing (bcrypt)
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention (Prisma)
- XSS protection
- HTTPS only
- Environment variables for secrets

---

**Built with ❤️ for Indian Badminton Community**
