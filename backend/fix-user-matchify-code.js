import prisma from './src/lib/prisma.js';
import { generateMatchifyCode } from './src/utils/matchifyCode.js';

/**
 * Fix specific user's matchifyCode
 * This script generates a matchifyCode for users who don't have one
 */
async function fixUserMatchifyCode() {
  try {
    console.log('🔧 Fixing user matchifyCode...\n');

    // Find the user by email
    const userEmail = 'pokkalipradyumna@gmail.com';
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        name: true,
        matchifyCode: true
      }
    });

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    console.log('📊 Current User Data:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Current matchifyCode: ${user.matchifyCode || 'NULL'}\n`);

    if (user.matchifyCode) {
      console.log('✅ User already has a matchifyCode!');
      console.log(`   Matchify ID: ${user.matchifyCode}`);
      return;
    }

    // Generate new matchifyCode
    console.log('🔄 Generating new matchifyCode...');
    const newMatchifyCode = await generateMatchifyCode();
    console.log(`   Generated: ${newMatchifyCode}\n`);

    // Update user
    console.log('💾 Updating user in database...');
    await prisma.user.update({
      where: { id: user.id },
      data: { matchifyCode: newMatchifyCode }
    });

    console.log('✅ SUCCESS! User updated:\n');
    console.log('========================================');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Matchify ID: ${newMatchifyCode}`);
    console.log('========================================\n');

    console.log('🎉 Done! Refresh your profile page to see the Matchify ID.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixUserMatchifyCode();
