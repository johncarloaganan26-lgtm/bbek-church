const { query } = require('./be/database/db');
require('dotenv').config({ path: './be/.env' });

async function migrate() {
    try {
        console.log('Running migration...');
        const sql = `ALTER TABLE tbl_biblestudy_requests 
                     MODIFY COLUMN status ENUM('Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected', 'Promoted') DEFAULT 'Pending'`;
        await query(sql);
        console.log('Migration successful: "Promoted" status added to tbl_biblestudy_requests');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
