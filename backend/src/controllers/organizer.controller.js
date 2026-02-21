import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { createNotification } from '../services/notification.service.js';

// GET /api/organizer/tournaments - Get organizer's tournaments with stats
export const getOrganizerTournaments = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const tournaments = await prisma.tournament.findMany({
      where: { organizerId },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            entryFee: true,
            registrationCount: true,
          },
        },
        registrations: {
          select: {
            id: true,
            status: true,
            amountTotal: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            categories: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats for each tournament
    const tournamentsWithStats = tournaments.map((tournament) => {
      const totalRegistrations = tournament.registrations.length;
      const confirmedRegistrations = tournament.registrations.filter(
        (r) => r.status === 'confirmed'
      ).length;
      const pendingRegistrations = tournament.registrations.filter(
        (r) => r.status === 'pending'
      ).length;
      const totalRevenue = tournament.registrations
        .filter((r) => r.status === 'confirmed')
        .reduce((sum, r) => sum + r.amountTotal, 0);

      return {
        ...tournament,
        stats: {
          totalRegistrations,
          confirmedRegistrations,
          pendingRegistrations,
          totalRevenue,
          categoriesCount: tournament._count.categories,
        },
      };
    });

    res.json({
      success: true,
      count: tournamentsWithStats.length,
      tournaments: tournamentsWithStats,
    });
  } catch (error) {
    console.error('Get organizer tournaments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournaments',
    });
  }
};

// GET /api/organizer/tournaments/:id/registrations - Get tournament registrations
export const getTournamentRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    // Verify tournament belongs to organizer
    const tournament = await prisma.tournament.findFirst({
      where: {
        id,
        organizerId,
      },
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found or unauthorized',
      });
    }

    const registrations = await prisma.registration.findMany({
      where: { tournamentId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            state: true,
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
      orderBy: { createdAt: 'desc' },
    });

    // Format registrations to include guest info
    const formattedRegistrations = registrations.map(reg => ({
      ...reg,
      displayName: reg.userId && reg.user ? reg.user.name : reg.guestName,
      displayEmail: reg.userId && reg.user ? reg.user.email : reg.guestEmail,
      displayPhone: reg.userId && reg.user ? reg.user.phone : reg.guestPhone,
      isGuest: !reg.userId
    }));

    res.json({
      success: true,
      count: formattedRegistrations.length,
      registrations: formattedRegistrations,
    });
  } catch (error) {
    console.error('Get tournament registrations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registrations',
    });
  }
};

