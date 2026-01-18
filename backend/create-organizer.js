import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createOrganizer() {
  try {
    const hashedPassword = await bcrypt.hash('organizer123', 12);
    
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@gmail.com',
        password: hashedPassword,
        name: 'Test Organizer',
        phone: '+919876543210',
        roles: 'ORGANIZER',
        isVerified: true,
        isActive: true
      }
    });

    console.log('✅ Organizer created successfully!');
    console.log('Email: organizer@gmail.com');
    console.log('Password: organizer123');
    console.log('User ID:', organizer.id);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Organizer already exists!');
      console.log('Email: organizer@gmail.com');
      console.log('Password: organizer123');
    } else {
      console.error('Error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createOrganizer();
