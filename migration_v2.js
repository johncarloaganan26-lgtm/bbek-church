require('dotenv').config({ path: './be/.env' });
const { query } = require('./be/database/db');

async function run() {
    try {
        console.log('Adding pastor_id column...');
        await query('ALTER TABLE tbl_discipleship_requests ADD COLUMN pastor_id VARCHAR(45) NULL AFTER status');
        console.log('pastor_id added');
    } catch (e) {
        console.log('pastor_id might already exist or error:', e.message);
    }

    try {
        console.log('Adding location column...');
        await query('ALTER TABLE tbl_discipleship_requests ADD COLUMN location VARCHAR(100) NULL AFTER pastor_id');
        console.log('location added');
    } catch (e) {
        console.log('location might already exist or error:', e.message);
    }

    process.exit(0);
}

run();
