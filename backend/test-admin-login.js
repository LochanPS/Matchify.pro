import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function testAdminLogin() {
  try {
    const email = 'ADMIN@gmail.com';
    const password = 'ADMIN@123(123)';
    
    console.log('🔍 Testing admin login...');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('\n✅ User found:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Roles:', user.roles);
    console.log('isActive:', user.isActive);
    console.log('isSuspended:', user.isSuspended);
    console.log('Password hash exists:', !!user.password);
    
    // Test password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('\n🔐 Password verification:');
    console.log('Password matches:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('\n❌ PASSWORD DOES NOT MATCH!');
      console.log('This is why login is failing.');
      console.log('\nLet me fix the password...');
      
      // Hash the correct password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Update user with correct password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Password updated successfully!');
      
      // Verify again
      const verifyAgain = await bcrypt.compare(password, hashedPassword);
      console.log('✅ Password verification after update:', verifyAgain);
    } else {
      console.log('\n✅ Password is correct! Login should work.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();
