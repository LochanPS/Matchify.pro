import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables first
dotenv.config();
// Birth year feature + Database migration deployed - v1.4

// Validate environment variables before starting server (only in non-Vercel environments)
// Vercel serverless functions don't have a traditional startup, so we skip validation there
if (!process.env.VERCEL) {
  try {
    const { validateEnvironment } = await import('./utils/validateEnv.js');
    validateEnvironment();
  } catch (error) {
    console.warn('⚠️ Environment validation skipped:', error.message);
  }
}

// Import getEnvironmentStatus for health check
let getEnvironmentStatus;
try {
  const envModule = await import('./utils/validateEnv.js');
  getEnvironmentStatus = envModule.getEnvironmentStatus;
} catch (error) {
  console.warn('⚠️ Environment status check unavailable');
  getEnvironmentStatus = () => ({ configured: [], missing: [], warnings: [] });
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('✅ Cloudinary configured:', process.env.CLOUDINARY_CLOUD_NAME);

// Import routes
import authRoutes from './routes/auth.js';
console.log('✅ Auth routes imported:', !!authRoutes);
console.log('✅ Auth routes type:', typeof authRoutes);
import profileRoutes from './routes/profile.js';
import walletRoutes from './routes/wallet.js';
import webhookRoutes from './routes/webhook.js';
import tournamentRoutes from './routes/tournament.routes.js';
import registrationRoutes from './routes/registration.routes.js';
import partnerRoutes from './routes/partner.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import organizerRoutes from './routes/organizer.routes.js';
import drawRoutes from './routes/draw.routes.js';
import matchRoutes from './routes/match.routes.js';
import pointsRoutes from './routes/points.routes.js';
// leaderboardRoutes removed - using direct routes in server.js instead
import adminRoutes from './routes/admin.routes.js';
import paymentSettingsRoutes from './routes/admin/payment-settings.routes.js';
import paymentVerificationRoutes from './routes/admin/payment-verification.routes.js';
import refundRequestsRoutes from './routes/refundRequests.routes.js';
import tournamentPaymentsRoutes from './routes/admin/tournament-payments.routes.js';
import revenueAnalyticsRoutes from './routes/admin/revenue-analytics.routes.js';
import tournamentManagementRoutes from './routes/admin/tournament-management.routes.js';
import deleteAllDataRoutes from './routes/admin/delete-all-data.routes.js';
import cleanPhoneNumbersRoutes from './routes/admin/clean-phone-numbers.routes.js';
import adminPaymentRoutes from './routes/adminPayment.routes.js';
import smsRoutes from './routes/sms.routes.js';
import academyRoutes from './routes/academy.routes.js';
import courtRoutes from './routes/court.routes.js';
import courtBookingRoutes from './routes/courtBooking.routes.js';
import userRoutes from './routes/user.routes.js';

// Import multi-role routes
// import multiRoleAuthRoutes from './routes/multiRoleAuth.routes.js';
// import multiRoleTournamentRoutes from './routes/multiRoleTournament.routes.js';
// import multiRoleMatchRoutes from './routes/multiRoleMatch.routes.js';

// Import middleware
import { authenticate, authorize } from './middleware/auth.js';
import { 
  sanitizeInput, 
  preventParameterPollution, 
  securityHeaders,
  validateTokenFormat,
  logSuspiciousActivity 
} from './middleware/security.js';

// Import services
import { initEmailService } from './services/email.service.js';
import { initializeSocket } from './services/socketService.js';
import { initRedis } from './services/redisService.js';
import { createServer } from 'http';
import prisma from './lib/prisma.js';

// Initialize email service
initEmailService();

// ============================================
// STARTUP DB MIGRATION — adds columns that may be missing
// from the live DB when schema was updated without db push.
// Safe to run on every cold-start: ADD COLUMN IF NOT EXISTS is idempotent.
// ============================================
async function runStartupMigrations() {
  try {
    const migrations = [
      // Password reset OTP fields (added in May 2026)
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetExpiry" TIMESTAMP(3)`,
      // Suspension fields
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMP(3)`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT`,
      // Alternate email
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "alternateEmail" TEXT`,
      // Birth year (added later)
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthYear" INTEGER`,
      // Blue tick verification fields
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerifiedOrganizer" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerifiedPlayer" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerifiedUmpire" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tournamentsRegistered" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "matchesUmpired" INTEGER NOT NULL DEFAULT 0`,
      // Umpire queue ordering on Match (added Jun 2026 — queueOrder)
      // CRITICAL: prisma generate regenerated client expecting this column;
      // without it ALL match.findMany() queries throw "column does not exist".
      `ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "queueOrder" INTEGER`,
      `CREATE INDEX IF NOT EXISTS "Match_queueOrder_idx" ON "Match"("queueOrder")`,
      // Multi-sport support (added Jun 2026 — sport). Existing tournaments → Badminton.
      `ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "sport" TEXT NOT NULL DEFAULT 'Badminton'`,
      `CREATE INDEX IF NOT EXISTS "Tournament_sport_idx" ON "Tournament"("sport")`,
      // Readable share-URL slugs (added Jun 2026). Backfilled below.
      `ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "slug" TEXT`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Tournament_slug_key" ON "Tournament"("slug")`,
      `ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "slug" TEXT`,
      // Venue map location (added Jul 2026) — optional lat/lng pin + label.
      `ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION`,
      `ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION`,
      `ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "locationName" TEXT`,
    ];

    for (const sql of migrations) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (err) {
        // Log but don't crash — column may already exist (older postgres) or other non-fatal error
        if (!err.message?.includes('already exists')) {
          console.warn(`⚠️ Migration warning: ${err.message?.split('\n')[0]}`);
        }
      }
    }
    console.log('✅ Startup DB migrations complete');

    // Backfill readable slugs for any tournaments/categories created before slugs existed.
    const { backfillSlugs } = await import('./utils/slug.js');
    await backfillSlugs();
  } catch (err) {
    console.error('❌ Startup migration failed:', err.message);
    // Non-fatal — app still starts, individual queries may fail
  }
}

