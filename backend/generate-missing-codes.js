import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate unique player code
 * Format: #ABC1234 (# + 3 letters + 4 numbers)
 */
async function generatePlayerCode() {
  const numbers = '0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    // Generate 3 random letters
    let letterPart = '';
    for (let i = 0; i < 3; i++) {
      letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generate 4 random numbers
    let numPart = '';
    for (let i = 0; i < 4; i++) {
      numPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    code = '#' + letterPart + numPart;
    
    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { playerCode: code }
    });
    
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
}

/**
 * Generate unique umpire code
 * Format: #123ABCD (# + 3 numbers + 4 letters)
 */
async function generateUmpireCode() {
  const numbers = '0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    // Generate 3 random numbers
    let numPart = '';
    for (let i = 0; i < 3; i++) {
      numPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // Generate 4 random letters
    let letterPart = '';
    for (let i = 0; i < 4; i++) {
      letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    code = '#' + numPart + letterPart;
    
    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { umpireCode: code }
    });
    
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
}

async function generateMissingCodes() {
  try {
    console.log('🔍 Checking for users without player/umpire codes...\n');

    // Find all users without player code or umpire code
    const usersWithoutCodes = await prisma.user.findMany({
      where: {
        OR: [
          { playerCode: null },
          { umpireCode: null }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        playerCode: true,
        umpireCode: true
      }
    });

    if (usersWithoutCodes.length === 0) {
      console.log('✅ All users already have player and umpire codes!');
      return;
    }

    console.log(`📋 Found ${usersWithoutCodes.length} users with missing codes:\n`);

    let updatedCount = 0;

    for (const user of usersWithoutCodes) {
      const updates = {};
      
      if (!user.playerCode) {
        updates.playerCode = await generatePlayerCode();
        console.log(`  🎮 Generating player code for ${user.name} (${user.email}): ${updates.playerCode}`);
      }
      
      if (!user.umpireCode) {
        updates.umpireCode = await generateUmpireCode();
        console.log(`  🏁 Generating umpire code for ${user.name} (${user.email}): ${updates.umpireCode}`);
      }

      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updates
        });
        updatedCount++;
        console.log(`  ✅ Updated ${user.name}\n`);
      }
    }

    console.log(`\n🎉 Successfully generated codes for ${updatedCount} users!`);
    
    // Verify all users now have codes
    const stillMissing = await prisma.user.count({
      where: {
        OR: [
          { playerCode: null },
          { umpireCode: null }
        ]
      }
    });

    if (stillMissing === 0) {
      console.log('✅ Verification: All users now have both player and umpire codes!');
    } else {
      console.log(`⚠️ Warning: ${stillMissing} users still missing codes. Please run script again.`);
    }

  } catch (error) {
    console.error('❌ Error generating codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateMissingCodes();
