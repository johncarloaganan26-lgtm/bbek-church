const { query } = require('./be/database/db');

async function runMigration() {
    try {
        console.log('Running migration to add pastor_id and location to tbl_discipleship_requests...');

        // Check if columns already exist to avoid errors
        const [columns] = await query("SHOW COLUMNS FROM tbl_discipleship_requests");
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('pastor_id')) {
            await query("ALTER TABLE tbl_discipleship_requests ADD COLUMN pastor_id VARCHAR(45) NULL AFTER status");
            console.log('Added pastor_id column');
        }

        if (!columnNames.includes('location')) {
            await query("ALTER TABLE tbl_discipleship_requests ADD COLUMN location VARCHAR(100) NULL AFTER pastor_id");
            console.log('Added location column');
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
