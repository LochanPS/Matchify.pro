import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDetails() {
  try {
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'ace',
          mode: 'insensitive'
        }
      },
      include: {
        categories: true
      }
    });

    console.log('Tournament:', JSON.stringify(tournament, null, 2));

    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['rahul.sharma@gmail.com', 'priya.patel@gmail.com']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true
      }
    });

    console.log('\nUsers:', JSON.stringify(users, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDetails();