// Run migrations BEFORE server starts — blocking is intentional.
// Column must exist before any request hits Prisma.
await runStartupMigrations();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Trust proxy - Required for Vercel deployment
app.set('trust proxy', 1);

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
  FRONTEND_URL,
  'https://matchify.pro',
  'https://www.matchify.pro',
  'https://matchify-pro.vercel.app',
  'https://matchify.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  process.env.CORS_ORIGIN
].filter(Boolean);

// Regex patterns for dynamic origins — scoped to matchify only
const allowedOriginPatterns = [
  /^https:\/\/matchify(-pro)?(-[a-z0-9]+)?(-destroyerforevers-projects)?\.vercel\.app$/,  // Matchify Vercel preview deployments only
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin matches any allowed pattern
    const isAllowedPattern = allowedOriginPatterns.some(pattern => pattern.test(origin));
    if (isAllowedPattern) {
      return callback(null, true);
    }
    
    console.warn('⚠️ CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// express-rate-limit v8: trustProxy removed (use app.set instead), ipKeyGenerator for IPv6
import { ipKeyGenerator } from 'express-rate-limit';
app.set('trust proxy', 1); // Trust first proxy (Railway/Vercel)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '::1'),
});

app.use(limiter);

app.use(securityHeaders);
app.use(sanitizeInput);
app.use(preventParameterPollution);
app.use(validateTokenFormat);
app.use(logSuspiciousActivity);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => ipKeyGenerator(req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '::1'),
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many admin requests from this IP, please try again later.',
  keyGenerator: (req) => ipKeyGenerator(req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '::1'),
});

// Static file serving for uploads
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware — 'dev' in dev (coloured), 'tiny' in prod (minimal overhead)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('tiny'));
}

// ============================================
// ROUTES
// ============================================

