import emailService from '../services/emailService.js';

class UrgentEmailHelpers {
  /**
   * Send match starting soon email (replaces SMS)
   * Priority: HIGH
   */
  async sendMatchStartingSoon(player, match, courtNumber, opponentName) {
    try {
      await emailService.sendMatchStartingSoon(player, match, courtNumber, opponentName);
      console.log(`✅ Match reminder sent to ${player.email}`);
    } catch (error) {
      console.error(`❌ Failed to send match reminder to ${player.email}:`, error.message);
    }
  }

  /**
   * Send tournament reminder (1 day before)
   * Priority: HIGH
   */
  async sendTournamentReminder(player, tournament) {
    try {
      await emailService.sendTournamentReminderUrgent(player, tournament);
      console.log(`✅ Tournament reminder sent to ${player.email}`);
    } catch (error) {
      console.error(`❌ Failed to send tournament reminder to ${player.email}:`, error.message);
    }
  }

  /**
   * Send quick notification (generic urgent message)
   */
  async sendQuickNotification(user, message, actionUrl = null) {
    try {
      await emailService.sendQuickNotification(user, message, actionUrl);
      console.log(`✅ Quick notification sent to ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to send quick notification to ${user.email}:`, error.message);
    }
  }

  /**
   * Schedule match reminder email (15 min before)
   * This would be called by a cron job
   */
  async scheduleMatchReminders() {
    const prisma = (await import('../lib/prisma.js')).default;

    try {
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

        for (const player of players.filter(p => p && p.email)) {
          const opponentName = match.matchType === 'SINGLES'
            ? (player.id === match.player1?.id ? match.player2.name : match.player1.name)
            : 'Your opponents';

          await this.sendMatchStartingSoon(player, match, match.courtNumber, opponentName);
        }

        // Mark reminder as sent
        await prisma.match.update({
          where: { id: match.id },
          data: { reminderSent: true }
        });
      }

      console.log(`[MATCH REMINDERS] Sent ${upcomingMatches.length} reminders`);
    } catch (error) {
      console.error('[MATCH REMINDERS ERROR]:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Schedule tournament reminder emails (1 day before)
   * This would be called by a cron job
   */
  async scheduleTournamentReminders() {
    const prisma = (await import('../lib/prisma.js')).default;

    try {
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
          if (registration.user.email) {
            await this.sendTournamentReminder(registration.user, tournament);
          }
        }

        // Mark reminder as sent
        await prisma.tournament.update({
          where: { id: tournament.id },
          data: { reminderSent: true }
        });
      }

      console.log(`[TOURNAMENT REMINDERS] Sent reminders for ${upcomingTournaments.length} tournaments`);
    } catch (error) {
      console.error('[TOURNAMENT REMINDERS ERROR]:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new UrgentEmailHelpers();
