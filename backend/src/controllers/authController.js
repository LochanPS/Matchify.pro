import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

/**
 * Generate unique player code
 * Format: #ABC1234 (# + 3 letters + 4 numbers)
 */
async function generatePlayerCode() {
  const numbers = '0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    // Generate 3 random letters
    let letterPart = '';
    for (let i = 0; i < 3; i++) {
      letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generate 4 random numbers
    let numPart = '';
    for (let i = 0; i < 4; i++) {
      numPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    code = '#' + letterPart + numPart;
    
    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { playerCode: code }
    });
    
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
}

/**
 * Generate unique umpire code
 * Format: #123ABCD (# + 3 numbers + 4 letters)
 */
async function generateUmpireCode() {
  const numbers = '0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    // Generate 3 random numbers
    let numPart = '';
    for (let i = 0; i < 3; i++) {
      numPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // Generate 4 random letters
    let letterPart = '';
    for (let i = 0; i < 4; i++) {
      letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    code = '#' + numPart + letterPart;
    
    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { umpireCode: code }
    });
    
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
}

// REGISTER - All users get all three roles automatically
export const register = async (req, res) => {
  try {
    const { email, password, name, phone, alternateEmail, city, state, gender, dateOfBirth } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields. Please provide name, email, password, and phone number.' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format. Please enter a valid email address (e.g., user@example.com).' 
      });
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        error: 'Invalid phone number. Please enter a valid 10-digit phone number (e.g., 9876543210).' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password too short. Password must be at least 6 characters long.' 
      });
    }

    const hasUppercase = /[A-Z]/.test(password);
    const numberCount = (password.match(/[0-9]/g) || []).length;
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUppercase) {
      return res.status(400).json({ 
        error: 'Weak password. Password must contain at least one uppercase letter (A-Z).' 
      });
    }

    if (numberCount < 2) {
      return res.status(400).json({ 
        error: 'Weak password. Password must contain at least two numbers (0-9).' 
      });
    }

    if (!hasSymbol) {
      return res.status(400).json({ 
        error: 'Weak password. Password must contain at least one symbol (!@#$%^&*...).' 
      });
    }

    // Validate alternate email if provided
    if (alternateEmail && !emailRegex.test(alternateEmail)) {
      return res.status(400).json({ 
        error: 'Invalid alternate email format. Please enter a valid email address or leave it empty.' 
      });
    }

    // All users automatically get all three roles
    const userRoles = ['PLAYER', 'ORGANIZER', 'UMPIRE'];

    // Check if user exists by email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        error: `Email already registered. The email "${email}" is already associated with an account. Please use a different email or try logging in.` 
      });
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ 
        error: `Phone number already registered. The phone number "${phone}" is already associated with an account. Please use a different phone number.` 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // For simplified schema - no player codes or profiles
    // Create user with basic fields only
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: userRoles[0], // Use 'role' field (singular) for simplified schema
        walletBalance: 0, // No welcome bonus in simplified schema
        city: city || null,
        state: state || null,
        gender: gender || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    // Generate JWT with role
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        city: user.city,
        state: user.state,
        country: user.country,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        profilePhoto: user.profilePhoto,
        walletBalance: user.walletBalance,
        totalPoints: user.totalPoints,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return res.status(400).json({ 
          error: 'Email already registered. This email is already associated with an account. Please use a different email or try logging in.' 
        });
      } else if (field === 'phone') {
        return res.status(400).json({ 
          error: 'Phone number already registered. This phone number is already associated with an account. Please use a different phone number.' 
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Registration failed. An unexpected error occurred. Please try again or contact support if the problem persists.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ADMIN CREDENTIALS (hardcoded for security)
const ADMIN_EMAIL = 'ADMIN@gmail.com';
const ADMIN_PASSWORD = 'ADMIN@123(123)';

// LOGIN - Return all roles
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for admin login
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Try to find admin user in database
      let adminUser = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL }
      });

      // If admin user doesn't exist in database, use hardcoded values
      const adminId = adminUser ? adminUser.id : 'admin';
      const adminName = adminUser ? adminUser.name : 'Super Admin';

      // Generate admin JWT with actual user ID if available
      const token = jwt.sign(
        { userId: adminId, email: ADMIN_EMAIL, roles: ['ADMIN'], isAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Admin login successful',
        token,
        user: {
          id: adminId,
          email: ADMIN_EMAIL,
          name: adminName,
          roles: ['ADMIN'],
          isAdmin: true,
        },
      });
    }

    // Find user - simplified schema (no includes)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if suspended - return detailed message
    if (user.isSuspended) {
      return res.status(403).json({ 
        error: 'Account suspended',
        isSuspended: true,
        suspensionReason: user.suspensionReason || 'Violation of Matchify.pro terms of service',
        message: `Your account has been suspended. Reason: ${user.suspensionReason || 'Violation of terms of service'}. Please contact support if you believe this is a mistake.`
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Parse roles - handle both 'role' (singular) and 'roles' (plural) fields
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

    // Generate JWT with all roles
    const token = jwt.sign(
      { userId: user.id, email: user.email, roles: userRoles, isAdmin: isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        city: user.city,
        state: user.state,
        country: user.country,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        profilePhoto: user.profilePhoto,
        walletBalance: user.walletBalance,
        totalPoints: user.totalPoints,
        role: user.role,
        isAdmin: isAdmin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

// ADD ROLE - Allow user to add another role
};