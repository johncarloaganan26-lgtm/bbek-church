require('dotenv').config();
const sgMail = require('@sendgrid/mail');

console.log('Testing SendGrid API Key...');
console.log('API Key loaded:', process.env.SENDGRID_API_KEY ? 'Yes' : 'No');
console.log('From Email:', process.env.SENDGRID_FROM_EMAIL);

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Test basic API call
  const testMsg = {
    to: 'johncarloaganan26@gmail.com', // Real email to test
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Test Email from Church System',
    text: 'This is a test email from your church management system.'
  };

  sgMail.send(testMsg)
    .then(() => {
      console.log('✅ SendGrid API key is valid and working!');
    })
    .catch(error => {
      console.error('❌ SendGrid API error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response body:', error.response.body);
      }
    });
} else {
  console.error('❌ SENDGRID_API_KEY not found in environment');
}