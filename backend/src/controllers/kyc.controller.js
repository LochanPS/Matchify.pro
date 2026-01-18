import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// ============================================
// ORGANIZER KYC ENDPOINTS
// ============================================

/**
 * Submit KYC - Upload Aadhaar and create KYC record
 * POST /api/kyc/submit
 */
export const submitKYC = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { aadhaarImageUrl, aadhaarNumber } = req.body;

    // Check if organizer already has KYC
    const existingKYC = await prisma.organizerKYC.findUnique({
      where: { organizerId }
    });

    // If already approved, don't allow resubmission
    if (existingKYC && existingKYC.status === 'APPROVED') {
      return res.status(400).json({
        error: 'KYC_ALREADY_APPROVED',
        message: 'You have already completed KYC verification'
      });
    }

    // If rejected, allow resubmission by updating existing record
    if (existingKYC && existingKYC.status === 'REJECTED') {
      const updatedKYC = await prisma.organizerKYC.update({
        where: { id: existingKYC.id },
        data: {
          aadhaarImageUrl,
          aadhaarNumber: aadhaarNumber || null,
          status: 'PENDING',
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
          videoRoomUrl: null,
          videoCallStartedAt: null,
          videoCallEndedAt: null
        }
      });

      return res.json({
        success: true,
        kycId: updatedKYC.id,
        status: 'PENDING',
        message: 'KYC resubmitted successfully. You can now request video verification.'
      });
    }

    // Create new KYC record
    const kyc = await prisma.organizerKYC.create({
      data: {
        organizerId,
        aadhaarImageUrl,
        aadhaarNumber: aadhaarNumber || null,
        status: 'PENDING'
      }
    });

    res.json({
      success: true,
      kycId: kyc.id,
      status: 'PENDING',
      message: 'KYC submitted. You can now request video verification.'
    });
  } catch (error) {
    console.error('Submit KYC error:', error);
    res.status(500).json({
      error: 'SUBMISSION_FAILED',
      message: 'Failed to submit KYC. Please try again.'
    });
  }
};

/**
 * Request Video Call - Find available admin and create Daily.co room
 * POST /api/kyc/request-call
 */
export const requestVideoCall = async (req, res) => {
  try {
    const organizerId = req.user.id;

    // Find organizer's KYC
    const kyc = await prisma.organizerKYC.findUnique({
      where: { organizerId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!kyc) {
      return res.status(404).json({
        error: 'KYC_NOT_FOUND',
        message: 'Please submit KYC first'
      });
    }

    if (kyc.status === 'APPROVED') {
      return res.status(400).json({
        error: 'KYC_ALREADY_APPROVED',
        message: 'Your KYC is already approved'
      });
    }

    if (kyc.status === 'IN_PROGRESS' && kyc.videoRoomUrl) {
      // Allow rejoining existing call
      return res.json({
        success: true,
        roomUrl: kyc.videoRoomUrl,
        message: 'Rejoining existing video call'
      });
    }

    // Find available admin
    const availableAdmin = await prisma.user.findFirst({
      where: {
        roles: {
          contains: 'ADMIN'
        },
        availableForKYC: true
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!availableAdmin) {
      return res.status(503).json({
        error: 'NO_ADMIN_AVAILABLE',
        message: 'No admin is currently available. Please try again in a few minutes.'
      });
    }

    // Create Daily.co room (placeholder - will implement after getting API key)
    const roomName = `kyc-${kyc.id}-${Date.now()}`;
    const roomUrl = `https://matchify.daily.co/${roomName}`; // Placeholder

    // TODO: Implement actual Daily.co API call when API key is available
    // const dailyResponse = await createDailyRoom(roomName);
    // const roomUrl = dailyResponse.url;

    // Update KYC record
    const updatedKYC = await prisma.organizerKYC.update({
      where: { id: kyc.id },
      data: {
        status: 'IN_PROGRESS',
        videoCallStartedAt: new Date(),
        videoRoomUrl: roomUrl
      }
    });

    // Send Socket.io notification to admin (will implement in socket setup)
    // notifyAdmin(availableAdmin.id, { ...kyc, roomUrl });

    res.json({
      success: true,
      roomUrl,
      adminName: availableAdmin.name,
      message: 'Connecting to admin... Please join the video call.'
    });
  } catch (error) {
    console.error('Request video call error:', error);
    res.status(500).json({
      error: 'CALL_REQUEST_FAILED',
      message: 'Failed to request video call. Please try again.'
    });
  }
};

/**
 * Get KYC Status
 * GET /api/kyc/status
 */
export const getKYCStatus = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const kyc = await prisma.organizerKYC.findUnique({
      where: { organizerId },
      include: {
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!kyc) {
      return res.json({
        status: null,
        message: 'No KYC submitted yet'
      });
    }

    res.json({
      status: kyc.status,
      aadhaarImageUrl: kyc.aadhaarImageUrl,
      videoRoomUrl: kyc.videoRoomUrl,
      reviewedAt: kyc.reviewedAt,
      rejectionReason: kyc.rejectionReason,
      reviewer: kyc.reviewer,
      createdAt: kyc.createdAt
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      error: 'STATUS_FETCH_FAILED',
      message: 'Failed to fetch KYC status'
    });
  }
};

/**
 * Rejoin Video Call
 * POST /api/kyc/rejoin-call
 */
export const rejoinCall = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const kyc = await prisma.organizerKYC.findUnique({
      where: { organizerId }
    });

    if (!kyc) {
      return res.status(404).json({
        error: 'KYC_NOT_FOUND',
        message: 'No KYC found'
      });
    }

    if (kyc.status === 'IN_PROGRESS' && kyc.videoRoomUrl) {
      return res.json({
        success: true,
        roomUrl: kyc.videoRoomUrl,
        message: 'Rejoining video call'
      });
    }

    res.status(400).json({
      error: 'NO_ACTIVE_CALL',
      message: 'No active video call to rejoin'
    });
  } catch (error) {
    console.error('Rejoin call error:', error);
    res.status(500).json({
      error: 'REJOIN_FAILED',
      message: 'Failed to rejoin call'
    });
  }
};
