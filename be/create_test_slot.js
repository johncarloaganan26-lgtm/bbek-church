require('dotenv').config();
const { query } = require('./database/db');


async function createSlot() {
  try {
    const service_type = 'bible_study';
    const date = '2026-04-15';
    const time = '10:00:00';
    const max_slots = 10;
    
    await query(
      'INSERT INTO tbl_service_slots (service_type, available_date, available_time, max_slots, status, date_created) VALUES (?, ?, ?, ?, \'Available\', NOW())',
      [service_type, date, time, max_slots]
    );
    console.log('Slot created successfully');
  } catch (err) {
    console.error('Error creating slot:', err);
  } finally {
    process.exit();
  }
}

createSlot();
