const { query } = require('./database/db');
require('dotenv').config();

async function migrate() {
    try {
        console.log('Running migration...');
        const sql = `ALTER TABLE tbl_biblestudy_requests 
                     MODIFY COLUMN status ENUM('Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected', 'Promoted') DEFAULT 'Pending'`;
        await query(sql);
        console.log('Migration successful: "Promoted" status added to tbl_biblestudy_requests');
        process.exit(0);
    } catch (error) {
        // If it already exists or fails for other reasons, log it
        console.error('Migration failed or already applied:', error.message);
        process.exit(1);
    }
}

migrate();
