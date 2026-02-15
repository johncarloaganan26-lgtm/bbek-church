// Script to fix event statuses in the database
// Run this script to update existing events from 'approved'/'cancelled' to valid statuses

const { query } = require('./database/db');

async function fixEventStatuses() {
  try {
    console.log('Fixing event statuses...');

    // Update events with 'approved' status to 'pending'
    const [approvedResult] = await query(`
      UPDATE tbl_events
      SET status = 'pending'
      WHERE status = 'approved'
    `);
    console.log(`Updated ${approvedResult.affectedRows} events from 'approved' to 'pending'`);

    // Update events with 'cancelled' status to 'completed'
    const [cancelledResult] = await query(`
      UPDATE tbl_events
      SET status = 'completed'
      WHERE status = 'cancelled'
    `);
    console.log(`Updated ${cancelledResult.affectedRows} events from 'cancelled' to 'completed'`);

    // Show current status distribution
    const [statusCounts] = await query(`
      SELECT status, COUNT(*) as count
      FROM tbl_events
      GROUP BY status
    `);
    console.log('\nCurrent status distribution:');
    statusCounts.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });

    console.log('\n✓ Event statuses fixed successfully!');
  } catch (error) {
    console.error('✗ Error fixing event statuses:', error.message);
    process.exit(1);
  }
}

fixEventStatuses();
