const { query } = require('../be/database/db');

async function checkSlots() {
  try {
    const [rows] = await query("SELECT * FROM tbl_service_slots WHERE service_type = 'water_baptism'");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkSlots();
