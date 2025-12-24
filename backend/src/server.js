import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';

// Load environment variables
dotenv.config();

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
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Matchify API v1.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      tournaments: '/api/tournaments',
      registrations: '/api/registrations',
      matches: '/api/matches',
      users: '/api/users'
    },
    documentation: 'https://github.com/your-username/matchify'
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Test routes for authentication
import { authenticate, authorize } from './middleware/auth.js';

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

app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║      MATCHIFY SERVER STARTED 🎾      ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║  Port: ${PORT.toString().padEnd(28)} ║`);
  console.log(`║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(20)} ║`);
  console.log(`║  Frontend: ${FRONTEND_URL.padEnd(21)} ║`);
  console.log('╚═══════════════════════════════════════╝');
  console.log('');
  console.log('🚀 Ready to serve badminton tournaments!');
  console.log('📊 Health check: http://localhost:' + PORT + '/health');
  console.log('🔗 API docs: http://localhost:' + PORT + '/api');
  console.log('');
});

export default app;