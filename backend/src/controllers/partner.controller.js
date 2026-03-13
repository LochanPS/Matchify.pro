import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { notifyPartnerAccepted, notifyPartnerDeclined } from '../services/notification.service.js';

// GET /api/partner/confirm/:token - Get partner invitation details
const getPartnerInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    // Find registration by token
    const registration = await prisma.registration.findFirst({
      where: {
        partnerToken: token,
        partnerConfirmed: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            venue: true,
            startDate: true,
            endDate: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            format: true,
            gender: true,
            entryFee: true,
          },
        },
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation',
      });
    }

    // Check if tournament registration is still open
    const now = new Date();
    if (now > new Date(registration.tournament.endDate)) {
      return res.status(400).json({
        success: false,
        error: 'Tournament has already ended',
      });
    }

    res.json({
      success: true,
      invitation: {
        id: registration.id,
        player: registration.user,
        tournament: registration.tournament,
        category: registration.category,
        partnerEmail: registration.partnerEmail,
      },
    });
  } catch (error) {
    console.error('Get partner invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitation details',
    });
  }
};

// POST /api/partner/confirm/:token - Accept or decline partner invitation
const confirmPartner = async (req, res) => {
  try {
    const { token } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    const userId = req.user?.id; // Optional - user might not be logged in

    if (!token || !action) {
      return res.status(400).json({
        success: false,
        error: 'Token and action are required',
      });
    }

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be "accept" or "decline"',
      });
    }

    // Find registration by token
    const registration = await prisma.registration.findFirst({
      where: {
        partnerToken: token,
        partnerConfirmed: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            endDate: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation',
      });
    }

    // Check if tournament has ended
    const now = new Date();
    if (now > new Date(registration.tournament.endDate)) {
      return res.status(400).json({
        success: false,
        error: 'Tournament has already ended',
      });
    }

    if (action === 'accept') {
      // User must be logged in to accept
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'You must be logged in to accept this invitation',
          requiresLogin: true,
        });
      }

      // Verify email matches (if partner is registered)
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (currentUser.email !== registration.partnerEmail) {
        return res.status(403).json({
          success: false,
          error: 'This invitation was sent to a different email address',
        });
      }

      // Update registration - accept
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          partnerId: userId,
          partnerConfirmed: true,
          status: 'confirmed',
        },
      });

      // Send notification to player
      await notifyPartnerAccepted({
        registration,
        partnerName: currentUser.name,
      });

      res.json({
        success: true,
        message: 'Partner invitation accepted',
        action: 'accepted',
      });
    } else {
      // Decline - can be done without login
      const partnerName = registration.partnerEmail.split('@')[0]; // Use email prefix as name

      // Update registration - decline
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          partnerConfirmed: false,
          partnerToken: null, // Invalidate token
        },
      });

      // Send notification to player
      await notifyPartnerDeclined({
        registration,
        partnerName,
      });

      res.json({
        success: true,
        message: 'Partner invitation declined',
        action: 'declined',
      });
    }
  } catch (error) {
    console.error('Confirm partner error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process invitation',
    });
  }
};

export { getPartnerInvitation, confirmPartner };
