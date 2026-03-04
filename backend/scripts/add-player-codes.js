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

async function addPlayerCodesToExistingUsers() {
  try {
    console.log('🔍 Finding users without player codes...');
    
    // Find all users without playerCode or umpireCode
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
        umpireCode: true,
        roles: true
      }
    });

    console.log(`📊 Found ${usersWithoutCodes.length} users needing codes`);

    if (usersWithoutCodes.length === 0) {
      console.log('✅ All users already have codes!');
      return;
    }

    let updated = 0;
    for (const user of usersWithoutCodes) {
      const updateData = {};
      
      // Generate playerCode if missing
      if (!user.playerCode) {
        updateData.playerCode = await generatePlayerCode();
      }
      
      // Generate umpireCode if missing
      if (!user.umpireCode) {
        updateData.umpireCode = await generateUmpireCode();
      }

      // Update roles if using old 'role' field or missing roles
      if (!user.roles || user.roles === 'PLAYER' || user.roles === 'ORGANIZER' || user.roles === 'UMPIRE') {
        updateData.roles = 'PLAYER,ORGANIZER,UMPIRE';
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });

        console.log(`✅ Updated ${user.email}:`);
        if (updateData.playerCode) console.log(`   Player Code: ${updateData.playerCode}`);
        if (updateData.umpireCode) console.log(`   Umpire Code: ${updateData.umpireCode}`);
        if (updateData.roles) console.log(`   Roles: ${updateData.roles}`);
        
        updated++;
      }
    }

    console.log(`\n🎉 Successfully updated ${updated} users!`);
  } catch (error) {
    console.error('❌ Error adding player codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addPlayerCodesToExistingUsers()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
