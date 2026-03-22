require('dotenv').config({ path: './be/.env' });
const { query } = require('./be/database/db');

async function migrate() {
    try {
        console.log('Starting migration: Adding status column to tbl_departmentofficers...');
        // Check if column already exists
        const [columns] = await query('SHOW COLUMNS FROM tbl_departmentofficers LIKE "status"');
        if (columns.length > 0) {
            console.log('Column "status" already exists. Skipping...');
        } else {
            await query('ALTER TABLE tbl_departmentofficers ADD COLUMN status VARCHAR(20) DEFAULT "Active" AFTER role');
            console.log('Migration successful: Added status to tbl_departmentofficers');
        }
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
