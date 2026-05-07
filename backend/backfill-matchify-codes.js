import prisma from './src/lib/prisma.js';
import { generateMatchifyCode } from './src/utils/matchifyCode.js';

/**
 * Backfill matchifyCode for existing users who don't have one
 * Run this after adding the matchifyCode column to the database
 */
async function backfillMatchifyCodes() {
  try {
    console.log('🔄 Starting matchifyCode backfill...\n');

    // Find all users without a matchifyCode
    const usersWithoutCode = await prisma.user.findMany({
      where: {
        matchifyCode: null
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.log(`📊 Found ${usersWithoutCode.length} users without matchifyCode\n`);

    if (usersWithoutCode.length === 0) {
      console.log('✅ All users already have matchifyCode!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Generate and assign matchifyCode for each user
    for (const user of usersWithoutCode) {
      try {
        const matchifyCode = await generateMatchifyCode();
        
        await prisma.user.update({
          where: { id: user.id },
          data: { matchifyCode }
        });

        console.log(`✅ ${user.email} → ${matchifyCode}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed for ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n========================================');
    console.log('📊 BACKFILL COMPLETE');
    console.log('========================================');
    console.log(`✅ Success: ${successCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillMatchifyCodes();
