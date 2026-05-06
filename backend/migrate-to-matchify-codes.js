import prisma from './src/lib/prisma.js';
import { generateMatchifyCode } from './src/utils/matchifyCode.js';

/**
 * Migration script to generate matchify codes for all existing users
 * Run this ONCE after deploying the new schema
 */
async function migrateToMatchifyCodes() {
  try {
    console.log('🚀 Starting Matchify Code Migration...\n');
    console.log('═'.repeat(70));
    
    // Find all users without matchify code
    const usersWithoutCode = await prisma.user.findMany({
      where: {
        matchifyCode: null
      },
      orderBy: {
        createdAt: 'asc' // Oldest users first
      },
      select: {
        id: true,
        email: true,
        name: true,
        playerCode: true,
        umpireCode: true,
        createdAt: true
      }
    });

    if (usersWithoutCode.length === 0) {
      console.log('✅ All users already have matchify codes!');
      console.log('═'.repeat(70));
      return;
    }

    console.log(`📊 Found ${usersWithoutCode.length} users without matchify codes\n`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutCode) {
      try {
        // Generate new matchify code
        const matchifyCode = await generateMatchifyCode();
        
        // Update user
        await prisma.user.update({
          where: { id: user.id },
          data: { matchifyCode }
        });

        successCount++;
        console.log(`✅ ${successCount}/${usersWithoutCode.length} - ${user.name || user.email}`);
        console.log(`   Old Player Code: ${user.playerCode || 'N/A'}`);
        console.log(`   Old Umpire Code: ${user.umpireCode || 'N/A'}`);
        console.log(`   New Matchify Code: ${matchifyCode}`);
        console.log('');
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed for ${user.email}:`, error.message);
      }
    }

    console.log('═'.repeat(70));
    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${usersWithoutCode.length}`);
    console.log('\n✨ Migration complete!');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToMatchifyCodes()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
