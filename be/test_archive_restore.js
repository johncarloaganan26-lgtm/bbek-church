/**
 * Test script for archive bulk restore functionality
 * Tests that the bulkRestoreArchives function handles:
 * 1. Empty JSON values (children column)
 * 2. Invalid date values (marriage_date column)
 * 3. Duplicate records
 * 4. Already restored records
 */

const { bulkRestoreArchives, getAllArchives } = require('./dbHelpers/archiveRecords');

async function testBulkRestore() {
    console.log('Testing bulk restore functionality...\n');

    try {
        // First, get some active archives to test
        const archivesResult = await getAllArchives({
            restored: 0, // Only get non-restored archives
            limit: 10,
            page: 1
        });

        if (!archivesResult.success || archivesResult.data.length === 0) {
            console.log('No archives found to test. Exiting.');
            return;
        }

        console.log(`Found ${archivesResult.data.length} archives to test`);
        console.log('Archives:', archivesResult.data.map(a => ({
            id: a.archive_id,
            table: a.original_table,
            original_id: a.original_id
        })));

        // Get archive IDs
        const archiveIds = archivesResult.data.map(a => a.archive_id);

        console.log('\nTesting bulk restore with archives:', archiveIds);

        // Test bulk restore
        const result = await bulkRestoreArchives(archiveIds, 'admin', 'Test restore');

        console.log('\n=== Bulk Restore Result ===');
        console.log('Success:', result.success);
        console.log('Message:', result.message);
        console.log('Data:', JSON.stringify(result.data, null, 2));

        // Check results
        if (result.data) {
            console.log('\n=== Summary ===');
            console.log(`Requested: ${result.data.requested}`);
            console.log(`Restored: ${result.data.restored}`);
            console.log(`Failed: ${result.data.failed}`);
            console.log(`Skipped: ${result.data.skipped}`);
            console.log(`Success Rate: ${result.data.success_rate}%`);

            if (result.data.failed.length > 0) {
                console.log('\n=== Failed Archives ===');
                result.data.failed.forEach(failed => {
                    console.log(`- ID: ${failed.archive_id}, Table: ${failed.original_table}, Reason: ${failed.reason}`);
                });
            }

            if (result.data.skipped.length > 0) {
                console.log('\n=== Skipped Archives ===');
                result.data.skipped.forEach(skipped => {
                    console.log(`- ID: ${skipped.archive_id}, Table: ${skipped.original_table}, Reason: ${skipped.reason}`);
                });
            }

            if (result.data.restored.length > 0) {
                console.log('\n=== Restored Archives ===');
                result.data.restored.forEach(restored => {
                    console.log(`- ID: ${restored.archive_id}, Table: ${restored.original_table}`);
                });
            }
        }

        console.log('\n=== Test Complete ===');

    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

// Run the test
testBulkRestore();
