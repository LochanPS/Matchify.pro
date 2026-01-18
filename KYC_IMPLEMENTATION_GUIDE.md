# KYC System Implementation Guide

## Overview
Fast 2-5 minute KYC verification for tournament organizers using video calls.

## Status: 🚧 IN PROGRESS

### ✅ Completed
- [x] Database schema added
- [ ] Database migration run
- [ ] Backend APIs created
- [ ] Daily.co integration
- [ ] Socket.IO setup
- [ ] Frontend organizer pages
- [ ] Frontend admin dashboard
- [ ] Email notifications
- [ ] Testing

## Next Steps

### 1. Run Database Migration
```bash
cd matchify/backend
npx prisma db push
npx prisma generate
```

### 2. Get Daily.co API Key
1. Sign up at https://daily.co (free tier)
2. Get API key from Dashboard → Developers
3. Add to `.env`:
```env
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=yourcompany.daily.co
```

### 3. Install Dependencies
```bash
# Backend
cd matchify/backend
npm install socket.io

# Frontend
cd matchify/frontend
npm install socket.io-client
```

## Implementation Timeline

**Total: 3-4 days**

- Day 1: Backend APIs + Daily.co (6-8 hours)
- Day 2: Frontend Organizer (6-8 hours)
- Day 3: Frontend Admin + Socket.IO (6-8 hours)
- Day 4: Testing + Polish (4-6 hours)

## Files to Create

### Backend
- `src/routes/kyc.routes.js` - Organizer KYC endpoints
- `src/routes/admin-kyc.routes.js` - Admin KYC endpoints
- `src/controllers/kyc.controller.js` - KYC logic
- `src/middleware/requireKYC.js` - Tournament protection
- `src/utils/daily.js` - Daily.co integration
- `src/utils/kyc-email.js` - Email notifications

### Frontend
- `src/pages/organizer/KYCSubmission.jsx` - Upload Aadhaar
- `src/pages/organizer/VideoCallPage.jsx` - Video verification
- `src/pages/admin/KYCDashboard.jsx` - Admin KYC management
- `src/api/kyc.js` - API client functions
- `src/hooks/useSocket.js` - Socket.IO hook

## Environment Variables Needed

### Backend (.env)
```env
DAILY_API_KEY=your_daily_api_key
DAILY_DOMAIN=yourcompany.daily.co
```

### Frontend (.env)
```env
VITE_SOCKET_URL=http://localhost:5000
```

## User Flow

### Organizer
1. Sign up → Try to create tournament → Blocked
2. Redirect to KYC submission
3. Upload Aadhaar (30 sec)
4. Request video call (30 sec)
5. Video verification with admin (2-3 min)
6. Instant approval → Create tournaments

### Admin
1. Toggle "Available for KYC"
2. Receive notification when organizer requests call
3. Join video call
4. View Aadhaar side-by-side with video
5. Approve/Reject during call
6. Organizer can create tournaments immediately

## Testing Checklist

### Backend
- [ ] POST /api/kyc/submit - Upload Aadhaar
- [ ] POST /api/kyc/request-call - Create video room
- [ ] GET /api/kyc/status - Get KYC status
- [ ] POST /api/admin/kyc/approve/:id - Approve KYC
- [ ] POST /api/admin/kyc/reject/:id - Reject KYC
- [ ] GET /api/admin/kyc/pending - List pending KYCs
- [ ] PUT /api/admin/availability - Toggle availability

### Frontend
- [ ] Upload Aadhaar with preview
- [ ] Request video call
- [ ] Daily.co iframe loads
- [ ] Admin receives Socket.IO notification
- [ ] Admin can approve/reject
- [ ] Organizer sees result
- [ ] Tournament creation blocked without KYC
- [ ] Tournament creation allowed with KYC

## Security Measures
- Rate limiting on KYC submissions (3 per hour)
- File type validation (jpg, png, pdf only)
- File size limit (5MB)
- KYC belongs to requesting organizer
- Admin-only approval/rejection
- Expired room cleanup (cron job)

## Performance Optimizations
- Database indexes on organizerId, status
- Lazy load Daily.co iframe
- Clean up expired rooms hourly
- Socket.IO connection pooling

## Deployment Notes

### Render (Backend)
Add environment variables:
- DAILY_API_KEY
- DAILY_DOMAIN

### Vercel (Frontend)
Add environment variables:
- VITE_SOCKET_URL (production backend URL)

---

**Ready to continue implementation!**
