import smsService from '../services/smsService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function sendMatchReminders() {
  const fifteenMinutesLater = new Date(Date.now() + 15 * 60 * 1000);
  const thirtyMinutesLater = new Date(Date.now() + 30 * 60 * 1000);

  // Find matches starting in 15-30 minutes
  const upcomingMatches = await prisma.match.findMany({
    where: {
      scheduledTime: {
        gte: fifteenMinutesLater,
        lte: thirtyMinutesLater
      },
      status: 'SCHEDULED',
      reminderSent: { not: true }
    },
    include: {
      player1: true,
      player2: true,
      team1Player1: true,
      team1Player2: true,
      team2Player1: true,
      team2Player2: true
    }
  });

  for (const match of upcomingMatches) {
    const players = match.matchType === 'SINGLES'
      ? [match.player1, match.player2]
      : [match.team1Player1, match.team1Player2, match.team2Player1, match.team2Player2];

    for (const player of players.filter(p => p && p.phone)) {
      const opponentName = match.matchType === 'SINGLES'
        ? (player.id === match.player1?.id ? match.player2.name : match.player1.name)
        : 'Your opponents';

      await smsService.sendWithRetry(
        player.phone,
        'MATCH_STARTING_SOON',
        {
          courtNumber: match.courtNumber || 'TBA',
          opponentName
        }
      ).catch(err => console.error('Match reminder SMS failed:', err));
    }

    // Mark reminder as sent
    await prisma.match.update({
      where: { id: match.id },
      data: { reminderSent: true }
    });
  }

  console.log(`[MATCH REMINDERS] Sent ${upcomingMatches.length} reminders`);
}

export async function sendTournamentReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  // Find tournaments starting tomorrow
  const upcomingTournaments = await prisma.tournament.findMany({
    where: {
      startDate: {
        gte: tomorrow,
        lt: dayAfterTomorrow
      },
      status: 'UPCOMING',
      reminderSent: { not: true }
    },
    include: {
      registrations: {
        where: { status: 'CONFIRMED' },
        include: { user: true }
      }
    }
  });

  for (const tournament of upcomingTournaments) {
    for (const registration of tournament.registrations) {
      if (registration.user.phone) {
        await smsService.sendWithRetry(
          registration.user.phone,
          'TOURNAMENT_REMINDER',
          {
            tournamentName: tournament.name,
            time: tournament.startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            venue: tournament.venue
          }
        ).catch(err => console.error('Tournament reminder SMS failed:', err));
      }
    }

    // Mark reminder as sent
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { reminderSent: true }
    });
  }

  console.log(`[TOURNAMENT REMINDERS] Sent reminders for ${upcomingTournaments.length} tournaments`);
}
