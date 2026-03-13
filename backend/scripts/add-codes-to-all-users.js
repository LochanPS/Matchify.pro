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

async function addCodesToAllUsers() {
  try {
    console.log('🔍 Finding users without codes...\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        playerCode: true,
        umpireCode: true
      }
    });

    console.log(`📊 Total users: ${users.length}\n`);

    let updatedCount = 0;
    let playerCodesAdded = 0;
    let umpireCodesAdded = 0;

    for (const user of users) {
      const updates = {};
      let needsUpdate = false;

      // Check if player code is missing
      if (!user.playerCode) {
        updates.playerCode = await generatePlayerCode();
        playerCodesAdded++;
        needsUpdate = true;
      }

      // Check if umpire code is missing
      if (!user.umpireCode) {
        updates.umpireCode = await generateUmpireCode();
        umpireCodesAdded++;
        needsUpdate = true;
      }

      // Update user if needed
      if (needsUpdate) {
        await prisma.user.update({
          where: { id: user.id },
          data: updates
        });

        console.log(`✅ Updated ${user.name} (${user.email})`);
        if (updates.playerCode) {
          console.log(`   Player Code: ${updates.playerCode}`);
        }
        if (updates.umpireCode) {
          console.log(`   Umpire Code: ${updates.umpireCode}`);
        }
        console.log('');
        updatedCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total users: ${users.length}`);
    console.log(`Users updated: ${updatedCount}`);
    console.log(`Player codes added: ${playerCodesAdded}`);
    console.log(`Umpire codes added: ${umpireCodesAdded}`);
    console.log('='.repeat(50));
    console.log('\n✨ All users now have both player and umpire codes!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addCodesToAllUsers();
