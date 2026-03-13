import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { notifyPartnerInvitation } from '../services/notification.service.js';

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
    // Convert server time to IST (India Standard Time, UTC+5:30) for comparison
    const now = new Date();
    
    // Convert UTC to IST by adding 5 hours 30 minutes
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    
    // Get IST time in ISO format without timezone: "2026-01-15T11:30"
    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istTime.getUTCDate()).padStart(2, '0');
    const hours = String(istTime.getUTCHours()).padStart(2, '0');
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    const currentTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    console.log('🕐 Registration Check (IST):', {
      serverTimeUTC: now.toISOString(),
      serverTimeIST: currentTimeString,
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
      // Allow re-registration if previous registration was rejected or cancelled
      const existing = await prisma.registration.findFirst({
        where: {
          userId: userId,
          categoryId: catId,
        },
      });

      if (existing && existing.status !== 'rejected' && existing.status !== 'cancelled') {
        return res.status(400).json({
          success: false,
          error: `Already registered for ${category.name}. Current status: ${existing.status}`,
        });
      }

      // Check if user is already a partner in this category
      const existingAsPartner = await prisma.registration.findFirst({
        where: {
          categoryId: catId,
          partnerId: userId,
          status: {
            in: ['pending', 'confirmed', 'approved'],
          },
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      if (existingAsPartner) {
        return res.status(400).json({
          success: false,
          error: `You are already registered as a partner with ${existingAsPartner.user.name} in ${category.name}`,
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

      // Check if there's an existing rejected/cancelled registration
      const existingRejected = await prisma.registration.findFirst({
        where: {
          userId: userId,
          categoryId: category.id,
        },
      });

      let registration;
      
      if (existingRejected && (existingRejected.status === 'rejected' || existingRejected.status === 'cancelled')) {
        // UPDATE the existing rejected/cancelled registration
        registration = await prisma.registration.update({
          where: {
            id: existingRejected.id,
          },
          data: {
            partnerId,
            partnerEmail: !partnerId && categoryPartnerEmail ? categoryPartnerEmail : null,
            partnerToken,
            amountTotal: category.entryFee,
            amountWallet: 0,
            amountRazorpay: 0,
            paymentStatus: 'pending',
            status: 'pending',
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
      } else {
        // CREATE a new registration
        registration = await prisma.registration.create({
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
      }
      
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
    // Convert server time to IST for comparison
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istTime.getUTCDate()).padStart(2, '0');
    const hours = String(istTime.getUTCHours()).padStart(2, '0');
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    const currentTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    if (currentTimeString >= registration.tournament.startDate) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel after tournament has started',
      });
    }

    // Upload QR code to Cloudinary if provided
    let qrCodeUrl = null;
    if (qrCodeFile) {
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
                folder: `matchify/refund-qr/${registration.tournamentId}`,
                transformation: [
                  { width: 500, height: 500, crop: 'limit' },
                  { quality: 'auto:good' },
                ],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(qrCodeFile.buffer);
          });

          qrCodeUrl = result.secure_url;
          console.log('✅ Refund QR uploaded to Cloudinary:', qrCodeUrl);
        } catch (cloudinaryError) {
          console.error('❌ Cloudinary upload failed for refund QR:', cloudinaryError.message);
          // Continue without QR code - it's optional
        }
      }
    }

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
    // Convert server time to IST (India Standard Time, UTC+5:30) for comparison
    const now = new Date();
    
    // Convert UTC to IST by adding 5 hours 30 minutes
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    
    // Get IST time in ISO format without timezone: "2026-01-15T11:30"
    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istTime.getUTCDate()).padStart(2, '0');
    const hours = String(istTime.getUTCHours()).padStart(2, '0');
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    const currentTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    console.log('🕐 Registration Check (Screenshot - IST):', {
      serverTimeUTC: now.toISOString(),
      serverTimeIST: currentTimeString,
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
      // Allow re-registration if previous registration was rejected or cancelled
      const existing = await prisma.registration.findFirst({
        where: {
          userId: userId,
          categoryId: catId,
        },
      });

      console.log(`📋 Checking registration for category ${category.name} (${catId}):`, {
        exists: !!existing,
        status: existing?.status,
        willBlock: existing && existing.status !== 'rejected' && existing.status !== 'cancelled'
      });

      if (existing && existing.status !== 'rejected' && existing.status !== 'cancelled') {
        console.log(`❌ Blocking registration for ${category.name} - Status: ${existing.status}`);
        return res.status(400).json({
          success: false,
          error: `Already registered for ${category.name}. Current status: ${existing.status}`,
        });
      }

      // Check if user is already a partner in this category
      const existingAsPartner = await prisma.registration.findFirst({
        where: {
          categoryId: catId,
          partnerId: userId,
          status: {
            in: ['pending', 'confirmed', 'approved'],
          },
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      console.log(`🤝 Checking if user is partner in ${category.name}:`, {
        isPartner: !!existingAsPartner,
        partnerOf: existingAsPartner?.user?.name
      });

      if (existingAsPartner) {
        console.log(`❌ Blocking registration - User is already a partner with ${existingAsPartner.user.name}`);
        return res.status(400).json({
          success: false,
          error: `You are already registered as a partner with ${existingAsPartner.user.name} in ${category.name}`,
        });
      }

      console.log(`✅ Registration allowed for ${category.name}`);
      totalAmount += category.entryFee;
      categories.push(category);
    }

    // Upload screenshot to Cloudinary
    let screenshotUrl = null;
    const cloudinary = (await import('../config/cloudinary.js')).default;
    
    // Check if Cloudinary is configured
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                    process.env.CLOUDINARY_API_KEY && 
                                    process.env.CLOUDINARY_API_SECRET &&
                                    !process.env.CLOUDINARY_CLOUD_NAME.includes('your-');

    if (isCloudinaryConfigured) {
      try {
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `matchify/payment-screenshots/${tournamentId}`,
              transformation: [
                { width: 1200, height: 1600, crop: 'limit' },
                { quality: 'auto:good' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(screenshotFile.buffer);
        });

        screenshotUrl = result.secure_url;
        console.log('✅ Screenshot uploaded to Cloudinary:', screenshotUrl);
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary upload failed:', cloudinaryError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload payment screenshot. Please try again.',
        });
      }
    } else {
      console.error('❌ Cloudinary not configured - cannot upload screenshot');
      return res.status(500).json({
        success: false,
        error: 'Image upload service not configured. Please contact support.',
      });
    }

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

      // Check if there's an existing rejected/cancelled registration
      const existingRejected = await prisma.registration.findFirst({
        where: {
          userId: userId,
          categoryId: category.id,
        },
      });

      console.log(`🔍 Checking for existing registration:`, {
        userId,
        categoryId: category.id,
        categoryName: category.name,
        found: !!existingRejected,
        status: existingRejected?.status,
        willUpdate: existingRejected && (existingRejected.status === 'rejected' || existingRejected.status === 'cancelled')
      });

      let registration;
      
      if (existingRejected && (existingRejected.status === 'rejected' || existingRejected.status === 'cancelled')) {
        // UPDATE the existing rejected/cancelled registration
        console.log(`🔄 UPDATING existing ${existingRejected.status} registration ${existingRejected.id}`);
        
        registration = await prisma.registration.update({
          where: {
            id: existingRejected.id,
          },
          data: {
            partnerId,
            partnerEmail: !partnerId && categoryPartnerEmail ? categoryPartnerEmail : null,
            partnerToken,
            amountTotal: category.entryFee,
            amountWallet: 0,
            amountRazorpay: 0,
            paymentScreenshot: screenshotUrl,
            paymentStatus: 'submitted', // Screenshot submitted, awaiting verification
            status: 'pending', // Reset to pending
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
        
        console.log(`✅ Registration UPDATED to pending:`, {
          id: registration.id,
          status: registration.status,
          paymentStatus: registration.paymentStatus
        });
      } else {
        // CREATE a new registration
        console.log(`➕ CREATING new registration for category ${category.name}`);
        
        registration = await prisma.registration.create({
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
      }
      
      registrations.push(registration);

      // Create or Update PaymentVerification record for admin to review
      const existingPaymentVerification = await prisma.paymentVerification.findUnique({
        where: { registrationId: registration.id }
      });

      console.log(`🔍 PaymentVerification check for registration ${registration.id}:`, {
        exists: !!existingPaymentVerification,
        currentStatus: existingPaymentVerification?.status,
        willUpdate: !!existingPaymentVerification
      });

      if (existingPaymentVerification) {
        // UPDATE existing payment verification - RESET TO PENDING
        console.log(`🔄 UPDATING PaymentVerification ${existingPaymentVerification.id} from ${existingPaymentVerification.status} to pending`);
        
        const updated = await prisma.paymentVerification.update({
          where: { registrationId: registration.id },
          data: {
            amount: category.entryFee,
            paymentScreenshot: screenshotUrl,
            status: 'pending',
            rejectionReason: null,
            verifiedBy: null,
            verifiedAt: null,
          },
        });
        
        console.log(`✅ PaymentVerification UPDATED successfully:`, {
          id: updated.id,
          status: updated.status,
          amount: updated.amount
        });
      } else {
        // CREATE new payment verification
        console.log(`➕ CREATING new PaymentVerification for registration ${registration.id}`);
        
        const created = await prisma.paymentVerification.create({
          data: {
            registrationId: registration.id,
            tournamentId,
            userId,
            amount: category.entryFee,
            paymentScreenshot: screenshotUrl,
            status: 'pending',
          },
        });
        
        console.log(`✅ PaymentVerification CREATED successfully:`, {
          id: created.id,
          status: created.status,
          amount: created.amount
        });
      }

      // Update category registration count only if it's a new registration
      if (!existingRejected) {
        await prisma.category.update({
          where: { id: category.id },
          data: { registrationCount: { increment: 1 } },
        });
      }
    }

    // Notify ADMIN (not organizer) about new registration for payment verification
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        roles: {
          contains: 'ADMIN'
        }
      }
    });

    if (adminUser) {
      // Create notification for ADMIN
      await prisma.notification.create({
        data: {
          userId: adminUser.id,
          type: 'PAYMENT_VERIFICATION_REQUIRED',
          title: 'New Registration - Payment Verification Required',
          message: `${currentUser.name} has registered for ${tournament.name} (₹${totalAmount}). Please verify their payment screenshot.`,
          data: JSON.stringify({
            registrationIds: registrations.map(r => r.id),
            playerName: currentUser.name,
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            amount: totalAmount,
            paymentScreenshot: screenshotUrl,
          }),
        },
      });
      console.log('✅ Admin notification created for payment verification');
    } else {
      console.warn('⚠️ No admin user found to send notification');
    }

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

    // If payment verified, increment tournament registration count for player verification
    if (status === 'verified') {
      const { incrementTournamentRegistration } = await import('../services/verification.service.js');
      await incrementTournamentRegistration(registration.userId);
    }

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

// GET /api/registrations/partner-by-code/:playerCode - Get partner info by player code
const getPartnerByCode = async (req, res) => {
  try {
    const { playerCode } = req.params;

    // Validate player code format: #ABC1234
    if (!/^#[A-Z]{3}\d{4}$/i.test(playerCode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid player code format. Use #ABC1234 (# + 3 letters + 4 numbers)'
      });
    }

    // Find user by player code
    const user = await prisma.user.findUnique({
      where: { playerCode: playerCode.toUpperCase() },
      select: {
        id: true,
        name: true,
        email: true,
        playerCode: true,
        phone: true,
        city: true,
        state: true,
        profilePhoto: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No player found with this code'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching partner by code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch partner information'
    });
  }
};

export { createRegistration, createRegistrationWithScreenshot, getMyRegistrations, cancelRegistration, verifyPayment, getPartnerByCode };
