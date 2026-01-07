require('dotenv').config();
const { query } = require('./database/db');

async function testBurialService() {
  try {
    console.log('Testing burial service functionality...\n');

    // Test 1: Check if burial service table exists and has correct columns
    console.log('1. Checking burial service table structure...');
    const [columns] = await query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tbl_burialservice' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('   Columns in tbl_burialservice:');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Nullable: ${col.IS_NULLABLE})`);
    });

    // Verify critical columns exist
    const requiredColumns = ['burial_id', 'member_id', 'relationship', 'location', 'pastor_name', 'service_date', 'status', 'date_created', 'deceased_name', 'deceased_birthdate', 'date_death'];
    const existingColumns = columns.map(c => c.COLUMN_NAME);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`   ⚠️  Missing columns: ${missingColumns.join(', ')}`);
    } else {
      console.log('   ✅ All required columns exist');
    }

    // Test 2: Check if there are any burial service records
    console.log('\n2. Checking burial service records...');
    const [records] = await query('SELECT COUNT(*) as count FROM tbl_burialservice');
    console.log(`   Total records: ${records[0].count}`);

    // Test 3: Sample query to verify data retrieval
    console.log('\n3. Testing data retrieval...');
    const [sampleRecords] = await query(`
      SELECT 
        burial_id, 
        member_id, 
        relationship, 
        location, 
        pastor_name, 
        service_date, 
        status, 
        date_created,
        deceased_name,
        deceased_birthdate,
        date_death
      FROM tbl_burialservice 
      ORDER BY date_created DESC 
      LIMIT 5
    `);

    if (sampleRecords.length > 0) {
      console.log('   Sample record:');
      sampleRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.burial_id}`);
        console.log(`      Member ID: ${record.member_id}`);
        console.log(`      Relationship: ${record.relationship}`);
        console.log(`      Location: ${record.location}`);
        console.log(`      Pastor Name: ${record.pastor_name}`);
        console.log(`      Service Date: ${record.service_date}`);
        console.log(`      Status: ${record.status}`);
        console.log(`      Deceased: ${record.deceased_name}`);
        console.log(`      Deceased Birthdate: ${record.deceased_birthdate}`);
        console.log(`      Date of Death: ${record.date_death}`);
      });
    } else {
      console.log('   No records found (this is OK for a new system)');
    }

    // Test 4: Verify FULLTEXT index (if implemented)
    console.log('\n4. Checking FULLTEXT indexes...');
    try {
      const [indexes] = await query(`
        SELECT INDEX_NAME, INDEX_TYPE, COLUMN_NAME
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'tbl_burialservice'
          AND INDEX_TYPE = 'FULLTEXT'
      `);
      
      if (indexes.length > 0) {
        console.log('   FULLTEXT indexes found:');
        indexes.forEach(idx => {
          console.log(`   - ${idx.INDEX_NAME}: ${idx.COLUMN_NAME} (${idx.INDEX_TYPE})`);
        });
      } else {
        console.log('   No FULLTEXT indexes found (optional for search optimization)');
      }
    } catch (err) {
      console.log('   Could not check FULLTEXT indexes:', err.message);
    }

    console.log('\n✅ Burial service database verification completed!');
  } catch (error) {
    console.error('\n❌ Error testing burial service:', error.message);
  } finally {
    process.exit();
  }
}

testBurialService();
