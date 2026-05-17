import prisma from '../lib/prisma.js';
import { v2 as cloudinary } from 'cloudinary';

// ============================================
// CREATE booking (authenticated user)
// ============================================
export const createBooking = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { courtId, bookingDate, startTime, endTime, durationMinutes, amount, notes } = req.body;

    if (!courtId || !bookingDate || !startTime || !endTime || !amount) {
      return res.status(400).json({ success: false, error: 'courtId, bookingDate, startTime, endTime, amount required' });
    }

    // Verify court exists and is active
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: { availability: true, academy: true }
    });
    if (!court || !court.isActive) {
      return res.status(404).json({ success: false, error: 'Court not found or inactive' });
    }

    // Check slot not already booked
    const conflict = await prisma.courtBooking.findFirst({
      where: {
        courtId,
        bookingDate,
        startTime,
        status: { in: ['pending', 'confirmed'] }
      }
    });
    if (conflict) {
      return res.status(409).json({ success: false, error: 'This slot is already booked' });
    }

    // Upload payment screenshot
    let screenshotUrl = null;
    let screenshotPublicId = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'matchify/booking-payments' },
          (err, r) => err ? reject(err) : resolve(r)
        );
        stream.end(req.file.buffer);
      });
      screenshotUrl = result.secure_url;
      screenshotPublicId = result.public_id;
    }

    const booking = await prisma.courtBooking.create({
      data: {
        courtId,
        academyId: court.academyId,
        userId,
        bookingDate,
        startTime,
        endTime,
        durationMinutes: parseInt(durationMinutes) || 60,
        amount: parseFloat(amount),
        paymentScreenshot: screenshotUrl,
        screenshotPublicId,
        status: 'pending',
        notes: notes || null
      }
    });

    // Notify academy owner
    if (court.academy.submittedBy) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          userId: court.academy.submittedBy,
          type: 'COURT_BOOKING_REQUEST',
          title: '🎾 New Court Booking Request',
          message: `${user?.name || 'A user'} wants to book ${court.name} on ${bookingDate} at ${startTime}. Amount: ₹${amount}. Please verify payment and confirm.`,
          data: JSON.stringify({ bookingId: booking.id, courtId, academyId: court.academyId, bookingDate, startTime })
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking submitted! Academy will confirm after verifying payment.',
      data: { booking }
    });
  } catch (err) {
    console.error('createBooking error:', err);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
};

