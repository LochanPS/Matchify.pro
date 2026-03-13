import jwt from 'jsonwebtoken';

/**
 * Optional authentication middleware
 * Allows both authenticated and anonymous users
 * Sets req.user to null if no valid token provided
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    // No token provided - user is anonymous
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    // Invalid token - treat as anonymous
    req.user = null;
    next();
  }
};
