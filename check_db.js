const { query } = require('./be/database/db');
async function check() {
    try {
        const [rows] = await query('DESCRIBE tbl_biblestudy_requests');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
check();
