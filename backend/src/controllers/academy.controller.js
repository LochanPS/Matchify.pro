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

    const where = { status: 'approved' };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } }
      ];
    }

    const academies = await prisma.academy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    // Filter by sport if specified
    let filteredAcademies = academies;
    if (sport) {
      filteredAcademies = academies.filter(a => {
        try {
          const sports = JSON.parse(a.sports);
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

    // Notify submitter
    if (academy.submittedBy) {
      await prisma.notification.create({
        data: {
          userId: academy.submittedBy,
          type: 'ACADEMY_APPROVED',
          title: '✅ Academy Approved!',
          message: `Your academy "${academy.name}" has been approved and is now live on Matchify.pro!`,
          data: JSON.stringify({ academyId: id })
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

    const updatedAcademy = await prisma.academy.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: reason || 'Payment not verified',
        reviewedBy: req.user?.id || 'admin',
        reviewedAt: new Date()
      }
    });

    // Notify submitter
    if (academy.submittedBy) {
      await prisma.notification.create({
        data: {
          userId: academy.submittedBy,
          type: 'ACADEMY_REJECTED',
          title: '❌ Academy Submission Rejected',
          message: `Your academy "${academy.name}" was not approved. Reason: ${reason || 'Payment not verified'}`,
          data: JSON.stringify({ academyId: id, reason })
        }
      });
    }

    console.log(`❌ Academy rejected: ${id} - ${academy.name}`);
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