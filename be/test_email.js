require('dotenv').config();
const { sendAccountDetails } = require('./dbHelpers/emailHelper');

async function testGmail() {
  console.log('Testing Gmail...');
  try {
    const result = await sendAccountDetails({
      acc_id: 'test123',
      email: 'invalid-email-test@localhost', // Invalid email to test connection without sending
      name: 'Test User',
      type: 'new_account',
      temporaryPassword: 'testpass123'
    });
    console.log('Gmail result:', result);
  } catch (error) {
    console.error('Gmail error:', error);
  }
}

async function main() {
  console.log('Starting email tests...');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

  await testGmail();
}

main().catch(console.error);