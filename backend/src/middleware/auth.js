import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../lib/prisma.js';

// ── P2024 retry helper ─────────────────────────────────────────────────────
// Prisma P2024 = connection pool exhausted (Vercel serverless with connection_limit=1
// under concurrent requests). Retry once after a short delay before giving up.
// Returning 503 instead of 401 on persistent P2024 is critical: 401 triggers the
// frontend's silent refresh flow which also hits DB → also P2024 → doLogout().
// 503 is treated as a transient server error; GET requests auto-retry, non-GETs fail
// gracefully without wiping the user's session.
const _sleep = ms => new Promise(r => setTimeout(r, ms));

function _isP2024(err) {
  return err?.code === 'P2024' || (err?.message || '').includes('connection pool');
}

async function _withDbRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    if (_isP2024(err)) {
      await _sleep(350);
      return await fn(); // one retry
    }
    throw err;
  }
}

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database (retry once on P2024 connection pool exhaustion)
    const user = await _withDbRetry(() => prisma.user.findUnique({
      where: { id: decoded.userId }
    }));

    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account is deactivated'
      });
    }

    // Check if account is suspended
    if (user.isSuspended) {
      const suspendedMessage = user.suspendedUntil
        ? `Account suspended until ${user.suspendedUntil.toISOString()}`
        : 'Account is permanently suspended';
        
      return res.status(403).json({
        error: suspendedMessage
      });
    }

    // Attach user to request - support both 'role' and 'roles' fields
    let userRoles;
    if (user.roles) {
      // If roles field exists (comma-separated string)
      userRoles = user.roles.split(',');
    } else if (user.role) {
      // If only role field exists (single value)
      userRoles = [user.role];
    } else {
      // Default to PLAYER
      userRoles = ['PLAYER'];
    }
    
    // Check if user is admin
    const isAdmin = userRoles.includes('ADMIN');
    
    req.user = {
      id: user.id,
      userId: user.id, // For compatibility with roleAuth middleware
      email: user.email,
      role: userRoles[0], // Primary role for backward compatibility
      roles: userRoles, // All roles for multi-role support
      name: user.name,
      isVerified: user.isVerified,
      isAdmin: isAdmin,
      // Preserve impersonation fields from JWT token
      isImpersonating: decoded.isImpersonating || false,
      adminId: decoded.adminId || null
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    // P2024 = DB connection pool exhausted — NOT an auth failure.
    // Return 503 so the frontend does NOT trigger its refresh-token → logout cascade.
    if (_isP2024(error)) {
      return res.status(503).json({ error: 'Server busy, please retry' });
    }
    res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
};

// Role-based authorization - support multi-role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check if user has ANY of the required roles
    const userRoles = req.user.roles || [req.user.role];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await _withDbRetry(() => prisma.user.findUnique({
      where: { id: decoded.userId }
    }));

    if (user && user.isActive && !user.isSuspended) {
      // Support both 'role' and 'roles' fields
      let userRoles;
      if (user.roles) {
        userRoles = user.roles.split(',');
      } else if (user.role) {
        userRoles = [user.role];
      } else {
        userRoles = ['PLAYER'];
      }
      
      req.user = {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: userRoles[0],
        roles: userRoles,
        name: user.name,
        isVerified: user.isVerified
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Require admin role - support multi-role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const userRoles = req.user.roles || [req.user.role];
  if (!userRoles.includes('ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

// Prevent admins from accessing non-admin features - support multi-role
const preventAdminAccess = (req, res, next) => {
  const userRoles = req.user?.roles || [req.user?.role];
  if (req.user && userRoles.includes('ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Admins cannot access this feature. Please use your personal account.',
      suggestion: 'Create a separate player/organizer account for non-admin activities',
      userRole: req.user.role
    });
  }

  next();
};

export { authenticate, authorize, optionalAuth, requireAdmin, preventAdminAccess };