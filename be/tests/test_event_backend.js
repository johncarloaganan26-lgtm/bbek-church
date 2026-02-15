// Test script to verify event backend is working
const eventRecords = require('./dbHelpers/church_records/eventRecords');

async function testEventBackend() {
  try {
    console.log('Testing event backend...');

    // Test getAllEvents
    const result = await eventRecords.getAllEvents({ limit: 5 });
    console.log('getAllEvents result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✓ Event backend is working!');
      console.log(`  Found ${result.count} events`);
    } else {
      console.log('✗ Event backend error:', result.message);
    }
  } catch (error) {
    console.error('✗ Error testing event backend:', error.message);
    process.exit(1);
  }
}

testEventBackend();
