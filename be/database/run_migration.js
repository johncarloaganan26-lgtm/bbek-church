const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('./db');
const fs = require('fs');

async function runMigration() {
    try {
        console.log('Running migration...');
        const sqlPath = path.join(__dirname, 'sync_discipleship_fields.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Remove comments and split by semicolon
        const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '');
        const queries = cleanSql.split(';').map(q => q.trim()).filter(q => q.length > 0);

        for (const q of queries) {
            const shortQ = q.replace(/\n/g, ' ').substring(0, 100);
            console.log(`Executing: ${shortQ}...`);
            try {
                await query(q);
                console.log('✅ Success');
            } catch (err) {
                if (err.message.includes('Duplicate column')) {
                    console.warn('⚠️ Column already exists, skipping.');
                } else {
                    console.error('❌ Error executing query:', err.message);
                }
            }
        }
        console.log('Migration completed');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
