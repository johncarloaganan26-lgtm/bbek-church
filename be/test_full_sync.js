require('dotenv').config();
const { query } = require('./database/db');

async function runFullSyncTest() {
    console.log('--- STARTING FULL SYNC TEST (Total System) ---');
    const targetRequestId = 'REQ000001';
    const testPastorId = '000000006'; // Example ID with leading zeros
    
    try {
        console.log(`1. Testing GET resolution for ${targetRequestId} with pastor_id: ${testPastorId}`);
        // Exact query logic used in the app
        const [rows] = await query(`
            SELECT 
                dr.request_id,
                dr.pastor_id,
                COALESCE(
                    NULLIF(TRIM(CONCAT_WS(' ', m_acc.firstname, m_acc.lastname)), ''),
                    NULLIF(TRIM(CONCAT_WS(' ', m_direct.firstname, m_direct.lastname)), '')
                ) as resolved_pastor_name
            FROM tbl_discipleship_requests dr
            LEFT JOIN tbl_accounts a ON (
                dr.pastor_id = a.acc_id OR
                (dr.pastor_id REGEXP '^[0-9]+$' AND CAST(dr.pastor_id AS UNSIGNED) = a.acc_id)
            )
            LEFT JOIN tbl_members m_acc ON a.email = m_acc.email COLLATE utf8mb4_unicode_ci
            LEFT JOIN tbl_members m_direct ON (
                dr.pastor_id = m_direct.member_id OR
                (dr.pastor_id REGEXP '^[0-9]+$' AND CAST(dr.pastor_id AS UNSIGNED) = m_direct.member_id)
            ) COLLATE utf8mb4_unicode_ci
            WHERE dr.request_id = ?
        `, [targetRequestId]);

        if (rows.length > 0) {
            console.log('Stored Pastor ID:', rows[0].pastor_id);
            console.log('Resolved Name:', rows[0].resolved_pastor_name);
            
            if (rows[0].resolved_pastor_name === 'Danny Delos santos') {
                console.log('✅ TABLE RESOLUTION: SUCCESS');
            } else {
                console.log('❌ TABLE RESOLUTION: FAILED');
            }
        }

        console.log('2. Testing EMAIL/UPDATE query logic (the one that was failing before)...');
        // The email query needs to use the same logic
        const [emailRows] = await query(`
            SELECT 
                COALESCE(
                    NULLIF(TRIM(CONCAT_WS(' ', m_acc.firstname, m_acc.lastname)), ''),
                    NULLIF(TRIM(CONCAT_WS(' ', m_direct.firstname, m_direct.lastname)), '')
                ) as pastor_name
            FROM (SELECT ? as pastor_id) tmp
            LEFT JOIN tbl_accounts a ON (tmp.pastor_id = a.acc_id OR (tmp.pastor_id REGEXP '^[0-9]+$' AND CAST(tmp.pastor_id AS UNSIGNED) = a.acc_id))
            LEFT JOIN tbl_members m_acc ON a.email = m_acc.email COLLATE utf8mb4_unicode_ci
            LEFT JOIN tbl_members m_direct ON (tmp.pastor_id = m_direct.member_id OR (tmp.pastor_id REGEXP '^[0-9]+$' AND CAST(tmp.pastor_id AS UNSIGNED) = m_direct.member_id)) COLLATE utf8mb4_unicode_ci
        `, [testPastorId, testPastorId, testPastorId, testPastorId, testPastorId]);

        if (emailRows.length > 0 && emailRows[0].pastor_name === 'Danny Delos santos') {
            console.log('✅ EMAIL RESOLUTION: SUCCESS');
        } else {
            console.log('❌ EMAIL RESOLUTION: FAILED');
        }

    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        process.exit();
    }
}

runFullSyncTest();
