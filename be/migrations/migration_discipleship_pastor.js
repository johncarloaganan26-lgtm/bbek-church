require('dotenv').config();
const { query } = require('./database/db');

async function runMigration() {
    try {
        console.log('--- Discipleship Migration Started ---');

        // Check if columns exist
        const [columns] = await query("SHOW COLUMNS FROM tbl_discipleship_requests");
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('pastor_id')) {
            console.log('Adding pastor_id...');
            await query("ALTER TABLE tbl_discipleship_requests ADD COLUMN pastor_id VARCHAR(45) NULL AFTER status");
            console.log('pastor_id added.');
        } else {
            console.log('pastor_id already exists.');
        }

        if (!columnNames.includes('location')) {
            console.log('Adding location...');
            await query("ALTER TABLE tbl_discipleship_requests ADD COLUMN location VARCHAR(100) NULL AFTER pastor_id");
            console.log('location added.');
        } else {
            console.log('location already exists.');
        }

        console.log('--- Migration Finished Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
