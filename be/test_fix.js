require('dotenv').config();
const { query } = require('./database/db');

async function testFix() {
    console.log('Testing Pastor ID Resolution (Synced Fix)...');
    
    // 1. Manually check the query logic for name resolution
    const pastorId = '000000006'; // Example ID
    
    try {
        console.log(`Testing resolution for ID: ${pastorId}`);
        
        const [rows] = await query(`
            SELECT 
                COALESCE(
                    NULLIF(TRIM(CONCAT_WS(' ', m_acc.firstname, m_acc.lastname)), ''),
                    NULLIF(TRIM(CONCAT_WS(' ', m_direct.firstname, m_direct.lastname)), '')
                ) as pastor_name
            FROM (SELECT ? as pastor_id) tmp
            LEFT JOIN tbl_accounts a ON (
                tmp.pastor_id = a.acc_id OR
                (tmp.pastor_id REGEXP '^[0-9]+$' AND CAST(tmp.pastor_id AS UNSIGNED) = a.acc_id)
            )
            LEFT JOIN tbl_members m_acc ON a.email = m_acc.email COLLATE utf8mb4_unicode_ci
            LEFT JOIN tbl_members m_direct ON (
                tmp.pastor_id = m_direct.member_id OR
                (tmp.pastor_id REGEXP '^[0-9]+$' AND CAST(tmp.pastor_id AS UNSIGNED) = m_direct.member_id)
            ) COLLATE utf8mb4_unicode_ci
        `, [pastorId, pastorId, pastorId, pastorId, pastorId]);

        if (rows.length > 0 && rows[0].pastor_name) {
            console.log('✅ Name Resolved Successfully:', rows[0].pastor_name);
        } else {
            console.log('❌ Name Resolution Failed.');
        }

        // 2. Test the specific "Update" email query logic that was reported failing
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
        `, [pastorId, pastorId, pastorId, pastorId, pastorId]);

        if (emailRows.length > 0 && emailRows[0].pastor_name) {
            console.log('✅ Email Query Resolved Successfully:', emailRows[0].pastor_name);
        } else {
            console.log('❌ Email Query Resolution Failed.');
        }

    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        process.exit();
    }
}

testFix();
