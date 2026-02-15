const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  console.log('🔧 Running tithes unique constraint removal...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bbeks',
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    // Check if the unique key exists
    const [indexes] = await connection.query("SHOW INDEX FROM tbl_tithes WHERE Key_name = 'member_id_UNIQUE'");
    
    if (indexes.length > 0) {
      console.log('Found unique constraint, dropping it...');
      await connection.query('ALTER TABLE tbl_tithes DROP INDEX member_id_UNIQUE');
      console.log('✅ Successfully removed member_id_UNIQUE constraint');
    } else {
      console.log('✅ No unique constraint found on member_id (already removed or never existed)');
    }

    console.log('\n✅ Migration complete! You can now add multiple donations from the same member.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration().catch(console.error);
