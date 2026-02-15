const { query } = require('./database/db');

async function testPagination() {
    console.log('Testing pagination...');

    // Test 1: Get total count
    const countResult = await query('SELECT COUNT(*) as total FROM tbl_members');
    console.log('Total members:', countResult[0].total);

    // Test 2: Get first page (10 records)
    console.log('\nPage 1 (10 records):');
    const page1Result = await query('SELECT * FROM tbl_members LIMIT 10 OFFSET 0');
    console.log(`Retrieved ${page1Result.length} records`);
    page1Result.forEach((member, index) => {
        console.log(`${index + 1}. ${member.firstname} ${member.lastname} (ID: ${member.member_id})`);
    });

    // Test 3: Get second page (10 records)
    console.log('\nPage 2 (10 records):');
    const page2Result = await query('SELECT * FROM tbl_members LIMIT 10 OFFSET 10');
    console.log(`Retrieved ${page2Result.length} records`);
    page2Result.forEach((member, index) => {
        console.log(`${index + 11}. ${member.firstname} ${member.lastname} (ID: ${member.member_id})`);
    });

    console.log('\n✅ Test completed!');
}

testPagination().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
