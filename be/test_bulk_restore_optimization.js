require('dotenv').config();
const { bulkRestoreArchives } = require('./dbHelpers/archiveRecords');

async function testBulkRestore() {
    console.log('Testing bulk restore optimization...');

    // Test with sample archive IDs
    const archiveIds = Array.from({ length: 100 }, (_, i) => i + 980); // Test with 100 records

    console.log(`Restoring ${archiveIds.length} archives...`);

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
    } catch (error) {
        console.error('Error during bulk restore:', error);
    }
}

testBulkRestore().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
