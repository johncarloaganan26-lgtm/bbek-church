require('dotenv').config();
const { query } = require('./database/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const sqlFile = process.argv[2] || 'database/add_family_fields_to_members.sql';
    const sqlFilePath = path.join(__dirname, sqlFile);

    if (!fs.existsSync(sqlFilePath)) {
      console.error(`SQL file not found: ${sqlFilePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('Running SQL:', sql);

    const [result] = await query(sql);
    console.log('SQL executed successfully:', result);
  } catch (error) {
    console.error('Error running SQL:', error);
  } finally {
    process.exit();
  }
}

runMigration();