// ============================================
// GET user's bookings
// ============================================
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { status, upcoming } = req.query;

    const where = { userId };
    if (status) where.status = status;
    if (upcoming === 'true') {
      where.bookingDate = { gte: new Date().toISOString().split('T')[0] };
    }

    const bookings = await prisma.courtBooking.findMany({
      where,
      include: {
        court: {
          include: {
            academy: { select: { id: true, name: true, address: true, city: true, phone: true } }
          }
        }
      },
      orderBy: [{ bookingDate: 'desc' }, { startTime: 'desc' }]
    });

    const formatted = bookings.map(b => ({
      ...b,
      court: b.court ? { ...b.court, photos: JSON.parse(b.court.photos || '[]') } : null
    }));

    res.json({ success: true, data: { bookings: formatted } });
  } catch (err) {
    console.error('getMyBookings error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
};

// ============================================
// GET bookings for academy owner
// ============================================
export const getAcademyBookings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { academyId } = req.params;
    const { status, date, courtId } = req.query;

    // Verify ownership
    const academy = await prisma.academy.findUnique({ where: { id: academyId } });
    if (!academy || academy.submittedBy !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const where = { academyId };
    if (status) where.status = status;
    if (date) where.bookingDate = date;
    if (courtId) where.courtId = courtId;

    const bookings = await prisma.courtBooking.findMany({
      where,
      orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }]
    });

    // Enrich with user info
    const userIds = [...new Set(bookings.map(b => b.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, phone: true, email: true }
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const courts = await prisma.court.findMany({ where: { academyId } });
    const courtMap = Object.fromEntries(courts.map(c => [c.id, c]));

    const formatted = bookings.map(b => ({
      ...b,
      user: userMap[b.userId] || null,
      court: courtMap[b.courtId] ? { ...courtMap[b.courtId], photos: JSON.parse(courtMap[b.courtId].photos || '[]') } : null
    }));

    // Stats
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      rejected: bookings.filter(b => b.status === 'rejected').length,
      revenue: bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.amount, 0)
    };

    res.json({ success: true, data: { bookings: formatted, stats } });
  } catch (err) {
    console.error('getAcademyBookings error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
};

// ============================================
// CONFIRM booking (academy owner)
// ============================================
export const confirmBooking = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { bookingId } = req.params;

    const booking = await prisma.courtBooking.findUnique({
      where: { id: bookingId },
      include: { court: { include: { academy: true } } }
    });

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    if (booking.court.academy.submittedBy !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Booking is already ${booking.status}` });
    }

    await prisma.courtBooking.update({
      where: { id: bookingId },
      data: { status: 'confirmed', verifiedBy: userId, verifiedAt: new Date() }
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'COURT_BOOKING_CONFIRMED',
        title: '✅ Court Booking Confirmed!',
        message: `Your booking for ${booking.court.name} on ${booking.bookingDate} at ${booking.startTime} has been confirmed. See you on the court!`,
        data: JSON.stringify({ bookingId, courtId: booking.courtId, bookingDate: booking.bookingDate, startTime: booking.startTime })
      }
    });

    res.json({ success: true, message: 'Booking confirmed', data: { bookingId } });
  } catch (err) {
    console.error('confirmBooking error:', err);
    res.status(500).json({ success: false, error: 'Failed to confirm booking' });
  }
};

// ============================================
// REJECT booking (academy owner)
// ============================================
export const rejectBooking = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await prisma.courtBooking.findUnique({
      where: { id: bookingId },
      include: { court: { include: { academy: true } } }
    });

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    if (booking.court.academy.submittedBy !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Booking is already ${booking.status}` });
    }

    const rejectionReason = reason || 'Payment could not be verified';

    await prisma.courtBooking.update({
      where: { id: bookingId },
      data: { status: 'rejected', rejectionReason, verifiedBy: userId, verifiedAt: new Date() }
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'COURT_BOOKING_REJECTED',
        title: '❌ Court Booking Not Confirmed',
        message: `Your booking for ${booking.court.name} on ${booking.bookingDate} at ${booking.startTime} could not be confirmed.\n\nReason: ${rejectionReason}\n\nPlease try again or contact the academy directly.`,
        data: JSON.stringify({ bookingId, courtId: booking.courtId })
      }
    });

    res.json({ success: true, message: 'Booking rejected', data: { bookingId } });
  } catch (err) {
    console.error('rejectBooking error:', err);
    res.status(500).json({ success: false, error: 'Failed to reject booking' });
  }
};

// ============================================
// CANCEL booking (user cancels their own)
// ============================================
export const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await prisma.courtBooking.findUnique({
      where: { id: bookingId },
      include: { court: true }
    });

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    if (booking.userId !== userId) return res.status(403).json({ success: false, error: 'Not authorized' });
    if (['cancelled', 'rejected'].includes(booking.status)) {
      return res.status(400).json({ success: false, error: 'Booking already cancelled/rejected' });
    }

    await prisma.courtBooking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelled by user'
      }
    });

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    console.error('cancelBooking error:', err);
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
};

// ============================================
// UPLOAD screenshot for existing pending booking
// ============================================
export const uploadBookingScreenshot = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { bookingId } = req.params;

    const booking = await prisma.courtBooking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    if (booking.userId !== userId) return res.status(403).json({ success: false, error: 'Not authorized' });
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only upload screenshot for pending bookings' });
    }

    if (!req.file) return res.status(400).json({ success: false, error: 'Screenshot file required' });

    // Delete old screenshot from Cloudinary
    if (booking.screenshotPublicId) {
      await cloudinary.uploader.destroy(booking.screenshotPublicId).catch(() => {});
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'matchify/booking-payments' },
        (err, r) => err ? reject(err) : resolve(r)
      );
      stream.end(req.file.buffer);
    });

    await prisma.courtBooking.update({
      where: { id: bookingId },
      data: { paymentScreenshot: result.secure_url, screenshotPublicId: result.public_id }
    });

    res.json({ success: true, message: 'Screenshot uploaded', data: { screenshotUrl: result.secure_url } });
  } catch (err) {
    console.error('uploadBookingScreenshot error:', err);
    res.status(500).json({ success: false, error: 'Failed to upload screenshot' });
  }
};
