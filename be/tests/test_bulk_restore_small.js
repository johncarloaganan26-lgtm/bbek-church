require('dotenv').config();
const { bulkRestoreArchives } = require('./dbHelpers/archiveRecords');
const { query } = require('./database/db');

async function testBulkRestore() {
    console.log('Testing bulk restore with available records...');

    // First, get some available (unrestored) archives
    const [availableArchives] = await query(`
    SELECT archive_id 
    FROM tbl_archives 
    WHERE restored = 0 
    LIMIT 5
  `);

    console.log(`Found ${availableArchives.length} available archives to restore`);

    if (availableArchives.length === 0) {
        console.log('No archives available for restoration');
        return;
    }

    const archiveIds = availableArchives.map(archive => archive.archive_id);

    console.log(`Attempting to restore archives: ${archiveIds.join(', ')}`);

    const startTime = Date.now();

    try {
        const result = await bulkRestoreArchives(archiveIds, 'testuser@example.com', 'Test bulk restore optimization');

        console.log('');
        console.log('Bulk Restore Results:');
        console.log('---------------------');
        console.log(`Total requested: ${result.data.requested}`);
        console.log(`Total processed: ${result.data.processed}`);
        console.log(`Restored: ${result.data.restored}`);
        console.log(`Failed: ${result.data.failed}`);
        console.log(`Skipped: ${result.data.skipped}`);
        console.log(`Success rate: ${result.data.success_rate}%`);

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log('');
        console.log(`Performance: ${duration}ms`);
        console.log(`Records per second: ${(result.data.processed / (duration / 1000)).toFixed(1)}`);

        if (result.data.failed > 0) {
            console.log('');
            console.log('Failed archives:');
            result.data.failed_archives.forEach(failed => {
                console.log(`- Archive ${failed.archive_id}: ${failed.reason}`);
            });
        }

        if (result.data.skipped > 0) {
            console.log('');
            console.log('Skipped archives (already restored):');
            result.data.skipped_archives.forEach(skipped => {
                console.log(`- Archive ${skipped.archive_id}`);
            });
        }
    } catch (error) {
        console.error('Error during bulk restore:', error);
    }
}

testBulkRestore().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
