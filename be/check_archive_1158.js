const mysql = require('mysql2/promise');
require('dotenv').config();

const run = async () => {
    console.log('=== Starting investigation ===');
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Database connected');

        console.log('\\n=== Checking archive 1158 ===');

        // Get archive
        const [archives] = await connection.execute('SELECT * FROM tbl_archives WHERE archive_id = ?', [1158]);
        if (archives.length === 0) {
            console.log('❌ Archive 1158 not found');
            await connection.end();
            return;
        }

        const archive = archives[0];
        console.log('✅ Archive found');
        console.log('Archive data:', JSON.stringify(archive, null, 2));

        // Parse archived data
        let archivedData;
        try {
            archivedData = JSON.parse(archive.archived_data);
            console.log('✅ Archived data parsed');
        } catch (parseError) {
            console.error('❌ Error parsing archived data:', parseError);
            await connection.end();
            return;
        }

        console.log('\\n=== Archived data ===');
        console.log('member_id:', archivedData.member_id);

        console.log('\\n=== Checking if record exists in tbl_members ===');
        const [existingMembers] = await connection.execute('SELECT * FROM tbl_members WHERE member_id = ?', [archivedData.member_id]);
        console.log('Existing members count:', existingMembers.length);
        if (existingMembers.length > 0) {
            console.log('⚠️  Record already exists!');
            console.log('Existing record:', JSON.stringify(existingMembers[0], null, 2));
        } else {
            console.log('✅ Record does NOT exist');
        }

        console.log('\\n=== Checking all members ===');
        const [allMembers] = await connection.execute('SELECT member_id FROM tbl_members LIMIT 10');
        console.log('First 10 member IDs:', allMembers.map(m => m.member_id));

        // Close connection
        await connection.end();

    } catch (error) {
        console.error('❌ Error:', error);
    }
};

console.log('🚀 Running check...');
run();
