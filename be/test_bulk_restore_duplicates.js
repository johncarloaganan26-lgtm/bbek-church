require('dotenv').config();
const { bulkRestoreArchives } = require('./dbHelpers/archiveRecords');
const { query } = require('./database/db');

async function testBulkRestore() {
    console.log('Testing bulk restore with duplicates...');

    // First, get some available (unrestored) archives that don't exist in destination tables
    const [availableArchives] = await query(`
    SELECT a.archive_id, a.original_table, a.original_id, a.archived_data
    FROM tbl_archives a
    WHERE a.restored = 0 
    LIMIT 10
  `);

    console.log(`Found ${availableArchives.length} available archives to restore`);

    if (availableArchives.length === 0) {
        console.log('No archives available for restoration');
        return;
    }

    // Check which archives don't have corresponding records in their destination tables
    const tablePrimaryKeys = {
        'tbl_members': 'member_id',
        'tbl_accounts': 'acc_id',
        'tbl_departments': 'department_id',
        'tbl_ministry': 'ministry_id',
        'tbl_events': 'event_id',
        'tbl_approval': 'approval_id',
        'tbl_tithes': 'tithes_id',
        'tbl_churchleaders': 'leader_id',
        'tbl_departmentofficers': 'officer_id',
        'tbl_waterbaptism': 'baptism_id',
        'tbl_marriageservice': 'marriage_id',
        'tbl_burialservice': 'burial_id',
        'tbl_childdedications': 'child_id',
        'tbl_transactions': 'transaction_id'
    };

    const uniqueArchiveIds = [];

    for (const archive of availableArchives) {
        try {
            const primaryKeyField = tablePrimaryKeys[archive.original_table];

            if (primaryKeyField) {
                const checkSql = `SELECT COUNT(*) as count FROM \`${archive.original_table}\` WHERE ${primaryKeyField} = ?`;
                const [countResult] = await query(checkSql, [archive.original_id]);

                if (countResult[0].count === 0) {
                    uniqueArchiveIds.push(archive.archive_id);
                    console.log(`- Archive ${archive.archive_id} for ${archive.original_table} (ID: ${archive.original_id}) is unique and can be restored`);
                } else {
                    console.log(`- Archive ${archive.archive_id} for ${archive.original_table} (ID: ${archive.original_id}) already exists and will be skipped`);
                }
            }
        } catch (error) {
            console.error(`- Error checking archive ${archive.archive_id}:`, error.message);
        }
    }

    console.log(`\n${uniqueArchiveIds.length} unique archives identified for restoration`);

    if (uniqueArchiveIds.length === 0) {
        console.log('No unique archives available for restoration');
        return;
    }

    const startTime = Date.now();

    try {
        const result = await bulkRestoreArchives(uniqueArchiveIds, 'testuser@example.com', 'Test bulk restore duplicates handling');

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
