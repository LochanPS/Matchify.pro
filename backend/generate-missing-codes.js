import prisma from './src/lib/prisma.js';

// Generate random code
function generateCode(prefix, length = 7) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function generateMissingCodes() {
  try {
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

    console.log(`\n🔧 Found ${usersWithoutCodes.length} users with missing codes\n`);

    for (const user of usersWithoutCodes) {
      const updates = {};
      
      if (!user.playerCode) {
        updates.playerCode = generateCode('#', 7);
      }
      
      if (!user.umpireCode) {
        updates.umpireCode = generateCode('#', 7);
      }

      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updates
        });

        console.log(`✅ Updated ${user.name || user.email}`);
        if (updates.playerCode) console.log(`   Player Code: ${updates.playerCode}`);
        if (updates.umpireCode) console.log(`   Umpire Code: ${updates.umpireCode}`);
        console.log('');
      }
    }

    console.log('✅ All codes generated!\n');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

generateMissingCodes();
