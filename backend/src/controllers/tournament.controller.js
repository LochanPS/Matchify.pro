import { PrismaClient } from '@prisma/client';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';

const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/tournaments - Create tournament (Steps 1-2)
const createTournament = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId; // Support both formats
    const userRole = req.user.role;
    const userRoles = req.user.roles; // Multi-role support

    // Check if user has ORGANIZER role (support both single and multi-role)
    const hasOrganizerRole = userRoles 
      ? (Array.isArray(userRoles) ? userRoles.includes('ORGANIZER') : userRoles === 'ORGANIZER')
      : userRole === 'ORGANIZER';

    if (!hasOrganizerRole) {
      return res.status(403).json({
        success: false,
        error: 'Only organizers can create tournaments'
      });
    }

    // Tournament creation is FREE - no credits required

    const {
      // Step 1: Basic Info
      name,
      description,
      venue,
      address,
      city,
      state,
      pincode,
      zone,
      country = 'India',
      format, // singles, doubles, both
      privacy = 'public',
      
      // Step 2: Dates
      registrationOpenDate,
      registrationCloseDate,
      startDate,
      endDate,
    } = req.body;

    // Validation
    const errors = [];

    if (!name || name.trim().length < 3) {
      errors.push('Tournament name must be at least 3 characters');
    }
    if (!description || description.trim().length < 20) {
      errors.push('Description must be at least 20 characters');
    }
    if (!venue || !address || !city || !state || !pincode) {
      errors.push('All location fields are required');
    }
    if (!zone || !['North', 'South', 'East', 'West', 'Central', 'Northeast'].includes(zone)) {
      errors.push('Invalid zone. Must be: North, South, East, West, Central, or Northeast');
    }
    if (!format || !['singles', 'doubles', 'both'].includes(format)) {
      errors.push('Invalid format. Must be: singles, doubles, or both');
    }

    // Date validations
    const regOpen = new Date(registrationOpenDate);
    const regClose = new Date(registrationCloseDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    // Set now to start of current minute for fair comparison
    now.setSeconds(0, 0);

    // Registration can open today (same day allowed)
    if (regOpen < now) {
      errors.push('Registration open date cannot be in the past');
    }
    // Registration close must be on or after open
    if (regClose < regOpen) {
      errors.push('Registration close date must be on or after registration open date');
    }
    // Tournament start must be on or after registration close
    if (start < regClose) {
      errors.push('Tournament start date must be on or after registration close date');
    }
    // Tournament end must be on or after start
    if (end < start) {
      errors.push('Tournament end date must be on or after start date');
    }

    // Check if end date is more than 30 days from start (reasonable limit)
    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    if (daysDiff > 30) {
      errors.push('Tournament duration cannot exceed 30 days');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Create tournament (FREE - no credits deducted)
    const result = await prisma.$transaction(async (tx) => {
      // Create tournament
      const tournament = await tx.tournament.create({
        data: {
          organizerId: userId,
          name: name.trim(),
          description: description.trim(),
          venue: venue.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          zone,
          country,
          format,
          privacy,
          registrationOpenDate: regOpen,
          registrationCloseDate: regClose,
          startDate: start,
          endDate: end,
          status: 'draft', // Will be published later
        },
      });

      return tournament;
    });

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully.',
      tournament: {
        id: result.id,
        name: result.name,
        city: result.city,
        startDate: result.startDate,
        status: result.status,
      }
    });
   
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ success: false, error: 'Failed to create tournament' });
  }
};

