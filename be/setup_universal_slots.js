require('dotenv').config();
const { query } = require('./database/db');

async function createServiceSlotsTable() {
  try {
    console.log('Creating tbl_service_slots...');
    
    await query(`
      CREATE TABLE IF NOT EXISTS tbl_service_slots (
        slot_id INT AUTO_INCREMENT PRIMARY KEY,
        service_type ENUM('salvation', 'baptism', 'dedication', 'burial', 'bible_study') NOT NULL,
        available_date DATE NOT NULL,
        available_time TIME NOT NULL,
        max_slots INT DEFAULT 1,
        status ENUM('Available', 'Booked', 'Cancelled') DEFAULT 'Available',
        date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_service_date (service_type, available_date)
      )
    `);

    console.log('✅ tbl_service_slots created successfully!');

    // Optionally migrate salvation slots to this new table
    console.log('Migrating existing salvation slots...');
    await query(`
      INSERT INTO tbl_service_slots (service_type, available_date, available_time, max_slots, status, date_created)
      SELECT 'salvation', available_date, available_time, max_slots, status, date_created 
      FROM tbl_salvation_availability
    `);
    console.log('✅ Migration complete!');

  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    process.exit();
  }
}

createServiceSlotsTable();
