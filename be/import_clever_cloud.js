const fs = require('fs');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { query, pool } = require('./database/db');

// Path to your huge SQL file
const SQL_PATH = 'c:\\Users\\John Carlo\\Downloads\\bryfbawdw5ngbh2tmkdf-mysql_services_clever-cloud_com.sql';

async function performImport() {
    if (!fs.existsSync(SQL_PATH)) {
        console.error(`❌ SQL File not found at ${SQL_PATH}`);
        return;
    }

    console.log('🚀 Starting deep database restore to Clever Cloud...');
    console.log(`📂 Reading: ${SQL_PATH}`);

    const fileStream = fs.createReadStream(SQL_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let currentQuery = '';
    let count = 0;
    let successCount = 0;
    let failCount = 0;

    for await (const line of rl) {
        const trimmed = line.trim();
        
        // Skip comments, empty lines, and USE statements
        if (trimmed.startsWith('--') || trimmed.startsWith('/*') || trimmed.startsWith('USE ') || trimmed === '') {
            continue;
        }

        currentQuery += line + '\n';

        // Execute when we find a semicolon at the end of a line
        if (trimmed.endsWith(';')) {
            try {
                // Remove MySQL specific comments like /*!40101 ... */
                let executableSql = currentQuery.replace(/\/\*!.*?\*\//g, '').trim();
                
                if (executableSql.length > 0) {
                    await query(executableSql);
                    successCount++;
                }
            } catch (err) {
                // Ignore "Table already exists" or "Duplicate column" errors
                if (!err.message.includes('already exists')) {
                    console.error(`\n❌ Error at block ${successCount + failCount + 1}:`);
                    console.error(`Error message: ${err.message}`);
                    failCount++;
                }
            }
            
            currentQuery = '';
            
            // Progress tracker
            if ((successCount + failCount) % 50 === 0) {
                process.stdout.write(`\rRestored ${successCount + failCount} SQL blocks...`);
            }
        }
    }

    console.log(`\n\n✅ Restore Finished!`);
    console.log(`- Blocks Success: ${successCount}`);
    console.log(`- Blocks Skipped/Failed: ${failCount}`);
    console.log(`\nYour BBEK application should now be fully functional on Clever Cloud.`);
    
    await pool.end();
    process.exit(0);
}

performImport().catch(err => {
    console.error('💥 CRITICAL FAILURE:', err);
    process.exit(1);
});
