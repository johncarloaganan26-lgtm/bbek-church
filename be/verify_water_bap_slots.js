const axios = require('axios');

async function test() {
  try {
    console.log('--- Testing Discipleship Requests (Water Baptism) ---');
    const res1 = await axios.get('http://localhost:5000/api/services/discipleship-requests/available-slots', {
      params: { service: 'water_baptism', days: 14 }
    });
    console.log('Result:', JSON.stringify(res1.data, null, 2));

    console.log('\n--- Testing Water Baptisms Admin (Water Baptism) ---');
    const res2 = await axios.get('http://localhost:5000/api/services/water-baptisms/available-slots', {
      params: { days: 14 }
    });
    console.log('Result:', JSON.stringify(res2.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

test();
