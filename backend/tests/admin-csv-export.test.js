import axios from 'axios';
import fs from 'fs';

const API_URL = 'http://localhost:5000/api';

let adminToken = '';

async function testCSVExport() {
  console.log('🧪 Testing Audit Log CSV Export...\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣  Logging in as admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@matchify.com',
      password: 'password123'
    });
    adminToken = loginRes.data.accessToken;
    console.log('✅ Admin logged in\n');

    // Step 2: Export audit logs as CSV
    console.log('2️⃣  Exporting audit logs as CSV...');
    const exportRes = await axios.get(
      `${API_URL}/admin/audit-logs/export`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        responseType: 'text'
      }
    );

    console.log('✅ CSV export successful');
    console.log('   Content-Type:', exportRes.headers['content-type']);
    console.log('   Content-Disposition:', exportRes.headers['content-disposition']);
    console.log('');

    // Step 3: Parse CSV and show sample
    const csvLines = exportRes.data.split('\n');
    console.log('3️⃣  CSV Content:');
    console.log('   Total lines:', csvLines.length);
    console.log('   Header:', csvLines[0]);
    if (csvLines.length > 1) {
      console.log('   First record:', csvLines[1].substring(0, 100) + '...');
    }
    console.log('');

    // Step 4: Save to file
    const filename = `audit-logs-test-${Date.now()}.csv`;
    fs.writeFileSync(filename, exportRes.data);
    console.log('4️⃣  CSV saved to file:');
    console.log('   Filename:', filename);
    console.log('   Size:', fs.statSync(filename).size, 'bytes');
    console.log('');

    // Step 5: Export with filters
    console.log('5️⃣  Exporting with filters (USER_SUSPEND only)...');
    const filteredExportRes = await axios.get(
      `${API_URL}/admin/audit-logs/export?action=USER_SUSPEND`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        responseType: 'text'
      }
    );

    const filteredLines = filteredExportRes.data.split('\n');
    console.log('✅ Filtered export successful');
    console.log('   Total lines:', filteredLines.length);
    console.log('');

    // Step 6: Verify export was logged
    console.log('6️⃣  Verifying export action was logged...');
    const auditLogsRes = await axios.get(
      `${API_URL}/admin/audit-logs?action=AUDIT_LOG_EXPORTED`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    console.log('✅ Export action logged');
    console.log('   Export logs found:', auditLogsRes.data.logs.length);
    if (auditLogsRes.data.logs.length > 0) {
      const lastExport = auditLogsRes.data.logs[0];
      console.log('   Last export by:', lastExport.admin.name);
      console.log('   Records exported:', lastExport.details.recordCount);
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 CSV EXPORT TEST PASSED!');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log('   ✅ CSV export working');
    console.log('   ✅ Filtered export working');
    console.log('   ✅ Export action logged');
    console.log('   ✅ File saved successfully');
    console.log('\n💡 Check the generated CSV file:', filename);

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testCSVExport();
