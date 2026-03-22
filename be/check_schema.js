require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { query } = require('./database/db');

async function main() {
    try {
        const [bsColumns] = await query("SHOW COLUMNS FROM tbl_biblestudy_requests");
        console.log("tbl_biblestudy_requests columns:");
        console.log(JSON.stringify(bsColumns.map(c => c.Field), null, 2));

        const [dispColumns] = await query("SHOW COLUMNS FROM tbl_discipleship_requests");
        console.log("tbl_discipleship_requests columns:");
        console.log(JSON.stringify(dispColumns.map(c => c.Field), null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
