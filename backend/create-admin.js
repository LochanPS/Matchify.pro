import bcrypt from 'bcryptjs';
import prisma from './src/lib/prisma.js';

/**
 * Simple script to create an admin account
 * Usage: node create-admin.js <email> <password> <name>
 * Example: node create-admin.js admin@matchify.pro SecurePass123 "Admin User"
 */

async function createAdmin() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('❌ Usage: node create-admin.js <email> <password> [name]');
      console.log('📝 Example: node create-admin.js admin@matchify.pro SecurePass123 "Admin User"');
      process.exit(1);
    }

    const email = args[0];
    const password = args[1];
    const name = args[2] || 'Admin';

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      process.exit(1);
    }

    // Validate password
    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin with email ${email} already exists`);
      console.log('🔄 Updating password...');
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name,
          roles: 'ADMIN',
          isActive: true,
          isVerified: true
        }
      });
      
      console.log('✅ Admin password updated successfully!');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`👤 Name: ${name}`);
    } else {
      console.log('🔨 Creating new admin account...');
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const admin = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          roles: 'ADMIN',
          isActive: true,
          isVerified: true,
          walletBalance: 0
        }
      });
      
      console.log('✅ Admin account created successfully!');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`👤 Name: ${name}`);
      console.log(`🆔 ID: ${admin.id}`);
    }

    console.log('\n🎉 You can now login at http://localhost:5173/login');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
