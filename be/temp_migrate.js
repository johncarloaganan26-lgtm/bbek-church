require('dotenv').config({ path: './be/.env' });
const { query } = require('./database/db');

async function run() {
  try {
    console.log('Starting migration...');
    
    // Check if columns exist first for tbl_churchleaders
    const [clRows] = await query('SHOW COLUMNS FROM tbl_churchleaders LIKE "bio"');
    if (clRows.length === 0) {
      console.log('Adding bio and image to tbl_churchleaders...');
      await query('ALTER TABLE tbl_churchleaders ADD COLUMN bio TEXT');
      await query('ALTER TABLE tbl_churchleaders ADD COLUMN image LONGBLOB');
    } else {
      console.log('Columns already exist in tbl_churchleaders');
    }

    // Check if columns exist first for tbl_departmentofficers
    const [doRows] = await query('SHOW COLUMNS FROM tbl_departmentofficers LIKE "bio"');
    if (doRows.length === 0) {
      console.log('Adding bio and image to tbl_departmentofficers...');
      await query('ALTER TABLE tbl_departmentofficers ADD COLUMN bio TEXT');
      await query('ALTER TABLE tbl_departmentofficers ADD COLUMN image LONGBLOB');
    } else {
      console.log('Columns already exist in tbl_departmentofficers');
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

run();
