import dotenv from 'dotenv';
import emailService from '../src/services/emailService.js';

dotenv.config();

async function testAllEmails() {
  const testEmail = 'your-email@example.com'; // CHANGE THIS!

  console.log('🧪 Testing all email templates...\n');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Registration Confirmation
    console.log('1️⃣  Sending Registration Confirmation...');
    await emailService.sendRegistrationConfirmation(
      { email: testEmail, name: 'Test Player' },
      {
        id: 1,
        name: 'Bangalore Open 2025',
        city: 'Bangalore',
        state: 'Karnataka',
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-02-17')
      },
      {
        categories: [{ name: "Men's Singles" }, { name: "Mixed Doubles" }],
        totalAmount: 1200
      }
    );
    console.log('   ✅ Sent!\n');

    // 2. Partner Invitation
    console.log('2️⃣  Sending Partner Invitation...');
    await emailService.sendPartnerInvitation(
      'John Doe',
      'john@example.com',
      testEmail,
      {
        id: 1,
        name: 'Bangalore Open 2025',
        city: 'Bangalore',
        state: 'Karnataka',
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-02-17')
      },
      { name: "Mixed Doubles", registrationFee: 600 },
      'reg_123'
    );
    console.log('   ✅ Sent!\n');

    // 3. Tournament Cancellation
    console.log('3️⃣  Sending Tournament Cancellation...');
    await emailService.sendTournamentCancellation(
      { email: testEmail, name: 'Test Player' },
      { id: 1, name: 'Bangalore Open 2025' },
      {
        total: 1200,
        walletAmount: 200,
        razorpayAmount: 1000,
        cancelledBy: 'Organizer'
      },
      'Venue unavailable due to maintenance'
    );
    console.log('   ✅ Sent!\n');

    // 4. Draw Published
    console.log('4️⃣  Sending Draw Published...');
    await emailService.sendDrawPublished(
      { email: testEmail, name: 'Test Player', matchifyPoints: 85 },
      { id: 1, name: 'Bangalore Open 2025' },
      { id: 1, name: "Men's Singles" },
      { seed: 3, firstMatch: 'vs Arjun Kumar (Seed #14) - Court 2' }
    );
    console.log('   ✅ Sent!\n');

    // 5. Match Assignment
    console.log('5️⃣  Sending Match Assignment...');
    await emailService.sendMatchAssignment(
      { email: testEmail, name: 'Test Umpire' },
      {
        id: 1,
        courtNumber: 3,
        scheduledTime: new Date('2025-02-15T10:30:00'),
        player1Name: 'Rahul Sharma',
        player2Name: 'Arjun Kumar',
        categoryName: "Men's Singles - Round 1"
      },
      { id: 1, name: 'Bangalore Open 2025' }
    );
    console.log('   ✅ Sent!\n');

    // 6. Admin Invite
    console.log('6️⃣  Sending Admin Invite...');
    await emailService.sendAdminInvite(
      testEmail,
      'Super Admin',
      'test-token-123',
      'ABC123XYZ',
      24
    );
    console.log('   ✅ Sent!\n');

    // 7. Suspension Notice
    console.log('7️⃣  Sending Suspension Notice...');
    await emailService.sendSuspensionNotice(
      { email: testEmail, name: 'Test Player' },
      {
        reason: 'Inappropriate behavior during match',
        duration: '30 days',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        canAppeal: true
      }
    );
    console.log('   ✅ Sent!\n');

    console.log('='.repeat(60));
    console.log('🎉 All emails sent! Check your inbox at:', testEmail);
    console.log('\n📊 Email Stats:');
    console.log(emailService.getStats());

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run test
testAllEmails();
