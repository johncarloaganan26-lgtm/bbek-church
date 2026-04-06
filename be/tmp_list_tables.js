const { query } = require('./database/db');
require('dotenv').config();

async function listTables() {
  try {
    const [rows] = await query('SHOW TABLES');
    console.log('Tables in database:', JSON.stringify(rows, null, 2));
    
    // Also check for any cms related tables
    const cmsTables = rows.filter(row => Object.values(row)[0].startsWith('tbl_cms'));
    console.log('CMS Tables:', JSON.stringify(cmsTables, null, 2));

    // For each CMS table, show 1 record if it exists
    for (const tableRow of cmsTables) {
        const tableName = Object.values(tableRow)[0];
        try {
            const [data] = await query(`SELECT * FROM ${tableName} LIMIT 1`);
            console.log(`Data from ${tableName}:`, JSON.stringify(data, null, 2));
        } catch (e) {
            console.log(`Could not read from ${tableName}:`, e.message);
        }
    }
  } catch (error) {
    console.error('Error listing tables:', error.message);
  } finally {
    process.exit();
  }
}

listTables();
