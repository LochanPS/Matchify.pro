import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createTournament = async (req, res) => {
  try {
    const userRoles = req.user.roles || [];
    if (!userRoles.includes('ORGANIZER')) {
      return res.status(403).json({ error: 'Only organizers can create tournaments' });
    }

    const {
      name, description, venue, address, city, state, country,
      startDate, endDate, registrationCloseDate, format, privacy, maxParticipants
    } = req.body;

    if (!name || !venue || !city || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name, description, venue, address, city, state, country,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationCloseDate: new Date(registrationCloseDate),
        format: format || 'SINGLES',
        privacy: privacy || 'public',
        totalCourts: maxParticipants || 64,
        organizerId: req.user.userId,
        status: 'draft',
      },
    });

    // Update organizer profile
    await prisma.organizerProfile.update({
      where: { userId: req.user.userId },
      data: { tournamentsOrganized: { increment: 1 } },
    });

    res.status(201).json({ message: 'Tournament created', tournament });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
};

export const getAllTournaments = async (req, res) => {
  try {
    const { city, state, status, format } = req.query;
    const filters = {};
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (status) filters.status = status;
    if (format) filters.format = format;

    const tournaments = await prisma.tournament.findMany({
      where: {
        ...filters,
        OR: [
          { privacy: 'public' },
          { organizerId: req.user?.userId },
        ],
      },
      include: {
        _count: { select: { registrations: true, categories: true } },
        posters: { orderBy: { displayOrder: 'asc' }, take: 1 },
        organizer: { select: { name: true, email: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    res.json({ tournaments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
};

export const getTournament = async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id },
      include: {
        categories: true,
        posters: { orderBy: { displayOrder: 'asc' } },
        organizer: { select: { name: true, email: true } },
        _count: { select: { registrations: true } },
      },
    });

    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.privacy === 'private' && tournament.organizerId !== req.user?.userId) {
      return res.status(403).json({ error: 'Private tournament' });
    }

    res.json({ tournament });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tournament' });
  }
};