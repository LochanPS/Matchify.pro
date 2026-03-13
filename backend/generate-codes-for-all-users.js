import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate unique player code
 * Format: #ABC1234 (# + 3 letters + 4 numbers)
 */
async function generatePlayerCode() {
  const numbers = '0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate 3 random letters
    let letterPart = '';
    for (let i = 0; i < 3; i++) {
      letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generate 4 random numbers
    let numberPart = '';
    for (let i = 0; i < 4; i++) {
      numberPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    code = `#${letterPart}${numberPart}`;
    
    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { playerCode: code }
    });
    
    isUnique = !existing;
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
  
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate 3 random numbers
    let numberPart = '';
    for (let i = 0; i < 3; i++) {
      numberPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    // Generate 4 random letters
    let letterPart = '';
    for (let i = 0; i < 4; i++) {
      letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    code = `#${numberPart}${letterPart}`;
    
    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { umpireCode: code }
    });
    
    isUnique = !existing;
  }
  
  return code;
}

async function generateCodesForAllUsers() {
  try {
    console.log('🔍 Finding users without codes...\n');
    
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
        name: true,
        email: true,
        playerCode: true,
        umpireCode: true
      }
    });
    
    if (usersWithoutCodes.length === 0) {
      console.log('✅ All users already have codes!');
      console.log('No action needed.\n');
      return;
    }
    
    console.log(`📊 Found ${usersWithoutCodes.length} users needing codes\n`);
    console.log('═'.repeat(70));
    
    let playerCodesAdded = 0;
    let umpireCodesAdded = 0;
    
    for (const user of usersWithoutCodes) {
      const updates = {};
      
      // Generate player code if missing
      if (!user.playerCode) {
        updates.playerCode = await generatePlayerCode();
        playerCodesAdded++;
        console.log(`✅ Player Code: ${updates.playerCode} → ${user.name}`);
        console.log(`   Email: ${user.email}`);
      }
      
      // Generate umpire code if missing
      if (!user.umpireCode) {
        updates.umpireCode = await generateUmpireCode();
        umpireCodesAdded++;
        console.log(`✅ Umpire Code: ${updates.umpireCode} → ${user.name}`);
        console.log(`   Email: ${user.email}`);
      }
      
      // Update user with new codes
      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updates
        });
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('═'.repeat(70));
    console.log('🎉 CODE GENERATION COMPLETE!');
    console.log('═'.repeat(70));
    console.log(`📊 Summary:`);
    console.log(`   - Users processed: ${usersWithoutCodes.length}`);
    console.log(`   - Player codes added: ${playerCodesAdded}`);
    console.log(`   - Umpire codes added: ${umpireCodesAdded}`);
    console.log('═'.repeat(70));
    console.log('\n✅ All users now have player and umpire codes!');
    
  } catch (error) {
    console.error('❌ Error generating codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateCodesForAllUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
