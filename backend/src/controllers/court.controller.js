import prisma from '../lib/prisma.js';
import { v2 as cloudinary } from 'cloudinary';

// ============================================
// HELPER: verify requester owns the academy
// ============================================
async function getOwnedAcademy(academyId, userId) {
  const academy = await prisma.academy.findUnique({ where: { id: academyId } });
  if (!academy) return null;
  if (academy.submittedBy !== userId) return null;
  if (academy.status !== 'approved') return null;
  return academy;
}

// ============================================
// GET courts for an academy (public)
// ============================================
export const getCourts = async (req, res) => {
  try {
    const { academyId } = req.params;
    const courts = await prisma.court.findMany({
      where: { academyId, isActive: true },
      include: { availability: { orderBy: { dayOfWeek: 'asc' } } },
      orderBy: { createdAt: 'asc' }
    });

    const formatted = courts.map(c => ({
      ...c,
      photos: JSON.parse(c.photos || '[]')
    }));

    res.json({ success: true, data: { courts: formatted } });
  } catch (err) {
    console.error('getCourts error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch courts' });
  }
};

// ============================================
// GET all courts for owner (including inactive)
// ============================================
export const getOwnerCourts = async (req, res) => {
  try {
    const { academyId } = req.params;
    const userId = req.user.userId || req.user.id;

    const academy = await getOwnedAcademy(academyId, userId);
    if (!academy) {
      return res.status(403).json({ success: false, error: 'Not authorized or academy not found' });
    }

    const courts = await prisma.court.findMany({
      where: { academyId },
      include: { availability: { orderBy: { dayOfWeek: 'asc' } } },
      orderBy: { createdAt: 'asc' }
    });

    const formatted = courts.map(c => ({
      ...c,
      photos: JSON.parse(c.photos || '[]')
    }));

    res.json({ success: true, data: { courts: formatted, academy } });
  } catch (err) {
    console.error('getOwnerCourts error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch courts' });
  }
};

// ============================================
// CREATE court (owner only)
// ============================================
export const createCourt = async (req, res) => {
  try {
    const { academyId } = req.params;
    const userId = req.user.userId || req.user.id;
    const { name, sport, description, pricePerHour } = req.body;

    const academy = await getOwnedAcademy(academyId, userId);
    if (!academy) {
      return res.status(403).json({ success: false, error: 'Not authorized or academy not found' });
    }

    if (!name || !sport || !pricePerHour) {
      return res.status(400).json({ success: false, error: 'name, sport, pricePerHour required' });
    }

    // Upload court photos if provided
    let photoUrls = [];
    if (req.files?.photos?.length) {
      for (const photo of req.files.photos) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'matchify/court-photos' },
            (err, r) => err ? reject(err) : resolve(r)
          );
          stream.end(photo.buffer);
        });
        photoUrls.push(result.secure_url);
      }
    }

    const court = await prisma.court.create({
      data: {
        academyId,
        name,
        sport,
        description: description || null,
        pricePerHour: parseFloat(pricePerHour),
        photos: JSON.stringify(photoUrls),
        isActive: true
      }
    });

    // Auto-create default availability (Mon–Sun, 6am–10pm, 1hr slots)
    const defaultAvailability = Array.from({ length: 7 }, (_, i) => ({
      courtId: court.id,
      dayOfWeek: i,
      openTime: '06:00',
      closeTime: '22:00',
      slotDuration: 60,
      isOpen: true
    }));

    await prisma.courtAvailability.createMany({ data: defaultAvailability });

    const withAvailability = await prisma.court.findUnique({
      where: { id: court.id },
      include: { availability: { orderBy: { dayOfWeek: 'asc' } } }
    });

    res.status(201).json({
      success: true,
      message: 'Court created successfully',
      data: { court: { ...withAvailability, photos: photoUrls } }
    });
  } catch (err) {
    console.error('createCourt error:', err);
    res.status(500).json({ success: false, error: 'Failed to create court' });
  }
};

// ============================================
// UPDATE court (owner only)
// ============================================
export const updateCourt = async (req, res) => {
  try {
    const { academyId, courtId } = req.params;
    const userId = req.user.userId || req.user.id;
    const { name, sport, description, pricePerHour, isActive } = req.body;

    const academy = await getOwnedAcademy(academyId, userId);
    if (!academy) {
      return res.status(403).json({ success: false, error: 'Not authorized or academy not found' });
    }

    const court = await prisma.court.findFirst({ where: { id: courtId, academyId } });
    if (!court) return res.status(404).json({ success: false, error: 'Court not found' });

    // Handle new photo uploads
    let existingPhotos = JSON.parse(court.photos || '[]');
    if (req.files?.photos?.length) {
      for (const photo of req.files.photos) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'matchify/court-photos' },
            (err, r) => err ? reject(err) : resolve(r)
          );
          stream.end(photo.buffer);
        });
        existingPhotos.push(result.secure_url);
      }
    }

    // removePhotos: JSON array of URLs to remove
    if (req.body.removePhotos) {
      const toRemove = JSON.parse(req.body.removePhotos);
      existingPhotos = existingPhotos.filter(p => !toRemove.includes(p));
    }

    const updated = await prisma.court.update({
      where: { id: courtId },
      data: {
        ...(name !== undefined && { name }),
        ...(sport !== undefined && { sport }),
        ...(description !== undefined && { description }),
        ...(pricePerHour !== undefined && { pricePerHour: parseFloat(pricePerHour) }),
        ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true }),
        photos: JSON.stringify(existingPhotos)
      },
      include: { availability: { orderBy: { dayOfWeek: 'asc' } } }
    });

    res.json({
      success: true,
      message: 'Court updated',
      data: { court: { ...updated, photos: existingPhotos } }
    });
  } catch (err) {
    console.error('updateCourt error:', err);
    res.status(500).json({ success: false, error: 'Failed to update court' });
  }
};