// Webhook routes BEFORE body parser (needs raw body)
app.use('/api/webhooks', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API Health check endpoint — no sensitive config details exposed
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'MATCHIFY.PRO API is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.1',
  });
});

// Debug endpoint removed — was public with no auth, exposed full route map to attackers

// Root endpoint — prevents 404 on GET /
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Matchify.pro API' });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Matchify.pro API v1.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      profile: '/api/profile',
      wallet: '/api/wallet',
      webhooks: '/api/webhooks',
      tournaments: '/api/tournaments',
      registrations: '/api/registrations',
      partner: '/api/partner',
      notifications: '/api/notifications',
      matches: '/api/matches',
      users: '/api/users'
    },
    documentation: 'https://github.com/your-username/matchify.pro'
  });
});

// Auth routes — stricter rate limiting to prevent brute force
console.log('🔧 Mounting auth routes at /api/auth');
app.use('/api/auth', authLimiter, authRoutes);
console.log('✅ Auth routes mounted');
// app.use('/api/multi-auth', authLimiter, multiRoleAuthRoutes);

// Profile routes
app.use('/api/profile', profileRoutes);

// Wallet routes
app.use('/api/wallet', walletRoutes);

// Draw routes - MUST BE BEFORE TOURNAMENT ROUTES to avoid middleware conflicts
app.use('/api', drawRoutes);

// Tournament routes (both old and new multi-role)
app.use('/api/tournaments', tournamentRoutes);

// Registration routes
app.use('/api/registrations', registrationRoutes);

// Partner routes
app.use('/api/partner', partnerRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Organizer routes
app.use('/api/organizer', organizerRoutes);

// Admin sub-routes (MUST BE BEFORE main admin routes for specificity)
// All admin routes share the strict rate limiter
app.use('/api/admin/payment', adminLimiter, adminPaymentRoutes);
app.use('/api/admin/payment-settings', adminLimiter, paymentSettingsRoutes);
app.use('/api/admin/payment-verifications', adminLimiter, paymentVerificationRoutes);
app.use('/api/admin/refund-requests', adminLimiter, refundRequestsRoutes);
app.use('/api/admin/tournament-payments', adminLimiter, tournamentPaymentsRoutes);
app.use('/api/admin/revenue', adminLimiter, revenueAnalyticsRoutes);
app.use('/api/admin/tournament-management', adminLimiter, tournamentManagementRoutes);
app.use('/api/admin', adminLimiter, deleteAllDataRoutes);
app.use('/api/admin', adminLimiter, cleanPhoneNumbersRoutes);

// Admin routes (general - must be AFTER specific routes)
app.use('/api/admin', adminLimiter, adminRoutes);

// SMS routes
app.use('/api/sms', smsRoutes);

// Academy routes
app.use('/api/academies', academyRoutes);

// Court routes (owner management + public slots)
app.use('/api', courtRoutes);

// Court booking routes
app.use('/api/court-bookings', courtBookingRoutes);

// User routes
app.use('/api/users', userRoutes);


// ============================================
// LEADERBOARD ROUTES (MUST BE BEFORE MATCH ROUTES)
// ============================================
// My rank endpoint (specific route first)
app.get('/api/leaderboard/my-rank', authenticate, async (req, res) => {
  console.log('🎯 MY RANK ROUTE HIT');
  try {
    const userId = req.user.userId || req.user.id;
    const tournamentPointsService = (await import('./services/tournamentPoints.service.js')).default;
    const playerRanks = await tournamentPointsService.getPlayerRankWithGeo(userId);
    
    if (!playerRanks) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    res.json({
      success: true,
      ranks: playerRanks
    });
  } catch (error) {
    console.error('Get player rank error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player rank'
    });
  }
});

