import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Create academy submission
export const createAcademy = async (req, res) => {
  try {
    const {
      name, address, city, state, pincode,
      sports, sportDetails, description,
      phone, email, website
    } = req.body;

    // Validate required fields
    if (!name || !address || !city || !state || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Parse sports and sportDetails if they're strings
    const parsedSports = typeof sports === 'string' ? sports : JSON.stringify(sports);
    const parsedSportDetails = typeof sportDetails === 'string' ? sportDetails : JSON.stringify(sportDetails);

    // Upload payment screenshot to Cloudinary
    let paymentScreenshotUrl = null;
    if (req.files?.paymentScreenshot?.[0]) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'matchify/academy-payments' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.paymentScreenshot[0].buffer);
      });
      paymentScreenshotUrl = result.secure_url;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Payment screenshot is required'
      });
    }

    // Upload academy photos to Cloudinary
    let photoUrls = [];
    if (req.files?.photos && req.files.photos.length > 0) {
      for (const photo of req.files.photos) {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'matchify/academy-photos' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(photo.buffer);
        });
        photoUrls.push(result.secure_url);
      }
    }

    // Upload academy QR code to Cloudinary
    let academyQrCodeUrl = null;
    if (req.files?.academyQrCode?.[0]) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'matchify/academy-qrcodes' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.academyQrCode[0].buffer);
      });
      academyQrCodeUrl = result.secure_url;
    }


    // Get submitter info from authenticated user or request body
    const submittedBy = req.user?.id || null;
    const submittedByName = req.user?.name || req.body.submitterName || null;
    const submittedByEmail = req.user?.email || req.body.submitterEmail || email;
    const submittedByPhone = req.user?.phone || req.body.submitterPhone || phone;

    // Create academy record
    const academy = await prisma.academy.create({
      data: {
        name,
        address,
        city,
        state,
        pincode: pincode || null,
        sports: parsedSports,
        sportDetails: parsedSportDetails,
        description: description || null,
        phone,
        email: email || null,
        website: website || null,
        photos: JSON.stringify(photoUrls),
        academyQrCode: academyQrCodeUrl,
        paymentScreenshot: paymentScreenshotUrl,
        status: 'pending',
        submittedBy,
        submittedByName,
        submittedByEmail,
        submittedByPhone,
      }
    });

    // Create notification for admin (ADMIN@gmail.com)
    const adminUser = await prisma.user.findFirst({
      where: {
        email: { equals: 'ADMIN@gmail.com', mode: 'insensitive' }
      }
    });

    if (adminUser) {
      await prisma.notification.create({
        data: {
          userId: adminUser.id,
          type: 'ACADEMY_SUBMISSION',
          title: '🏢 New Academy Submission',
          message: `New academy "${name}" from ${city}, ${state} is awaiting approval. Payment: ₹200`,
          data: JSON.stringify({
            academyId: academy.id,
            academyName: name,
            city,
            state,
            phone,
            email: submittedByEmail,
            paymentScreenshot: paymentScreenshotUrl,
            sports: parsedSports,
          })
        }
      });
    }

    console.log(`✅ Academy submission created: ${academy.id} - ${name}`);

    res.status(201).json({
      success: true,
      message: 'Academy submitted successfully! Awaiting admin approval.',
      data: { academyId: academy.id }
    });

  } catch (error) {
    console.error('Error creating academy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit academy'
    });
  }
};


// Get all approved academies (public)
export const getAcademies = async (req, res) => {
  try {
    const { search, city, sport, page = 1, limit = 20 } = req.query;

    // Simple query - just get approved academies
    let where = { status: 'approved' };

    console.log('Fetching approved academies...');

    const academies = await prisma.academy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    console.log(`Found ${academies.length} approved academies`);

    // Filter by city if specified
    let filteredAcademies = academies;
    if (city) {
      filteredAcademies = filteredAcademies.filter(a => 
        a.city?.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Filter by search if specified
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAcademies = filteredAcademies.filter(a => 
        a.name?.toLowerCase().includes(searchLower) ||
        a.city?.toLowerCase().includes(searchLower) ||
        a.state?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by sport if specified
    if (sport) {
      filteredAcademies = filteredAcademies.filter(a => {
        try {
          const sports = JSON.parse(a.sports || '[]');
          return sports.includes(sport);
        } catch {
          return false;
        }
      });
    }

    // Parse JSON fields
    const formattedAcademies = filteredAcademies.map(a => ({
      ...a,
      sports: JSON.parse(a.sports || '[]'),
      sportDetails: JSON.parse(a.sportDetails || '{}'),
      photos: JSON.parse(a.photos || '[]')
    }));

    const total = await prisma.academy.count({ where });

    res.json({
      success: true,
      data: {
        academies: formattedAcademies,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
      }
    });

  } catch (error) {
    console.error('Error fetching academies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch academies' });
  }
};

// Get pending academies (admin only)
export const getPendingAcademies = async (req, res) => {
  try {
    const academies = await prisma.academy.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });

    const formattedAcademies = academies.map(a => ({
      ...a,
      sports: JSON.parse(a.sports || '[]'),
      sportDetails: JSON.parse(a.sportDetails || '{}'),
      photos: JSON.parse(a.photos || '[]')
    }));

    res.json({ success: true, data: { academies: formattedAcademies } });

  } catch (error) {
    console.error('Error fetching pending academies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending academies' });
  }
};


