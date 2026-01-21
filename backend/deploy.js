import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function deploySetup() {
  try {
    console.log('🚀 Starting deployment setup...');
    
    // Check if database is accessible
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Push database schema
    console.log('📊 Setting up database schema...');
    // Note: prisma db push is handled in package.json postinstall
    
    // Check if admin user exists
    const adminExists = await prisma.user.findUnique({
      where: { email: 'ADMIN@gmail.com' }
    });
    
    if (!adminExists) {
      console.log('👤 Creating admin user...');
      
      const hashedPassword = await bcrypt.hash('ADMIN@123(123)', 10);
      
      await prisma.user.create({
        data: {
          email: 'ADMIN@gmail.com',
          password: hashedPassword,
          name: 'Super Admin',
          roles: 'ADMIN,PLAYER,ORGANIZER,UMPIRE',
          isActive: true,
          isVerified: true,
          country: 'India'
        }
      });
      
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Initialize payment settings if they don't exist
    const paymentSettings = await prisma.paymentSettings.findFirst();
    if (!paymentSettings) {
      console.log('💰 Initializing payment settings...');
      
      await prisma.paymentSettings.create({
        data: {
          upiId: 'admin@matchify.pro',
          accountHolder: 'Matchify Pro Admin',
          isActive: true
        }
      });
      
      console.log('✅ Payment settings initialized');
    }
    
    console.log('🎉 Deployment setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Deployment setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deploySetup();