// GET /api/organizer/tournaments/:id/analytics - Get tournament analytics
export const getTournamentAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    // Verify tournament belongs to organizer
    const tournament = await prisma.tournament.findFirst({
      where: {
        id,
        organizerId,
      },
      include: {
        categories: true,
        registrations: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found or unauthorized',
      });
    }

    // Calculate analytics
    const totalRegistrations = tournament.registrations.length;
    const confirmedRegistrations = tournament.registrations.filter(
      (r) => r.status === 'confirmed'
    ).length;
    const pendingRegistrations = tournament.registrations.filter(
      (r) => r.status === 'pending'
    ).length;
    const cancelledRegistrations = tournament.registrations.filter(
      (r) => r.status === 'cancelled'
    ).length;

    const totalRevenue = tournament.registrations
      .filter((r) => r.status === 'confirmed')
      .reduce((sum, r) => sum + r.amountTotal, 0);

    const walletRevenue = tournament.registrations
      .filter((r) => r.status === 'confirmed')
      .reduce((sum, r) => sum + r.amountWallet, 0);

    const razorpayRevenue = tournament.registrations
      .filter((r) => r.status === 'confirmed')
      .reduce((sum, r) => sum + r.amountRazorpay, 0);

    // Category-wise breakdown
    const categoryStats = tournament.categories.map((category) => {
      const categoryRegistrations = tournament.registrations.filter(
        (r) => r.categoryId === category.id && r.status === 'confirmed'
      );

      return {
        categoryId: category.id,
        categoryName: category.name,
        format: category.format,
        entryFee: category.entryFee,
        maxParticipants: category.maxParticipants,
        registrations: categoryRegistrations.length,
        revenue: categoryRegistrations.reduce((sum, r) => sum + r.amountTotal, 0),
        fillPercentage: category.maxParticipants
          ? (categoryRegistrations.length / category.maxParticipants) * 100
          : 0,
      };
    });

    // Gender distribution
    const genderStats = {
      men: tournament.registrations.filter(
        (r) => r.category.gender === 'men' && r.status === 'confirmed'
      ).length,
      women: tournament.registrations.filter(
        (r) => r.category.gender === 'women' && r.status === 'confirmed'
      ).length,
      mixed: tournament.registrations.filter(
        (r) => r.category.gender === 'mixed' && r.status === 'confirmed'
      ).length,
    };

    // Format distribution
    const formatStats = {
      singles: tournament.registrations.filter(
        (r) => r.category.format === 'singles' && r.status === 'confirmed'
      ).length,
      doubles: tournament.registrations.filter(
        (r) => r.category.format === 'doubles' && r.status === 'confirmed'
      ).length,
    };

    res.json({
      success: true,
      analytics: {
        overview: {
          totalRegistrations,
          confirmedRegistrations,
          pendingRegistrations,
          cancelledRegistrations,
          totalRevenue,
          walletRevenue,
          razorpayRevenue,
        },
        categories: categoryStats,
        demographics: {
          gender: genderStats,
          format: formatStats,
        },
      },
    });
  } catch (error) {
    console.error('Get tournament analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
};

// GET /api/organizer/tournaments/:id/export - Export participants
export const exportParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;
    const { format = 'json' } = req.query;

    // Verify tournament belongs to organizer
    const tournament = await prisma.tournament.findFirst({
      where: {
        id,
        organizerId,
      },
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found or unauthorized',
      });
    }

    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId: id,
        status: 'confirmed',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            city: true,
            state: true,
          },
        },
        partner: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        category: {
          select: {
            name: true,
            format: true,
            gender: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Format data for export
    const exportData = registrations.map((reg, index) => ({
      sNo: index + 1,
      playerName: reg.user.name,
      playerEmail: reg.user.email,
      playerPhone: reg.user.phone || 'N/A',
      playerCity: reg.user.city || 'N/A',
      playerState: reg.user.state || 'N/A',
      category: reg.category.name,
      format: reg.category.format,
      gender: reg.category.gender,
      partnerName: reg.partner?.name || 'N/A',
      partnerEmail: reg.partner?.email || 'N/A',
      partnerPhone: reg.partner?.phone || 'N/A',
      partnerConfirmed: reg.partnerConfirmed ? 'Yes' : 'No',
      amountPaid: reg.amountTotal,
      paymentStatus: reg.paymentStatus,
      registrationDate: reg.createdAt.toISOString(),
    }));

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map((row) => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="tournament-${id}-participants.csv"`
      );
      res.send(csv);
    } else {
      // Return JSON
      res.json({
        success: true,
        count: exportData.length,
        participants: exportData,
      });
    }
  } catch (error) {
    console.error('Export participants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export participants',
    });
  }
};

// PUT /api/organizer/tournaments/:id/status - Update tournament status
export const updateTournamentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const organizerId = req.user.id;

    // Validate status
    const validStatuses = ['draft', 'published', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    // Verify tournament belongs to organizer
    const tournament = await prisma.tournament.findFirst({
      where: {
        id,
        organizerId,
      },
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found or unauthorized',
      });
    }

    // Update status
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      message: 'Tournament status updated',
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error('Update tournament status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tournament status',
    });
  }
};


// PUT /api/organizer/registrations/:id/approve - Approve a registration
export const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    console.log('✅ Approving registration:', { registrationId: id, organizerId });

    // Find registration and verify organizer owns the tournament
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        user: { select: { name: true, email: true } },
        category: { select: { name: true } },
      },
    });

    if (!registration) {
      console.log('❌ Registration not found:', id);
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
      });
    }

    console.log('📋 Registration found:', {
      id: registration.id,
      player: registration.user.name,
      tournament: registration.tournament.name,
      currentStatus: registration.status,
      paymentStatus: registration.paymentStatus
    });

    if (registration.tournament.organizerId !== organizerId) {
      console.log('❌ Unauthorized - organizer mismatch');
      return res.status(403).json({
        success: false,
        error: 'Not authorized to manage this registration',
      });
    }

    if (registration.status === 'confirmed') {
      console.log('⚠️ Registration already confirmed');
      return res.status(400).json({
        success: false,
        error: 'Registration is already confirmed',
      });
    }

    // Update registration status
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        status: 'confirmed',
        paymentStatus: 'verified',
      },
    });

    console.log('✅ Registration updated:', {
      id: updatedRegistration.id,
      newStatus: updatedRegistration.status,
      newPaymentStatus: updatedRegistration.paymentStatus
    });

    // Send notification to the player
    await createNotification({
      userId: registration.userId,
      type: 'REGISTRATION_CONFIRMED',
      title: 'Registration Confirmed! 🎉',
      message: `Your registration for "${registration.category.name}" in "${registration.tournament.name}" has been approved. You're all set to compete!`,
    });

    console.log('✅ Notification sent to player');

    res.json({
      success: true,
      message: `Registration approved for ${registration.user.name}`,
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('❌ Approve registration error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to approve registration',
      details: error.message
    });
  }
};

