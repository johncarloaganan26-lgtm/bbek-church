require('dotenv').config();
const { query, pool } = require('./database/db');
const { processBaptismCompletion } = require('./dbHelpers/services/waterBaptismRecords');

async function testCompletion() {
  try {
    console.log('--- STARTING FUNCTIONAL TEST ---');
    
    // 1. Create a dummy baptism record for a unique test email
    const testEmail = `test_user_${Date.now()}@example.com`;
    console.log(`Creating dummy baptism for: ${testEmail}`);
    
    const [ins] = await query(`
      INSERT INTO tbl_waterbaptism 
      (firstname, lastname, email, phone_number, baptism_date, baptism_time, status) 
      VALUES (?, ?, ?, ?, CURDATE(), '13:00:00', 'approved')
    `, ['Test', 'Automation', testEmail, '09123456789']);
    
    const baptismId = ins.insertId;
    console.log(`Dummy baptism created with ID: ${baptismId}`);
    
    // 2. Call the completion processor
    console.log('Processing completion...');
    const result = await processBaptismCompletion(baptismId);
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ SUCCESS: Functional test completed without error!');
      
      // Verify account and member exists
      const [acc] = await query('SELECT * FROM tbl_accounts WHERE email = ?', [testEmail]);
      const [mem] = await query('SELECT * FROM tbl_members WHERE email = ?', [testEmail]);
      
      console.log(`Account verified: ${acc.length > 0 ? 'YES (ID: ' + acc[0].acc_id + ')' : 'NO'}`);
      console.log(`Member verified: ${mem.length > 0 ? 'YES (ID: ' + mem[0].member_id + ')' : 'NO'}`);
      
      // Cleanup
      console.log('Cleaning up test data...');
      await query('DELETE FROM tbl_waterbaptism WHERE baptism_id = ?', [baptismId]);
      if (acc[0]) await query('DELETE FROM tbl_accounts WHERE acc_id = ?', [acc[0].acc_id]);
      if (mem[0]) await query('DELETE FROM tbl_members WHERE member_id = ?', [mem[0].member_id]);
    } else {
      console.log('❌ FAILURE: Functional test failed.');
    }
  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    pool.end();
  }
}

testCompletion();
