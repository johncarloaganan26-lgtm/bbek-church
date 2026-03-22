const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('./db');

async function checkSchema() {
    try {
        const [rows] = await query('DESCRIBE tbl_biblestudy_requests');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
