import express from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/admin/clean-phone-numbers
 * Clean all phone numbers in the database — admin JWT required
 */
router.post('/clean-phone-numbers', authenticate, requireAdmin, async (req, res) => {
  try {
    
    console.log('🔧 Starting phone number cleanup via API...');
    
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
    const updates = [];
    
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
          updates.push({
            userId: user.id,
            name: user.name,
            email: user.email,
            originalPhone,
            cleanedPhone,
            status: 'success'
          });
          console.log(`   ✅ Updated successfully`);
        } catch (error) {
          console.log(`   ❌ Failed to update: ${error.message}`);
          updates.push({
            userId: user.id,
            name: user.name,
            email: user.email,
            originalPhone,
            cleanedPhone,
            status: 'failed',
            error: error.message
          });
        }
      } else {
        skippedCount++;
      }
    }
    
    const summary = {
      totalUsers: users.length,
      updated: updatedCount,
      alreadyClean: skippedCount,
      updates
    };
    
    console.log('\n📊 Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Already clean: ${skippedCount}`);
    console.log('✅ Phone number cleanup complete!');
    
    res.json({
      success: true,
      message: 'Phone number cleanup completed',
      summary
    });
    
  } catch (error) {
    console.error('❌ Error cleaning phone numbers:', error);
    res.status(500).json({
      error: 'Failed to clean phone numbers',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
});

export default router;
