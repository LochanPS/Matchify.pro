import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    
    const existing = await prisma.user.findUnique({
      where: { playerCode: code }
    });
    
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
}

async function main() {
  console.log('🎮 Generating Player Codes for all users...\n');

  // Find all users who don't have a playerCode
  const users = await prisma.user.findMany({
    where: {
      playerCode: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      roles: true
    }
  });

  console.log(`Found ${users.length} users without player codes\n`);
  
  let count = 0;
  for (const user of users) {
    const code = await generatePlayerCode();
    await prisma.user.update({
      where: { id: user.id },
      data: { playerCode: code }
    });
    count++;
    console.log(`✅ ${count}. Generated ${code} for ${user.name} (${user.email})`);
  }

  console.log(`\n🎉 Successfully generated ${count} player codes!`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
