require('dotenv').config();
const { query } = require('./database/db');
const fs = require('fs');
const path = require('path');

async function runAllSQL() {
  try {
    const sqlFiles = [
      'create_archive_table.sql',
      'create_audit_trail_table.sql',
      'create_cms_tables.sql',
      'create_announcements_table.sql',
      'create_forms_table.sql',
      'add_civil_status_to_members.sql',
      'add_route_accessed_to_audit_trail.sql',
      'update_childdedications_table.sql',
      'create_water_baptism_registration_table.sql'
    ];

    for (const sqlFile of sqlFiles) {
      try {
        const sqlFilePath = path.join(__dirname, 'database', sqlFile);
        if (fs.existsSync(sqlFilePath)) {
          const sql = fs.readFileSync(sqlFilePath, 'utf8');
          console.log(`Running SQL: ${sqlFile}`);

          const [result] = await query(sql);
          console.log(`SQL executed successfully: ${sqlFile}`, result);
        } else {
          console.log(`SQL file not found: ${sqlFile}`);
        }
      } catch (error) {
        console.error(`Error running SQL: ${sqlFile}`, error.message);
        // Continue with next file
      }
    }

    console.log('All SQL files processed');
  } catch (error) {
    console.error('Error running all SQL:', error);
  } finally {
    process.exit();
  }
}

runAllSQL();