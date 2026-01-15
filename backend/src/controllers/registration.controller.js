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
    // Dates are stored as strings like "2026-01-15T11:30" (no timezone)
    // We need to compare them as-is without timezone conversion
    const now = new Date();
    
    // Get current time in ISO format without timezone: "2026-01-15T11:30"
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    console.log('🕐 Registration Check:', {
      serverTime: now.toISOString(),
      serverTimeLocal: currentTimeString,
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      registrationOpen: tournament.registrationOpenDate,
      registrationClose: tournament.registrationCloseDate,
      comparison: {
        currentVsOpen: `${currentTimeString} >= ${tournament.registrationOpenDate} = ${currentTimeString >= tournament.registrationOpenDate}`,
        currentVsClose: `${currentTimeString} <= ${tournament.registrationCloseDate} = ${currentTimeString <= tournament.registrationCloseDate}`,
      },
      isOpen: currentTimeString >= tournament.registrationOpenDate && currentTimeString <= tournament.registrationCloseDate
    });
    
    if (currentTimeString < tournament.registrationOpenDate) {
      return res.status(400).json({
        success: false,
        error: 'Registration has not opened yet',
      });
    }
    if (currentTimeString > tournament.registrationCloseDate) {
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

// DELETE /api/registrations/:id - Cancel registration (request cancellation with reason and UPI details)
const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, upiId } = req.body;
    const userId = req.user.id;
    const qrCodeFile = req.file;

    console.log('Cancel registration request:', { id, reason, upiId, userId, hasFile: !!qrCodeFile });    // Validation
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a detailed reason for cancellation (at least 10 characters)',
      });
    }

    if (!upiId || upiId.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your UPI ID for refund',
      });
    }

    // Fetch registration
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        category: true,
        user: { select: { id: true, name: true, email: true } },
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

    if (registration.status === 'cancellation_requested') {
      return res.status(400).json({
        success: false,
        error: 'Cancellation request already submitted. Please wait for organizer response.',
      });
    }

    // Only allow cancellation for confirmed or pending registrations
    if (registration.status !== 'confirmed' && registration.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel registration with status: ${registration.status}`,
      });
    }

    // Check if cancellation is allowed (before tournament starts)
    const now = new Date();
    const tournamentStartDate = new Date(registration.tournament.startDate);
    if (now >= tournamentStartDate) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel after tournament has started',
      });
    }

    // Create QR code URL if uploaded
    const qrCodeUrl = qrCodeFile ? `/uploads/refund-qr/${qrCodeFile.filename}` : null;

    // Update registration with cancellation request
    await prisma.registration.update({
      where: { id },
      data: {
        status: 'cancellation_requested',
        cancellationReason: reason.trim(),
        refundUpiId: upiId.trim(),
        refundQrCode: qrCodeUrl,
        refundAmount: registration.amountTotal,
        refundStatus: 'pending',
        refundRequestedAt: new Date(),
      },
    });

    // Notify organizer about cancellation request
    await prisma.notification.create({
      data: {
        userId: registration.tournament.organizerId,
        type: 'CANCELLATION_REQUEST',
        title: 'Cancellation Request Received',
        message: `${registration.user.name} has requested to cancel their registration for ${registration.tournament.name} (${registration.category.name}). Please review and process the refund.`,
        data: JSON.stringify({
          registrationId: registration.id,
          playerName: registration.user.name,
          tournamentId: registration.tournamentId,
          categoryName: registration.category.name,
          amount: registration.amountTotal,
          reason: reason.trim(),
        }),
      },
    });

    res.json({
      success: true,
      message: 'Cancellation request submitted. The organizer will review and process your refund.',
      refundAmount: registration.amountTotal,
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Cancellation request failed',
      details: error.message,
    });
  }
};

// POST /api/registrations/with-screenshot - Register with payment screenshot
const createRegistrationWithScreenshot = async (req, res) => {
  try {
    const { tournamentId, categoryIds, partnerEmails } = req.body;
    const userId = req.user.id;
    const screenshotFile = req.file;

    // Parse JSON strings
    const parsedCategoryIds = JSON.parse(categoryIds);
    const parsedPartnerEmails = JSON.parse(partnerEmails || '{}');

    // Validation
    if (!tournamentId || !parsedCategoryIds || parsedCategoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tournament ID and at least one category are required',
      });
    }

    if (!screenshotFile) {
      return res.status(400).json({
        success: false,
        error: 'Payment screenshot is required',
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
    // Dates are stored as strings like "2026-01-15T11:30" (no timezone)
    // We need to compare them as-is without timezone conversion
    const now = new Date();
    
    // Get current time in ISO format without timezone: "2026-01-15T11:30"
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    console.log('🕐 Registration Check (Screenshot):', {
      serverTime: now.toISOString(),
      serverTimeLocal: currentTimeString,
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      registrationOpen: tournament.registrationOpenDate,
      registrationClose: tournament.registrationCloseDate,
      comparison: {
        currentVsOpen: `${currentTimeString} >= ${tournament.registrationOpenDate} = ${currentTimeString >= tournament.registrationOpenDate}`,
        currentVsClose: `${currentTimeString} <= ${tournament.registrationCloseDate} = ${currentTimeString <= tournament.registrationCloseDate}`,
      },
      isOpen: currentTimeString >= tournament.registrationOpenDate && currentTimeString <= tournament.registrationCloseDate
    });
    
    if (currentTimeString < tournament.registrationOpenDate) {
      return res.status(400).json({
        success: false,
        error: 'Registration has not opened yet',
      });
    }
    if (currentTimeString > tournament.registrationCloseDate) {
      return res.status(400).json({
        success: false,
        error: 'Registration is closed',
      });
    }

    // Calculate total amount and validate categories
    let totalAmount = 0;
    const categories = [];

    for (const catId of parsedCategoryIds) {
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

    // Create screenshot URL
    const screenshotUrl = `/uploads/payment-screenshots/${screenshotFile.filename}`;

    // Create registrations with screenshot
    const registrations = [];

    for (const category of categories) {
      const categoryPartnerEmail = parsedPartnerEmails?.[category.id];
      let partnerId = null;
      let partnerToken = null;

      if (category.format === 'doubles' && categoryPartnerEmail) {
        const partner = await prisma.user.findUnique({
          where: { email: categoryPartnerEmail },
        });
        if (partner) {
          partnerId = partner.id;
        }
        partnerToken = crypto.randomBytes(32).toString('hex');
      }

      const registration = await prisma.registration.create({
        data: {
          tournamentId,
          categoryId: category.id,
          userId,
          partnerId,
          partnerEmail: !partnerId && categoryPartnerEmail ? categoryPartnerEmail : null,
          partnerToken,
          amountTotal: category.entryFee,
          amountWallet: 0,
          amountRazorpay: 0,
          paymentScreenshot: screenshotUrl,
          paymentStatus: 'submitted', // Screenshot submitted, awaiting verification
          status: 'pending', // Pending until organizer confirms
        },
        include: {
          category: true,
          tournament: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              organizerId: true,
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

    // Notify organizer about new registration
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Create notification for organizer
    await prisma.notification.create({
      data: {
        userId: tournament.organizerId,
        type: 'PAYMENT_VERIFICATION_REQUIRED',
        title: 'New Registration - Payment Verification Required',
        message: `${currentUser.name} has registered for ${tournament.name}. Please verify their payment screenshot.`,
        data: JSON.stringify({
          registrationIds: registrations.map(r => r.id),
          playerName: currentUser.name,
          tournamentId: tournament.id,
          amount: totalAmount,
        }),
      },
    });

    // Send partner invitations for doubles
    for (const registration of registrations) {
      if (registration.category.format === 'doubles' && registration.partnerToken) {
        const categoryPartnerEmail = parsedPartnerEmails?.[registration.categoryId] || registration.partnerEmail;
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
      message: 'Registration submitted. Awaiting payment verification from organizer.',
      data: {
        registrations,
        totalAmount,
        paymentStatus: 'submitted',
      },
    });
  } catch (error) {
    console.error('Registration with screenshot error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// POST /api/registrations/:id/verify-payment - Organizer verifies payment
const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'verified' or 'rejected'
    const organizerId = req.user.id;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be "verified" or "rejected"',
      });
    }

    // Get registration with tournament
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        category: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    // Check if user is the organizer
    if (registration.tournament.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can verify payments',
      });
    }

    // Update registration
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        paymentStatus: status,
        status: status === 'verified' ? 'confirmed' : 'pending',
      },
    });

    // Notify player
    await prisma.notification.create({
      data: {
        userId: registration.userId,
        type: status === 'verified' ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
        title: status === 'verified' ? 'Payment Verified! ✅' : 'Payment Verification Failed',
        message: status === 'verified'
          ? `Your payment for ${registration.tournament.name} (${registration.category.name}) has been verified. You are now registered!`
          : `Your payment for ${registration.tournament.name} (${registration.category.name}) could not be verified. Please contact the organizer.`,
        data: JSON.stringify({
          registrationId: registration.id,
          tournamentId: registration.tournamentId,
          categoryId: registration.categoryId,
        }),
      },
    });

    res.json({
      success: true,
      message: status === 'verified' ? 'Payment verified successfully' : 'Payment rejected',
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      details: error.message,
    });
  }
};

export { createRegistration, createRegistrationWithScreenshot, getMyRegistrations, cancelRegistration, verifyPayment };
