import jwt from 'jsonwebtoken';

// Verify JWT
export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, roles }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user has required role
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if roles is array and includes required role
    const roles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
    
    if (!roles.includes(requiredRole)) {
      return res.status(403).json({ error: `Requires ${requiredRole} role` });
    }

    next();
  };
};

// Check if user has ANY of the required roles
export const requireAnyRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const roles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
    const hasRole = requiredRoles.some(role => roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ error: `Requires one of: ${requiredRoles.join(', ')}` });
    }

    next();
  };
};