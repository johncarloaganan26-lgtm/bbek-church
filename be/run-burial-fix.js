require('dotenv').config();
const { query } = require('./database/db');

async function runBurialFix() {
  try {
    console.log('Fixing burial service table columns...');
    
    // Rename pastor_id to pastor_name
    console.log('Renaming pastor_id to pastor_name...');
    try {
      await query("ALTER TABLE `tbl_burialservice` CHANGE COLUMN `pastor_id` `pastor_name` VARCHAR(45) NULL");
      console.log('Successfully renamed pastor_id to pastor_name');
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        console.log('Column pastor_name already exists, checking if pastor_id exists...');
        // Check if pastor_id exists
        try {
          await query("SELECT pastor_id FROM `tbl_burialservice` LIMIT 1");
          console.log('pastor_id still exists, trying rename...');
        } catch (e) {
          console.log('Column pastor_id does not exist');
        }
      } else {
        console.log('Error (may be expected if columns are already correct):', err.message);
      }
    }

    // Verify columns
    console.log('\nVerifying burial service table columns...');
    const [columns] = await query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tbl_burialservice' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Current columns in tbl_burialservice:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (Nullable: ${col.IS_NULLABLE})`);
    });

    console.log('\nBurial service table fix completed!');
  } catch (error) {
    console.error('Error fixing burial service table:', error);
  } finally {
    process.exit();
  }
}

runBurialFix();
