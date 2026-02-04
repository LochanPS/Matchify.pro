import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceDrawRefresh() {
  try {
    const draw = await prisma.draw.findFirst({
      where: { format: 'ROUND_ROBIN_KNOCKOUT' }
    });

    if (!draw) {
      console.log('No draw found');
      return;
    }

    // Force update timestamp
    await prisma.draw.update({
      where: { id: draw.id },
      data: { updatedAt: new Date() }
    });

    console.log('✅ Draw timestamp updated');
    console.log('🔄 Close your browser COMPLETELY and reopen it');
    console.log('   Or clear browser cache and refresh');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceDrawRefresh();
