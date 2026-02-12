import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';

/**
 * Payment Split Formula (CRITICAL - DO NOT CHANGE):
 * - Platform Fee: 5% of total revenue
 * - First Payout to Organizer: 30% of total revenue
 * - Second Payout to Organizer: 65% of total revenue
 * - Total: 5% + 30% + 65% = 100%
 * 
 * Example: ₹100 total
 * - Platform: ₹5 (5%)
 * - First Payout: ₹30 (30%)
 * - Second Payout: ₹65 (65%)
 * 
 * Example: ₹160,000 total
 * - Platform: ₹8,000 (5%)
 * - First Payout: ₹48,000 (30%)
 * - Second Payout: ₹104,000 (65%)
 */

export async function createOrUpdateTournamentPayment(tournamentId) {
  try {
    // Get tournament with registrations
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { 
            paymentStatus: { in: ['approved', 'completed', 'verified'] },
            status: 'confirmed'
          }
        },
        categories: true
      }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Calculate total collected from approved registrations
    let totalCollected = 0;
    for (const registration of tournament.registrations) {
      const category = tournament.categories.find(c => c.id === registration.categoryId);
      if (category) {
        totalCollected += category.entryFee;
      }
    }

    const totalRegistrations = tournament.registrations.length;

    // Calculate payment split
    const platformFeePercent = 5;
    const platformFeeAmount = Math.round(totalCollected * 0.05); // 5% of total
    const organizerShare = totalCollected - platformFeeAmount; // For display only

    // CRITICAL: 30% and 65% are of TOTAL, not organizer share
    const payout50Percent1 = Math.round(totalCollected * 0.30); // 30% of TOTAL
    const payout50Percent2 = Math.round(totalCollected * 0.65); // 65% of TOTAL

    // Create or update tournament payment record
    const existingPayment = await prisma.tournamentPayment.findUnique({
      where: { tournamentId }
    });

    if (existingPayment) {
      return await prisma.tournamentPayment.update({
        where: { tournamentId },
        data: {
          totalCollected,
          totalRegistrations,
          platformFeePercent,
          platformFeeAmount,
          organizerShare,
          payout50Percent1,
          payout50Percent2
        }
      });
    } else {
      return await prisma.tournamentPayment.create({
        data: {
          tournamentId,
          organizerId: tournament.organizerId,
          totalCollected,
          totalRegistrations,
          platformFeePercent,
          platformFeeAmount,
          organizerShare,
          payout50Percent1,
          payout50Percent2,
          payout50Status1: 'pending',
          payout50Status2: 'pending'
        }
      });
    }
  } catch (error) {
    console.error('Error in createOrUpdateTournamentPayment:', error);
    throw error;
  }
}

export async function markPayoutPaid(tournamentId, payoutNumber) {
  try {
    const statusField = payoutNumber === 1 ? 'payout50Status1' : 'payout50Status2';
    const dateField = payoutNumber === 1 ? 'payout50Date1' : 'payout50Date2';

    return await prisma.tournamentPayment.update({
      where: { tournamentId },
      data: {
        [statusField]: 'paid',
        [dateField]: new Date()
      }
    });
  } catch (error) {
    console.error('Error in markPayoutPaid:', error);
    throw error;
  }
}

export async function getTournamentPayment(tournamentId) {
  try {
    return await prisma.tournamentPayment.findUnique({
      where: { tournamentId },
      include: {
        tournament: {
          select: {
            name: true,
            startDate: true,
            endDate: true
          }
        },
        organizer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error in getTournamentPayment:', error);
    throw error;
  }
}

export async function getAllTournamentPayments() {
  try {
    return await prisma.tournamentPayment.findMany({
      include: {
        tournament: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            status: true
          }
        },
        organizer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    console.error('Error in getAllTournamentPayments:', error);
    throw error;
  }
}
