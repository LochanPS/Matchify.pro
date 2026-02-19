import prisma from './src/lib/prisma.js';

// Generate player code: #ABC1234 (# + 3 letters + 4 numbers)
async function generatePlayerCode() {
  const numbers = '0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    let letterPart = '';
    for (let i = 0; i < 3; i++) {
      letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
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

// Generate umpire code: #123ABCD (# + 3 numbers + 4 letters)
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

// Validate code format
function isValidPlayerCode(code) {
  // #ABC1234 - # + 3 letters + 4 numbers
  return /^#[A-Z]{3}[0-9]{4}$/.test(code);
}

function isValidUmpireCode(code) {
  // #123ABCD - # + 3 numbers + 4 letters
  return /^#[0-9]{3}[A-Z]{4}$/.test(code);
}

async function fixIncorrectCodes() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        playerCode: true,
        umpireCode: true
      }
    });

    console.log('\n🔍 Checking all user codes...\n');

    for (const user of users) {
      const updates = {};
      let needsUpdate = false;

      // Check player code
      if (!user.playerCode || !isValidPlayerCode(user.playerCode)) {
        updates.playerCode = await generatePlayerCode();
        needsUpdate = true;
        console.log(`❌ Invalid player code for ${user.name || user.email}: ${user.playerCode || 'NULL'}`);
        console.log(`✅ New player code: ${updates.playerCode}`);
      }

      // Check umpire code
      if (!user.umpireCode || !isValidUmpireCode(user.umpireCode)) {
        updates.umpireCode = await generateUmpireCode();
        needsUpdate = true;
        console.log(`❌ Invalid umpire code for ${user.name || user.email}: ${user.umpireCode || 'NULL'}`);
        console.log(`✅ New umpire code: ${updates.umpireCode}`);
      }

      if (needsUpdate) {
        await prisma.user.update({
          where: { id: user.id },
          data: updates
        });
        console.log(`✅ Updated ${user.name || user.email}\n`);
      } else {
        console.log(`✅ ${user.name || user.email} - Codes are valid`);
      }
    }

    console.log('\n✅ All codes fixed!\n');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixIncorrectCodes();
