import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { createDailyRoom, deleteDailyRoom } from '../utils/daily.js';
import sgMail from '@sendgrid/mail';

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
    }
  }
});

export { upload };

// ============================================
// ORGANIZER KYC ENDPOINTS
// ============================================

/**
 * Upload Aadhaar to Cloudinary
 * POST /api/kyc/upload-aadhaar
 */
export const uploadAadhaar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'NO_FILE',
        message: 'Please upload a file'
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'kyc/aadhaar',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.json({
      success: true,
      imageUrl: result.secure_url
    });
  } catch (error) {
    console.error('Aadhaar upload error:', error);
    res.status(500).json({
      error: 'UPLOAD_FAILED',
      message: 'Failed to upload image'
    });
  }
};

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

    // Create Daily.co room
    const roomName = `kyc-${kyc.id}-${Date.now()}`;
    const dailyRoom = await createDailyRoom(roomName);
    const roomUrl = dailyRoom.url;

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


/**
 * Submit Phone Number with Aadhaar (Step 1 of KYC)
 * POST /api/kyc/submit-phone
 */
export const submitPhoneAndAadhaar = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { phone, aadhaarImageUrl } = req.body;

    if (!phone || !aadhaarImageUrl) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Phone number and Aadhaar image are required'
      });
    }

    // Validate Indian phone number
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        error: 'INVALID_PHONE',
        message: 'Please enter a valid 10-digit Indian phone number'
      });
    }

    // Check if KYC already exists
    const existingKYC = await prisma.organizerKYC.findUnique({
      where: { organizerId }
    });

    if (existingKYC && existingKYC.status === 'APPROVED') {
      return res.status(400).json({
        error: 'KYC_ALREADY_APPROVED',
        message: 'You have already completed KYC verification'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create or update KYC record
    const kyc = await prisma.organizerKYC.upsert({
      where: { organizerId },
      update: {
        phone,
        aadhaarImageUrl,
        phoneOTP: otp,
        phoneOTPGeneratedAt: new Date(),
        phoneOTPVerified: false,
        status: 'PENDING'
      },
      create: {
        organizerId,
        phone,
        aadhaarImageUrl,
        phoneOTP: otp,
        phoneOTPGeneratedAt: new Date(),
        phoneOTPVerified: false,
        status: 'PENDING'
      }
    });

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { email: true, name: true }
    });

    // Try to send OTP via email (SendGrid)
    let emailSent = false;
    if (process.env.SENDGRID_API_KEY && user.email) {
      try {
        const msg = {
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@matchify.pro',
          subject: 'Your Matchify KYC Verification OTP',
          text: `Hello ${user.name},\n\nYour OTP for KYC phone verification is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nMatchify.pro Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">Matchify.pro - KYC Verification</h2>
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>Your OTP for KYC phone verification is:</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <h1 style="color: #7c3aed; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              </div>
              <p style="color: #ef4444;"><strong>This OTP is valid for 10 minutes.</strong></p>
              <p>If you didn't request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 12px;">Best regards,<br>Matchify.pro Team</p>
            </div>
          `
        };
        
        await sgMail.send(msg);
        emailSent = true;
        console.log('OTP email sent successfully to:', user.email);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Continue even if email fails - admin can send manually
      }
    }

    res.json({
      success: true,
      message: emailSent 
        ? `OTP sent to your email (${user.email}). Please check your inbox.`
        : 'Phone number and Aadhaar submitted. Admin will send OTP to your phone.',
      kycId: kyc.id,
      emailSent,
      fallbackToManual: !emailSent
    });
  } catch (error) {
    console.error('Submit phone and Aadhaar error:', error);
    res.status(500).json({
      error: 'SUBMIT_FAILED',
      message: 'Failed to submit phone and Aadhaar'
    });
  }
};

/**
 * Verify OTP entered by organizer
 * POST /api/kyc/verify-otp
 */
export const verifyOTP = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { otp } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({
        error: 'INVALID_OTP',
        message: 'Please enter a valid 6-digit OTP'
      });
    }

    // Find KYC record
    const kyc = await prisma.organizerKYC.findUnique({
      where: { organizerId }
    });

    if (!kyc) {
      return res.status(404).json({
        error: 'KYC_NOT_FOUND',
        message: 'KYC record not found'
      });
    }

    if (kyc.phoneOTPVerified) {
      return res.status(400).json({
        error: 'ALREADY_VERIFIED',
        message: 'Phone number already verified'
      });
    }

    if (!kyc.phoneOTP) {
      return res.status(400).json({
        error: 'NO_OTP',
        message: 'No OTP generated. Please submit phone number first.'
      });
    }

    // Check if OTP expired (10 minutes)
    const otpAge = Date.now() - new Date(kyc.phoneOTPGeneratedAt).getTime();
    if (otpAge > 10 * 60 * 1000) {
      return res.status(400).json({
        error: 'OTP_EXPIRED',
        message: 'OTP has expired. Please request a new one from admin.'
      });
    }

    // Verify OTP
    if (otp !== kyc.phoneOTP) {
      return res.status(400).json({
        error: 'INVALID_OTP',
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Mark as verified
    await prisma.organizerKYC.update({
      where: { id: kyc.id },
      data: {
        phoneOTPVerified: true,
        phoneOTPVerifiedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Phone number verified successfully! You can now proceed with KYC.'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      error: 'VERIFY_FAILED',
      message: 'Failed to verify OTP'
    });
  }
};

/**
 * Check if phone is verified
 * GET /api/kyc/phone-status
 */
export const getPhoneStatus = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const kyc = await prisma.organizerKYC.findUnique({
      where: { organizerId },
      select: {
        phone: true,
        phoneOTPVerified: true,
        phoneOTPVerifiedAt: true
      }
    });

    if (!kyc) {
      return res.json({
        success: true,
        phoneVerified: false,
        phone: null
      });
    }

    res.json({
      success: true,
      phoneVerified: kyc.phoneOTPVerified,
      phone: kyc.phone,
      verifiedAt: kyc.phoneOTPVerifiedAt
    });
  } catch (error) {
    console.error('Get phone status error:', error);
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Failed to fetch phone status'
    });
  }
};
