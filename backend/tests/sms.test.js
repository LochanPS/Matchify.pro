import dotenv from 'dotenv';
import smsService from '../src/services/smsService.js';

dotenv.config();

async function testSMSService() {
  console.log('🧪 Testing SMS Service...\n');
  console.log('='.repeat(60) + '\n');

  // IMPORTANT: Replace with your actual phone number
  const testPhone = '+919876543210'; // CHANGE THIS!

  try {
    // Test 1: Registration Confirmation
    console.log('1️⃣  Testing Registration Confirmation SMS...');
    const result1 = await smsService.send(
      testPhone,
      'REGISTRATION_CONFIRMATION',
      {
        tournamentName: 'Bangalore Open 2025',
        categoryName: "Men's Singles",
        amount: 500
      }
    );
    console.log('   ✅ Result:', result1);
    console.log('');

    // Test 2: Match Starting Soon
    console.log('2️⃣  Testing Match Starting Soon SMS...');
    const result2 = await smsService.send(
      testPhone,
      'MATCH_STARTING_SOON',
      {
        courtNumber: '3',
        opponentName: 'Rahul Sharma'
      }
    );
    console.log('   ✅ Result:', result2);
    console.log('');

    // Test 3: Draw Published
    console.log('3️⃣  Testing Draw Published SMS...');
    const result3 = await smsService.send(
      testPhone,
      'DRAW_PUBLISHED',
      {
        tournamentName: 'Bangalore Open 2025',
        matchDate: 'Feb 15, 2025 at 10:00 AM'
      }
    );
    console.log('   ✅ Result:', result3);
    console.log('');

    // Test 4: Phone Number Formatting
    console.log('4️⃣  Testing Phone Number Formatting...');
    const formats = [
      '9876543210',
      '+919876543210',
      '919876543210',
      '+91 98765 43210'
    ];
    
    for (const format of formats) {
      const formatted = smsService.formatPhoneNumber(format);
      console.log(`   ${format} → ${formatted}`);
    }
    console.log('');

    // Test 5: Rate Limiting
    console.log('5️⃣  Testing Rate Limiting...');
    console.log('   Sending 6 SMS rapidly to test rate limit...');
    
    for (let i = 1; i <= 6; i++) {
      try {
        await smsService.send(
          testPhone,
          'MATCH_COMPLETED',
          {
            result: 'Won 21-19, 21-17',
            pointsEarned: 10
          }
        );
        console.log(`   ✅ SMS ${i} sent`);
      } catch (error) {
        console.log(`   ❌ SMS ${i} failed: ${error.message}`);
      }
    }
    console.log('');

    // Test 6: Retry Logic
    console.log('6️⃣  Testing Retry Logic...');
    try {
      const result = await smsService.sendWithRetry(
        testPhone,
        'TOURNAMENT_REMINDER',
        {
          tournamentName: 'Mumbai Open 2025',
          time: '9:00 AM',
          venue: 'Sports Complex, Andheri'
        },
        3
      );
      console.log('   ✅ SMS sent with retry:', result);
    } catch (error) {
      console.log('   ❌ All retry attempts failed:', error.message);
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ SMS Service Tests Complete!\n');
    console.log('📱 Check your phone for SMS messages');
    console.log('📊 Check SMS logs in database\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run tests
testSMSService();
