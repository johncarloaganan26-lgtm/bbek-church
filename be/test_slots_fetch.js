const axios = require('axios');

async function test() {
  try {
    const response = await axios.get('http://localhost:5000/api/services/discipleship-requests/available-slots', {
      params: { service: 'bible_study', days: 14 }
    });
    console.log('Bible Study Slots:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching slots:', error.response ? error.response.data : error.message);
  }
}

test();
