import dotenv from 'dotenv';
import emailService from '../src/services/emailService.js';

dotenv.config();

async function testUrgentEmails() {
  console.log('🧪 Testing Urgent Email Notifications...\n');
  console.log('='.repeat(60) + '\n');

  // IMPORTANT: Replace with your actual email
  const testEmail = 'your-email@example.com'; // CHANGE THIS!

  const testUser = {
    name: 'Rahul Sharma',
    email: testEmail
  };

  const testTournament = {
    id: 1,
    name: 'Bangalore Open 2025',
    startDate: new Date('2025-02-01'),
    venue: 'Kanteerava Indoor Stadium',
    city: 'Bangalore',
    state: 'Karnataka'
  };

  const testMatch = {
    id: 123,
    scheduledTime: new Date(Date.now() + 15 * 60 * 1000) // 15 min from now
  };

  try {
    // Test 1: Match Starting Soon
    console.log('1️⃣  Sending Match Starting Soon Email...');
    await emailService.sendMatchStartingSoon(
      testUser,
      testMatch,
      5, // Court 5
      'Virat Kohli'
    );
    console.log('   ✅ Match reminder sent\n');

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Tournament Reminder
    console.log('2️⃣  Sending Tournament Reminder Email...');
    await emailService.sendTournamentReminderUrgent(testUser, testTournament);
    console.log('   ✅ Tournament reminder sent\n');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Quick Notification
    console.log('3️⃣  Sending Quick Notification Email...');
    await emailService.sendQuickNotification(
      testUser,
      'Your doubles partner has accepted the invitation! Get ready to dominate the court together. 🎾',
      'https://matchify.pro/tournaments/123'
    );
    console.log('   ✅ Quick notification sent\n');

    console.log('='.repeat(60));
    console.log('✅ All urgent emails sent successfully!\n');
    console.log('📧 Check your inbox at:', testEmail);
    console.log('📊 Email Stats:', emailService.getStats());
    console.log('\n💡 Tips:');
    console.log('   - Check spam folder if not in inbox');
    console.log('   - Urgent emails should appear at top (high priority)');
    console.log('   - Gmail may show "Important" badge');
    console.log('   - Delivery should be < 5 seconds\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run tests
testUrgentEmails();
