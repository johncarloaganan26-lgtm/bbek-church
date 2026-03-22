require('dotenv').config({ path: './be/.env' });
const { query } = require('./database/db');

async function run() {
  try {
    console.log('Starting migration for tbl_departmentofficers...');
    
    // 1. Remove UNIQUE constraint on member_id
    // First find the constraint name
    const [indexes] = await query("SHOW INDEX FROM tbl_departmentofficers WHERE Column_name = 'member_id' AND Non_unique = 0");
    if (indexes.length > 0) {
      const constraintName = indexes[0].Key_name;
      console.log(`Removing unique constraint: ${constraintName}`);
      await query(`ALTER TABLE tbl_departmentofficers DROP INDEX ${constraintName}`);
    }

    // 2. Add department_id and role columns
    const [cols] = await query("SHOW COLUMNS FROM tbl_departmentofficers");
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('department_id')) {
      console.log('Adding department_id column...');
      await query('ALTER TABLE tbl_departmentofficers ADD COLUMN department_id INT');
    }

    if (!colNames.includes('role')) {
      console.log('Adding role column...');
      await query('ALTER TABLE tbl_departmentofficers ADD COLUMN role VARCHAR(100)');
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

run();
