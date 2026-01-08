import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncRegistrationCounts() {
  try {
    // Get all categories
    const categories = await prisma.category.findMany();
    
    for (const category of categories) {
      // Count actual registrations (not cancelled)
      const count = await prisma.registration.count({
        where: {
          categoryId: category.id,
          status: { not: 'cancelled' }
        }
      });
      
      // Update category with correct count
      await prisma.category.update({
        where: { id: category.id },
        data: { registrationCount: count }
      });
      
      console.log(`Category "${category.name}": ${count} registrations`);
    }
    
    console.log('\n✅ Registration counts synced successfully!');
  } catch (error) {
    console.error('Error syncing counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncRegistrationCounts();