// ============================================
// DELETE court (owner only, soft delete via isActive)
// ============================================
export const deleteCourt = async (req, res) => {
  try {
    const { academyId, courtId } = req.params;
    const userId = req.user.userId || req.user.id;

    const academy = await getOwnedAcademy(academyId, userId);
    if (!academy) {
      return res.status(403).json({ success: false, error: 'Not authorized or academy not found' });
    }

    const court = await prisma.court.findFirst({ where: { id: courtId, academyId } });
    if (!court) return res.status(404).json({ success: false, error: 'Court not found' });

    // Check no pending/confirmed future bookings
    const today = new Date().toISOString().split('T')[0];
    const activeBookings = await prisma.courtBooking.count({
      where: {
        courtId,
        bookingDate: { gte: today },
        status: { in: ['pending', 'confirmed'] }
      }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete court with ${activeBookings} active/pending booking(s). Cancel them first.`
      });
    }

    await prisma.court.update({ where: { id: courtId }, data: { isActive: false } });

    res.json({ success: true, message: 'Court deactivated' });
  } catch (err) {
    console.error('deleteCourt error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete court' });
  }
};

// ============================================
// UPDATE availability for a court (owner only)
// ============================================
export const updateAvailability = async (req, res) => {
  try {
    const { academyId, courtId } = req.params;
    const userId = req.user.userId || req.user.id;
    const { availability } = req.body;
    // availability: array of { dayOfWeek, openTime, closeTime, slotDuration, isOpen }

    const academy = await getOwnedAcademy(academyId, userId);
    if (!academy) {
      return res.status(403).json({ success: false, error: 'Not authorized or academy not found' });
    }

    const court = await prisma.court.findFirst({ where: { id: courtId, academyId } });
    if (!court) return res.status(404).json({ success: false, error: 'Court not found' });

    if (!Array.isArray(availability)) {
      return res.status(400).json({ success: false, error: 'availability must be array' });
    }

    // Upsert each day
    for (const day of availability) {
      await prisma.courtAvailability.upsert({
        where: { courtId_dayOfWeek: { courtId, dayOfWeek: day.dayOfWeek } },
        update: {
          openTime: day.openTime,
          closeTime: day.closeTime,
          slotDuration: day.slotDuration || 60,
          isOpen: day.isOpen !== false
        },
        create: {
          courtId,
          dayOfWeek: day.dayOfWeek,
          openTime: day.openTime,
          closeTime: day.closeTime,
          slotDuration: day.slotDuration || 60,
          isOpen: day.isOpen !== false
        }
      });
    }

    const updated = await prisma.courtAvailability.findMany({
      where: { courtId },
      orderBy: { dayOfWeek: 'asc' }
    });

    res.json({ success: true, message: 'Availability updated', data: { availability: updated } });
  } catch (err) {
    console.error('updateAvailability error:', err);
    res.status(500).json({ success: false, error: 'Failed to update availability' });
  }
};

// ============================================
// GET available slots for a court on a date (public)
// ============================================
export const getSlots = async (req, res) => {
  try {
    const { courtId } = req.params;
    const { date } = req.query; // "2026-05-20"

    if (!date) return res.status(400).json({ success: false, error: 'date query param required' });

    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: { availability: true }
    });
    if (!court || !court.isActive) {
      return res.status(404).json({ success: false, error: 'Court not found' });
    }

    const dayOfWeek = new Date(date).getDay(); // 0-6
    const avail = court.availability.find(a => a.dayOfWeek === dayOfWeek);

    if (!avail || !avail.isOpen) {
      return res.json({ success: true, data: { slots: [], closed: true } });
    }

    // Generate all slots for the day
    const slots = generateSlots(avail.openTime, avail.closeTime, avail.slotDuration);

    // Get existing bookings for this date
    const bookings = await prisma.courtBooking.findMany({
      where: {
        courtId,
        bookingDate: date,
        status: { in: ['pending', 'confirmed'] }
      }
    });

    const bookedTimes = new Set(bookings.map(b => b.startTime));

    const slotsWithStatus = slots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationMinutes: avail.slotDuration,
      price: court.pricePerHour * (avail.slotDuration / 60),
      available: !bookedTimes.has(slot.startTime)
    }));

    res.json({ success: true, data: { slots: slotsWithStatus, court: { id: court.id, name: court.name, sport: court.sport, pricePerHour: court.pricePerHour } } });
  } catch (err) {
    console.error('getSlots error:', err);
    res.status(500).json({ success: false, error: 'Failed to get slots' });
  }
};

// ============================================
// GET academy owner's full dashboard stats
// ============================================
export const getOwnerDashboard = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Find all approved academies owned by this user
    const academies = await prisma.academy.findMany({
      where: { submittedBy: userId, status: 'approved', isDeleted: false },
      include: { courts: { where: { isActive: true } } }
    });

    if (!academies.length) {
      return res.json({ success: true, data: { academies: [], hasAcademy: false } });
    }

    const academyIds = academies.map(a => a.id);
    const today = new Date().toISOString().split('T')[0];

    // Aggregate booking stats
    const [totalBookings, pendingBookings, confirmedBookings, todayBookings, totalRevenue] = await Promise.all([
      prisma.courtBooking.count({ where: { academyId: { in: academyIds } } }),
      prisma.courtBooking.count({ where: { academyId: { in: academyIds }, status: 'pending' } }),
      prisma.courtBooking.count({ where: { academyId: { in: academyIds }, status: 'confirmed' } }),
      prisma.courtBooking.count({ where: { academyId: { in: academyIds }, bookingDate: today } }),
      prisma.courtBooking.aggregate({
        where: { academyId: { in: academyIds }, status: 'confirmed' },
        _sum: { amount: true }
      })
    ]);

    const formattedAcademies = academies.map(a => ({
      ...a,
      sports: JSON.parse(a.sports || '[]'),
      sportDetails: JSON.parse(a.sportDetails || '{}'),
      photos: JSON.parse(a.photos || '[]'),
      amenities: JSON.parse(a.amenities || '[]'),
      courts: a.courts.map(c => ({ ...c, photos: JSON.parse(c.photos || '[]') }))
    }));

    res.json({
      success: true,
      data: {
        hasAcademy: true,
        academies: formattedAcademies,
        stats: {
          totalBookings,
          pendingBookings,
          confirmedBookings,
          todayBookings,
          totalRevenue: totalRevenue._sum.amount || 0,
          totalCourts: academies.reduce((sum, a) => sum + a.courts.length, 0)
        }
      }
    });
  } catch (err) {
    console.error('getOwnerDashboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
  }
};

// ============================================
// UPDATE academy details (owner only)
// ============================================
export const updateAcademy = async (req, res) => {
  try {
    const { academyId } = req.params;
    const userId = req.user.userId || req.user.id;

    const academy = await getOwnedAcademy(academyId, userId);
    if (!academy) {
      return res.status(403).json({ success: false, error: 'Not authorized or academy not found' });
    }

    const {
      name, address, city, state, pincode, description,
      phone, email, website, upiId, openingHours, instagram, type, amenities
    } = req.body;

    // Handle new photos
    let existingPhotos = JSON.parse(academy.photos || '[]');
    if (req.files?.photos?.length) {
      for (const photo of req.files.photos) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'matchify/academy-photos' },
            (err, r) => err ? reject(err) : resolve(r)
          );
          stream.end(photo.buffer);
        });
        existingPhotos.push(result.secure_url);
      }
    }

    if (req.body.removePhotos) {
      const toRemove = JSON.parse(req.body.removePhotos);
      existingPhotos = existingPhotos.filter(p => !toRemove.includes(p));
    }

    const updated = await prisma.academy.update({
      where: { id: academyId },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(description !== undefined && { description }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(upiId !== undefined && { upiId }),
        ...(openingHours !== undefined && { openingHours }),
        ...(instagram !== undefined && { instagram }),
        ...(type !== undefined && { type }),
        ...(amenities !== undefined && { amenities: typeof amenities === 'string' ? amenities : JSON.stringify(amenities) }),
        photos: JSON.stringify(existingPhotos)
      }
    });

    res.json({
      success: true,
      message: 'Academy updated',
      data: {
        academy: {
          ...updated,
          sports: JSON.parse(updated.sports || '[]'),
          sportDetails: JSON.parse(updated.sportDetails || '{}'),
          photos: existingPhotos,
          amenities: JSON.parse(updated.amenities || '[]')
        }
      }
    });
  } catch (err) {
    console.error('updateAcademy error:', err);
    res.status(500).json({ success: false, error: 'Failed to update academy' });
  }
};

// ============================================
// HELPER: generate time slots between open/close
// ============================================
function generateSlots(openTime, closeTime, durationMinutes) {
  const slots = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  let current = openH * 60 + openM;
  const end = closeH * 60 + closeM;

  while (current + durationMinutes <= end) {
    const startH = Math.floor(current / 60).toString().padStart(2, '0');
    const startMin = (current % 60).toString().padStart(2, '0');
    const endMin = current + durationMinutes;
    const endH = Math.floor(endMin / 60).toString().padStart(2, '0');
    const endMinStr = (endMin % 60).toString().padStart(2, '0');

    slots.push({ startTime: `${startH}:${startMin}`, endTime: `${endH}:${endMinStr}` });
    current += durationMinutes;
  }

  return slots;
}
