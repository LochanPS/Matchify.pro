import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'ADMIN@gmail.com';
const ADMIN_PASSWORD = 'ADMIN@123(123)';
let ADMIN_TOKEN = null;

// Function to get admin token
async function getAdminToken() {
  try {
    console.log('🔑 Getting admin token...');
    const response = await axios.post(`${API_URL}/multi-auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (response.data.token || response.data.accessToken) {
      ADMIN_TOKEN = response.data.token || response.data.accessToken;
      console.log('✅ Admin token obtained successfully');
      return true;
    } else {
      console.log('❌ No access token in response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to get admin token:', error.response?.data || error.message);
    return false;
  }
}

async function testAuditWithPayment() {
  try {
    console.log('🧪 Testing audit logging with payment actions...\n');
    
    // Step 1: Get admin token
    const tokenObtained = await getAdminToken();
    if (!tokenObtained) {
      console.log('❌ Cannot proceed without admin token.');
      return;
    }
    
    // Step 2: Check current audit logs count
    console.log('📊 Step 2: Checking current audit logs count...');
    const beforeResponse = await axios.get(`${API_URL}/admin/audit-logs`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const beforeCount = beforeResponse.data.pagination?.total || 0;
    console.log(`✅ Current audit logs count: ${beforeCount}`);
    
    if (beforeCount > 0) {
      console.log('📋 Existing audit log entries:');
      beforeResponse.data.logs.slice(0, 3).forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} on ${log.entityType} by ${log.admin?.name || 'Unknown'} at ${log.createdAt}`);
      });
    }
    
    // Step 3: Create some test payment verifications to work with
    console.log('\n🧪 Step 3: Creating test payment verifications...');
    
    // We'll create a few test registrations with payment verifications
    // This is a simplified approach - in reality these would be created by players
    
    // First, let's check if there are any existing pending payments
    const pendingResponse = await axios.get(`${API_URL}/admin/payment-verifications?status=pending`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Found ${pendingResponse.data.data?.length || 0} pending payment verifications`);
    
    if (pendingResponse.data.data && pendingResponse.data.data.length > 0) {
      // Step 4: Test individual payment approval
      console.log('\n🎯 Step 4: Testing individual payment approval...');
      
      const testPayment = pendingResponse.data.data[0];
      console.log(`Testing with payment from: ${testPayment.registration?.user?.name || 'Unknown'}`);
      
      try {
        const approveResponse = await axios.post(
          `${API_URL}/admin/payment-verifications/${testPayment.id}/approve`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${ADMIN_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (approveResponse.data.success) {
          console.log('✅ Payment approved successfully');
          
          // Wait a moment for audit log to be created
          setTimeout(async () => {
            try {
              const afterResponse = await axios.get(`${API_URL}/admin/audit-logs`, {
                headers: {
                  'Authorization': `Bearer ${ADMIN_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              });
              
              const afterCount = afterResponse.data.pagination?.total || 0;
              console.log(`✅ Audit logs count after approval: ${afterCount}`);
              
              if (afterCount > beforeCount) {
                console.log('🎉 SUCCESS: Audit logging is now working!');
                console.log('📋 Latest audit log entries:');
                afterResponse.data.logs.slice(0, 3).forEach((log, index) => {
                  console.log(`${index + 1}. ${log.action} on ${log.entityType} by ${log.admin?.name || 'Unknown'} at ${log.createdAt}`);
                  if (log.details && typeof log.details === 'object') {
                    console.log(`   Player: ${log.details.playerName}, Amount: ₹${log.details.amount}`);
                  }
                });
              } else {
                console.log('❌ No new audit logs created - there might still be an issue');
              }
            } catch (error) {
              console.log('❌ Error checking audit logs after approval:', error.response?.data || error.message);
            }
          }, 2000);
          
        } else {
          console.log('❌ Payment approval failed:', approveResponse.data.message);
        }
      } catch (error) {
        console.log('❌ Error approving payment:', error.response?.data || error.message);
      }
    } else {
      console.log('ℹ️ No pending payments to test with. Let me check if we can test bulk approval with existing data...');
      
      // Step 5: Test the audit log export function (which should definitely create a log)
      console.log('\n📤 Step 5: Testing audit log export (should create audit entry)...');
      
      try {
        const exportResponse = await axios.get(`${API_URL}/admin/audit-logs/export`, {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Export request completed');
        
        // Wait for audit log to be created
        setTimeout(async () => {
          try {
            const finalResponse = await axios.get(`${API_URL}/admin/audit-logs`, {
              headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
                'Content-Type': 'application/json'
              }
            });
            
            const finalCount = finalResponse.data.pagination?.total || 0;
            console.log(`✅ Final audit logs count: ${finalCount}`);
            
            if (finalCount > beforeCount) {
              console.log('🎉 SUCCESS: Audit logging is working!');
              console.log('📋 All audit log entries:');
              finalResponse.data.logs.forEach((log, index) => {
                console.log(`${index + 1}. ${log.action} on ${log.entityType} by ${log.admin?.name || 'Unknown'} at ${log.createdAt}`);
                if (log.details && typeof log.details === 'object') {
                  console.log(`   Details:`, JSON.stringify(log.details, null, 2));
                }
              });
            } else {
              console.log('❌ Still no new audit logs - there may be a deeper issue');
            }
          } catch (error) {
            console.log('❌ Error checking final audit logs:', error.response?.data || error.message);
          }
        }, 2000);
        
      } catch (error) {
        console.log('❌ Error with export request:', error.response?.data || error.message);
      }
    }
    
    console.log('\n✅ Audit logging test with payment actions completed!');
    
  } catch (error) {
    console.error('❌ Error during audit logging test:', error.response?.data || error.message);
  }
}

// Run the test
testAuditWithPayment();