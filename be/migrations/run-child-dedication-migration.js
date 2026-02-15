require('dotenv').config();
const { query } = require('./database/db');
const fs = require('fs');
const path = require('path');

async function runChildDedicationMigration() {
  try {
    const sqlFile = path.join(__dirname, 'database', 'make_preferred_dedication_date_nullable.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('Running Child Dedication Migration SQL...');
    console.log('SQL:', sql);

    const [result] = await query(sql);
    console.log('Migration executed successfully:', result);
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    process.exit();
  }
}

runChildDedicationMigration();