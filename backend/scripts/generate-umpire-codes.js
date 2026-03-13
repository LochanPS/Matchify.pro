import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateUmpireCode() {
  const numbers = '0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    let numPart = '';
    for (let i = 0; i < 3; i++) {
      numPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    let letterPart = '';
    for (let i = 0; i < 4; i++) {
      letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    code = '#' + numPart + letterPart;
    
    const existing = await prisma.user.findUnique({
      where: { umpireCode: code }
    });
    
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
}

async function main() {
  // Find all users who have UMPIRE role but no umpireCode
  const users = await prisma.user.findMany({
    where: {
      roles: { contains: 'UMPIRE' },
      umpireCode: null
    }
  });
  
  console.log(`Found ${users.length} umpires without codes`);
  
  for (const user of users) {
    const code = await generateUmpireCode();
    await prisma.user.update({
      where: { id: user.id },
      data: { umpireCode: code }
    });
    console.log(`Generated code ${code} for ${user.name} (${user.email})`);
  }
  
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