// Approve academy (admin only)
export const approveAcademy = async (req, res) => {
  try {
    const { id } = req.params;

    const academy = await prisma.academy.findUnique({ where: { id } });
    if (!academy) {
      return res.status(404).json({ success: false, error: 'Academy not found' });
    }

    if (academy.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Academy is not pending approval' });
    }

    const updatedAcademy = await prisma.academy.update({
      where: { id },
      data: {
        status: 'approved',
        isVerified: true,
        reviewedBy: req.user?.id || 'admin',
        reviewedAt: new Date()
      }
    });

    // Notify submitter with proper Matchify message
    if (academy.submittedBy) {
      await prisma.notification.create({
        data: {
          userId: academy.submittedBy,
          type: 'ACADEMY_APPROVED',
          title: '🎉 Congratulations! Your Academy is Now Live',
          message: `Great news! Your academy "${academy.name}" has been approved and is now listed on Matchify.pro. Players can now discover your academy and connect with you. Thank you for being part of the Matchify community!`,
          data: JSON.stringify({ 
            academyId: id,
            academyName: academy.name,
            city: academy.city,
            state: academy.state
          })
        }
      });
    }

    console.log(`✅ Academy approved: ${id} - ${academy.name}`);
    res.json({ success: true, message: 'Academy approved successfully', data: { academy: updatedAcademy } });

  } catch (error) {
    console.error('Error approving academy:', error);
    res.status(500).json({ success: false, error: 'Failed to approve academy' });
  }
};

// Reject academy (admin only)
export const rejectAcademy = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const academy = await prisma.academy.findUnique({ where: { id } });
    if (!academy) {
      return res.status(404).json({ success: false, error: 'Academy not found' });
    }

    if (academy.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Academy is not pending approval' });
    }

    const rejectionReason = reason || 'Payment verification failed';

    const updatedAcademy = await prisma.academy.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: rejectionReason,
        reviewedBy: req.user?.id || 'admin',
        reviewedAt: new Date()
      }
    });

    // Notify submitter with proper Matchify message including reason
    if (academy.submittedBy) {
      await prisma.notification.create({
        data: {
          userId: academy.submittedBy,
          type: 'ACADEMY_REJECTED',
          title: '❌ Academy Submission Not Approved',
          message: `We're sorry, but your academy "${academy.name}" could not be approved at this time.\n\n📋 Reason: ${rejectionReason}\n\nIf you believe this was a mistake or would like to resubmit with the correct information, please submit a new application. For any questions, contact us at support@matchify.pro`,
          data: JSON.stringify({ 
            academyId: id, 
            academyName: academy.name,
            reason: rejectionReason,
            city: academy.city,
            state: academy.state
          })
        }
      });
    }

    console.log(`❌ Academy rejected: ${id} - ${academy.name} - Reason: ${rejectionReason}`);
    res.json({ success: true, message: 'Academy rejected', data: { academy: updatedAcademy } });

  } catch (error) {
    console.error('Error rejecting academy:', error);
    res.status(500).json({ success: false, error: 'Failed to reject academy' });
  }
};

// Get single academy
export const getAcademyById = async (req, res) => {
  try {
    const { id } = req.params;
    const academy = await prisma.academy.findUnique({ where: { id } });
    
    if (!academy) {
      return res.status(404).json({ success: false, error: 'Academy not found' });
    }

    res.json({
      success: true,
      data: {
        academy: {
          ...academy,
          sports: JSON.parse(academy.sports || '[]'),
          sportDetails: JSON.parse(academy.sportDetails || '{}'),
          photos: JSON.parse(academy.photos || '[]')
        }
      }
    });

  } catch (error) {
    console.error('Error fetching academy:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch academy' });
  }
};


// Get all academies for admin (includes blocked)
export const getAllAcademiesAdmin = async (req, res) => {
  try {
    const { status, isBlocked, isDeleted } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (isBlocked !== undefined) where.isBlocked = isBlocked === 'true';
    if (isDeleted !== undefined) where.isDeleted = isDeleted === 'true';

    const academies = await prisma.academy.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const formattedAcademies = academies.map(a => ({
      ...a,
      sports: JSON.parse(a.sports || '[]'),
      sportDetails: JSON.parse(a.sportDetails || '{}'),
      photos: JSON.parse(a.photos || '[]')
    }));

    res.json({ success: true, data: { academies: formattedAcademies } });

  } catch (error) {
    console.error('Error fetching all academies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch academies' });
  }
};

