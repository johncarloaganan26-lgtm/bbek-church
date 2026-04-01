
const { query } = require('./database/db');

async function check() {
    try {
        console.log('--- TABLES ---');
        const [tables] = await query('SHOW TABLES');
        console.log(tables);
        
        console.log('\n--- CHILD DEDICATION DATA ---');
        const [dedications] = await query('SELECT child_firstname, child_lastname, preferred_dedication_date, preferred_dedication_time, status FROM tbl_childdedications ORDER BY date_created DESC LIMIT 5');
        console.log(dedications);
        
        console.log('\n--- SERVICE SLOTS DATA ---');
        const [slots] = await query("SELECT * FROM tbl_service_slots WHERE service_type = 'dedication' LIMIT 5");
        console.log(slots);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
