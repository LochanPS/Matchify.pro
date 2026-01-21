/**
 * Additional Security Middleware for Matchify.pro
 */

// Sanitize user input to prevent XSS attacks
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove potentially dangerous characters
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    });
  }
  next();
};

// Prevent parameter pollution
export const preventParameterPollution = (req, res, next) => {
  // Ensure query parameters are not arrays (unless expected)
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (Array.isArray(req.query[key]) && !['roles', 'sports'].includes(key)) {
        req.query[key] = req.query[key][0];
      }
    });
  }
  next();
};

// Add security headers
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https://res.cloudinary.com data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  
  next();
};

// Validate JWT token format
export const validateTokenFormat = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token && !/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token format'
    });
  }
  
  next();
};

// Log suspicious activity
export const logSuspiciousActivity = (req, res, next) => {
  // Skip security checks in development mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i,  // Path traversal
    /(union|select|insert|update|delete|drop|create|alter)/i,  // SQL injection
    /(<script|javascript:|onerror=|onload=)/i,  // XSS
    /(eval\(|exec\(|system\()/i,  // Code injection
  ];
  
  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query) + req.url;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.warn('⚠️ SUSPICIOUS ACTIVITY DETECTED:', {
        ip: req.ip,
        method: req.method,
        url: req.url,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({
        success: false,
        message: 'Suspicious activity detected. This incident has been logged.'
      });
    }
  }
  
  next();
};

// Prevent timing attacks on authentication
export const preventTimingAttacks = async (callback) => {
  const start = Date.now();
  const result = await callback();
  const elapsed = Date.now() - start;
  
  // Ensure minimum response time of 100ms to prevent timing attacks
  if (elapsed < 100) {
    await new Promise(resolve => setTimeout(resolve, 100 - elapsed));
  }
  
  return result;
};
