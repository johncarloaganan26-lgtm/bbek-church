require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { sendAccountDetails } = require('./dbHelpers/emailHelperSendGrid');

async function testBaptismCompletionEmail() {
  console.log('Testing Baptism Completion Email...');
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set');
  console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);
  
  try {
    // Test with a real email address
    const result = await sendAccountDetails({
      acc_id: 'test_baptism_001',
      email: 'johncarloaganan26@gmail.com', // Replace with your test email
      name: 'Test Baptism Member',
      type: 'new_account',
      temporaryPassword: 'TempPass123!'
    });
    
    console.log('Email result:', result);
    
    if (result.success) {
      console.log('✅ Baptism completion email sent successfully!');
    } else {
      console.error('❌ Failed to send email:', result.message);
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

testBaptismCompletionEmail();
