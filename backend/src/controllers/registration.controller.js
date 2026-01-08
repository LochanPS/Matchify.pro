import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { notifyPartnerInvitation } from '../services/notification.service.js';

const prisma = new PrismaClient();

// Initialize Razorpay (will be null if keys not provided)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// POST /api/registrations - Register for tournament
const createRegistration = async (req, res) => {
  try {
    const { tournamentId, categoryIds, partnerEmails } = req.body; // Changed to partnerEmails object
    const userId = req.user.id;

    // Validation
    if (!tournamentId || !categoryIds || categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tournament ID and at least one category are required',
      });
    }

    // Fetch tournament with categories
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { categories: true },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    // Check if registration is open
    const now = new Date();
    if (now < new Date(tournament.registrationOpenDate)) {
      return res.status(400).json({
        success: false,
        error: 'Registration has not opened yet',
      });
    }
    if (now > new Date(tournament.registrationCloseDate)) {
      return res.status(400).json({
        success: false,
        error: 'Registration is closed',
      });
    }

    // Calculate total amount and validate categories
    let totalAmount = 0;
    const categories = [];

    for (const catId of categoryIds) {
      const category = tournament.categories.find((c) => c.id === catId);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: `Category ${catId} not found in this tournament`,
        });
      }

      // Check if already registered
      const existing = await prisma.registration.findUnique({
        where: {
          userId_categoryId: {
            userId,
            categoryId: catId,
          },
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: `Already registered for ${category.name}`,
        });
      }

      totalAmount += category.entryFee;
      categories.push(category);
    }

    // Create registrations (one per category) - Payment is via organizer's QR code
    const registrations = [];

    for (const category of categories) {
      // Get partner email for this specific category
      const categoryPartnerEmail = partnerEmails?.[category.id];
      let partnerId = null;
      let partnerToken = null;

      // Handle partner for doubles categories
      if (category.format === 'doubles' && categoryPartnerEmail) {
        const partner = await prisma.user.findUnique({
          where: { email: categoryPartnerEmail },
        });
        if (partner) {
          partnerId = partner.id;
        }
        // Generate unique token for this category's partner confirmation
        partnerToken = crypto.randomBytes(32).toString('hex');
      }

      // Registration with pending payment - organizer will verify via QR payment
      const registration = await prisma.registration.create({
        data: {
          tournamentId,
          categoryId: category.id,
          userId,
          partnerId,
          partnerEmail: !partnerId && categoryPartnerEmail ? categoryPartnerEmail : null,
          partnerToken,
          amountTotal: category.entryFee,
          amountWallet: 0, // No wallet payment
          amountRazorpay: 0, // No Razorpay payment
          paymentStatus: 'pending', // Organizer will verify QR payment
          status: 'pending', // Pending until organizer confirms payment
        },
        include: {
          category: true,
          tournament: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });
      registrations.push(registration);

      // Update category registration count
      await prisma.category.update({
        where: { id: category.id },
        data: { registrationCount: { increment: 1 } },
      });
    }

    // Send partner invitation emails
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Send invitation for each doubles registration with partner email
    for (const registration of registrations) {
      if (registration.category.format === 'doubles' && registration.partnerToken) {
        const categoryPartnerEmail = partnerEmails?.[registration.categoryId] || registration.partnerEmail;
        if (categoryPartnerEmail) {
          await notifyPartnerInvitation({
            registration,
            playerName: currentUser.name,
            partnerEmail: categoryPartnerEmail,
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Registration submitted. Please pay via QR code. Organizer will verify your payment.',
      data: {
        registrations,
        totalAmount,
        paymentMethod: 'qr_code',
        paymentStatus: 'pending',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// GET /api/registrations/my - Get user's registrations
const getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            venue: true,
            startDate: true,
            endDate: true,
            status: true,
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
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registrations',
    });
  }
};

// DELETE /api/registrations/:id - Cancel registration
const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Fetch registration
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        category: true,
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
      });
    }

    if (registration.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this registration',
      });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Registration already cancelled',
      });
    }

    // Check if cancellation is allowed (before tournament starts)
    const now = new Date();
    if (now >= new Date(registration.tournament.startDate)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel after tournament has started',
      });
    }

    // Calculate refund (100% if > 24h before start, 0% otherwise)
    const hoursUntilStart =
      (new Date(registration.tournament.startDate) - now) / (1000 * 60 * 60);
    const refundPercentage = hoursUntilStart > 24 ? 1.0 : 0;
    const refundAmount = registration.amountTotal * refundPercentage;

    // Update registration
    await prisma.registration.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        refundAmount,
        refundStatus: refundAmount > 0 ? 'pending' : 'not_applicable',
        paymentStatus: 'refunded',
      },
    });

    // Process refund to wallet
    if (refundAmount > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      const balanceBefore = user.walletBalance;
      const balanceAfter = balanceBefore + refundAmount;

      await prisma.user.update({
        where: { id: userId },
        data: { walletBalance: balanceAfter },
      });

      // Log wallet transaction
      await prisma.walletTransaction.create({
        data: {
          userId,
          type: 'REFUND',
          amount: refundAmount,
          balanceBefore,
          balanceAfter,
          description: `Refund - ${registration.tournament.name} (${registration.category.name})`,
          referenceId: registration.tournamentId,
          paymentGateway: 'wallet',
          status: 'COMPLETED',
        },
      });

      // Update refund status
      await prisma.registration.update({
        where: { id },
        data: { refundStatus: 'completed' },
      });
    }

    res.json({
      success: true,
      message: 'Registration cancelled successfully',
      refundAmount,
      refundPercentage: refundPercentage * 100,
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Cancellation failed',
      details: error.message,
    });
  }
};

export { createRegistration, getMyRegistrations, cancelRegistration };