// PUT /api/organizer/registrations/:id/reject - Reject a registration
export const rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const organizerId = req.user.id;

    // Find registration and verify organizer owns the tournament
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        user: { select: { name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
      });
    }

    if (registration.tournament.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to manage this registration',
      });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Registration is already cancelled',
      });
    }

    // Update registration status
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        status: 'cancelled',
        paymentStatus: 'refunded',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Rejected by organizer',
      },
    });

    // Decrement category registration count
    await prisma.category.update({
      where: { id: registration.category.id },
      data: { registrationCount: { decrement: 1 } },
    });

    // Send notification to the player
    await createNotification({
      userId: registration.userId,
      type: 'REGISTRATION_REJECTED',
      title: 'Registration Rejected',
      message: `Your registration for "${registration.category.name}" in "${registration.tournament.name}" has been rejected by the organizer.${reason ? ` Reason: ${reason}` : ''}`,
    });

    res.json({
      success: true,
      message: `Registration rejected for ${registration.user.name}`,
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject registration',
    });
  }
};

// DELETE /api/organizer/registrations/:id - Remove a player from tournament
export const removeRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const organizerId = req.user.id;

    // Find registration and verify organizer owns the tournament
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        user: { select: { name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
      });
    }

    if (registration.tournament.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to manage this registration',
      });
    }

    // Store info before deleting
    const playerUserId = registration.userId;
    const tournamentName = registration.tournament.name;
    const categoryName = registration.category.name;
    const categoryId = registration.category.id;
    const tournamentId = registration.tournamentId;

    // Delete the registration
    await prisma.registration.delete({
      where: { id },
    });

    // Decrement category registration count
    await prisma.category.update({
      where: { id: categoryId },
      data: { registrationCount: { decrement: 1 } },
    });

    // Send notification to the player
    await createNotification({
      userId: playerUserId,
      type: 'REGISTRATION_REMOVED',
      title: 'Removed from Tournament',
      message: `You have been removed from "${categoryName}" in "${tournamentName}" by the organizer.${reason ? ` Reason: ${reason}` : ''}`,
    });

    res.json({
      success: true,
      message: `${registration.user.name} has been removed from ${categoryName}`,
    });
  } catch (error) {
    console.error('Remove registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove registration',
    });
  }
};


