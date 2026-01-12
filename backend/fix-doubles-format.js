// Fix categories that have "doubles" in name but format is "singles"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDoublesFormat() {
  try {
    // Find all categories with format "singles"
    const allCategories = await prisma.category.findMany({
      where: {
        format: 'singles'
      },
      include: {
        tournament: {
          select: { name: true }
        }
      }
    });

    // Filter those with "doubles" in name (case insensitive)
    const wrongCategories = allCategories.filter(cat => 
      cat.name.toLowerCase().includes('doubles')
    );

    console.log(`Found ${wrongCategories.length} categories with wrong format:\n`);
    
    for (const cat of wrongCategories) {
      console.log(`- "${cat.name}" in tournament "${cat.tournament.name}" (ID: ${cat.id})`);
    }

    if (wrongCategories.length === 0) {
      console.log('No categories need fixing!');
      return;
    }

    // Fix them one by one
    let fixedCount = 0;
    for (const cat of wrongCategories) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { format: 'doubles' }
      });
      fixedCount++;
    }

    console.log(`\n✅ Fixed ${fixedCount} categories - changed format from "singles" to "doubles"`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDoublesFormat();