// General leaderboard endpoint (NO AUTHENTICATION REQUIRED - PUBLIC)
app.get('/api/leaderboard', async (req, res) => {
  console.log('🎯🎯🎯 DIRECT LEADERBOARD ROUTE HIT!');
  console.log('Query params:', req.query);
  
  try {
    const { limit = 100, scope = 'country', city, state } = req.query;
    
    console.log('Calling getLeaderboard with:', { limit, scope, city, state });
    
    // Import the service
    const tournamentPointsService = (await import('./services/tournamentPoints.service.js')).default;
    
    const leaderboard = await tournamentPointsService.getLeaderboard(
      parseInt(limit),
      scope,
      city,
      state
    );
    
    console.log(`✅ Leaderboard fetched: ${leaderboard.length} players`);
    
    res.json({
      success: true,
      leaderboard,
      total: leaderboard.length,
      scope,
      filters: { city, state }
    });
  } catch (error) {
    console.error('❌ Direct leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Match routes (both old and new multi-role)
app.use('/api', matchRoutes);  // For tournament-related match routes
app.use('/api/matches', matchRoutes);  // For /matches/:matchId routes
// app.use('/api/multi-matches', multiRoleMatchRoutes);

// Points routes (after leaderboard)
app.use('/api', pointsRoutes);

// Test routes for authentication

// Test protected route
app.get('/api/test/protected', authenticate, (req, res) => {
  res.json({
    message: 'Access granted! You are authenticated.',
    user: req.user
  });
});

// Test role-based route
app.get('/api/test/player-only', 
  authenticate, 
  authorize('PLAYER'), 
  (req, res) => {
    res.json({
      message: 'Player-only content accessed successfully!',
      user: req.user
    });
  }
);

// Test organizer-only route
app.get('/api/test/organizer-only', 
  authenticate, 
  authorize('ORGANIZER'), 
  (req, res) => {
    res.json({
      message: 'Organizer-only content accessed successfully!',
      user: req.user
    });
  }
);

// Test admin-only route
app.get('/api/test/admin-only', 
  authenticate, 
  authorize('ADMIN'), 
  (req, res) => {
    res.json({
      message: 'Admin-only content accessed successfully!',
      user: req.user
    });
  }
);

// API routes (will be added in later days)
// app.use('/api/tournaments', tournamentRoutes);
// app.use('/api/registrations', registrationRoutes);
// app.use('/api/matches', matchRoutes);
// app.use('/api/users', userRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER STARTUP
// ============================================

// On Vercel: skip HTTP server + Socket.IO (serverless — no persistent connections)
// On Render/local: start normally with Socket.IO
if (!process.env.VERCEL) {
  const httpServer = createServer(app);

  // Init Redis first, then Socket.IO (Redis adapter needs to be ready)
  await initRedis();
  const io = await initializeSocket(httpServer);
  console.log('✅ Socket.IO initialized');

  httpServer.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════╗');
    console.log('║      Matchify.pro SERVER STARTED 🎾      ║');
    console.log('╠═══════════════════════════════════════╣');
    console.log(`║  Port: ${PORT.toString().padEnd(28)} ║`);
    console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(20)} ║`);
    console.log(`║  Frontend: ${FRONTEND_URL.padEnd(21)} ║`);
    console.log('║  WebSocket: ✅ Enabled                ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log('');
    console.log('🚀 Ready to serve badminton tournaments!');
    console.log('📊 Health check: http://localhost:' + PORT + '/health');
    console.log('🔗 API docs: http://localhost:' + PORT + '/api');
    console.log('🔴 WebSocket: ws://localhost:' + PORT);
    console.log('');
  });
}

// ============================================
// DATA CLEANUP — runs on startup + every 24h
// Deletes notifications older than 60 days
// ============================================
const runCleanup = async () => {
  try {
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
    const { count } = await prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } }
    });
    if (count > 0) console.log(`🧹 Cleanup: deleted ${count} notifications older than 60 days`);
  } catch (err) {
    console.error('⚠️ Cleanup job failed:', err.message);
  }
};

// Run once on startup, then every 24 hours
runCleanup();
setInterval(runCleanup, 24 * 60 * 60 * 1000);

export default app;
