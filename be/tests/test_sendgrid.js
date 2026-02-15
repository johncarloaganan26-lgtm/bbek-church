require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const sgMail = require('@sendgrid/mail');
const https = require('https');

console.log('Testing SendGrid API Key...');
console.log('API Key loaded:', process.env.SENDGRID_API_KEY ? 'Yes' : 'No');
console.log('From Email:', process.env.SENDGRID_FROM_EMAIL);

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Test basic API call
  const testMsg = {
    to: 'johncarloaganan26@gmail.com',
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Test Email from Church System',
    text: 'This is a test email from your church management system.'
  };

  sgMail.send(testMsg)
    .then(() => {
      console.log('✅ SendGrid API key is valid and working!');
      checkAccountLimits();
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

// Function to check account limits
function checkAccountLimits() {
  console.log('\n--- Checking SendGrid Account Limits ---');
  
  const options = {
    hostname: 'api.sendgrid.com',
    path: '/v3/account',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const account = JSON.parse(data);
        console.log('Account Info:', JSON.stringify(account, null, 2));
        
        if (account.errors) {
          console.log('Errors:', account.errors);
        }
      } catch (e) {
        console.error('Error parsing account info:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error fetching account:', error.message);
  });

  req.end();

  // Check credits/limits
  const creditsOptions = {
    hostname: 'api.sendgrid.com',
    path: '/v3/user/credits',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
    }
  };

  const creditsReq = https.request(creditsOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const credits = JSON.parse(data);
        console.log('\n--- Credits/Limits ---');
        console.log(JSON.stringify(credits, null, 2));
      } catch (e) {
        console.error('Error parsing credits:', e.message);
      }
    });
  });

  creditsReq.on('error', (error) => {
    console.error('Error fetching credits:', error.message);
  });

  creditsReq.end();
}
