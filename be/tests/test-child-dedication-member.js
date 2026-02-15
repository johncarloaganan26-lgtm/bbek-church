require('dotenv').config();
const axios = require('axios');

async function testChildDedicationMemberRegistration() {
  try {
    console.log('Testing child dedication member registration without preferred_dedication_date...');

    // Test data for member registration (no preferred_dedication_date)
    const testData = {
      requested_by: '000000011', // Use an existing member ID
      requester_relationship: 'father',
      child_firstname: 'Test',
      child_lastname: 'Child',
      child_middle_name: 'Member',
      date_of_birth: '2024-01-01',
      place_of_birth: 'Test City',
      gender: 'M',
      // Note: preferred_dedication_date is NOT provided (should be null)
      contact_phone_number: '09123456789',
      contact_email: 'test@example.com',
      contact_address: 'Test Address',
      father_firstname: 'Test',
      father_lastname: 'Father',
      mother_firstname: 'Test',
      mother_lastname: 'Mother',
      sponsors: [],
      status: 'pending'
    };

    console.log('Sending test data:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:5000/api/church-records/child-dedications/createChildDedication', testData);

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('✅ SUCCESS: Child dedication created successfully for member without preferred_dedication_date');
      console.log('Created record ID:', response.data.data?.child_id);
    } else {
      console.log('❌ FAILED: Child dedication creation failed');
      console.log('Error:', response.data.message || response.data.error);
    }

  } catch (error) {
    console.error('❌ ERROR: Test failed');
    console.error('Error details:', error.response?.data || error.message);

    if (error.response?.data?.error?.includes('preferred_dedication_date')) {
      console.log('❌ CONFIRMED: The issue still exists - preferred_dedication_date is still required');
    }
  }
}

testChildDedicationMemberRegistration();