// GET /api/tournaments - Get all tournaments with comprehensive filtering
const getTournaments = async (req, res) => {
  try {
    const { 
      // Pagination
      page = 1, 
      limit = 20,
      
      // Location filters
      city, 
      state, 
      zone,
      country,
      
      // Date filters
      startDate,
      endDate,
      registrationOpen, // true/false - only show tournaments with open registration
      
      // Status filter (can be comma-separated: "draft,published")
      status,
      
      // Format filter
      format,
      
      // Privacy filter
      privacy,
      
      // Search
      search,
      
      // Sorting
      sortBy = 'startDate',
      sortOrder = 'asc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = {};

    // Build base filters
    const baseFilters = {};

    // Location filters (case-insensitive for SQLite)
    if (city) {
      baseFilters.city = { contains: city };
    }
    if (state) {
      baseFilters.state = { contains: state };
    }
    if (zone) {
      baseFilters.zone = zone;
    }
    if (country) {
      baseFilters.country = { contains: country };
    }

    // Date range filter (tournaments starting between startDate and endDate)
    if (startDate || endDate) {
      baseFilters.startDate = {};
      if (startDate) {
        baseFilters.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        baseFilters.startDate.lte = new Date(endDate);
      }
    }

    // Registration open filter
    if (registrationOpen === 'true') {
      const now = new Date();
      baseFilters.registrationOpenDate = { lte: now };
      baseFilters.registrationCloseDate = { gte: now };
      baseFilters.status = { in: ['draft', 'published'] }; // Only show upcoming tournaments
    }

    // Status filter (can be multiple: "draft,published,ongoing")
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      baseFilters.status = { in: statuses };
    }
    // Removed default status filter - show all tournaments by default

    // Format filter
    if (format) {
      baseFilters.format = format;
    }

    // Privacy filter
    if (privacy) {
      baseFilters.privacy = privacy;
    }
    // Removed default privacy filter - show all tournaments by default

    // Search by name, description, venue, or city
    if (search) {
      where = {
        AND: [
          baseFilters,
          {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
              { venue: { contains: search } },
              { city: { contains: search } },
            ],
          },
        ],
      };
    } else {
      where = baseFilters;
    }

    // Sorting
    const orderBy = {};
    const validSortFields = ['startDate', 'endDate', 'createdAt', 'name', 'city'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'startDate';
    orderBy[sortField] = sortOrder === 'desc' ? 'desc' : 'asc';

    // Fetch tournaments with related data
    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          posters: {
            orderBy: { displayOrder: 'asc' },
            take: 1, // Only get primary poster for list view
          },
          categories: {
            select: {
              id: true,
              name: true,
              format: true,
              gender: true,
              entryFee: true,
              maxParticipants: true,
              registrationCount: true,
            },
          },
          _count: {
            select: {
              categories: true,
              registrations: true,
            },
          },
        },
      }),
      prisma.tournament.count({ where }),
    ]);

    // Calculate min/max entry fees for each tournament
    const tournamentsWithPricing = tournaments.map(tournament => {
      const fees = tournament.categories.map(cat => cat.entryFee);
      const minFee = fees.length > 0 ? Math.min(...fees) : 0;
      const maxFee = fees.length > 0 ? Math.max(...fees) : 0;

      // Calculate registration status
      const now = new Date();
      const isRegistrationOpen = 
        new Date(tournament.registrationOpenDate) <= now &&
        new Date(tournament.registrationCloseDate) >= now;

      return {
        ...tournament,
        minEntryFee: minFee,
        maxEntryFee: maxFee,
        isRegistrationOpen,
        daysUntilStart: Math.ceil((new Date(tournament.startDate) - now) / (1000 * 60 * 60 * 24)),
      };
    });

    res.json({
      success: true,
      data: {
        tournaments: tournamentsWithPricing,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
        filters: {
          city,
          state,
          zone,
          country,
          status,
          format,
          privacy,
          search,
          startDate,
          endDate,
          registrationOpen,
        },
      },
    });
  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tournaments' });
  }
};

// GET /api/tournaments/:id - Get single tournament
const getTournament = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        posters: {
          orderBy: { displayOrder: 'asc' },
        },
        categories: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    res.json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tournament' });
  }
};

// PUT /api/tournaments/:id - Update tournament
const updateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if tournament exists and user is the organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can update this tournament',
      });
    }

    const {
      name,
      description,
      venue,
      address,
      city,
      state,
      pincode,
      zone,
      format,
      privacy,
      status,
      registrationOpenDate,
      registrationCloseDate,
      startDate,
      endDate,
    } = req.body;

    // Build update data
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (venue) updateData.venue = venue.trim();
    if (address) updateData.address = address.trim();
    if (city) updateData.city = city.trim();
    if (state) updateData.state = state.trim();
    if (pincode) updateData.pincode = pincode.trim();
    if (zone) updateData.zone = zone;
    if (format) updateData.format = format;
    if (privacy) updateData.privacy = privacy;
    if (status) updateData.status = status;
    if (registrationOpenDate) updateData.registrationOpenDate = new Date(registrationOpenDate);
    if (registrationCloseDate) updateData.registrationCloseDate = new Date(registrationCloseDate);
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error('Update tournament error:', error);
    res.status(500).json({ success: false, error: 'Failed to update tournament' });
  }
};

// DELETE /api/tournaments/:id - Delete tournament
const deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if tournament exists and user is the organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        posters: true,
      },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can delete this tournament',
      });
    }

    // Delete posters from Cloudinary
    if (tournament.posters.length > 0) {
      const deletePromises = tournament.posters.map((poster) =>
        cloudinary.uploader.destroy(poster.publicId)
      );
      await Promise.all(deletePromises);
    }

    // Delete tournament (cascade will delete posters, categories, registrations)
    await prisma.tournament.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Tournament deleted successfully',
    });
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete tournament' });
  }
};

