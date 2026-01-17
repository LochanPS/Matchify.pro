import { verifyAccessToken } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    console.log('🔓 Token decoded:', {
      userId: decoded.userId,
      email: decoded.email,
      isImpersonating: decoded.isImpersonating,
      adminId: decoded.adminId
    });

    // Check if this is a super admin token
    if (decoded.isAdmin && decoded.userId === 'admin') {
      req.user = {
        id: 'admin',
        userId: 'admin',
        email: decoded.email,
        role: 'ADMIN',
        roles: ['ADMIN'],
        name: 'Super Admin',
        isAdmin: true,
        isVerified: true
      };
      return next();
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

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

    // Attach user to request - support multi-role
    const userRoles = user.roles ? user.roles.split(',') : ['PLAYER'];
    
    req.user = {
      id: user.id,
      userId: user.id, // For compatibility with roleAuth middleware
      email: user.email,
      role: userRoles[0], // Primary role for backward compatibility
      roles: userRoles, // All roles for multi-role support
      name: user.name,
      isVerified: user.isVerified,
      isAdmin: false,
      // Preserve impersonation fields from JWT token
      isImpersonating: decoded.isImpersonating || false,
      adminId: decoded.adminId || null
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (user && user.isActive && !user.isSuspended) {
      const userRoles = user.roles ? user.roles.split(',') : ['PLAYER'];
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