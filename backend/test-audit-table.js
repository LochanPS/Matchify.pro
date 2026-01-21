import { PrismaClient } from '@prisma/client';
import AuditLogService from './src/services/auditLog.service.js';

const prisma = new PrismaClient();

async function testAuditTable() {
  try {
    console.log('🔍 Testing audit log table and service...\n');
    
    // Step 1: Check if audit log table exists and is accessible
    console.log('📊 Step 1: Checking audit log table...');
    try {
      const count = await prisma.auditLog.count();
      console.log(`✅ Audit log table exists with ${count} entries`);
    } catch (error) {
      console.log('❌ Audit log table error:', error.message);
      return;
    }
    
    // Step 2: Test creating an audit log entry directly
    console.log('\n🧪 Step 2: Testing direct audit log creation...');
    try {
      const testLog = await AuditLogService.log({
        adminId: 'admin', // Use the super admin ID
        action: 'TEST_ACTION',
        entityType: 'TEST',
        entityId: 'test-123',
        details: {
          message: 'This is a test audit log entry',
          timestamp: new Date().toISOString()
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent'
      });
      
      if (testLog) {
        console.log('✅ Test audit log created successfully:', {
          id: testLog.id,
          action: testLog.action,
          entityType: testLog.entityType
        });
      } else {
        console.log('❌ Failed to create test audit log');
      }
    } catch (error) {
      console.log('❌ Error creating test audit log:', error.message);
    }
    
    // Step 3: Check if the entry was created
    console.log('\n🔍 Step 3: Verifying audit log was created...');
    try {
      const logs = await AuditLogService.getAll({ page: 1, limit: 5 });
      console.log(`✅ Found ${logs.pagination.total} audit log entries`);
      
      if (logs.logs.length > 0) {
        console.log('📋 Recent audit log entries:');
        logs.logs.forEach((log, index) => {
          console.log(`${index + 1}. ${log.action} on ${log.entityType} by admin ${log.adminId} at ${log.createdAt}`);
          if (log.details) {
            console.log(`   Details:`, log.details);
          }
        });
      }
    } catch (error) {
      console.log('❌ Error retrieving audit logs:', error.message);
    }
    
    // Step 4: Test with a real admin user
    console.log('\n👤 Step 4: Finding real admin user...');
    try {
      const admin = await prisma.user.findFirst({
        where: {
          roles: { contains: 'ADMIN' }
        }
      });
      
      if (admin) {
        console.log(`✅ Found admin user: ${admin.name} (${admin.id})`);
        
        // Create another test log with real admin
        const realAdminLog = await AuditLogService.log({
          adminId: admin.id,
          action: 'ADMIN_TEST_ACTION',
          entityType: 'USER',
          entityId: admin.id,
          details: {
            message: 'Test audit log with real admin user',
            adminName: admin.name,
            adminEmail: admin.email
          },
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent'
        });
        
        if (realAdminLog) {
          console.log('✅ Real admin test audit log created successfully');
        }
      } else {
        console.log('❌ No admin user found in database');
      }
    } catch (error) {
      console.log('❌ Error with real admin test:', error.message);
    }
    
    // Step 5: Final count
    console.log('\n📊 Step 5: Final audit log count...');
    try {
      const finalCount = await prisma.auditLog.count();
      console.log(`✅ Final audit log count: ${finalCount}`);
    } catch (error) {
      console.log('❌ Error getting final count:', error.message);
    }
    
    console.log('\n✅ Audit table test completed!');
    
  } catch (error) {
    console.error('❌ Error during audit table test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuditTable();