require('dotenv').config();
const { sendAccountDetails } = require('./dbHelpers/emailHelper');

async function testEmail() {
  console.log('Testing email sending...');

  const testResult = await sendAccountDetails({
    acc_id: 999,
    email: 'bbekkawit@gmail.com', // Replace with your test email
    name: 'Test User',
    type: 'forgot_password',
    token: 'test-jwt-token-placeholder'
  });

  console.log('Test result:', testResult);
}

testEmail().catch(console.error);