// GET /api/organizer/cancellation-requests - Get all cancellation requests for organizer's tournaments
export const getCancellationRequests = async (req, res) => {
  try {
    const organizerId = req.user.id;

    // Get all tournaments owned by this organizer
    const tournaments = await prisma.tournament.findMany({
      where: { organizerId },
      select: { id: true },
    });

    const tournamentIds = tournaments.map(t => t.id);

    // Get all cancellation requests for these tournaments
    const cancellationRequests = await prisma.registration.findMany({
      where: {
        tournamentId: { in: tournamentIds },
        status: 'cancellation_requested',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            format: true,
            gender: true,
          },
        },
      },
      orderBy: { refundRequestedAt: 'desc' },
    });

    res.json({
      success: true,
      count: cancellationRequests.length,
      requests: cancellationRequests,
    });
  } catch (error) {
    console.error('Get cancellation requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cancellation requests',
    });
  }
};

// PUT /api/organizer/registrations/:id/approve-refund - Approve refund request
export const approveRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    // Find registration and verify organizer owns the tournament
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        user: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
      });
    }

    if (registration.tournament.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to manage this registration',
      });
    }

    if (registration.status !== 'cancellation_requested') {
      return res.status(400).json({
        success: false,
        error: 'This registration does not have a pending cancellation request',
      });
    }

    // Update registration - mark as cancelled with approved refund
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        status: 'cancelled',
        refundStatus: 'approved',
        refundProcessedAt: new Date(),
        cancelledAt: new Date(),
        paymentStatus: 'refunded',
      },
    });

    // Decrement category registration count
    await prisma.category.update({
      where: { id: registration.category.id },
      data: { registrationCount: { decrement: 1 } },
    });

    // Send notification to the player
    await createNotification({
      userId: registration.userId,
      type: 'REFUND_APPROVED',
      title: 'Refund Approved! 💰',
      message: `Your refund request for "${registration.category.name}" in "${registration.tournament.name}" has been approved. Amount: ₹${registration.amountTotal}. The organizer will process the refund to your UPI ID: ${registration.refundUpiId}`,
      data: {
        registrationId: registration.id,
        tournamentId: registration.tournamentId,
        tournamentName: registration.tournament.name,
        categoryName: registration.category.name,
        amount: registration.amountTotal,
      },
    });

    res.json({
      success: true,
      message: `Refund approved for ${registration.user.name}. Amount: ₹${registration.amountTotal}`,
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Approve refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve refund',
    });
  }
};

// PUT /api/organizer/registrations/:id/reject-refund - Reject refund request
export const rejectRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const organizerId = req.user.id;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a reason for rejecting the refund',
      });
    }

    // Find registration and verify organizer owns the tournament
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        user: { select: { id: true, name: true, email: true } },
        category: { select: { name: true } },
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
      });
    }

    if (registration.tournament.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to manage this registration',
      });
    }

    if (registration.status !== 'cancellation_requested') {
      return res.status(400).json({
        success: false,
        error: 'This registration does not have a pending cancellation request',
      });
    }

    // Update registration - reject refund but keep registration active
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        status: 'confirmed', // Restore to confirmed status
        refundStatus: 'rejected',
        refundRejectionReason: reason.trim(),
        refundProcessedAt: new Date(),
      },
    });

    // Send notification to the player
    await createNotification({
      userId: registration.userId,
      type: 'REFUND_REJECTED',
      title: 'Refund Request Rejected',
      message: `Your refund request for "${registration.category.name}" in "${registration.tournament.name}" has been rejected. Reason: ${reason.trim()}. Your registration remains active.`,
    });

    res.json({
      success: true,
      message: `Refund rejected for ${registration.user.name}`,
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Reject refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject refund',
    });
  }
};

