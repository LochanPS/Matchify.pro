import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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

// REGISTER - Support multiple roles
export const register = async (req, res) => {
  try {
    const { email, password, name, phone, alternateEmail, roles } = req.body;

    // Validate roles - default to PLAYER if none provided
    const validRoles = ['PLAYER', 'ORGANIZER', 'UMPIRE'];
    let userRoles = roles && Array.isArray(roles) 
      ? roles.filter(role => validRoles.includes(role)) 
      : ['PLAYER'];
    
    if (userRoles.length === 0) {
      userRoles.push('PLAYER'); // Fallback to PLAYER
    }

    // Validate phone number is required
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check if user exists by email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with roles (stored as comma-separated string for SQLite)
    // All new users get ₹10 welcome bonus
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        alternateEmail: alternateEmail || null,
        roles: userRoles.join(','),
        walletBalance: 10, // Welcome bonus
      },
    });

    // Create welcome bonus transaction
    await prisma.walletTransaction.create({
      data: {
        userId: user.id,
        type: 'CREDIT',
        amount: 10,
        balanceBefore: 0,
        balanceAfter: 10,
        description: 'Welcome bonus - ₹10 credits!',
        status: 'COMPLETED',
      },
    });

    // Create role-specific profiles
    if (userRoles.includes('PLAYER')) {
      await prisma.playerProfile.create({
        data: { userId: user.id },
      });
    }
    
    if (userRoles.includes('ORGANIZER')) {
      await prisma.organizerProfile.create({
        data: { userId: user.id },
      });
    }
    
    if (userRoles.includes('UMPIRE')) {
      await prisma.umpireProfile.create({
        data: { userId: user.id },
      });
    }

    // Generate JWT with all roles
    const token = jwt.sign(
      { userId: user.id, email: user.email, roles: userRoles },
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
        roles: userRoles,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

// LOGIN - Return all roles
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with all profile fields
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        playerProfile: true,
        organizerProfile: true,
        umpireProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if suspended
    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Parse roles from comma-separated string
    const userRoles = user.roles ? user.roles.split(',') : ['PLAYER'];

    // Generate JWT with all roles
    const token = jwt.sign(
      { userId: user.id, email: user.email, roles: userRoles },
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
        umpireCode: user.umpireCode,
        roles: userRoles,
        profiles: {
          player: user.playerProfile,
          organizer: user.organizerProfile,
          umpire: user.umpireProfile,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

// ADD ROLE - Allow user to add another role
export const addRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.userId; // From JWT middleware

    // Only PLAYER and UMPIRE are valid roles now (ORGANIZER is merged with PLAYER)
    const validRoles = ['PLAYER', 'UMPIRE'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Get user
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        playerProfile: true,
        organizerProfile: true,
        umpireProfile: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse current roles
    const currentRoles = user.roles ? user.roles.split(',') : [];

    // Check if role already exists
    if (currentRoles.includes(role)) {
      return res.status(400).json({ error: 'Role already exists' });
    }

    // Add role
    const newRoles = [...currentRoles, role];
    let updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roles: newRoles.join(','),
      },
    });

    // Create profile for new role
    if (role === 'PLAYER' && !user.playerProfile) {
      await prisma.playerProfile.create({
        data: { userId: user.id },
      });
    } else if (role === 'ORGANIZER' && !user.organizerProfile) {
      await prisma.organizerProfile.create({
        data: { userId: user.id },
      });
      
      // Add 10 Matchify credits for new organizers
      const currentBalance = user.walletBalance || 0;
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { walletBalance: currentBalance + 10 },
      });
      
      await prisma.walletTransaction.create({
        data: {
          userId: user.id,
          type: 'CREDIT',
          amount: 10,
          balanceBefore: currentBalance,
          balanceAfter: currentBalance + 10,
          description: 'Welcome bonus - 10 Matchify credits for becoming an organizer!',
          status: 'COMPLETED',
        },
      });
    } else if (role === 'UMPIRE' && !user.umpireProfile) {
      // Generate unique umpire code
      const umpireCode = await generateUmpireCode();
      
      // Update user with umpire code
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { umpireCode },
      });
      
      await prisma.umpireProfile.create({
        data: { userId: user.id },
      });
    }

    // Fetch the complete updated user
    const fullUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        roles: true,
        umpireCode: true,
        profilePhoto: true,
        city: true,
        state: true,
        country: true,
        dateOfBirth: true,
        gender: true,
        totalPoints: true,
        tournamentsPlayed: true,
        matchesWon: true,
        matchesLost: true,
        walletBalance: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      }
    });

    // Parse roles for frontend
    const userRoles = fullUser.roles ? fullUser.roles.split(',') : ['PLAYER'];

    res.json({
      message: 'Role added successfully',
      roles: newRoles,
      user: {
        ...fullUser,
        roles: userRoles,
        currentRole: role // Set the new role as current
      }
    });
  } catch (error) {
    console.error('Add role error:', error);
    res.status(500).json({ error: 'Failed to add role', details: error.message });
  }
};