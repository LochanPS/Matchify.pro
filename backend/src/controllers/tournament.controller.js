import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import notificationService from '../services/notificationService.js';
import { cacheGet, cacheSet, cacheDel } from '../services/redisService.js';
import tournamentPointsService from '../services/tournamentPoints.service.js';
import { PLATFORM_FEE_PERCENT } from '../config/constants.js';

// Configure multer for memory storage
// fileSize limit: 4 MB per file — stays under Vercel's 4.5 MB serverless body limit.
// Without a limit, oversized uploads cause Vercel to close the connection before the
// handler runs, which axios surfaces as "Network Error" (no response at all).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 5 }, // 4 MB per file, max 5 files
});

// Helper function to generate empty draw structure
function generateEmptyDraw(format, bracketSize) {
  // Ensure bracket size is at least 2 and a power of 2
  let size = Math.max(2, bracketSize);
  // Round up to next power of 2
  size = Math.pow(2, Math.ceil(Math.log2(size)));
  
  if (format === 'ROUND_ROBIN') {
    // Generate empty round robin structure
    const participants = [];
    for (let i = 0; i < size; i++) {
      participants.push({
        id: null,
        name: `Slot ${i + 1}`,
        seed: i + 1,
        wins: 0,
        losses: 0,
        points: 0
      });
    }
    
    // Create empty results matrix
    const results = participants.map(() => participants.map(() => null));
    
    return {
      format: 'ROUND_ROBIN',
      bracketSize: size,
      totalParticipants: 0,
      participants,
      results
    };
  }
  
  // Generate empty knockout bracket
  const numRounds = Math.log2(size);
  const rounds = [];
  
  for (let round = 0; round < numRounds; round++) {
    const numMatches = size / Math.pow(2, round + 1);
    const matches = [];
    
    for (let i = 0; i < numMatches; i++) {
      if (round === 0) {
        // First round - show slot numbers
        matches.push({
          matchNumber: i + 1,
          player1: { id: null, name: `Slot ${i * 2 + 1}`, seed: i * 2 + 1 },
          player2: { id: null, name: `Slot ${i * 2 + 2}`, seed: i * 2 + 2 },
          score1: null,
          score2: null,
          winner: null
        });
      } else {
        // Later rounds - TBD
        matches.push({
          matchNumber: i + 1,
          player1: { id: null, name: 'TBD', seed: null },
          player2: { id: null, name: 'TBD', seed: null },
          score1: null,
          score2: null,
          winner: null
        });
      }
    }
    
    rounds.push({ roundNumber: round + 1, matches });
  }
  
  return {
    format: 'KNOCKOUT',
    bracketSize: size,
    totalParticipants: 0,
    rounds
  };
}

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
      contactPhone,
      whatsappNumber,

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
    // Store dates as strings to completely avoid timezone conversion
    // Input: "2026-01-15T14:00" → Store exactly as is
    console.log('📅 Storing dates as strings (no conversion)');
    console.log('Registration Open:', registrationOpenDate);
    console.log('Registration Close:', registrationCloseDate);
    console.log('Start:', startDate);
    console.log('End:', endDate);

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

    // Get Matchify payment settings for QR code
    const paymentSettings = await prisma.paymentSettings.findFirst({
      where: { isActive: true }
    });

    // Create tournament (FREE - no credits deducted)
    const result = await prisma.$transaction(async (tx) => {
      // Create tournament with Matchify QR code
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
          registrationOpenDate: registrationOpenDate,  // Store as string
          registrationCloseDate: registrationCloseDate, // Store as string
          startDate: startDate,                    // Store as string
          endDate: endDate,                        // Store as string
          status: 'draft', // Will be published later
          shuttleType: req.body.shuttleType || null,
          shuttleBrand: req.body.shuttleBrand || null,
          contactPhone: contactPhone?.trim() || null,
          whatsappNumber: whatsappNumber?.trim() || null,
          // Use Matchify payment QR code
          paymentQRUrl: paymentSettings?.qrCodeUrl || null,
          upiId: paymentSettings?.upiId || null,
          accountHolderName: paymentSettings?.accountHolder || null,
        },
      });

      // Create tournament payment tracking
      await tx.tournamentPayment.create({
        data: {
          tournamentId: tournament.id,
          organizerId: userId,
          platformFeePercent: PLATFORM_FEE_PERCENT,
        }
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
      
      // Organizer filter - if true, show all tournaments for the organizer (including drafts)
      myTournaments,

      // Tab filter - 'upcoming' or 'completed'
      tab,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = {};

    // Build base filters
    const baseFilters = {};

    // If this is NOT a "myTournaments" request, only show published tournaments
    // This ensures public discovery only shows published tournaments
    if (myTournaments !== 'true') {
      baseFilters.status = 'published';
    }

    // If user is authenticated and requesting their tournaments, filter by organizer
    if (myTournaments === 'true' && req.user) {
      const userId = req.user.id || req.user.userId;
      baseFilters.organizerId = userId;
      // Remove the published-only filter for organizer's own tournaments
      delete baseFilters.status;
    }

    // Tab filter - overrides default status filter
    if (tab === 'completed') {
      baseFilters.status = 'completed';
    } else if (tab === 'upcoming' || (!tab && myTournaments !== 'true')) {
      // upcoming = published (not completed, not draft)
      baseFilters.status = 'published';
    }

    // Location filters (case-insensitive — PostgreSQL requires mode: 'insensitive')
    if (city) {
      baseFilters.city = { contains: city, mode: 'insensitive' };
    }
    if (state) {
      baseFilters.state = { contains: state, mode: 'insensitive' };
    }
    if (zone) {
      baseFilters.zone = zone;
    }
    if (country) {
      baseFilters.country = { contains: country, mode: 'insensitive' };
    }

    // Date range filter — startDate stored as String (YYYY-MM-DD), use string comparison
    if (startDate || endDate) {
      baseFilters.startDate = {};
      if (startDate) baseFilters.startDate.gte = startDate;
      if (endDate)   baseFilters.startDate.lte = endDate;
    }

    // Registration open filter
    if (registrationOpen === 'true') {
      if (!baseFilters.status) {
        baseFilters.status = { in: ['draft', 'published'] };
      }
    }

    // Status filter — only apply if tab not set (tab takes priority)
    if (status && !tab) {
      const statuses = status.split(',').map(s => s.trim());
      baseFilters.status = { in: statuses };
    }

    // Format filter
    if (format) {
      baseFilters.format = format;
    }

    // Privacy filter
    if (privacy) {
      baseFilters.privacy = privacy;
    }

    // Search by name, description, venue, or city (case-insensitive)
    if (search) {
      where = {
        AND: [
          baseFilters,
          {
            OR: [
              { name:        { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { venue:       { contains: search, mode: 'insensitive' } },
              { city:        { contains: search, mode: 'insensitive' } },
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
      // Convert server time to IST (India Standard Time, UTC+5:30) for comparison
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);
      const year = istTime.getUTCFullYear();
      const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(istTime.getUTCDate()).padStart(2, '0');
      const hours = String(istTime.getUTCHours()).padStart(2, '0');
      const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
      const currentTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      const isRegistrationOpen = 
        currentTimeString >= tournament.registrationOpenDate && 
        currentTimeString <= tournament.registrationCloseDate;

      return {
        ...tournament,
        minEntryFee: minFee,
        maxEntryFee: maxFee,
        isRegistrationOpen,
        daysUntilStart: Math.ceil((new Date(tournament.startDate) - now) / (1000 * 60 * 60 * 24)),
      };
    });

    // Apply registration open filter in memory if needed
    let filteredTournaments = tournamentsWithPricing;
    if (registrationOpen === 'true') {
      filteredTournaments = tournamentsWithPricing.filter(t => t.isRegistrationOpen);
    }

    res.json({
      success: true,
      data: {
        tournaments: filteredTournaments,
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

// GET /api/tournaments/:id - Get single tournament (cached 30s)
const getTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `tournament:${id}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        posters: { orderBy: { displayOrder: 'asc' } },
        categories: { orderBy: { createdAt: 'asc' } },
        _count: { select: { registrations: true } },
      },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const result = { success: true, data: tournament };
    await cacheSet(cacheKey, result, 30); // 30s TTL — short enough to stay fresh

    res.json(result);
  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tournament' });
  }
};

// PUT /api/tournaments/:id - Update tournament
const updateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user.userId;

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
      contactPhone,
      whatsappNumber,
    } = req.body;

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (venue !== undefined) updateData.venue = venue.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (state !== undefined) updateData.state = state.trim();
    if (pincode !== undefined) updateData.pincode = pincode.trim();
    if (zone !== undefined) updateData.zone = zone;
    if (format !== undefined) updateData.format = format;
    if (privacy !== undefined) updateData.privacy = privacy;
    if (status !== undefined) updateData.status = status;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone?.trim() || null;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber?.trim() || null;
    
    // Store dates as strings - no conversion needed
    if (registrationOpenDate) updateData.registrationOpenDate = registrationOpenDate;
    if (registrationCloseDate) updateData.registrationCloseDate = registrationCloseDate;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: updateData,
    });

    // Bust tournament cache so next fetch gets fresh data
    await cacheDel(`tournament:${id}`);

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
    const userId = req.user.userId || req.user.id;
    const { reason } = req.body; // Get cancellation reason from request body

    // Determine if caller is admin
    const callerRoles = req.user.roles || [req.user.role];
    const callerIsAdmin = callerRoles.includes('ADMIN');

    // Check if tournament exists and user is the organizer (or admin)
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        posters: true,
        registrations: {
          include: {
            user: {
              select: { id: true, email: true, name: true }
            }
          }
        }
      },
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    // Admin can delete any tournament; organizer can only delete their own
    if (!callerIsAdmin && tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can delete this tournament',
      });
    }

    // Require cancellation reason if there are registrations AND caller is not admin
    if (!callerIsAdmin && tournament.registrations.length > 0 && !reason) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a reason for cancelling the tournament as there are registered participants',
      });
    }

    // Notify all registered participants about the cancellation
    if (tournament.registrations.length > 0) {
      // Get unique users (a user might have multiple registrations for different categories)
      // Filter out guest registrations (userId is null)
      const uniqueUserIds = [...new Set(
        tournament.registrations
          .filter(r => r.userId !== null) // Only include registrations with actual user accounts
          .map(r => r.userId)
      )];
      
      // Create notifications for all participants (only those with user accounts)
      if (uniqueUserIds.length > 0) {
        const notificationPromises = uniqueUserIds.map(participantId => 
          prisma.notification.create({
            data: {
              userId: participantId,
              type: 'TOURNAMENT_CANCELLED',
              title: 'Tournament Cancelled',
              message: `The tournament "${tournament.name}" has been cancelled by the organizer.`,
              data: JSON.stringify({
                tournamentId: id,
                tournamentName: tournament.name,
                reason: reason || 'No reason provided'
              }),
              read: false
            }
          })
        );
        
        await Promise.all(notificationPromises);
        console.log(`Sent cancellation notifications to ${uniqueUserIds.length} participants`);
      }
      
      // Log guest registrations that won't receive notifications
      const guestCount = tournament.registrations.filter(r => r.userId === null).length;
      if (guestCount > 0) {
        console.log(`Note: ${guestCount} guest registrations will not receive notifications`);
      }
    }

    // Try to delete posters from Cloudinary (don't fail if it errors)
    if (tournament.posters.length > 0) {
      try {
        const deletePromises = tournament.posters.map((poster) =>
          cloudinary.uploader.destroy(poster.publicId).catch(err => {
            console.log(`Failed to delete poster ${poster.publicId} from Cloudinary:`, err.message);
          })
        );
        await Promise.all(deletePromises);
      } catch (cloudinaryError) {
        console.log('Cloudinary deletion failed, continuing with tournament deletion:', cloudinaryError.message);
      }
    }

    // Delete tournament (cascade will delete posters, categories, registrations)
    await prisma.tournament.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Tournament deleted successfully',
      notifiedParticipants: tournament.registrations.length > 0 ? [...new Set(tournament.registrations.map(r => r.userId))].length : 0
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
    const userId = req.user.id || req.user.userId;

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

    // Check if Cloudinary is properly configured (not placeholder values)
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                    process.env.CLOUDINARY_API_KEY && 
                                    process.env.CLOUDINARY_API_SECRET &&
                                    !process.env.CLOUDINARY_CLOUD_NAME.includes('your-') &&
                                    !process.env.CLOUDINARY_API_KEY.includes('your-') &&
                                    !process.env.CLOUDINARY_API_SECRET.includes('your-');

    let uploadResults = [];

    if (isCloudinaryConfigured) {
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

      uploadResults = await Promise.all(uploadPromises);
    } else {
      // Local file storage fallback
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'posters', id);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      uploadResults = req.files.map((file, index) => {
        const filename = `poster_${Date.now()}_${index}${path.extname(file.originalname) || '.jpg'}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, file.buffer);
        
        return {
          imageUrl: `/uploads/posters/${id}/${filename}`,
          publicId: `local_${id}_${filename}`,
          displayOrder: index,
        };
      });
    }

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

// DELETE /api/tournaments/:id/posters/:posterId - Delete a tournament poster
const deletePoster = async (req, res) => {
  try {
    const { id, posterId } = req.params;
    const userId = req.user.id || req.user.userId;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    if (tournament.organizerId !== userId) return res.status(403).json({ success: false, error: 'Not authorized' });

    const poster = await prisma.tournamentPoster.findUnique({ where: { id: posterId } });
    if (!poster || poster.tournamentId !== id) return res.status(404).json({ success: false, error: 'Poster not found' });

    // Delete from Cloudinary if it's a cloud URL
    if (poster.publicId && !poster.publicId.startsWith('local_')) {
      try { await cloudinary.uploader.destroy(poster.publicId); } catch (e) { /* ignore */ }
    }

    await prisma.tournamentPoster.delete({ where: { id: posterId } });

    res.json({ success: true, message: 'Poster deleted successfully' });
  } catch (error) {
    console.error('Delete poster error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete poster' });
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

    // Get tournament format from request (default to KNOCKOUT)
    const tournamentFormat = req.body.tournamentFormat || 'KNOCKOUT';

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
        tournamentFormat: tournamentFormat,
        scoringFormat,
        prizeWinner: prizeWinner ? parseFloat(prizeWinner) : null,
        prizeRunnerUp: prizeRunnerUp ? parseFloat(prizeRunnerUp) : null,
        prizeSemiFinalist: prizeSemiFinalist ? parseFloat(prizeSemiFinalist) : null,
        prizeDescription: prizeDescription || null,
      },
    });

    // Auto-generate empty draw based on tournament format
    const bracketSize = maxParticipants ? parseInt(maxParticipants) : 4;
    const drawData = generateEmptyDraw(tournamentFormat, bracketSize);
    
    await prisma.draw.create({
      data: {
        tournamentId: id,
        categoryId: category.id,
        format: tournamentFormat,
        bracketJson: JSON.stringify(drawData)
      }
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

    // Check if category exists and get registration count
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        registrations: true // Include registrations to check if any exist
      }
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
      tournamentFormat,
      scoringFormat,
      status,
      prizeWinner,
      prizeRunnerUp,
      prizeSemiFinalist,
      prizeDescription,
    } = req.body;

    // Check if entry fee is being changed and if there are existing registrations
    if (entryFee !== undefined && parseFloat(entryFee) !== existingCategory.entryFee) {
      if (existingCategory.registrations.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot change entry fee after registrations have started',
          details: `This category has ${existingCategory.registrations.length} existing registration(s). Entry fees are locked once players register to maintain fairness and prevent confusion.`,
          currentFee: existingCategory.entryFee,
          attemptedFee: parseFloat(entryFee),
          registrationCount: existingCategory.registrations.length,
          feeLocked: true
        });
      }
    }

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
    
    // Only allow entry fee change if no registrations exist
    if (entryFee !== undefined) {
      updateData.entryFee = parseFloat(entryFee);
    }
    
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants ? parseInt(maxParticipants) : null;
    if (tournamentFormat !== undefined) updateData.tournamentFormat = tournamentFormat;
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
      feeLocked: existingCategory.registrations.length > 0,
      registrationCount: existingCategory.registrations.length
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
    const userId = req.user.id || req.user.userId;

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

    // Check if Cloudinary is properly configured (not placeholder values)
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                    process.env.CLOUDINARY_API_KEY && 
                                    process.env.CLOUDINARY_API_SECRET &&
                                    !process.env.CLOUDINARY_CLOUD_NAME.includes('your-') &&
                                    !process.env.CLOUDINARY_API_KEY.includes('your-') &&
                                    !process.env.CLOUDINARY_API_SECRET.includes('your-');

    if (isCloudinaryConfigured) {
      try {
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
      } catch (cloudinaryError) {
        console.error('Cloudinary error:', cloudinaryError.message);
        // Fall through to local storage
      }
    }
    
    // Local file storage fallback
    if (!paymentQRUrl) {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'payment-qr', id);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `qr_${Date.now()}${path.extname(req.file.originalname) || '.png'}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, req.file.buffer);
      
      paymentQRUrl = `/uploads/payment-qr/${id}/${filename}`;
      paymentQRPublicId = `local_${id}_${filename}`;
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

// POST /api/tournaments/:id/umpires - Add umpire by code
const addUmpireByCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { umpireCode } = req.body;
    const userId = req.user.id;

    // Validate Matchify.pro ID format: #1, #2, #100, ... (or legacy #A10000)
    const isNewFormat = /^#\d+$/.test(umpireCode);
    const isOldFormat = /^#[A-Z]\d{5}$/i.test(umpireCode);
    if (!umpireCode || (!isNewFormat && !isOldFormat)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Matchify.pro ID. Format: #1, #2, #100 etc.'
      });
    }

    // Get tournament and verify ownership
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, organizerId: true, name: true }
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can add umpires'
      });
    }

    // Find user by matchifyCode (universal Matchify.pro ID)
    const umpire = await prisma.user.findFirst({
      where: {
        matchifyCode: umpireCode
      },
      select: {
        id: true,
        name: true,
        email: true,
        matchifyCode: true,
        profilePhoto: true,
        roles: true
      }
    });

    if (!umpire) {
      return res.status(404).json({
        success: false,
        error: 'No user found with this Matchify.pro ID. Please check and try again.'
      });
    }

    // Verify the user has the UMPIRE role (roles stored as comma-separated string)
    const userRoles = umpire.roles ? umpire.roles.split(',').map(r => r.trim().toUpperCase()) : [];
    if (!userRoles.includes('UMPIRE')) {
      return res.status(400).json({
        success: false,
        error: 'This user does not have the Umpire role. They must register as an umpire first.'
      });
    }

    // Check if umpire is already added to this tournament
    const existingUmpire = await prisma.tournamentUmpire.findUnique({
      where: {
        tournamentId_umpireId: {
          tournamentId: id,
          umpireId: umpire.id
        }
      }
    });

    if (existingUmpire) {
      return res.status(400).json({
        success: false,
        error: 'This umpire is already added to the tournament'
      });
    }

    // Add umpire to tournament
    await prisma.tournamentUmpire.create({
      data: {
        tournamentId: id,
        umpireId: umpire.id
      }
    });

    // Get organizer name for the notification
    const organizer = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    // Send elaborate notification to umpire
    await notificationService.createNotification({
      userId: umpire.id,
      type: 'UMPIRE_ADDED',
      title: '🎾 You\'ve Been Selected as an Umpire!',
      message: `Great news! ${organizer?.name || 'The tournament organizer'} has added you as an official umpire for "${tournament.name}". You'll be responsible for officiating matches, keeping scores, and ensuring fair play. Head over to the tournament page to view match schedules and prepare for your assignments. We're counting on you to make this tournament a success!`,
      data: {
        tournamentId: id,
        tournamentName: tournament.name,
        organizerName: organizer?.name,
        actionUrl: `/tournaments/${id}`
      },
      sendEmail: true
    });

    res.json({
      success: true,
      message: `${umpire.name} has been added as an umpire`,
      umpire: {
        id: umpire.id,
        name: umpire.name,
        email: umpire.email,
        umpireCode: umpire.matchifyCode,
        profilePhoto: umpire.profilePhoto
      }
    });
  } catch (error) {
    console.error('Add umpire error:', error);
    res.status(500).json({ success: false, error: 'Failed to add umpire' });
  }
};

// GET /api/tournaments/:id/umpires - Get tournament umpires
const getTournamentUmpires = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        umpires: {
          include: {
            umpire: {
              select: {
                id: true,
                name: true,
                email: true,
                matchifyCode: true,
                profilePhoto: true,
                umpireProfile: {
                  select: {
                    matchesUmpired: true,
                    certification: true,
                    rating: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const umpires = tournament.umpires.map(tu => ({
      id: tu.umpire.id,
      name: tu.umpire.name,
      email: tu.umpire.email,
      umpireCode: tu.umpire.matchifyCode,
      profilePhoto: tu.umpire.profilePhoto,
      addedAt: tu.addedAt,
      matchesUmpired: tu.umpire.umpireProfile?.matchesUmpired || 0,
      certification: tu.umpire.umpireProfile?.certification,
      rating: tu.umpire.umpireProfile?.rating
    }));

    res.json({ success: true, umpires });
  } catch (error) {
    console.error('Get tournament umpires error:', error);
    res.status(500).json({ success: false, error: 'Failed to get umpires' });
  }
};

// DELETE /api/tournaments/:id/umpires/:umpireId - Remove umpire from tournament
const removeUmpire = async (req, res) => {
  try {
    const { id, umpireId } = req.params;
    const userId = req.user.id;

    // Get tournament and verify ownership
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, organizerId: true, name: true }
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the tournament organizer can remove umpires'
      });
    }

    // Check if umpire exists in tournament
    const tournamentUmpire = await prisma.tournamentUmpire.findUnique({
      where: {
        tournamentId_umpireId: {
          tournamentId: id,
          umpireId: umpireId
        }
      },
      include: {
        umpire: {
          select: { name: true }
        }
      }
    });

    if (!tournamentUmpire) {
      return res.status(404).json({
        success: false,
        error: 'Umpire not found in this tournament'
      });
    }

    // Remove umpire from tournament
    await prisma.tournamentUmpire.delete({
      where: {
        tournamentId_umpireId: {
          tournamentId: id,
          umpireId: umpireId
        }
      }
    });

    // Send notification to umpire
    await prisma.notification.create({
      data: {
        userId: umpireId,
        type: 'UMPIRE_REMOVED',
        title: 'Removed from Tournament',
        message: `You have been removed as an umpire from "${tournament.name}"`,
        data: JSON.stringify({
          tournamentId: id,
          tournamentName: tournament.name
        }),
        read: false
      }
    });

    res.json({
      success: true,
      message: `${tournamentUmpire.umpire.name} has been removed from the tournament`
    });
  } catch (error) {
    console.error('Remove umpire error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove umpire' });
  }
};

/**
 * Get registrations for a specific category
 * GET /api/tournaments/:tournamentId/categories/:categoryId/registrations
 */
const getCategoryRegistrations = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;

    // Get registrations for this category
    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId,
        categoryId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Format registrations to include guest data
    const formattedRegistrations = registrations.map(reg => ({
      ...reg,
      displayName: reg.userId && reg.user ? reg.user.name : (reg.guestName || 'Unknown'),
      displayEmail: reg.userId && reg.user ? reg.user.email : (reg.guestEmail || null),
      displayPhone: reg.userId && reg.user ? reg.user.phone : (reg.guestPhone || null),
      isGuest: !reg.userId
    }));

    res.json({
      success: true,
      registrations: formattedRegistrations,
      totalCount: formattedRegistrations.length,
      confirmedCount: formattedRegistrations.filter(r => r.status === 'confirmed').length
    });
  } catch (error) {
    console.error('Get category registrations error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
  }
};

export {
  createTournament,
  getTournaments,
  getTournament,
  updateTournament,
  deleteTournament,
  uploadPosters,
  deletePoster,
  uploadPaymentQR,
  updatePaymentInfo,
  upload, // Export multer middleware
  // Category endpoints
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  // Umpire endpoints
  addUmpireByCode,
  getTournamentUmpires,
  removeUmpire,
  // Registration endpoints
  getCategoryRegistrations,
};

/**
 * End tournament - Mark as completed
 * PUT /api/tournaments/:id/end
 */
export const endTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        categories: {
          select: { id: true, name: true }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const isOrganizer = tournament.organizerId === userId;
    const hasAdminRole = req.user.roles?.includes('admin') || req.user.role === 'ADMIN';

    if (!isOrganizer && !hasAdminRole) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Update tournament status to completed
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: { status: 'completed', updatedAt: new Date() }
    });

    // Award points to all categories in this tournament
    console.log(`🏆 Tournament ended: ${tournament.name}`);
    console.log(`📊 Awarding points for ${tournament.categories.length} categories...`);
    
    const pointsResults = [];
    for (const category of tournament.categories) {
      try {
        const categoryPoints = await tournamentPointsService.awardTournamentPoints(id, category.id);
        pointsResults.push({
          categoryId: category.id,
          categoryName: category.name,
          playersAwarded: categoryPoints?.length || 0,
          success: true
        });
        console.log(`✅ Points awarded for category: ${category.name} (${categoryPoints?.length || 0} players)`);
      } catch (error) {
        console.error(`❌ Error awarding points for category ${category.name}:`, error);
        pointsResults.push({
          categoryId: category.id,
          categoryName: category.name,
          success: false,
          error: error.message
        });
      }
    }

    res.json({ 
      success: true, 
      message: 'Tournament ended successfully and points awarded', 
      tournament: updatedTournament,
      pointsAwarded: pointsResults
    });
  } catch (error) {
    console.error('End tournament error:', error);
    res.status(500).json({ success: false, error: 'Failed to end tournament' });
  }
};

/**
 * End a specific category (not entire tournament)
 * PUT /api/tournaments/:tournamentId/categories/:categoryId/end
 */
export const endCategory = async (req, res) => {
  console.log('🎯🎯🎯 END CATEGORY FUNCTION CALLED! 🎯🎯🎯');
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('Request params:', req.params);
  console.log('Request URL:', req.url);
  
  try {
    const { tournamentId, categoryId } = req.params;
    const userId = req.user.userId || req.user.id;

    // Verify tournament exists and user is authorized
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    console.log('7. Tournament found:', tournament ? 'YES' : 'NO');

    if (!tournament) {
      console.log('❌ Tournament not found');
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    const isOrganizer = tournament.organizerId === userId;
    const hasAdminRole = req.user.roles?.includes('admin') || req.user.role === 'ADMIN';

    console.log('8. Is organizer:', isOrganizer);
    console.log('9. Has admin role:', hasAdminRole);

    if (!isOrganizer && !hasAdminRole) {
      console.log('❌ Not authorized');
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Get category
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    console.log('10. Category found:', category ? 'YES' : 'NO');
    console.log('11. Category name:', category?.name);
    console.log('12. Category status:', category?.status);

    if (!category || category.tournamentId !== tournamentId) {
      console.log('❌ Category not found or wrong tournament');
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Check if already completed
    if (category.status === 'completed') {
      console.log('❌ Category already completed');
      return res.status(400).json({ 
        success: false, 
        error: `Category '${category.name}' is already completed` 
      });
    }

    // Update category status to completed
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { status: 'completed', updatedAt: new Date() }
    });

    console.log('✅ Category status updated to completed');

    // Award points ONLY for this category
    console.log(`🏆 Category ended: ${category.name} (${tournament.name})`);
    console.log(`📊 Awarding points for this category...`);
    
    let pointsResult;
    try {
      const categoryPoints = await tournamentPointsService.awardTournamentPoints(tournamentId, categoryId);
      pointsResult = {
        categoryId: category.id,
        categoryName: category.name,
        playersAwarded: categoryPoints?.length || 0,
        success: true
      };
      console.log(`✅ Points awarded: ${categoryPoints?.length || 0} players`);
    } catch (error) {
      console.error(`❌ Error awarding points:`, error);
      pointsResult = {
        categoryId: category.id,
        categoryName: category.name,
        success: false,
        error: error.message
      };
    }

    console.log('✅ Sending success response');
    res.json({ 
      success: true, 
      message: `Category '${category.name}' ended successfully and points awarded`, 
      category: updatedCategory,
      pointsAwarded: pointsResult
    });
  } catch (error) {
    console.error('❌ End category error:', error);
    res.status(500).json({ success: false, error: 'Failed to end category' });
  }
};
