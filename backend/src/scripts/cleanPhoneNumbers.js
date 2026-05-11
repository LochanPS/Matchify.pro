import prisma from '../lib/prisma.js';

/**
 * Clean all phone numbers in the database
 * Removes spaces, dashes, plus signs, and country code (91)
 */
async function cleanPhoneNumbers() {
  try {
    console.log('🔧 Starting phone number cleanup...');
    
    // Get all users with phone numbers
    const users = await prisma.user.findMany({
      where: {
        phone: {
          not: null
        }
      },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true
      }
    });
    
    console.log(`📊 Found ${users.length} users with phone numbers`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      const originalPhone = user.phone;
      
      // Clean phone number
      const cleanedPhone = originalPhone
        .replace(/[\s\-\+]/g, '')  // Remove spaces, dashes, plus signs
        .replace(/^91/, '');        // Remove country code if present
      
      // Check if phone needs updating
      if (originalPhone !== cleanedPhone) {
        console.log(`📝 User: ${user.name} (${user.email || 'no email'})`);
        console.log(`   Original: "${originalPhone}" → Cleaned: "${cleanedPhone}"`);
        
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { phone: cleanedPhone }
          });
          updatedCount++;
          console.log(`   ✅ Updated successfully`);
        } catch (error) {
          console.log(`   ❌ Failed to update: ${error.message}`);
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Already clean: ${skippedCount}`);
    console.log('✅ Phone number cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error cleaning phone numbers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
cleanPhoneNumbers()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