// PUT /api/organizer/registrations/:id/complete-refund - Mark refund as completed (money sent)
export const completeRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;
    const paymentScreenshotFile = req.file; // Multer file upload

    // Validate payment screenshot is provided
    if (!paymentScreenshotFile) {
      return res.status(400).json({
        success: false,
        error: 'Payment screenshot is required as proof of refund',
      });
    }

    // Find registration and verify organizer owns the tournament
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        user: { select: { id: true, name: true, email: true } },
        category: { select: { name: true } },
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
      });
    }

    if (registration.tournament.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to manage this registration',
      });
    }

    if (registration.refundStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Refund must be approved before marking as completed',
      });
    }

    // Upload payment screenshot to Cloudinary
    let paymentScreenshotUrl = null;
    let paymentScreenshotPublicId = null;

    const cloudinary = (await import('../config/cloudinary.js')).default;
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                    process.env.CLOUDINARY_API_KEY && 
                                    process.env.CLOUDINARY_API_SECRET &&
                                    !process.env.CLOUDINARY_CLOUD_NAME.includes('your-');

    if (isCloudinaryConfigured) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `matchify/refund-payments/${registration.tournamentId}`,
              transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto:good' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(paymentScreenshotFile.buffer);
        });

        paymentScreenshotUrl = result.secure_url;
        paymentScreenshotPublicId = result.public_id;
        console.log('✅ Payment screenshot uploaded to Cloudinary:', paymentScreenshotUrl);
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary upload failed:', cloudinaryError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload payment screenshot. Please try again.',
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        error: 'Cloudinary is not configured. Cannot upload payment screenshot.',
      });
    }

    // Update registration - mark refund as completed with payment proof
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        refundStatus: 'completed',
        refundProcessedAt: new Date(),
        refundPaymentScreenshot: paymentScreenshotUrl,
        refundPaymentScreenshotPublicId: paymentScreenshotPublicId,
      },
    });

    // Send notification to the player
    await createNotification({
      userId: registration.userId,
      type: 'REFUND_COMPLETED',
      title: 'Refund Sent! ✅',
      message: `Your refund of ₹${registration.amountTotal} for "${registration.category.name}" in "${registration.tournament.name}" has been sent to your UPI ID: ${registration.refundUpiId}. Please check your account and confirm receipt.`,
      data: {
        registrationId: registration.id,
        tournamentId: registration.tournamentId,
        amount: registration.amountTotal,
        paymentScreenshot: paymentScreenshotUrl,
      },
    });

    res.json({
      success: true,
      message: `Refund completed for ${registration.user.name}. Amount: ₹${registration.amountTotal}`,
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Complete refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete refund',
    });
  }
};

// GET ORGANIZER PROFILE - Get organizer profile details
export const getOrganizerProfile = async (req, res) => {
  try {
    const organizerId = req.params.id || req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        country: true,
        profilePhoto: true,
        isVerifiedOrganizer: true,
        createdAt: true,
        organizerProfile: {
          select: {
            organization: true,
            tournamentsOrganized: true,
            totalRevenue: true,
            rating: true,
            savedUpiId: true,
            savedAccountHolder: true,
            savedPaymentQRUrl: true,
          }
        },
        _count: {
          select: {
            tournamentsOrganized: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Organizer not found' });
    }

    // Get total registrations across all tournaments
    const tournaments = await prisma.tournament.findMany({
      where: { organizerId },
      select: {
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    const totalParticipants = tournaments.reduce((sum, t) => sum + t._count.registrations, 0);

    // Get revenue stats
    const payments = await prisma.tournamentPayment.findMany({
      where: {
        tournament: {
          organizerId
        }
      },
      select: {
        totalAmount: true,
        payout50Percent1: true,
        payout50Percent2: true,
        payout50Status1: true,
        payout50Status2: true,
      }
    });

    const totalRevenue = payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const paidOut = payments.reduce((sum, p) => {
      let paid = 0;
      if (p.payout50Status1 === 'PAID') paid += p.payout50Percent1 || 0;
      if (p.payout50Status2 === 'PAID') paid += p.payout50Percent2 || 0;
      return sum + paid;
    }, 0);
    const pending = totalRevenue - paidOut;

    res.json({
      success: true,
      profile: {
        ...user,
        organizerProfile: user.organizerProfile || {},
        stats: {
          tournamentsOrganized: user._count.tournamentsOrganized,
          totalParticipants,
          totalRevenue,
          paidOut,
          pendingPayout: pending,
        }
      }
    });
  } catch (error) {
    console.error('Get organizer profile error:', error);
    res.status(500).json({ error: 'Failed to get organizer profile', details: error.message });
  }
};
