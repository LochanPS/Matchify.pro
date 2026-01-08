import { PrismaClient } from '@prisma/client';
import { createNotification } from '../services/notification.service.js';

const prisma = new PrismaClient();

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

    res.json({
      success: true,
      count: registrations.length,
      registrations,
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

    if (registration.status === 'confirmed') {
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
        paymentStatus: 'completed',
      },
    });

    res.json({
      success: true,
      message: `Registration approved for ${registration.user.name}`,
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve registration',
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