// POST /api/tournaments/:id/posters - Upload tournament posters
const uploadPosters = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    // Check if tournament exists and user is the organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can upload posters'
      });
    }

    // Check if files exist
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    // Limit to 5 posters
    if (req.files.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 posters allowed per tournament'
      });
    }

    // Upload each file to Cloudinary
    const uploadPromises = req.files.map((file, index) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `matchify/tournaments/${id}`,
            transformation: [
              { width: 1200, height: 1600, crop: 'limit' },
              { quality: 'auto:good' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve({
              imageUrl: result.secure_url,
              publicId: result.public_id,
              displayOrder: index,
            });
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const uploadResults = await Promise.all(uploadPromises);

    // Save posters to database
    await prisma.tournamentPoster.createMany({
      data: uploadResults.map((result) => ({
        tournamentId: id,
        imageUrl: result.imageUrl,
        publicId: result.publicId,
        displayOrder: result.displayOrder,
      })),
    });

    // Fetch created posters
    const createdPosters = await prisma.tournamentPoster.findMany({
      where: { tournamentId: id },
      orderBy: { displayOrder: 'asc' },
    });

    res.status(201).json({
      success: true,
      message: `${createdPosters.length} poster(s) uploaded successfully`,
      posters: createdPosters,
    });
   
  } catch (error) {
    console.error('Upload posters error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload posters' });
  }
};

// ==================== CATEGORY ENDPOINTS ====================

