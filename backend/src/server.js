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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('✅ Cloudinary configured:', process.env.CLOUDINARY_CLOUD_NAME);

// Import routes
import authRoutes from './routes/auth.js';
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
import tournamentPaymentsRoutes from './routes/admin/tournament-payments.routes.js';
import revenueAnalyticsRoutes from './routes/admin/revenue-analytics.routes.js';
import tournamentManagementRoutes from './routes/admin/tournament-management.routes.js';
import deleteAllDataRoutes from './routes/admin/delete-all-data.routes.js';
import smsRoutes from './routes/sms.routes.js';
import academyRoutes from './routes/academy.routes.js';
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
import { createServer } from 'http';

// Initialize email service
initEmailService();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
  'https://matchify-pro.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview deployments
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow Render deployments
    if (origin.includes('.onrender.com')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Rate limiting - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for normal operations
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Apply additional security middlewares
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(preventParameterPollution);
app.use(validateTokenFormat);
app.use(logSuspiciousActivity);

// More reasonable rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Allow 20 attempts per 15 minutes (more reasonable)
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true,
});

// Static file serving for uploads
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
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

// API Health check endpoint (for testing)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'MATCHIFY.PRO API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
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

// Auth routes (both old and new multi-role) - with stricter rate limiting
app.use('/api/auth', authLimiter, authRoutes);
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

// Admin routes
app.use('/api/admin', adminRoutes);

// Admin sub-routes
app.use('/api/admin/payment-settings', paymentSettingsRoutes);
app.use('/api/admin/payment-verifications', paymentVerificationRoutes);
app.use('/api/admin/tournament-payments', tournamentPaymentsRoutes);
app.use('/api/admin/revenue', revenueAnalyticsRoutes);
app.use('/api/admin/tournament-management', tournamentManagementRoutes);
app.use('/api/admin', deleteAllDataRoutes); // Changed: remove /delete-all-info prefix

// SMS routes
app.use('/api/sms', smsRoutes);

// Academy routes
app.use('/api/academies', academyRoutes);

// User routes
app.use('/api/users', userRoutes);

// KYC routes - DISABLED (KYC feature removed)

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

const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);
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

export default app;
