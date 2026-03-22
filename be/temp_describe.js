require('dotenv').config();
const { query } = require('./database/db');

async function checkSchema() {
  try {
    const [rows] = await query('DESCRIBE tbl_members');
    console.log('tbl_members columns:', rows.map(r => r.Field).join(', '));
    const [deptRows] = await query('DESCRIBE tbl_departments');
    console.log('tbl_departments columns:', deptRows.map(r => r.Field).join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkSchema();