// POST /api/tournaments/:id/categories - Create category
const createCategory = async (req, res) => {
  try {
    const { id } = req.params; // tournament ID
    const userId = req.user.id;

    // Validate tournament exists and user is organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can add categories'
      });
    }

    const {
      name,
      format,
      ageGroup,
      gender,
      entryFee,
      maxParticipants,
      scoringFormat = '21x3',
      prizeWinner,
      prizeRunnerUp,
      prizeSemiFinalist,
      prizeDescription,
    } = req.body;

    // Validation
    const errors = [];

    if (!name || name.trim().length < 3) {
      errors.push('Category name must be at least 3 characters');
    }
    if (!format || !['singles', 'doubles'].includes(format)) {
      errors.push('Format must be singles or doubles');
    }
    if (!gender || !['men', 'women', 'mixed', 'MALE', 'FEMALE', 'OPEN'].includes(gender)) {
      errors.push('Invalid gender value');
    }
    if (entryFee === undefined || entryFee < 0) {
      errors.push('Entry fee must be 0 or greater');
    }
    if (maxParticipants && maxParticipants < 2) {
      errors.push('Max participants must be at least 2');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Normalize gender values
    let normalizedGender = gender.toLowerCase();
    if (gender === 'MALE') normalizedGender = 'men';
    if (gender === 'FEMALE') normalizedGender = 'women';
    if (gender === 'OPEN') normalizedGender = 'mixed';

    // Create category
    const category = await prisma.category.create({
      data: {
        tournamentId: id,
        name: name.trim(),
        format,
        ageGroup: ageGroup || null,
        gender: normalizedGender,
        entryFee: parseFloat(entryFee),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        scoringFormat,
        prizeWinner: prizeWinner ? parseFloat(prizeWinner) : null,
        prizeRunnerUp: prizeRunnerUp ? parseFloat(prizeRunnerUp) : null,
        prizeSemiFinalist: prizeSemiFinalist ? parseFloat(prizeSemiFinalist) : null,
        prizeDescription: prizeDescription || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
};

// GET /api/tournaments/:id/categories - Get all categories for a tournament
const getCategories = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const categories = await prisma.category.findMany({
      where: { tournamentId: id },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      count: categories.length,
      categories,
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
};

// PUT /api/tournaments/:id/categories/:categoryId - Update category
const updateCategory = async (req, res) => {
  try {
    const { id, categoryId } = req.params;
    const userId = req.user.id;

    // Validate tournament exists and user is organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can update categories'
      });
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory || existingCategory.tournamentId !== id) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const {
      name,
      format,
      ageGroup,
      gender,
      entryFee,
      maxParticipants,
      scoringFormat,
      status,
      prizeWinner,
      prizeRunnerUp,
      prizeSemiFinalist,
      prizeDescription,
    } = req.body;

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (format !== undefined) updateData.format = format;
    if (ageGroup !== undefined) updateData.ageGroup = ageGroup || null;
    if (prizeWinner !== undefined) updateData.prizeWinner = prizeWinner ? parseFloat(prizeWinner) : null;
    if (prizeRunnerUp !== undefined) updateData.prizeRunnerUp = prizeRunnerUp ? parseFloat(prizeRunnerUp) : null;
    if (prizeSemiFinalist !== undefined) updateData.prizeSemiFinalist = prizeSemiFinalist ? parseFloat(prizeSemiFinalist) : null;
    if (prizeDescription !== undefined) updateData.prizeDescription = prizeDescription || null;
    if (gender !== undefined) {
      let normalizedGender = gender.toLowerCase();
      if (gender === 'MALE') normalizedGender = 'men';
      if (gender === 'FEMALE') normalizedGender = 'women';
      if (gender === 'OPEN') normalizedGender = 'mixed';
      updateData.gender = normalizedGender;
    }
    if (entryFee !== undefined) updateData.entryFee = parseFloat(entryFee);
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants ? parseInt(maxParticipants) : null;
    if (scoringFormat !== undefined) updateData.scoringFormat = scoringFormat;
    if (status !== undefined) updateData.status = status;

    // Update category
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      category,
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
};

// DELETE /api/tournaments/:id/categories/:categoryId - Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id, categoryId } = req.params;
    const userId = req.user.id;

    // Validate tournament exists and user is organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can delete categories'
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    });

    if (!category || category.tournamentId !== id) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Check if category has registrations
    if (category._count.registrations > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category with ${category._count.registrations} registration(s). Cancel registrations first.`
      });
    }

    // Delete category
    await prisma.category.delete({
      where: { id: categoryId },
    });

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};

// POST /api/tournaments/:id/payment-qr - Upload payment QR code
const uploadPaymentQR = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if tournament exists and user is the organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can upload payment QR'
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Get UPI ID and account holder name from body
    const { upiId, accountHolderName } = req.body;

    let paymentQRUrl = null;
    let paymentQRPublicId = null;

    // Try Cloudinary upload, fallback to base64 if not configured
    try {
      // Check if Cloudinary is properly configured
      const cloudinaryConfigured = process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_KEY !== 'your-cloudinary-api-key';
      
      if (cloudinaryConfigured) {
        // Delete old QR from Cloudinary if exists
        if (tournament.paymentQRPublicId) {
          try {
            await cloudinary.uploader.destroy(tournament.paymentQRPublicId);
          } catch (err) {
            console.error('Error deleting old QR:', err);
          }
        }

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `matchify/tournaments/${id}/payment`,
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
          uploadStream.end(req.file.buffer);
        });

        paymentQRUrl = result.secure_url;
        paymentQRPublicId = result.public_id;
      } else {
        // Fallback: Store as base64 data URL
        const base64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/png';
        paymentQRUrl = `data:${mimeType};base64,${base64}`;
        paymentQRPublicId = null;
      }
    } catch (cloudinaryError) {
      console.error('Cloudinary error, using base64 fallback:', cloudinaryError.message);
      // Fallback: Store as base64 data URL
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype || 'image/png';
      paymentQRUrl = `data:${mimeType};base64,${base64}`;
      paymentQRPublicId = null;
    }

    // Update tournament with QR info
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        paymentQRUrl,
        paymentQRPublicId,
        upiId: upiId || null,
        accountHolderName: accountHolderName || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Payment QR uploaded successfully',
      paymentQR: {
        url: updatedTournament.paymentQRUrl,
        upiId: updatedTournament.upiId,
        accountHolderName: updatedTournament.accountHolderName,
      },
    });

  } catch (error) {
    console.error('Upload payment QR error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload payment QR' });
  }
};

// PUT /api/tournaments/:id/payment-info - Update payment info (UPI ID, account holder)
const updatePaymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { upiId, accountHolderName } = req.body;

    // Check if tournament exists and user is the organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can update payment info'
      });
    }

    // Update tournament
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        upiId: upiId !== undefined ? upiId : tournament.upiId,
        accountHolderName: accountHolderName !== undefined ? accountHolderName : tournament.accountHolderName,
      },
    });

    res.json({
      success: true,
      message: 'Payment info updated successfully',
      paymentInfo: {
        upiId: updatedTournament.upiId,
        accountHolderName: updatedTournament.accountHolderName,
        paymentQRUrl: updatedTournament.paymentQRUrl,
      },
    });

  } catch (error) {
    console.error('Update payment info error:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment info' });
  }
};

export {
  createTournament,
  getTournaments,
  getTournament,
  updateTournament,
  deleteTournament,
  uploadPosters,
  uploadPaymentQR,
  updatePaymentInfo,
  upload, // Export multer middleware
  // Category endpoints
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
