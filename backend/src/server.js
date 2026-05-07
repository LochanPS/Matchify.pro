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
// Birth year feature + Database migration deployed - v1.3

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
  'https://matchify.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  process.env.CORS_ORIGIN
].filter(Boolean);

// Regex patterns for dynamic origins
const allowedOriginPatterns = [
  /^https:\/\/matchify-.*\.vercel\.app$/,  // All Matchify Vercel preview deployments
  /^https:\/\/.*\.vercel\.app$/,            // All Vercel deployments
  /^https:\/\/.*\.onrender\.com$/           // All Render deployments
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
  let envStatus = { configured: [], missing: [], warnings: [] };
  let hasIssues = false;
  
  try {
    if (getEnvironmentStatus) {
      envStatus = getEnvironmentStatus();
      hasIssues = envStatus.missing.length > 0;
    }
  } catch (error) {
    console.warn('Health check: Environment status unavailable');
  }
  
  res.status(hasIssues ? 503 : 200).json({
    status: hasIssues ? 'degraded' : 'healthy',
    message: hasIssues 
      ? 'MATCHIFY.PRO API is running but has configuration issues' 
      : 'MATCHIFY.PRO API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.1',
    authRoutesLoaded: !!authRoutes,
    deploymentTime: '2026-05-06T19:00:00Z',
    configuration: {
      database: !!process.env.DATABASE_URL,
      jwt: !!process.env.JWT_SECRET && !!process.env.JWT_REFRESH_SECRET,
      cors: !!process.env.CORS_ORIGIN,
      cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
      razorpay: !!process.env.RAZORPAY_KEY_ID,
      sendgrid: !!process.env.SENDGRID_API_KEY
    },
    environmentVariables: {
      configured: envStatus.configured.length,
      missing: envStatus.missing.length,
      warnings: envStatus.warnings.length
    },
    ...(hasIssues && {
      issues: {
        missing: envStatus.missing,
        warnings: envStatus.warnings
      }
    })
  });
});

// Debug endpoint to list all routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes, total: routes.length });
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
console.log('🔧 Mounting auth routes at /api/auth');

// TEST: Add a simple test route first
app.post('/api/auth/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

// TEST: Add login route directly
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Direct login route hit!');
  console.log('Request body:', req.body);
  console.log('Environment check:', {
    hasDatabase: !!process.env.DATABASE_URL,
    hasJWT: !!process.env.JWT_SECRET,
    hasRefreshSecret: !!process.env.JWT_REFRESH_SECRET
  });
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check environment variables
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not set');
      return res.status(503).json({ 
        error: 'Database not configured',
        code: 'DATABASE_NOT_CONFIGURED'
      });
    }
    
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('❌ JWT secrets not set');
      return res.status(503).json({ 
        error: 'Authentication not configured',
        code: 'JWT_NOT_CONFIGURED'
      });
    }
    
    console.log('✅ Environment variables present');
    
    // Import bcrypt and prisma
    console.log('📦 Importing dependencies...');
    const bcrypt = await import('bcryptjs');
    const { default: prisma } = await import('./lib/prisma.js');
    
    console.log('🔍 Looking up user:', email);
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('✅ User found:', user.id);
    
    const isValid = await bcrypt.default.compare(password, user.password);
    
    if (!isValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('✅ Password valid');
    
    // Import JWT utils
    const { generateAccessToken, generateRefreshToken } = await import('./utils/jwt.js');
    
    // Parse roles
    let userRoles = ['PLAYER'];
    if (user.roles) {
      userRoles = user.roles.split(',').map(r => r.trim());
    }
    
    console.log('🎭 User roles:', userRoles);
    
    const accessToken = generateAccessToken(user.id, userRoles[0]);
    const refreshToken = generateRefreshToken(user.id);
    
    console.log('✅ Tokens generated');
    
    // Update refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });
    
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('✅ Login successful for:', email);
    
    res.json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        roles: userRoles,
        currentRole: userRoles[0],
        isAdmin: userRoles.includes('ADMIN')
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Login failed', 
      details: error.message,
      code: error.code || 'INTERNAL_ERROR'
    });
  }
});

app.use('/api/auth', authRoutes);  // Temporarily removed authLimiter for debugging
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
app.use('/api/admin/payment-settings', paymentSettingsRoutes);
app.use('/api/admin/payment-verifications', paymentVerificationRoutes);
app.use('/api/admin/refund-requests', refundRequestsRoutes);
app.use('/api/admin/tournament-payments', tournamentPaymentsRoutes);
app.use('/api/admin/revenue', revenueAnalyticsRoutes);
app.use('/api/admin/tournament-management', tournamentManagementRoutes);
app.use('/api/admin', deleteAllDataRoutes);

// Admin routes (general - must be AFTER specific routes)
app.use('/api/admin', adminRoutes);

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

// On Vercel: skip HTTP server + Socket.IO (serverless — no persistent connections)
// On Render/local: start normally with Socket.IO
if (!process.env.VERCEL) {
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
}

export default app;
