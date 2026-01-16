require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const sgMail = require('@sendgrid/mail');
const https = require('https');

console.log('=== Detailed SendGrid Analysis ===');
console.log('API Key loaded:', process.env.SENDGRID_API_KEY ? 'Yes' : 'No');
console.log('From Email:', process.env.SENDGRID_FROM_EMAIL);
console.log('');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Test 1: Basic API connectivity
  console.log('Test 1: Basic API connectivity');
  const testMsg = {
    to: 'johncarloaganan26@gmail.com',
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'BBEK Test'
    },
    subject: 'SendGrid Connectivity Test',
    text: 'This is a test to check SendGrid connectivity and performance.',
    html: '<p>This is a test to check SendGrid connectivity and performance.</p>'
  };

  const startTime = Date.now();
  sgMail.send(testMsg)
    .then((response) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log('✅ Email sent successfully');
      console.log(`⏱️  Response time: ${duration}ms`);
      if (duration > 5000) {
        console.log('⚠️  Warning: Slow response time (>5s)');
      }
      console.log('Response:', response[0]?.statusCode);
      console.log('');
      checkAccountDetails();
    })
    .catch(error => {
      console.error('❌ Email send failed:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Body:', error.response.body);
      }
      console.log('');
      checkAccountDetails();
    });
} else {
  console.error('❌ SENDGRID_API_KEY not found');
  checkAccountDetails();
}

function checkAccountDetails() {
  console.log('Test 2: Account Details');

  // Check user profile
  const profileOptions = {
    hostname: 'api.sendgrid.com',
    path: '/v3/user/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  const profileReq = https.request(profileOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const profile = JSON.parse(data);
        console.log('Profile Status:', res.statusCode);
        if (profile.errors) {
          console.log('Profile Errors:', profile.errors);
        } else {
          console.log('Account Type:', profile.account_type || 'N/A');
          console.log('Email:', profile.email || 'N/A');
        }
      } catch (e) {
        console.error('Error parsing profile:', e.message);
      }
      checkLimits();
    });
  });

  profileReq.on('error', (error) => {
    console.error('Profile request error:', error.message);
    checkLimits();
  });

  profileReq.end();
}

function checkLimits() {
  console.log('');
  console.log('Test 3: Rate Limits and Credits');

  const creditsOptions = {
    hostname: 'api.sendgrid.com',
    path: '/v3/user/credits',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
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
        console.log('Credits Status:', res.statusCode);
        if (credits.errors) {
          console.log('Credits Errors:', credits.errors);
        } else {
          console.log('Total Credits:', credits.total || 'N/A');
          console.log('Used Credits:', credits.used || 'N/A');
          console.log('Remaining Credits:', credits.remain || 'N/A');
          console.log('Reset Frequency:', credits.reset_frequency || 'N/A');
          console.log('Last Reset:', credits.last_reset || 'N/A');
          console.log('Next Reset:', credits.next_reset || 'N/A');

          if (credits.remain <= 10) {
            console.log('⚠️  Warning: Low credits remaining!');
          }
        }
      } catch (e) {
        console.error('Error parsing credits:', e.message);
      }
      checkSuppression();
    });
  });

  creditsReq.on('error', (error) => {
    console.error('Credits request error:', error.message);
    checkSuppression();
  });

  creditsReq.end();
}

function checkSuppression() {
  console.log('');
  console.log('Test 4: Suppression List Check');

  const suppressionOptions = {
    hostname: 'api.sendgrid.com',
    path: '/v3/suppression/bounces?limit=5',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  const suppressionReq = https.request(suppressionOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const suppression = JSON.parse(data);
        console.log('Suppression Status:', res.statusCode);
        if (suppression.errors) {
          console.log('Suppression Errors:', suppression.errors);
        } else {
          console.log('Bounce Count:', suppression.length || 0);
          if (suppression.length > 0) {
            console.log('Recent Bounces:', suppression.slice(0, 3));
          }
        }
      } catch (e) {
        console.error('Error parsing suppression:', e.message);
      }
      console.log('');
      console.log('=== Analysis Complete ===');
      provideRecommendations();
    });
  });

  suppressionReq.on('error', (error) => {
    console.error('Suppression request error:', error.message);
    console.log('');
    console.log('=== Analysis Complete ===');
    provideRecommendations();
  });

  suppressionReq.end();
}

function provideRecommendations() {
  console.log('');
  console.log('📋 RECOMMENDATIONS:');
  console.log('1. If emails are slow, check network connectivity');
  console.log('2. Monitor credit usage - upgrade plan if needed');
  console.log('3. Verify sender email reputation');
  console.log('4. Check recipient email validity');
  console.log('5. Consider email batching for bulk sends');
  console.log('6. Implement proper error handling and retries');
  console.log('7. Monitor SendGrid dashboard for issues');
}