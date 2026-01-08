import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// REGISTER - Support multiple roles
export const register = async (req, res) => {
  try {
    const { email, password, name, phone, roles } = req.body;

    // Validate roles - default to PLAYER if none provided
    const validRoles = ['PLAYER', 'ORGANIZER', 'UMPIRE'];
    let userRoles = roles && Array.isArray(roles) 
      ? roles.filter(role => validRoles.includes(role)) 
      : ['PLAYER'];
    
    if (userRoles.length === 0) {
      userRoles.push('PLAYER'); // Fallback to PLAYER
    }

    // Check if user exists by email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ error: 'User with this phone number already exists' });
      }
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
        phone: phone || null,
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

    // Find user
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

    const validRoles = ['PLAYER', 'ORGANIZER', 'UMPIRE'];
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
    const updatedUser = await prisma.user.update({
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
      await prisma.user.update({
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
      await prisma.umpireProfile.create({
        data: { userId: user.id },
      });
    }

    res.json({
      message: 'Role added successfully',
      roles: newRoles,
    });
  } catch (error) {
    console.error('Add role error:', error);
    res.status(500).json({ error: 'Failed to add role', details: error.message });
  }
};