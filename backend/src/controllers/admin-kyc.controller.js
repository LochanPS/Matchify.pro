import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// ADMIN KYC ENDPOINTS
// ============================================

/**
 * Get Pending KYCs
 * GET /api/admin/kyc/pending
 */
export const getPendingKYCs = async (req, res) => {
  try {
    const kycs = await prisma.organizerKYC.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const formattedKYCs = kycs.map(kyc => ({
      id: kyc.id,
      organizerId: kyc.organizerId,
      organizerName: kyc.organizer.name,
      organizerEmail: kyc.organizer.email,
      organizerPhone: kyc.organizer.phone,
      aadhaarImageUrl: kyc.aadhaarImageUrl,
      status: kyc.status,
      videoRoomUrl: kyc.videoRoomUrl,
      createdAt: kyc.createdAt,
      videoCallStartedAt: kyc.videoCallStartedAt
    }));

    res.json({
      success: true,
      kycs: formattedKYCs
    });
  } catch (error) {
    console.error('Get pending KYCs error:', error);
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Failed to fetch pending KYCs'
    });
  }
};

/**
 * Approve KYC
 * POST /api/admin/kyc/approve/:kycId
 */
export const approveKYC = async (req, res) => {
  try {
    const { kycId } = req.params;
    const adminId = req.user.id;
    const { adminNotes } = req.body;

    // Verify admin role
    if (!req.user.roles.includes('ADMIN')) {
      return res.status(403).json({
        error: 'UNAUTHORIZED',
        message: 'Only admins can approve KYC'
      });
    }

    // Find KYC
    const kyc = await prisma.organizerKYC.findUnique({
      where: { id: kycId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!kyc) {
      return res.status(404).json({
        error: 'KYC_NOT_FOUND',
        message: 'KYC record not found'
      });
    }

    if (kyc.status === 'APPROVED') {
      return res.status(400).json({
        error: 'ALREADY_APPROVED',
        message: 'KYC is already approved'
      });
    }

    // Update KYC status
    const updatedKYC = await prisma.organizerKYC.update({
      where: { id: kycId },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        videoCallEndedAt: new Date(),
        adminNotes: adminNotes || 'Verified successfully'
      }
    });

    // TODO: Send approval email to organizer
    // await sendKYCApprovalEmail(kyc.organizer);

    // TODO: Delete Daily.co room (cleanup)
    // if (kyc.videoRoomUrl) {
    //   await deleteDailyRoom(kyc.videoRoomUrl);
    // }

    res.json({
      success: true,
      message: 'KYC approved successfully. Organizer can now create tournaments.',
      kyc: {
        id: updatedKYC.id,
        status: updatedKYC.status,
        reviewedAt: updatedKYC.reviewedAt
      }
    });
  } catch (error) {
    console.error('Approve KYC error:', error);
    res.status(500).json({
      error: 'APPROVAL_FAILED',
      message: 'Failed to approve KYC'
    });
  }
};

/**
 * Reject KYC
 * POST /api/admin/kyc/reject/:kycId
 */
export const rejectKYC = async (req, res) => {
  try {
    const { kycId } = req.params;
    const adminId = req.user.id;
    const { rejectionReason, adminNotes } = req.body;

    // Verify admin role
    if (!req.user.roles.includes('ADMIN')) {
      return res.status(403).json({
        error: 'UNAUTHORIZED',
        message: 'Only admins can reject KYC'
      });
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        error: 'REASON_REQUIRED',
        message: 'Rejection reason is required'
      });
    }

    // Find KYC
    const kyc = await prisma.organizerKYC.findUnique({
      where: { id: kycId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!kyc) {
      return res.status(404).json({
        error: 'KYC_NOT_FOUND',
        message: 'KYC record not found'
      });
    }

    // Update KYC status
    const updatedKYC = await prisma.organizerKYC.update({
      where: { id: kycId },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        videoCallEndedAt: new Date(),
        rejectionReason,
        adminNotes: adminNotes || rejectionReason
      }
    });

    // TODO: Send rejection email to organizer
    // await sendKYCRejectionEmail(kyc.organizer, rejectionReason);

    // TODO: Delete Daily.co room (cleanup)
    // if (kyc.videoRoomUrl) {
    //   await deleteDailyRoom(kyc.videoRoomUrl);
    // }

    res.json({
      success: true,
      message: 'KYC rejected. Organizer will be notified.',
      kyc: {
        id: updatedKYC.id,
        status: updatedKYC.status,
        rejectionReason: updatedKYC.rejectionReason,
        reviewedAt: updatedKYC.reviewedAt
      }
    });
  } catch (error) {
    console.error('Reject KYC error:', error);
    res.status(500).json({
      error: 'REJECTION_FAILED',
      message: 'Failed to reject KYC'
    });
  }
};

/**
 * Toggle Admin Availability for KYC
 * PUT /api/admin/availability
 */
export const toggleAvailability = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { availableForKYC } = req.body;

    // Verify admin role
    if (!req.user.roles.includes('ADMIN')) {
      return res.status(403).json({
        error: 'UNAUTHORIZED',
        message: 'Only admins can toggle availability'
      });
    }

    if (typeof availableForKYC !== 'boolean') {
      return res.status(400).json({
        error: 'INVALID_VALUE',
        message: 'availableForKYC must be true or false'
      });
    }

    // Update admin availability
    const updatedUser = await prisma.user.update({
      where: { id: adminId },
      data: { availableForKYC }
    });

    res.json({
      success: true,
      availableForKYC: updatedUser.availableForKYC,
      message: availableForKYC 
        ? 'You are now available for KYC calls' 
        : 'You are no longer available for KYC calls'
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      error: 'UPDATE_FAILED',
      message: 'Failed to update availability'
    });
  }
};

/**
 * Get KYC Statistics (for admin dashboard)
 * GET /api/admin/kyc/stats
 */
export const getKYCStats = async (req, res) => {
  try {
    const stats = await prisma.organizerKYC.groupBy({
      by: ['status'],
      _count: true
    });

    const formattedStats = {
      pending: stats.find(s => s.status === 'PENDING')?._count || 0,
      inProgress: stats.find(s => s.status === 'IN_PROGRESS')?._count || 0,
      approved: stats.find(s => s.status === 'APPROVED')?._count || 0,
      rejected: stats.find(s => s.status === 'REJECTED')?._count || 0,
      total: stats.reduce((sum, s) => sum + s._count, 0)
    };

    res.json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Get KYC stats error:', error);
    res.status(500).json({
      error: 'STATS_FETCH_FAILED',
      message: 'Failed to fetch KYC statistics'
    });
  }
};
