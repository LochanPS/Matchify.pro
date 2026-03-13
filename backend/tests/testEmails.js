import dotenv from 'dotenv';
import emailService from '../src/services/emailService.js';

dotenv.config();

async function testAllEmails() {
  console.log('🧪 Testing Email Templates...\n');
  console.log('='.repeat(60) + '\n');

  // IMPORTANT: Replace with your actual test email
  const testEmail = 'your-test-email@example.com';

  try {
    // Test 1: Registration Confirmation
    console.log('1️⃣  Testing Registration Confirmation...');
    await emailService.sendRegistrationConfirmation({
      name: 'John Doe',
      email: testEmail,
      role: 'PLAYER'
    });
    console.log('   ✅ Registration confirmation sent\n');

    // Test 2: Tournament Registration
    console.log('2️⃣  Testing Tournament Registration...');
    await emailService.sendTournamentRegistration({
      user: { name: 'John Doe', email: testEmail },
      tournament: {
        id: 1,
        name: 'Mumbai Open 2025',
        city: 'Mumbai',
        state: 'Maharashtra',
        venue: 'Sports Complex, Andheri',
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-02-17'),
        registrationDeadline: new Date('2025-02-10')
      },
      categories: [
        { name: 'Men Singles', gender: 'MALE', type: 'SINGLES', registrationFee: 500 },
        { name: 'Men Doubles', gender: 'MALE', type: 'DOUBLES', registrationFee: 400 }
      ],
      totalAmount: 900,
      paymentMethod: 'Wallet (₹500) + Razorpay (₹400)'
    });
    console.log('   ✅ Tournament registration sent\n');

    // Test 3: Partner Invitation
    console.log('3️⃣  Testing Partner Invitation...');
    await emailService.sendPartnerInvitation({
      inviterName: 'John Doe',
      inviterEmail: 'john@example.com',
      partnerEmail: testEmail,
      registrationId: 123,
      token: 'test-token-abc123',
      tournament: {
        id: 1,
        name: 'Mumbai Open 2025',
        city: 'Mumbai',
        state: 'Maharashtra',
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-02-17')
      },
      category: {
        name: 'Men Doubles',
        gender: 'MALE',
        type: 'DOUBLES',
        registrationFee: 800
      }
    });
    console.log('   ✅ Partner invitation sent\n');

    // Test 4: Tournament Cancellation
    console.log('4️⃣  Testing Tournament Cancellation...');
    await emailService.sendTournamentCancellation({
      user: { name: 'John Doe', email: testEmail },
      tournament: {
        name: 'Mumbai Open 2025',
        city: 'Mumbai',
        state: 'Maharashtra',
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-02-17'),
        cancellationReason: 'Insufficient registrations'
      },
      refundAmount: 900,
      categories: [
        { name: 'Men Singles', registrationFee: 500 },
        { name: 'Men Doubles', registrationFee: 400 }
      ]
    });
    console.log('   ✅ Tournament cancellation sent\n');

    // Test 5: Draw Published
    console.log('5️⃣  Testing Draw Published...');
    await emailService.sendDrawPublished({
      user: { name: 'John Doe', email: testEmail },
      tournament: {
        id: 1,
        name: 'Mumbai Open 2025'
      },
      categories: [
        { name: 'Men Singles', seed: 3, firstMatchDate: new Date('2025-02-15T10:00:00') },
        { name: 'Men Doubles', seed: 5, firstMatchDate: new Date('2025-02-15T14:00:00') }
      ]
    });
    console.log('   ✅ Draw published sent\n');

    // Test 6: Match Assignment
    console.log('6️⃣  Testing Match Assignment...');
    await emailService.sendMatchAssignment({
      umpire: { name: 'Jane Smith', email: testEmail },
      match: {
        id: 456,
        player1Name: 'John Doe',
        player2Name: 'Mike Johnson',
        categoryName: 'Men Singles (Open)',
        round: 'QUARTER_FINALS',
        courtNumber: 2,
        scheduledTime: new Date('2025-02-16T11:00:00')
      },
      tournament: { name: 'Mumbai Open 2025' }
    });
    console.log('   ✅ Match assignment sent\n');

    // Test 7: Admin Invite
    console.log('7️⃣  Testing Admin Invite...');
    await emailService.sendAdminInvite({
      email: testEmail,
      token: 'admin-invite-token-xyz',
      oneTimePassword: 'MATCH2025',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedBy: 'Super Admin'
    });
    console.log('   ✅ Admin invite sent\n');

    // Test 8: Suspension Notice
    console.log('8️⃣  Testing Suspension Notice...');
    await emailService.sendSuspensionNotice({
      user: { name: 'John Doe', email: testEmail },
      reason: 'Violation of Terms of Service - Inappropriate behavior during match',
      duration: '30 days',
      suspendedBy: 'Admin Team'
    });
    console.log('   ✅ Suspension notice sent\n');

    console.log('='.repeat(60));
    console.log('✅ All email tests completed! Check your inbox.\n');
    console.log('📧 Emails sent to:', testEmail);
    console.log('\n⚠️  Remember to:');
    console.log('   1. Replace test email with your actual email');
    console.log('   2. Set up SendGrid API key in .env');
    console.log('   3. Verify sender email in SendGrid dashboard\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
  }
}

// Run tests
testAllEmails();
