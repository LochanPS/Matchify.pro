import { PrismaClient } from '@prisma/client';
import { sendInviteEmail } from '../services/email.service.js';
import { generateOneTimePassword, calculateExpiry, generateInviteToken } from '../utils/adminInvite.js';

const prisma = new PrismaClient();

// POST /admin/invites - Create new invite
export const createInvite = async (req, res) => {
  try {
    const { email, role, duration = '7d' } = req.body;
    const adminId = req.user.id;

    // Verify user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    // Validation
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email and role are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate role
    const validRoles = ['ORGANIZER', 'UMPIRE', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be ORGANIZER, UMPIRE, or ADMIN'
      });
    }

    // Validate duration
    const validDurations = ['24h', '7d', '30d'];
    if (!validDurations.includes(duration)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid duration. Must be 24h, 7d, or 30d'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Check for pending invite
    const pendingInvite = await prisma.adminInvite.findFirst({
      where: {
        email,
        status: 'pending',
        expiresAt: { gt: new Date() }
      }
    });

    if (pendingInvite) {
      return res.status(409).json({
        success: false,
        error: 'Pending invite already exists for this email'
      });
    }

    // Generate token, one-time password, and expiry
    const token = generateInviteToken();
    const oneTimePassword = generateOneTimePassword();
    const expiresAt = calculateExpiry(duration);

    // Create invite
    const invite = await prisma.adminInvite.create({
      data: {
        email,
        role,
        token,
        oneTimePassword,
        invitedBy: adminId,
        expiresAt,
        status: 'pending'
      },
      include: {
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Send invite email
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/accept/${token}`;
    await sendInviteEmail(email, role, inviteUrl, req.user.name, oneTimePassword);

    res.status(201).json({
      success: true,
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt
      },
      message: 'Admin invite sent successfully'
    });

  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invite'
    });
  }
};

// GET /admin/invites - List all invites
export const listInvites = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    if (status) {
      where.status = status;
    }

    // Get invites
    const [invites, total] = await Promise.all([
      prisma.adminInvite.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          inviter: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.adminInvite.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        invites: invites.map(invite => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          invitedBy: invite.inviter.name,
          inviterEmail: invite.inviter.email,
          expiresAt: invite.expiresAt,
          acceptedAt: invite.acceptedAt,
          revokedAt: invite.revokedAt,
          createdAt: invite.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('List invites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invites'
    });
  }
};

// GET /admin/invites/:token/verify - Verify invite token
export const verifyInvite = async (req, res) => {
  try {
    const { token } = req.params;

    const invite = await prisma.adminInvite.findUnique({
      where: { token },
      include: {
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invalid invite token'
      });
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      return res.status(410).json({
        success: false,
        error: 'Invite has expired'
      });
    }

    // Check if already used
    if (invite.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Invite has been ${invite.status}`
      });
    }

    res.json({
      success: true,
      data: {
        email: invite.email,
        role: invite.role,
        invitedBy: invite.inviter.name,
        expiresAt: invite.expiresAt
      }
    });

  } catch (error) {
    console.error('Verify invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify invite'
    });
  }
};

// POST /admin/invites/:token/accept - Accept invite and create account
export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const { oneTimePassword, name, password, phone, city, state } = req.body;

    // Validation
    if (!oneTimePassword || !name || !password) {
      return res.status(400).json({
        success: false,
        error: 'One-time password, name, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Find invite
    const invite = await prisma.adminInvite.findUnique({
      where: { token }
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invalid invite token'
      });
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      // Update status to expired
      await prisma.adminInvite.update({
        where: { id: invite.id },
        data: { status: 'expired' }
      });
      return res.status(410).json({
        success: false,
        error: 'Invite has expired'
      });
    }

    // Check if already used
    if (invite.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Invite has been ${invite.status}`
      });
    }

    // Verify one-time password
    if (invite.oneTimePassword !== oneTimePassword.toUpperCase()) {
      return res.status(401).json({
        success: false,
        error: 'Invalid one-time password'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and update invite in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: invite.email,
          password: hashedPassword,
          name,
          phone: phone || null,
          city: city || null,
          state: state || null,
          role: invite.role
        }
      });

      // Update invite status
      await tx.adminInvite.update({
        where: { id: invite.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date()
        }
      });

      return user;
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role
      },
      message: 'Account created successfully. You can now login.'
    });

  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept invite'
    });
  }
};

// DELETE /admin/invites/:id/revoke - Revoke invite
export const revokeInvite = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;

    // Find invite
    const invite = await prisma.adminInvite.findUnique({
      where: { id }
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invite not found'
      });
    }

    // Check if already revoked or accepted
    if (invite.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot revoke invite that is ${invite.status}`
      });
    }

    // Update invite status
    await prisma.adminInvite.update({
      where: { id },
      data: {
        status: 'revoked',
        revokedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Invite revoked successfully'
    });

  } catch (error) {
    console.error('Revoke invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke invite'
    });
  }
};

// DELETE /admin/invites/:id - Delete invite
export const deleteInvite = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;

    // Delete invite
    await prisma.adminInvite.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Invite deleted successfully'
    });

  } catch (error) {
    console.error('Delete invite error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Invite not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete invite'
    });
  }
};