// Block academy (admin only)
export const blockAcademy = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const academy = await prisma.academy.findUnique({ where: { id } });
    if (!academy) {
      return res.status(404).json({ success: false, error: 'Academy not found' });
    }

    if (academy.isBlocked) {
      return res.status(400).json({ success: false, error: 'Academy is already blocked' });
    }

    const blockReason = reason || 'Violation of community guidelines';

    const updatedAcademy = await prisma.academy.update({
      where: { id },
      data: {
        isBlocked: true,
        blockReason: blockReason,
        blockedAt: new Date(),
        blockedBy: req.user?.id || 'admin'
      }
    });

    // Notify submitter with proper Matchify message
    if (academy.submittedBy) {
      await prisma.notification.create({
        data: {
          userId: academy.submittedBy,
          type: 'ACADEMY_BLOCKED',
          title: '⚠️ Academy Listing Suspended',
          message: `Your academy "${academy.name}" has been temporarily suspended from Matchify.pro.\n\n📋 Reason: ${blockReason}\n\nYour academy will not be visible to players until this issue is resolved. If you believe this was a mistake, please contact us at support@matchify.pro`,
          data: JSON.stringify({ 
            academyId: id, 
            academyName: academy.name,
            reason: blockReason 
          })
        }
      });
    }

    console.log(`🚫 Academy blocked: ${id} - ${academy.name}`);
    res.json({ success: true, message: 'Academy blocked successfully', data: { academy: updatedAcademy } });

  } catch (error) {
    console.error('Error blocking academy:', error);
    res.status(500).json({ success: false, error: 'Failed to block academy' });
  }
};

// Unblock academy (admin only)
export const unblockAcademy = async (req, res) => {
  try {
    const { id } = req.params;

    const academy = await prisma.academy.findUnique({ where: { id } });
    if (!academy) {
      return res.status(404).json({ success: false, error: 'Academy not found' });
    }

    if (!academy.isBlocked) {
      return res.status(400).json({ success: false, error: 'Academy is not blocked' });
    }

    const updatedAcademy = await prisma.academy.update({
      where: { id },
      data: {
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedBy: null
      }
    });

    // Notify submitter with proper Matchify message
    if (academy.submittedBy) {
      await prisma.notification.create({
        data: {
          userId: academy.submittedBy,
          type: 'ACADEMY_UNBLOCKED',
          title: '🎉 Academy Listing Restored',
          message: `Great news! Your academy "${academy.name}" has been restored and is now visible again on Matchify.pro. Players can once again discover and connect with your academy. Thank you for your patience!`,
          data: JSON.stringify({ 
            academyId: id,
            academyName: academy.name
          })
        }
      });
    }

    console.log(`✅ Academy unblocked: ${id} - ${academy.name}`);
    res.json({ success: true, message: 'Academy unblocked successfully', data: { academy: updatedAcademy } });

  } catch (error) {
    console.error('Error unblocking academy:', error);
    res.status(500).json({ success: false, error: 'Failed to unblock academy' });
  }
};

// Delete academy (admin only)
export const deleteAcademy = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id || 'admin';

    console.log(`🔍 Delete academy request - ID: ${id}, Reason: ${reason}`);

    const academy = await prisma.academy.findUnique({ where: { id } });
    
    if (!academy) {
      console.log(`❌ Academy not found: ${id}`);
      return res.status(404).json({ success: false, error: 'Academy not found' });
    }

    console.log(`✅ Academy found: ${academy.name}`);

    const deletionReason = reason || 'Removed by administrator';

    // Soft delete - mark as deleted instead of removing from database
    await prisma.academy.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: adminId,
        deletionReason: deletionReason,
        status: 'deleted'
      }
    });
    console.log(`✅ Academy soft deleted (moved to deleted list)`);

    // Notify submitter with proper Matchify message including reason
    if (academy.submittedBy) {
      await prisma.notification.create({
        data: {
          userId: academy.submittedBy,
          type: 'ACADEMY_DELETED',
          title: '🗑️ Academy Listing Removed from Matchify.pro',
          message: `Your academy "${academy.name}" has been permanently removed from Matchify.pro.\n\n📋 Reason: ${deletionReason}\n\nIf you have any questions about this action, please contact us at support@matchify.pro`,
          data: JSON.stringify({ 
            academyName: academy.name,
            city: academy.city,
            state: academy.state,
            reason: deletionReason
          })
        }
      });
      console.log(`✅ Notification sent to academy owner`);
    }

    console.log(`🗑️ Academy deleted: ${id} - ${academy.name} - Reason: ${deletionReason}`);
    res.json({ success: true, message: 'Academy deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting academy:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Failed to delete academy' });
  }
};
