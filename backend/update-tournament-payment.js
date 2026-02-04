import { createOrUpdateTournamentPayment } from './src/services/paymentTrackingService.js';

const tournamentId = 'd79fbf59-22a3-44ec-961c-a3c23d10129c'; // Ace Badminton

console.log('🔄 Updating tournament payment record...\n');

try {
  const result = await createOrUpdateTournamentPayment(tournamentId);
  
  console.log('✅ Tournament Payment Updated!\n');
  console.log('📊 Payment Breakdown:');
  console.log('  Total Collected: ₹' + result.totalCollected);
  console.log('  Total Registrations: ' + result.totalRegistrations);
  console.log('  Platform Fee (5%): ₹' + result.platformFeeAmount);
  console.log('  First Payout (30%): ₹' + result.payout50Percent1);
  console.log('  Second Payout (65%): ₹' + result.payout50Percent2);
  console.log('\n  Math Check: ₹' + result.platformFeeAmount + ' + ₹' + result.payout50Percent1 + ' + ₹' + result.payout50Percent2 + ' = ₹' + (result.platformFeeAmount + result.payout50Percent1 + result.payout50Percent2));
  console.log('  Expected: ₹' + result.totalCollected);
  console.log('  Match: ' + ((result.platformFeeAmount + result.payout50Percent1 + result.payout50Percent2) === result.totalCollected ? '✅' : '❌'));
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

process.exit(0);
