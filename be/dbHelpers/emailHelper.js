const nodemailer = require('nodemailer');
const crypto = require('crypto');
const moment = require('moment-timezone');
require('dotenv').config();

// Set default timezone to Philippines (Asia/Manila, UTC+8)
moment.tz.setDefault('Asia/Manila');

const CHURCH_EMAIL = process.env.EMAIL_USER || 'biblebaptistekklesiaofkawit@gmail.com';

// Lightweight token generator until JWT routes are available
const generateResetToken = () => crypto.randomBytes(32).toString('hex');

// Nodemailer transporter configuration
// Configure these in your .env file:
// EMAIL_HOST=smtp.gmail.com (or your SMTP server)
// EMAIL_PORT=587
// EMAIL_SECURE=false (true for 465, false for other ports)
// EMAIL_USER=your-email@gmail.com
// EMAIL_PASS=your-app-password
// FRONTEND_URL1=http://localhost:5174 (or your frontend URL)

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });


};

/**
 * Send account details email for password change
 * Supports two scenarios: new account creation and forgot password
 * @param {Object} accountDetails - Account details object
 * @param {string|number} accountDetails.acc_id - Account ID
 * @param {string} accountDetails.email - Recipient email
 * @param {string} [accountDetails.name] - Account holder name (optional)
 * @param {string} [accountDetails.type] - Email type: 'new_account' or 'forgot_password' (default: 'forgot_password')
 * @param {string} [accountDetails.temporaryPassword] - Temporary password for new accounts (optional)
 * @returns {Promise<Object>} - Result object with success status and message
 */
const buildErrorResult = (message, error) => {
  // Return a consistent error shape to FE with useful nodemailer diagnostics
  return {
    success: false,
    message,
    error: error?.message || null,
    code: error?.code || null,
    response: error?.response || null,
    responseCode: error?.responseCode || null,
  };
};

const sendAccountDetails = async (accountDetails) => {
  try {
    if (!accountDetails || !accountDetails.acc_id || !accountDetails.email) {
      return {
        success: false,
        message: 'Account ID and email are required',
      };
    }

    const emailType = accountDetails.type || 'forgot_password'; // 'new_account' or 'forgot_password'
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL1 || 'http://localhost:5173' || 'http://localhost:5174';
    const resetUrlBase = `${frontendUrl}/change-password/${accountDetails.acc_id}`;

    // For account setup (new_account), don't use tokens - allow direct access
    // For password reset (forgot_password), use tokens with expiration
    let token = null;
    let resetUrl = resetUrlBase;

    if (emailType === 'forgot_password') {
      token = accountDetails.token || accountDetails.resetToken || generateResetToken();
      resetUrl = token
        ? `${resetUrlBase}?token=${encodeURIComponent(token)}&type=${encodeURIComponent(emailType)}`
        : resetUrlBase;
    } else {
      // For new_account, no token needed - direct access
      resetUrl = `${resetUrlBase}?type=${encodeURIComponent(emailType)}`;
    }
    const recipientName = accountDetails.name || 'User';

    // Determine email content based on type
    let subject, title, mainMessage, buttonText, importantNotes;

    if (emailType === 'new_account') {
      subject = 'Welcome! Set Your Password - Bible Baptist Ekklesia of Kawit';
      title = 'Welcome to Bible Baptist Ekklesia of Kawit';
      mainMessage = `Your account has been successfully created! To get started, please set your password by clicking the link below.`;
      buttonText = 'Set Password';
      importantNotes = `
        <p><strong>Important:</strong></p>
        <ul>
          <li>Please set your password as soon as possible to secure your account.</li>
          <li>This link will expire after a certain period for security reasons.</li>
          <li>For security, do not share this link with anyone.</li>
          ${accountDetails.temporaryPassword ? `<li><strong>Temporary Password:</strong> ${accountDetails.temporaryPassword} (Please change this immediately after logging in)</li>` : ''}
        </ul>
      `;
    } else {
      // forgot_password
      subject = 'Password Reset Request - Bible Baptist Ekklesia of Kawit';
      title = 'Password Reset Request';
      mainMessage = `You have requested to reset your password for your Bible Baptist Ekklesia of Kawit account.`;
      buttonText = 'Reset Password';
      importantNotes = `
        <p><strong>Important:</strong></p>
        <ul>
          <li>This link will expire after 7 days for security reasons.</li>
          <li>If you did not request this password reset, please ignore this email and contact the church administration immediately.</li>
          <li>For security, do not share this link with anyone.</li>
        </ul>
      `;
    }

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit Administrator" <${CHURCH_EMAIL}>`,
      to: accountDetails.email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">${title}</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>${mainMessage}</p>
            
            <p>Please click on the link below to ${emailType === 'new_account' ? 'set' : 'reset'} your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                ${buttonText}
              </a>
            </div>
            
            <p style="color: #7f8c8d; font-size: 12px;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #3498db; word-break: break-all;">${resetUrl}</a>
            </p>
            
            ${importantNotes}
            
            <p>If you have any questions or concerns, please contact the church administration.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: `Account details email sent successfully (${emailType === 'new_account' ? 'new account' : 'password reset'})`,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending account details email:', error);
    return buildErrorResult('Failed to send account details email', error);
  }
};

/**
 * Send marriage service details email
 * @param {Object} marriageDetails - Marriage service details object
 * @param {string} marriageDetails.email - Recipient email
 * @param {string} marriageDetails.status - Status: 'pending', 'ongoing', or 'completed'
 * @param {string} [marriageDetails.groomName] - Groom's name (optional)
 * @param {string} [marriageDetails.brideName] - Bride's name (optional)
 * @param {string} [marriageDetails.marriageDate] - Marriage date (optional)
 * @param {string} [marriageDetails.location] - Marriage location (optional)
 * @param {string} [marriageDetails.recipientName] - Recipient name (optional)
 * @returns {Promise<Object>} - Result object with success status and message
 */
const sendMarriageDetails = async (marriageDetails) => {
  try {
    if (!marriageDetails || !marriageDetails.email || !marriageDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }

    const transporter = createTransporter();
    const status = marriageDetails.status.toLowerCase();
    const statusColors = {
      pending: '#f39c12',
      ongoing: '#3498db',
      completed: '#27ae60',
    };
    const statusMessages = {
      pending: 'Your marriage service request is currently pending approval.',
      ongoing: 'Your marriage service is currently in progress.',
      completed: 'Your marriage service has been completed successfully.',
    };

    const recipientName = marriageDetails.recipientName || 'Valued Member';
    const groomName = marriageDetails.groomName || 'N/A';
    const brideName = marriageDetails.brideName || 'N/A';
    const marriageDate = marriageDetails.marriageDate || 'To be determined';
    const location = marriageDetails.location || 'To be determined';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: marriageDetails.email,
      subject: `Marriage Service Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Marriage Service Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Marriage Service Update</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>${statusMessages[status] || 'Your marriage service status has been updated.'}</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColors[status] || '#3498db'};">
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> 
                <span style="color: ${statusColors[status] || '#3498db'}; font-weight: bold; text-transform: uppercase;">
                  ${status}
                </span>
              </p>
            </div>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Marriage Service Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Groom:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${groomName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Bride:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${brideName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Marriage Date:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${marriageDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Location:</strong></td>
                  <td style="padding: 8px 0;">${location}</td>
                </tr>
              </table>
            </div>
            
            <p>If you have any questions or need to make changes, please contact the church administration.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Marriage details email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending marriage details email:', error);
    return buildErrorResult('Failed to send marriage details email', error);
  }
};

/**
 * Send water baptism service details email
 * @param {Object} baptismDetails - Baptism service details object
 * @param {string} baptismDetails.email - Recipient email
 * @param {string} baptismDetails.status - Status: 'pending', 'approved', 'disapproved', 'completed', or 'cancelled'
 * @param {string} [baptismDetails.memberName] - Member's name (optional)
 * @param {string} [baptismDetails.baptismDate] - Baptism date (optional)
 * @param {string} [baptismDetails.baptismTime] - Baptism time (optional, separate from date)
 * @param {string} [baptismDetails.location] - Baptism location (optional)
 * @param {string} [baptismDetails.recipientName] - Recipient name (optional)
 * @param {string} [baptismDetails.pastorName] - Pastor name (optional)
 * @param {boolean} [baptismDetails.isMember] - Whether recipient is a member (optional)
 * @returns {Promise<Object>} - Result object with success status and message
 */
const sendWaterBaptismDetails = async (baptismDetails) => {
  try {
    if (!baptismDetails || !baptismDetails.email || !baptismDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }

    const transporter = createTransporter();
    const status = baptismDetails.status.toLowerCase();
    const statusColors = {
      pending: '#f39c12',
      approved: '#27ae60',
      disapproved: '#e74c3c',
      completed: '#27ae60',
      cancelled: '#95a5a6',
    };
    const statusMessages = {
      pending: 'Your water baptism request is currently pending approval.',
      approved: 'Your water baptism request has been approved.',
      disapproved: 'Your water baptism request has been disapproved.',
      completed: 'Your water baptism has been completed successfully.',
      cancelled: 'Your water baptism request has been cancelled.',
    };

    const recipientName = baptismDetails.recipientName || 'Valued Member';
    const memberName = baptismDetails.memberName || 'N/A';
    const pastorName = baptismDetails.pastorName || 'N/A';
    const isMember = baptismDetails.isMember || false;

    // Get all registration fields for the email - show empty instead of N/A for optional fields
    const firstname = baptismDetails.firstname || '';
    const middleName = baptismDetails.middleName || '';
    const lastname = baptismDetails.lastname || '';
    const fullName = `${firstname} ${middleName} ${lastname}`.replace(/\s+/g, ' ').trim() || 'N/A';
    const birthdate = baptismDetails.birthdate || '';
    const age = baptismDetails.age !== undefined && baptismDetails.age !== null ? baptismDetails.age : '';
    const gender = baptismDetails.gender || '';
    const address = baptismDetails.address || '';
    const email = baptismDetails.email || '';
    const phoneNumber = baptismDetails.phoneNumber || '';
    const civilStatus = baptismDetails.civilStatus ? baptismDetails.civilStatus.charAt(0).toUpperCase() + baptismDetails.civilStatus.slice(1) : '';
    const profession = baptismDetails.profession || '';
    const childrenInfo = baptismDetails.children || '';
    const guardianName = baptismDetails.guardianName || '';
    const guardianContact = baptismDetails.guardianContact || '';
    const guardianRelationship = baptismDetails.guardianRelationship || '';
    const testimony = baptismDetails.testimony || '';
    const spouseName = baptismDetails.spouseName || '';

    // Format baptism date with time (if available) for all statuses
    let baptismDate = baptismDetails.baptismDate || 'To be determined';
    let baptismTime = baptismDetails.baptismTime || '';

    console.log('EMAIL DEBUG: baptismDate input:', baptismDate);
    console.log('EMAIL DEBUG: baptismTime input:', baptismTime);

    if (baptismDate !== 'To be determined' && baptismDate) {
      // Use moment-timezone to parse and format with Philippines timezone
      let parsedMoment = moment.tz(baptismDate, 'Asia/Manila');

      if (parsedMoment.isValid()) {
        console.log('EMAIL DEBUG: Parsed moment (Philippines time):', parsedMoment.format('YYYY-MM-DD HH:mm:ss'));

        // Check if the time component is meaningful (not midnight 00:00)
        const hasTime = parsedMoment.hours() !== 0 || parsedMoment.minutes() !== 0;

        // PRIORITY 1: If baptismTime is provided separately, use it
        if (baptismTime) {
          // Parse the time and apply it to the date
          const timeMoment = moment(baptismTime, ['HH:mm', 'HH:mm:ss', 'h:mm A', 'h:mm:ss A']);
          if (timeMoment.isValid()) {
            parsedMoment.set({
              hour: timeMoment.hours(),
              minute: timeMoment.minutes(),
              second: timeMoment.seconds()
            });
          }
          // Format with date and time in Philippines timezone
          baptismDate = parsedMoment.tz('Asia/Manila').format('MMMM D, YYYY [at] h:mm A');
          console.log('EMAIL DEBUG: baptismDate with baptismTime (PH timezone):', baptismDate);
        }
        // PRIORITY 2: If the date has a time component, include it
        else if (hasTime) {
          // Format with date and time in Philippines timezone
          baptismDate = parsedMoment.tz('Asia/Manila').format('MMMM D, YYYY [at] h:mm A');
          console.log('EMAIL DEBUG: baptismDate with time (PH timezone):', baptismDate);
        }
        // PRIORITY 3: Date only
        else {
          baptismDate = parsedMoment.tz('Asia/Manila').format('MMMM D, YYYY');
          console.log('EMAIL DEBUG: baptismDate (date only, PH timezone):', baptismDate);
        }
      } else {
        console.log('EMAIL DEBUG: Could not parse baptismDate, keeping as-is:', baptismDate);
      }
    }

    // Handle location for pending status - show details for all statuses
    let location = baptismDetails.location || 'To be determined';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: baptismDetails.email,
      subject: `Water Baptism Service Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Water Baptism Service Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Water Baptism Service Update</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>${statusMessages[status] || 'Your water baptism service status has been updated.'}</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColors[status] || '#3498db'};">
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> 
                <span style="color: ${statusColors[status] || '#3498db'}; font-weight: bold; text-transform: uppercase;">
                  ${status}
                </span>
              </p>
            </div>
            
            ${status === 'pending' ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>Next Steps:</strong></p>
              <p style="margin: 10px 0 0 0;">Our team is reviewing your registration. You may be contacted for a brief pastoral interview to discuss your faith journey. Please wait for the official approval notification.</p>
            </div>
            ` : ''}

            ${status === 'approved' ? `
            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
              <p style="margin: 0;"><strong>Preparation for Baptism:</strong></p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>Attend the pre-baptism orientation as scheduled</li>
                <li>Please prepare a change of clothes and a towel</li>
                <li>Arrive at the baptism venue at least 30 minutes before the ceremony</li>
              </ul>
            </div>
            ` : ''}

            ${(status === 'disapproved' || status === 'cancelled') ? `
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p style="margin: 0;"><strong>Reason:</strong></p>
              <p style="margin: 10px 0 0 0;">${baptismDetails.rejectionReason || 'No reason provided.'}</p>
            </div>
            ` : ''}

            ${status === 'completed' ? `
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
              <p style="margin: 0;"><strong>Welcome to the Family!</strong></p>
              <p style="margin: 10px 0 0 0;">You can now log in to the portal to view your <strong>digital Baptism Certificate</strong>. We also invite you to explore other modules and ministries as you grow in your faith journey.</p>
            </div>
            ` : ''}
            
            ${status === 'pending' || status !== 'pending' ? `
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Baptism Service Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${status === 'completed' ? 'Date Got Saved:' : 'Baptism Date:'}</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${baptismDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Pastor:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${pastorName}</td>
                </tr>
                ${baptismDetails.location && baptismDetails.location.trim() !== '' ? `
                <tr>
                  <td style="padding: 8px 0;"><strong>Location:</strong></td>
                  <td style="padding: 8px 0;">${baptismDetails.location}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            ` : ''}
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Registration Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Full Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Birthdate:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${birthdate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Age:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${age} years old</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Gender:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${gender}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Address:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${address}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${phoneNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Civil Status:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${civilStatus}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Profession:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${profession}</td>
                </tr>
                ${spouseName ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Spouse Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${spouseName}</td>
                </tr>
                ` : ''}
                ${childrenInfo ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Children:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${childrenInfo}</td>
                </tr>
                ` : ''}
                ${guardianName ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Guardian Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${guardianName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Guardian Contact:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${guardianContact}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Guardian Relationship:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${guardianRelationship}</td>
                </tr>
                ` : ''}
                ${testimony ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Testimony:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${testimony}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${baptismDetails.desireMinistry ? `
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Ministry Interest</h3>
              <p style="margin: 0;">${baptismDetails.desireMinistry}</p>
            </div>
            ` : ''}
            
            <p>If you have any questions or need to make changes to your water baptism registration, please contact the church administration.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('EMAIL DEBUG: Water baptism email sent successfully to:', baptismDetails.email);

    return {
      success: true,
      message: 'Water baptism details email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending water baptism details email:', error);
    return buildErrorResult('Failed to send water baptism details email', error);
  }
};

/**
 * Send child dedication service details email
 * @param {Object} dedicationDetails - Child dedication service details object
 * @param {string} dedicationDetails.email - Recipient email
 * @param {string} dedicationDetails.status - Status: 'pending', 'approved', 'disapproved', 'completed', or 'cancelled'
 * @param {string} [dedicationDetails.memberName] - Member's name (optional)
 * @param {string} [dedicationDetails.childName] - Child's name (optional)
 * @param {string} [dedicationDetails.dedicationDate] - Dedication date (optional)
 * @param {string} [dedicationDetails.dedicationTime] - Dedication time (optional)
 * @param {string} [dedicationDetails.location] - Dedication location (optional)
 * @param {string} [dedicationDetails.recipientName] - Recipient name (optional)
 * @param {string} [dedicationDetails.pastorName] - Pastor name (optional)
 * @param {boolean} [dedicationDetails.isMember] - Whether recipient is a member (optional)
 * @returns {Promise<Object>} - Result object with success status and message
 */
const sendChildDedicationDetails = async (dedicationDetails) => {
  try {
    if (!dedicationDetails || !dedicationDetails.email || !dedicationDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }

    const transporter = createTransporter();
    const status = dedicationDetails.status.toLowerCase();
    const statusColors = {
      pending: '#f39c12',
      approved: '#27ae60',
      disapproved: '#e74c3c',
      completed: '#27ae60',
      cancelled: '#95a5a6',
    };
    const statusMessages = {
      pending: 'Your child dedication request is currently pending approval.',
      approved: 'Your child dedication request has been approved.',
      disapproved: 'Your child dedication request has been disapproved.',
      completed: 'Your child dedication service has been completed successfully.',
      cancelled: 'Your child dedication request has been cancelled.',
    };

    const recipientName = dedicationDetails.recipientName || 'Valued Member';
    const memberName = dedicationDetails.memberName || 'N/A';
    const childName = dedicationDetails.childName || 'N/A';
    const pastorName = dedicationDetails.pastorName || 'N/A';
    const isMember = dedicationDetails.isMember || false;

    // Format the dedication date and time using moment for accuracy and timezone consistency
    let formattedDedicationDate = 'To be determined';
    let formattedDedicationTime = '';

    if (dedicationDetails.dedicationDate) {
      const dateMoment = moment(dedicationDetails.dedicationDate);
      if (dateMoment.isValid()) {
        formattedDedicationDate = dateMoment.format('MMMM D, YYYY');

        // If dedicationTime is provided, use it to format the time
        if (dedicationDetails.dedicationTime) {
          // Combine date and time if possible, or just parse time
          const timeMoment = moment(dedicationDetails.dedicationTime, ['HH:mm:ss', 'HH:mm', 'h:mm A']);
          if (timeMoment.isValid()) {
            formattedDedicationTime = timeMoment.format('h:mm A');
          }
        }
      }
    }

    const fullDedicationDateTime = (formattedDedicationTime && formattedDedicationDate !== 'To be determined')
      ? `${formattedDedicationDate} at ${formattedDedicationTime}`
      : (formattedDedicationDate !== 'To be determined' ? formattedDedicationDate : 'To be determined');

    const location = dedicationDetails.location || 'To be determined';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: dedicationDetails.email,
      subject: `Child Dedication Service Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Child Dedication Service Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Child Dedication Service Update</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>${statusMessages[status] || 'Your child dedication service status has been updated.'}</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColors[status] || '#3498db'};">
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> 
                <span style="color: ${statusColors[status] || '#3498db'}; font-weight: bold; text-transform: uppercase;">
                  ${status}
                </span>
              </p>
            </div>
            
            ${status === 'pending' ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>Next Steps:</strong></p>
              <p style="margin: 10px 0 0 0;">Our team is currently coordinating with our Officiating Pastors to confirm their availability for your requested date. We will notify you once the schedule is confirmed.</p>
            </div>
            ` : ''}

            ${status === 'approved' ? `
            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
              <p style="margin: 0;"><strong>Preparation:</strong></p>
              <p style="margin: 10px 0 0 0;">Schedule confirmed! Please coordinate with the church office to finalize the names of godparents for the certificate and invite your loved ones to join this special occasion.</p>
            </div>
            ` : ''}

            ${(status === 'disapproved' || status === 'cancelled') ? `
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p style="margin: 0;"><strong>Reason:</strong></p>
              <p style="margin: 10px 0 0 0;">${dedicationDetails.rejectionReason || 'No reason provided.'}</p>
            </div>
            ` : ''}

            ${status === 'completed' ? `
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
              <p style="margin: 0;"><strong>Congratulations!</strong></p>
              <p style="margin: 10px 0 0 0;">Your child's dedication is now officially recorded. You may now log in to the portal to download the official <strong>Digital Certificate</strong> from your 'My Account' page.</p>
            </div>
            ` : ''}
            
            </div>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Child Dedication Service Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Dedication Date:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${fullDedicationDateTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Pastor:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${pastorName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Location:</strong></td>
                  <td style="padding: 8px 0;">${location}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Child Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Child's Full Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${childName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date of Birth:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dedicationDetails.childBirthdate || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Gender:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dedicationDetails.childGender || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Place of Birth:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dedicationDetails.placeOfBirth || 'N/A'}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Parent/Guardian Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Full Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${memberName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dedicationDetails.email || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dedicationDetails.phoneNumber || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Address:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dedicationDetails.address || 'N/A'}</td>
                </tr>
                ${dedicationDetails.requesterRelationship ? `
                <tr>
                  <td style="padding: 8px 0;"><strong>Relationship to Child:</strong></td>
                  <td style="padding: 8px 0;">${dedicationDetails.requesterRelationship}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${dedicationDetails.specialPrayerRequests ? `
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Special Prayer Requests</h3>
              <p style="margin: 0;">${dedicationDetails.specialPrayerRequests}</p>
            </div>
            ` : ''}
            
            <p>If you have any questions or need to make changes to your child dedication registration, please contact the church administration.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Child dedication details email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending child dedication details email:', error);
    return buildErrorResult('Failed to send child dedication details email', error);
  }
};

/**
 * Send burial service details email
 * @param {Object} burialDetails - Burial service details object
 * @param {string} burialDetails.email - Recipient email
 * @param {string} burialDetails.status - Status: 'pending', 'approved', 'disapproved', 'completed', or 'cancelled'
 * @param {string} [burialDetails.memberName] - Member's name (optional)
 * @param {string} [burialDetails.deceasedName] - Deceased person's name (optional)
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date of Birth:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${deceasedBirthDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Date of Death:</strong></td>
                  <td style="padding: 8px 0;">${dateOfDeath}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>Next Steps:</strong></p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>Our team will review your request within 24 hours</li>
                <li>You will receive a follow-up email with service date and location details</li>
                <li>If you have any urgent questions, please contact the church administration</li>
              </ul>
            </div>
            
            <p>Please know that our thoughts and prayers are with you and your family during this time. We are committed to providing compassionate support and ensuring that the burial service honors the memory of your loved one.</p>
            
            <p>If you have any questions or need immediate assistance, please do not hesitate to contact us.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email. For inquiries, please contact the church administration.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Burial service request notification email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending burial service request notification email:', error);
    return buildErrorResult('Failed to send burial service request notification email', error);
  }
};

/**
 * Send burial service details email
 * @param {Object} burialDetails - Burial service details object
 * @param {string} burialDetails.email - Recipient email
 * @param {string} burialDetails.status - Status: 'pending', 'ongoing', or 'completed'
 * @param {string} [burialDetails.deceasedName] - Deceased person's name (optional)
 * @param {string} [burialDetails.familyContact] - Family contact name (optional)
 * @param {string} [burialDetails.burialDate] - Burial date (optional)
 * @param {string} [burialDetails.location] - Burial location (optional)
 * @param {string} [burialDetails.recipientName] - Recipient name (optional)
 * @param {string} [burialDetails.pastorName] - Pastor name (optional)
 * @param {boolean} [burialDetails.isMember] - Whether recipient is a member (optional)
 * @returns {Promise<Object>} - Result object with success status and message
 */
const sendBurialDetails = async (burialDetails) => {
  try {
    if (!burialDetails || !burialDetails.email || !burialDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }

    const transporter = createTransporter();
    const status = burialDetails.status.toLowerCase();
    const statusColors = {
      pending: '#f39c12',
      approved: '#27ae60',
      disapproved: '#e74c3c',
      completed: '#27ae60',
      cancelled: '#95a5a6',
    };
    const statusMessages = {
      pending: 'Your burial service request is currently pending approval.',
      approved: 'Your burial service request has been approved.',
      disapproved: 'Your burial service request has been disapproved.',
      completed: 'Your burial service has been completed successfully.',
      cancelled: 'Your burial service request has been cancelled.',
    };

    const recipientName = burialDetails.recipientName || 'Valued Member';
    const deceasedName = burialDetails.deceasedName || 'N/A';
    const familyContact = burialDetails.familyContact || 'N/A';
    const pastorName = burialDetails.pastorName || 'N/A';
    const isMember = burialDetails.isMember || false;

    // Format burial date using moment for accuracy and timezone consistency
    let burialDate = burialDetails.burialDate || 'To be determined';
    if (burialDate !== 'To be determined' && (status === 'approved' || status === 'completed')) {
      const dateMoment = moment(burialDate);
      if (dateMoment.isValid()) {
        // Format with AM/PM
        burialDate = dateMoment.tz('Asia/Manila').format('MMMM D, YYYY [at] h:mm A');
      }
    }

    // Handle location for non-members in pending status
    let location = burialDetails.location || 'To be determined';
    if (status === 'pending' && !isMember) {
      location = '';
    }

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: burialDetails.email,
      subject: `Burial Service Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Burial Service Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Burial Service Update</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>${statusMessages[status] || 'Your burial service status has been updated.'}</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColors[status] || '#3498db'};">
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> 
                <span style="color: ${statusColors[status] || '#3498db'}; font-weight: bold; text-transform: uppercase;">
                  ${status}
                </span>
              </p>
            </div>
            
            ${status === 'pending' ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>What's Next:</strong></p>
              <p style="margin: 10px 0 0 0;">Our pastoral team has been notified. A representative will reach out shortly for coordination and spiritual support during this time of mourning.</p>
            </div>
            ` : ''}

            ${status === 'approved' ? `
            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
              <p style="margin: 0;"><strong>Service Preparation:</strong></p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>Please prepare a brief biography of the deceased for the officiating pastor</li>
                <li>Coordinate any special service requirements (music, tributes) with the assigned pastor</li>
                <li>Finalize venue arrangements and inform the family accordingly</li>
              </ul>
            </div>
            ` : ''}

            ${(status === 'disapproved' || status === 'cancelled') ? `
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <p style="margin: 0;"><strong>Reason:</strong></p>
              <p style="margin: 10px 0 0 0;">${burialDetails.rejectionReason || 'No reason provided.'}</p>
            </div>
            ` : ''}

            ${status === 'completed' ? `
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
              <p style="margin: 0;"><strong>Continuing Support</strong></p>
              <p style="margin: 10px 0 0 0;">We continue to join you in prayer. If your family needs follow-up counseling or any church support as you journey through grief, we are here for you.</p>
            </div>
            ` : ''}
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Burial Service Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Deceased Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${deceasedName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Family Contact:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${familyContact}</td>
                </tr>
                ${status === 'approved' ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Pastor:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${pastorName}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Burial Date:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${burialDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Location:</strong></td>
                  <td style="padding: 8px 0;">${location}</td>
                </tr>
              </table>
            </div>
            
            <p>If you have any questions or need to make changes, please contact the church administration.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Burial details email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending burial details email:', error);
    return buildErrorResult('Failed to send burial details email', error);
  }
};

/**
 * Send approval request notification email (for new requests)
 * @param {Object} approvalDetails - Approval request details object
 * @param {string} approvalDetails.email - Recipient email
 * @param {string} approvalDetails.type - Type: 'event' or 'ministry'
 * @param {string} approvalDetails.requestTitle - Event or ministry name
 * @param {string} approvalDetails.recipientName - Recipient name (optional)
 * @param {string} approvalDetails.approvalId - Approval ID (optional)
 * @returns {Promise<Object>} - Result object with success status and message
 */
const sendApprovalRequestNotification = async (approvalDetails) => {
  try {
    if (!approvalDetails || !approvalDetails.email || !approvalDetails.type) {
      return {
        success: false,
        message: 'Email and type are required',
      };
    }

    const transporter = createTransporter();
    const recipientName = approvalDetails.recipientName || 'Valued Member';
    const requestTitle = approvalDetails.requestTitle || 'N/A';
    const approvalId = approvalDetails.approvalId || 'N/A';
    const typeLabel = approvalDetails.type === 'event' ? 'Event' : 'Ministry';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: approvalDetails.email,
      subject: `${typeLabel} Join Request Received - Bible Baptist Ekklesia of Kawit`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${typeLabel} Join Request Received</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">${typeLabel} Join Request Received</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>We have received your request to join the ${typeLabel.toLowerCase()} <strong>${requestTitle}</strong>. Thank you for your interest in participating!</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f39c12;">
              <p style="margin: 0 0 10px 0;"><strong>Request Status:</strong> 
                <span style="color: #f39c12; font-weight: bold; text-transform: uppercase;">
                  Pending Review
                </span>
              </p>
            </div>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Request Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Request ID:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${approvalId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${typeLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>${typeLabel} Name:</strong></td>
                  <td style="padding: 8px 0;">${requestTitle}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>Next Steps:</strong></p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>Our team will review your request within 24-48 hours</li>
                <li>You will receive a follow-up email once your request has been reviewed</li>
                <li>If approved, you will be able to participate in the ${typeLabel.toLowerCase()}</li>
                <li>If you have any questions, please contact the church administration</li>
              </ul>
            </div>
            
            <p>We appreciate your interest and look forward to having you join us!</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email. For inquiries, please contact the church administration.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Approval request notification email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending approval request notification email:', error);
    return buildErrorResult('Failed to send approval request notification email', error);
  }
};

/**
 * Send approval status update email
 * @param {Object} approvalDetails - Approval status update details object
 * @param {string} approvalDetails.email - Recipient email
 * @param {string} approvalDetails.status - Status: 'pending', 'approved', or 'rejected'
 * @param {string} approvalDetails.type - Type: 'event' or 'ministry'
 * @param {string} approvalDetails.requestTitle - Event or ministry name
 * @param {string} [approvalDetails.recipientName] - Recipient name (optional)
 * @param {string} [approvalDetails.approvalId] - Approval ID (optional)
 * @returns {Promise<Object>} - Result object with success status and message
 */
const sendApprovalStatusUpdate = async (approvalDetails) => {
  try {
    if (!approvalDetails || !approvalDetails.email || !approvalDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }

    const transporter = createTransporter();
    const status = approvalDetails.status.toLowerCase();
    const statusColors = {
      pending: '#f39c12',
      approved: '#27ae60',
      rejected: '#e74c3c',
    };
    const statusMessages = {
      pending: 'Your request is currently pending review.',
      approved: 'Congratulations! Your request has been approved. You can now participate in this activity.',
      rejected: 'We regret to inform you that your request has been rejected. If you have any questions, please contact the church administration.',
    };

    const recipientName = approvalDetails.recipientName || 'Valued Member';
    const requestTitle = approvalDetails.requestTitle || 'N/A';
    const approvalId = approvalDetails.approvalId || 'N/A';
    const typeLabel = approvalDetails.type === 'event' ? 'Event' : 'Ministry';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: approvalDetails.email,
      subject: `${typeLabel} Join Request ${status.charAt(0).toUpperCase() + status.slice(1)} - Bible Baptist Ekklesia of Kawit`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${typeLabel} Join Request ${status.charAt(0).toUpperCase() + status.slice(1)}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">${typeLabel} Join Request Update</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>${statusMessages[status] || 'Your request status has been updated.'}</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColors[status] || '#3498db'};">
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> 
                <span style="color: ${statusColors[status] || '#3498db'}; font-weight: bold; text-transform: uppercase;">
                  ${status}
                </span>
              </p>
            </div>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Request Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Request ID:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${approvalId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${typeLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>${typeLabel} Name:</strong></td>
                  <td style="padding: 8px 0;">${requestTitle}</td>
                </tr>
              </table>
            </div>
            
            ${status === 'approved' ? `
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
              <p style="margin: 0;"><strong>What's Next:</strong></p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>You are now a participant in <strong>${requestTitle}</strong></li>
                <li>You will receive updates and information about this ${typeLabel.toLowerCase()}</li>
                <li>If you have any questions, please contact the church administration</li>
              </ul>
            </div>
            ` : ''}
            
            <p>If you have any questions or need to make changes, please contact the church administration.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Approval status update email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending approval status update email:', error);
    return buildErrorResult('Failed to send approval status update email', error);
  }
};

/**
 * Send transaction completion notification email
 * @param {Object} transactionDetails - Transaction completion details object
 * @param {string} transactionDetails.email - Recipient email
 * @param {string} transactionDetails.type_of_service - Service type: 'marriage', 'burial', 'child_dedication', or 'water_baptism'
 * @param {string} transactionDetails.service_id - Service ID
 * @param {number} transactionDetails.total - Transaction total amount
 * @param {string} transactionDetails.transaction_id - Transaction ID
 * @param {string} [transactionDetails.recipientName] - Recipient name (optional)
 * @param {string} [transactionDetails.serviceName] - Service name/description (optional)
 * @returns {Promise<Object>} - Result object with success status and message
 */
const sendTransactionCompletionNotification = async (transactionDetails) => {
  try {
    if (!transactionDetails || !transactionDetails.email || !transactionDetails.type_of_service) {
      return {
        success: false,
        message: 'Email and service type are required',
      };
    }

    const transporter = createTransporter();
    const recipientName = transactionDetails.recipientName || 'Valued Member';
    const transactionId = transactionDetails.transaction_id || 'N/A';
    const serviceId = transactionDetails.service_id || 'N/A';
    const totalAmount = transactionDetails.total || 0;
    const serviceType = transactionDetails.type_of_service.toLowerCase();

    const serviceTypeLabels = {
      'marriage': 'Marriage Service',
      'burial': 'Burial Service',
      'child_dedication': 'Child Dedication Service',
      'water_baptism': 'Water Baptism Service'
    };

    const serviceTypeLabel = serviceTypeLabels[serviceType] || 'Service';
    const serviceName = transactionDetails.serviceName || serviceTypeLabel;

    // Format currency
    const formattedAmount = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(totalAmount);

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: transactionDetails.email,
      subject: `Transaction Completed - ${serviceTypeLabel} - Bible Baptist Ekklesia of Kawit`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Transaction Completed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Transaction Completed</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>We are pleased to inform you that your transaction for <strong>${serviceName}</strong> has been completed successfully.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
              <p style="margin: 0 0 10px 0;"><strong>Transaction Status:</strong> 
                <span style="color: #27ae60; font-weight: bold; text-transform: uppercase;">
                  Completed
                </span>
              </p>
            </div>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Transaction Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Transaction ID:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${transactionId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Service Type:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${serviceTypeLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Service ID:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${serviceId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Total Amount:</strong></td>
                  <td style="padding: 8px 0; font-weight: bold; color: #27ae60; font-size: 18px;">${formattedAmount}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
              <p style="margin: 0;"><strong>What's Next:</strong></p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>Your ${serviceTypeLabel.toLowerCase()} has been marked as completed</li>
                <li>You can now request a certificate for this service if needed</li>
                <li>Please keep this transaction ID for your records</li>
                <li>If you have any questions, please contact the church administration</li>
              </ul>
            </div>
            
            <p>Thank you for your payment. We appreciate your support and participation in our church services.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email. For inquiries, please contact the church administration.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Transaction completion notification email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending transaction completion notification email:', error);
    return buildErrorResult('Failed to send transaction completion notification email', error);
  }
};

/**
 * Send form submission notification email
 * @param {Object} formDetails - Form submission details object
 * @param {string} formDetails.email - Recipient email
 * @param {string} formDetails.formType - Form type: 'schedule_change' or 'prayer_request'
 * @param {string} formDetails.recipientName - Recipient name (optional)
 * @param {string} formDetails.formId - Form ID (optional)
 * @param {Object} formDetails.formData - Form data object (optional)
 * @returns {Promise<Object>} - Result object with success status and message
 */
const sendFormSubmissionNotification = async (formDetails) => {
  try {
    if (!formDetails || !formDetails.email) {
      return {
        success: false,
        message: 'Email is required',
      };
    }

    const transporter = createTransporter();
    const recipientName = formDetails.recipientName || 'Valued Member';
    const formId = formDetails.formId || 'N/A';
    const formType = formDetails.formType || 'form';

    const formTypeLabels = {
      'schedule_change': 'Schedule Change Request',
      'prayer_request': 'Prayer Request'
    };

    const formTypeLabel = formTypeLabels[formType] || 'Form Submission';

    // Build form details HTML based on form type
    let formDetailsHtml = '';

    if (formType === 'schedule_change' && formDetails.formData) {
      const serviceTypeLabels = {
        'water-baptism': 'Water Baptism',
        'marriage': 'Marriage Ceremony',
        'burial': 'Burial Service',
        'child-dedication': 'Child Dedication'
      };
      const serviceType = formDetails.formData.serviceType || 'N/A';
      const serviceTypeLabel = serviceTypeLabels[serviceType] || serviceType;
      const originalDate = formDetails.formData.originalDate
        ? new Date(formDetails.formData.originalDate).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        : 'N/A';
      const requestedDate = formDetails.formData.requestedDate
        ? new Date(formDetails.formData.requestedDate).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        : 'N/A';
      const reason = formDetails.formData.reason || 'N/A';

      formDetailsHtml = `
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Schedule Change Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Service Type:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${serviceTypeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Original Date:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${originalDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Requested New Date:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${requestedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Reason:</strong></td>
              <td style="padding: 8px 0;">${reason}</td>
            </tr>
          </table>
        </div>
      `;
    } else if (formType === 'prayer_request' && formDetails.formData) {
      const request = formDetails.formData.request || 'N/A';
      const isAnonymous = formDetails.formData.anonymous || false;

      formDetailsHtml = `
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Prayer Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Request:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${request}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Submitted as:</strong></td>
              <td style="padding: 8px 0;">${isAnonymous ? 'Anonymous' : 'Named Request'}</td>
            </tr>
          </table>
        </div>
      `;
    }

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: formDetails.email,
      subject: `${formTypeLabel} Received - Bible Baptist Ekklesia of Kawit`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${formTypeLabel} Received</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">${formTypeLabel} Received</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>We have received your ${formTypeLabel.toLowerCase()}. Thank you for reaching out to us!</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f39c12;">
              <p style="margin: 0 0 10px 0;"><strong>Request Status:</strong> 
                <span style="color: #f39c12; font-weight: bold; text-transform: uppercase;">
                  Pending Review
                </span>
              </p>
            </div>
            
            ${formDetailsHtml}
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>Next Steps:</strong></p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>Our team will review your request within 24-48 hours</li>
                <li>You will receive a follow-up email once your request has been reviewed</li>
                <li>If you have any questions, please contact the church administration</li>
              </ul>
            </div>
            
            <p>We appreciate your submission and will get back to you as soon as possible.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email. For inquiries, please contact the church administration.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Form submission notification email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending form submission notification email:', error);
    return buildErrorResult('Failed to send form submission notification email', error);
  }
};

/**
 * Send form status update notification email
 * @param {Object} formDetails - Form status update details object
 * @param {string} formDetails.email - Recipient email
 * @param {string} formDetails.formType - Form type: 'schedule_change' or 'prayer_request'
 * @param {string} formDetails.status - Status: 'pending', 'approved', or 'rejected'
 * @param {string} formDetails.recipientName - Recipient name (optional)
 * @param {string} formDetails.formId - Form ID (optional)
 * @param {Object} formDetails.formData - Form data object (optional)
 * @param {string} formDetails.adminNotes - Admin notes (optional)
 * @returns {Promise<Object>} - Result object with success status and message
 */
const sendFormStatusUpdate = async (formDetails) => {
  try {
    if (!formDetails || !formDetails.email || !formDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }

    const transporter = createTransporter();
    const status = formDetails.status.toLowerCase();
    const statusColors = {
      pending: '#f39c12',
      approved: '#27ae60',
      rejected: '#e74c3c',
    };
    const statusMessages = {
      pending: 'Your request is currently pending review.',
      approved: 'Great news! Your request has been approved.',
      rejected: 'We regret to inform you that your request has been rejected.',
    };

    const recipientName = formDetails.recipientName || 'Valued Member';
    const formId = formDetails.formId || 'N/A';
    const formType = formDetails.formType || 'form';

    const formTypeLabels = {
      'schedule_change': 'Schedule Change Request',
      'prayer_request': 'Prayer Request'
    };

    const formTypeLabel = formTypeLabels[formType] || 'Form Submission';

    // Build form details HTML based on form type
    let formDetailsHtml = '';

    if (formType === 'schedule_change' && formDetails.formData) {
      const serviceTypeLabels = {
        'water-baptism': 'Water Baptism',
        'marriage': 'Marriage Ceremony',
        'burial': 'Burial Service',
        'child-dedication': 'Child Dedication'
      };
      const serviceType = formDetails.formData.serviceType || 'N/A';
      const serviceTypeLabel = serviceTypeLabels[serviceType] || serviceType;
      const originalDate = formDetails.formData.originalDate
        ? new Date(formDetails.formData.originalDate).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        : 'N/A';
      const requestedDate = formDetails.formData.requestedDate
        ? new Date(formDetails.formData.requestedDate).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        : 'N/A';

      formDetailsHtml = `
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Schedule Change Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Service Type:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${serviceTypeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Original Date:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${originalDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Requested New Date:</strong></td>
              <td style="padding: 8px 0;">${requestedDate}</td>
            </tr>
          </table>
        </div>
      `;
    } else if (formType === 'prayer_request' && formDetails.formData) {
      const request = formDetails.formData.request || 'N/A';

      formDetailsHtml = `
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Prayer Request Details</h3>
          <p style="margin: 0;">${request}</p>
        </div>
      `;
    }

    // Add admin notes if available
    let adminNotesHtml = '';
    if (formDetails.adminNotes) {
      adminNotesHtml = `
        <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
          <p style="margin: 0 0 10px 0;"><strong>Admin Notes:</strong></p>
          <p style="margin: 0;">${formDetails.adminNotes}</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: formDetails.email,
      subject: `${formTypeLabel} ${status.charAt(0).toUpperCase() + status.slice(1)} - Bible Baptist Ekklesia of Kawit`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${formTypeLabel} ${status.charAt(0).toUpperCase() + status.slice(1)}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">${formTypeLabel} Update</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>${statusMessages[status] || 'Your request status has been updated.'}</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColors[status] || '#3498db'};">
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> 
                <span style="color: ${statusColors[status] || '#3498db'}; font-weight: bold; text-transform: uppercase;">
                  ${status}
                </span>
              </p>
            </div>
            
            ${formDetailsHtml}
            
            ${adminNotesHtml}
            
            ${status === 'approved' && formType === 'schedule_change' ? `
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
              <p style="margin: 0;"><strong>What's Next:</strong></p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>Your service date has been updated as requested</li>
                <li>Please mark the new date on your calendar</li>
                <li>If you have any questions, please contact the church administration</li>
              </ul>
            </div>
            ` : ''}

            ${status === 'approved' && formType === 'prayer_request' ? `
            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
              <p style="margin: 0;"><strong>What's Next:</strong></p>
              <p style="margin: 10px 0 0 0;">Your prayer request has been shared with our ministry team. Please wait for a follow-up message or a personal outreach from our church staff shortly as we join you in prayer.</p>
            </div>
            ` : ''}

            ${status === 'approved' && (formType === 'message' || formType === 'contact') ? `
            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
              <p style="margin: 0;"><strong>What's Next:</strong></p>
              <p style="margin: 10px 0 0 0;">Our administration team has reviewed your inquiry. Please stay tuned as a staff member will be replying to your concerns via email within the next 24-48 hours.</p>
            </div>
            ` : ''}
            
            ${status === 'rejected' ? `
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e74c3c;">
              <p style="margin: 0;"><strong>Note:</strong></p>
              <p style="margin: 10px 0 0 0;">If you have any questions about this decision, please contact the church administration.</p>
            </div>
            ` : ''}
            
            <p>If you have any questions or need to make changes, please contact the church administration.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Form status update email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending form status update email:', error);
    return buildErrorResult('Failed to send form status update email', error);
  }
};
/**
 * Send donation notification email to church admin
 * Called when a new online donation proof is submitted via the Give page
 * @param {Object} donationData - Donation details
 * @returns {Promise<Object>} - Result object with success status and message
 */
const sendDonationNotification = async (donationData) => {
  try {
    const transporter = createTransporter();

    const {
      tithes_id,
      donor_name = 'Anonymous',
      amount = 0,
      type = 'donation',
      donation_method = 'N/A',
      donation_date,
      date_created
    } = donationData;

    const formattedAmount = parseFloat(amount).toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP'
    });

    const formattedDate = donation_date
      ? moment(donation_date).tz('Asia/Manila').format('MMMM DD, YYYY')
      : moment(date_created).tz('Asia/Manila').format('MMMM DD, YYYY');

    const methodLabel = {
      gcash: 'GCash',
      maya: 'Maya',
      others: 'Other Method'
    }[donation_method] || donation_method;

    const typeLabel = {
      tithe: 'Tithe',
      offering: 'Offering',
      missions: 'Missions',
      love_gift: 'Love Gift',
      building_fund: 'Building Fund',
      donation: 'Donation',
      other: 'Other'
    }[type] || type;

    const frontendUrl = process.env.FRONTEND_URL1 || 'http://localhost:5173';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: CHURCH_EMAIL,
      subject: `🔔 New Online Donation Submitted - ${formattedAmount}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Online Donation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Online Donation</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">A new donation proof has been submitted for review</p>
          </div>
          
          <div style="background-color: #f8fffe; padding: 24px; border: 1px solid #e0f2f1; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555; width: 140px;">Donation ID</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">#${tithes_id}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555;">Donor Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${donor_name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555;">Amount</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-size: 18px; font-weight: 700; color: #0d9488;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555;">Type</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${typeLabel}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #555;">Payment Method</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${methodLabel}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: 600; color: #555;">Donation Date</td>
                <td style="padding: 10px 0;">${formattedDate}</td>
              </tr>
            </table>

            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px 16px; margin-top: 20px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⚠️ <strong>Action Required:</strong> Please review the donation proof and confirm or reject this donation in the admin panel.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
            
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0; text-align: center;">
              This is an automated notification from the Bible Baptist Ekklesia of Kawit system.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Donation notification email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending donation notification email:', error);
    return buildErrorResult('Failed to send donation notification email', error);
  }
};

/**
 * Send acknowledgement email to donor
 * Called when a donor submits a donation with an email address
 * @param {Object} donationData - Donation details
 * @returns {Promise<Object>} - Result object
 */
const sendDonorAcknowledgementEmail = async (donationData) => {
  console.log('📧 [Email Service] Preparing to send Donor Acknowledgement Email...');
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ [Email Service] Missing EMAIL_USER or EMAIL_PASS in .env configuration');
      return { success: false, message: 'Email configuration missing' };
    }

    const transporter = createTransporter();

    const {
      tithes_id,
      donor_name = 'Donor',
      email,
      amount = 0,
      type = 'donation',
      donation_date
    } = donationData;

    console.log(`📧 [Email Service] Recipient: ${email}, ID: ${tithes_id}`);

    if (!email) {
      console.warn('⚠️ [Email Service] No donor email provided, skipping email.');
      return { success: false, message: 'No donor email provided' };
    }

    const formattedAmount = parseFloat(amount).toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP'
    });

    const formattedDate = donation_date
      ? moment(donation_date).tz('Asia/Manila').format('MMMM DD, YYYY')
      : moment().tz('Asia/Manila').format('MMMM DD, YYYY');

    const mailOptions = {
      from: `"BBEK Church" <${CHURCH_EMAIL}>`,
      to: email,
      subject: `Donation Received - Reference #${tithes_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Thank you for your generosity!</h2>
          <p>Dear ${donor_name},</p>
          <p>We have received your donation submission. Our team will review the details and verify your proof of payment shortly.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Reference ID:</strong> #${tithes_id}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${formattedAmount}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${type.toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> Pending Review</p>
          </div>
          
          <p>You will receive another email once your donation has been confirmed.</p>
          
          <p>God bless you!</p>
          <p>BBEK Church Administration</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Service] Acknowledgement Email sent successfully! Message ID: ${info.messageId}`);
    return { success: true, message: 'Acknowledgement email sent' };
  } catch (error) {
    console.error('❌ [Email Service] Error sending acknowledgement email:', error);
    return buildErrorResult('Failed to send acknowledgement email', error);
  }
};

/**
 * Send status update email to donor
 * Called when admin confirms or rejects a donation
 * @param {Object} donationData - Donation details
 * @param {String} action - 'confirmed' or 'rejected'
 * @param {String} reason - Rejection reason (optional)
 * @returns {Promise<Object>} - Result object
 */
const sendDonorStatusUpdateEmail = async (donationData, action, reason = null) => {
  console.log(`📧 [Email Service] Preparing to send Donor Status Update (${action})...`);
  try {
    const transporter = createTransporter();

    const {
      tithes_id,
      donor_name = 'Donor',
      donor_email, // Note: field name depends on object shape from DB or create result
      member_name, // Fallback
      email, // Fallback
      amount = 0,
      donation_date
    } = donationData;

    // Resolve email and name
    const recipientEmail = donor_email || email;
    const recipientName = donor_name || member_name || 'Donor';

    console.log(`📧 [Email Service] Recipient: ${recipientEmail}, Action: ${action}`);

    if (!recipientEmail) {
      console.warn('⚠️ [Email Service] No donor email provided for status update.');
      return { success: false, message: 'No donor email provided' };
    }

    const formattedAmount = parseFloat(amount).toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP'
    });

    const isConfirmed = action === 'confirmed';
    const subjectStatus = isConfirmed ? 'Confirmed' : 'Update';
    const color = isConfirmed ? '#059669' : '#dc2626'; // Green or Red

    let messageBody = '';
    if (isConfirmed) {
      messageBody = `
        <p>We are pleased to inform you that your donation has been <strong>successfully verified and confirmed</strong>.</p>
        <p>Thank you for your support to the ministry.</p>
      `;
    } else {
      messageBody = `
        <p>Your donation submission has been <strong>marked as rejected</strong>.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you believe this is an error, please contact the church administration.</p>
      `;
    }

    const mailOptions = {
      from: `"BBEK Church" <${CHURCH_EMAIL}>`,
      to: recipientEmail,
      subject: `Donation ${subjectStatus} - Reference #${tithes_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${color};">Donation ${action === 'confirmed' ? 'Confirmed' : 'Update'}</h2>
          <p>Dear ${recipientName},</p>
          
          ${messageBody}
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Reference ID:</strong> #${tithes_id}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${formattedAmount}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${action.toUpperCase()}</p>
          </div>
          
          <p>God bless you!</p>
          <p>BBEK Church Administration</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Service] Status Update Email sent successfully! Message ID: ${info.messageId}`);
    return { success: true, message: 'Status update email sent' };
  } catch (error) {
    console.error('❌ [Email Service] Error sending status update email:', error);
    return buildErrorResult('Failed to send status update email', error);
  }
};

/**
 * Send discipleship service details email
 * @param {Object} details - Discipleship details object
 */
const sendDiscipleshipDetails = async (details) => {
  try {
    if (!details || !details.email || !details.status) {
      return { success: false, message: 'Email and status are required' };
    }

    const transporter = createTransporter();
    const status = details.status.toLowerCase();

    const rawRequestType = details.request_type || details.requestType || '';
    const normalizedRequestType = String(rawRequestType).trim().toLowerCase();
    const serviceLabel =
      normalizedRequestType === 'salvation'
        ? 'Salvation Talk'
        : normalizedRequestType === 'bible study'
          ? 'Bible Study'
          : 'Discipleship';

    const getCompletedMessage = () => {
      if (serviceLabel === 'Salvation Talk') {
        return 'Your Salvation Talk has been marked as completed. Next, we can schedule your Bible Study (Wednesdays and Saturdays only).';
      }
      if (serviceLabel === 'Bible Study') {
        return 'Your Bible Study session has been marked as completed. Next step: Water Baptism (Sundays only).';
      }
      return `Your ${serviceLabel} session has been marked as completed.`;
    };

    const statusColors = {
      pending: '#f39c12',
      scheduled: '#3498db',
      completed: '#27ae60',
      promoted: '#14b8a6',
      cancelled: '#95a5a6',
    };
    const statusMessages = {
      pending: `Your ${serviceLabel} request has been received and is currently pending review.`,
      scheduled: `Your ${serviceLabel} session has been scheduled!`,
      completed: getCompletedMessage(),
      promoted: 'Congratulations! You have been promoted to Water Baptism candidate.',
      cancelled: `Your ${serviceLabel} request has been cancelled.`,
    };

    const recipientName = details.recipientName || details.firstname || 'Valued Member';
    const scheduleDate = details.scheduled_date ? moment(details.scheduled_date).tz('Asia/Manila').format('MMMM D, YYYY [at] h:mm A') : 'To be determined';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: details.email,
      subject: `${serviceLabel} Request Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${serviceLabel} Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">${serviceLabel} Update</h2>
            <p>Dear ${recipientName},</p>
            <p>${statusMessages[status] || `Your ${serviceLabel} request status has been updated.`}</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColors[status] || '#3498db'};">
              <p style="margin: 0 0 10px 0;"><strong>Service:</strong> ${serviceLabel}</p>
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> 
                <span style="color: ${statusColors[status] || '#3498db'}; font-weight: bold; text-transform: uppercase;">
                  ${status}
                </span>
              </p>
              <p style="margin: 0 0 5px 0;"><strong>Schedule:</strong> ${scheduleDate}</p>
              ${details.pastor_id ? `<p style="margin: 0 0 5px 0;"><strong>Pastor:</strong> ${details.pastor_id}</p>` : ''}
              ${details.location ? `<p style="margin: 0;"><strong>Location:</strong> ${details.location}</p>` : ''}
            </div>

            ${status === 'scheduled' ? `
            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
              <p style="margin: 0;"><strong>Preparation:</strong></p>
              <p style="margin: 10px 0 0 0;">Please be prepared for your session. Our team will meet you at the church on the scheduled date. If you have any questions, please contact us.</p>
            </div>
            ` : ''}

            <p>If you have any questions, please contact the church administration.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from the Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully', messageId: info.messageId };
  } catch (error) {
    console.error('Error sending discipleship email:', error);
    return { success: false, message: 'Failed to send email', error: error.message };
  }
};

/**
 * Send Water Baptism Invitation/Registration Email
 */
const sendWaterBaptismInvitation = async (details) => {
  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL1 || 'http://localhost:5173';
    // Link to the registration page for the candidate to fill up details
    const registrationUrl = `${frontendUrl}/services/water-baptism/registration?reqId=${details.request_id}`;

    const recipientName = details.firstname || 'Valued Member';
    const isDecided = details.isDecided || false;

    const subject = isDecided
      ? 'Next Step: Water Baptism Registration - Bible Baptist Ekklesia of Kawit'
      : 'Invitation to Water Baptism - Bible Baptist Ekklesia of Kawit';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: details.email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
            .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background-color: #fdfdfd; }
            .button { display: inline-block; padding: 12px 30px; background-color: #0d9488; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
            .footer { font-size: 12px; color: #666; text-align: center; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Water Baptism Registration</h1>
            </div>
            <div class="content">
              <p>Dear ${recipientName},</p>
              
              ${isDecided
          ? `<p>We are excited to hear that you have decided to take the next step in your faith journey through Water Baptism! This is a wonderful public declaration of your commitment to follow Jesus Christ.</p>`
          : `<p>As you complete your discipleship journey, we would like to invite you to consider taking the next step: <strong>Water Baptism</strong>. This is a significant milestone in your spiritual walk, symbolizing your identification with Christ's death, burial, and resurrection.</p>`}
              
              <p>To proceed with your registration, please click the button below to fill out the necessary information (including personal details and guardian information if applicable).</p>
              
              <div style="text-align: center;">
                <a href="${registrationUrl}" class="button">Complete Registration Form</a>
              </div>
              
              <p style="margin-top: 30px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="font-size: 13px; color: #0d9488;">${registrationUrl}</p>
              
              <p>We look forward to witnessing this special moment in your life!</p>
              
              <p>Grace and peace,<br>Bible Baptist Ekklesia of Kawit</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Bible Baptist Ekklesia of Kawit. All rights reserved.</p>
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending water baptism invitation:', error);
    return { success: false, error: error.message };
  }
};


/**
 * Send Bible Study form link to a hesitant candidate
 * Called when admin promotes a Salvation-completed candidate who is not yet fully decided
 * @param {Object} data
 * @param {string} data.email - Recipient email
 * @param {string} data.firstname - Recipient first name
 * @param {string} data.lastname - Recipient last name
 * @param {string} data.formLink - Full URL to the Bible Study registration form
 * @param {string} data.request_id - The discipleship request ID
 */
const sendBibleStudyFormLink = async ({ email, firstname, lastname, formLink, request_id }) => {
  try {
    if (!email || !formLink) {
      return { success: false, message: 'Email and formLink are required' };
    }
    const transporter = createTransporter();
    const recipientName = `${firstname || ''} ${lastname || ''}`.trim() || 'Friend';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: email,
      subject: 'You\'re Invited: Bible Study Sessions — Bible Baptist Ekklesia of Kawit',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bible Study Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 30px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0f766e; margin-top: 0;">📖 Bible Study Invitation</h2>
              <p style="color: #555; font-size: 14px;">Reference ID: ${request_id}</p>
            </div>

            <p>Dear <strong>${recipientName}</strong>,</p>

            <p>Congratulations on completing your <strong>Salvation Talk</strong>! 🎉 We are so glad you took that step of faith.</p>

            <p>As the next step in your spiritual journey, we warmly invite you to join our <strong>Bible Study sessions</strong>, held every <strong>Wednesday and Saturday</strong>.</p>

            <div style="background-color: #e0f2f1; border-left: 4px solid #0f766e; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #0f766e;">📅 Schedule: Wednesdays & Saturdays</p>
              <p style="margin: 8px 0 0 0; color: #555;">Our pastor will personally guide you through God's Word at your own pace.</p>
            </div>

            <p>Whenever you feel ready, please click the button below to confirm your interest in Bible Study. Once you submit, our team will reach out to schedule your sessions.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${formLink}"
                 style="background-color: #0f766e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                I'm Ready for Bible Study
              </a>
            </div>

            <p style="color: #7f8c8d; font-size: 12px;">
              Or copy and paste this link into your browser:<br>
              <a href="${formLink}" style="color: #0f766e; word-break: break-all;">${formLink}</a>
            </p>

            <p>There is no pressure — take all the time you need. We are here whenever you are ready. 🙏</p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

            <p style="color: #95a5a6; font-size: 12px; margin-bottom: 0;">
              This is an automated message from Bible Baptist Ekklesia of Kawit.<br>
              Please do not reply to this email. Contact us at ${CHURCH_EMAIL} for any questions.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending Bible Study form link email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Salvation Rejection email (No-show after 30 mins)
 */
const sendSalvationRejection = async ({ email, firstname, lastname, scheduled_date }) => {
  try {
    const transporter = createTransporter();
    const recipientName = `${firstname || ''} ${lastname || ''}`.trim() || 'Friend';
    const formattedDate = moment(scheduled_date).tz('Asia/Manila').format('MMMM D, YYYY [at] h:mm A');

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: email,
      subject: 'Update on Your Salvation Talk Request - Bible Baptist Ekklesia of Kawit',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fce7e7; padding: 30px; border-radius: 8px;">
            <h2 style="color: #c53030; margin-top: 0;">Update: Missed Appointment</h2>
            <p>Dear <strong>${recipientName}</strong>,</p>
            <p>We noticed that you were unable to attend your scheduled Salvation Talk on <strong>${formattedDate}</strong>.</p>
            <p>As per our policy, we have marked this request as "Rejected" due to the no-show. However, we still want to help you on your spiritual journey!</p>
            <p>If you would like to reschedule, please visit our website and submit a new request. We look forward to meeting you soon!</p>
            <hr style="border: none; border-top: 1px solid #feb2b2; margin: 20px 0;">
            <p style="color: #a0aec0; font-size: 12px; margin-bottom: 0;">
              This is an automated message from Bible Baptist Ekklesia of Kawit.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending salvation rejection email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Bible Study Invitation (Promotion)
 */
const sendBibleStudyInvitation = async ({ email, firstname, lastname, scheduled_date, location, pastor_name }) => {
  try {
    const transporter = createTransporter();
    const recipientName = `${firstname || ''} ${lastname || ''}`.trim() || 'Friend';
    const formattedDate = moment(scheduled_date).tz('Asia/Manila').format('MMMM D, YYYY [at] h:mm A');

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: email,
      subject: 'Next Step: Bible Study Scheduled! - Bible Baptist Ekklesia of Kawit',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #e6fffa; padding: 30px; border-radius: 8px;">
            <h2 style="color: #2c7a7b; margin-top: 0;">📖 Bible Study Scheduled</h2>
            <p>Congratulations <strong>${recipientName}</strong> on completing your Salvation Talk!</p>
            <p>Your first Bible Study session has been scheduled as part of your growth journey.</p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #285e61;">
              <p style="margin: 0 0 10px 0;"><strong>Schedule:</strong> ${formattedDate}</p>
              <p style="margin: 0 0 10px 0;"><strong>Location:</strong> ${location || 'To be determined'}</p>
              <p style="margin: 0;"><strong>Assigned Pastor:</strong> ${pastor_name || 'To be determined'}</p>
            </div>
            <p>We look forward to seeing you grow in God's grace!</p>
            <hr style="border: none; border-top: 1px solid #b2f5ea; margin: 20px 0;">
            <p style="color: #718096; font-size: 12px; margin-bottom: 0;">
              This is an automated message from Bible Baptist Ekklesia of Kawit.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending bible study invitation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Bible Study Update (Status changed)
 */
const sendBibleStudyDetails = async (details) => {
  try {
    const transporter = createTransporter();
    const status = (details.status || '').toLowerCase();
    const recipientName = `${details.firstname || ''} ${details.lastname || ''}`.trim() || 'Member';
    const formattedDate = details.scheduled_date ? moment(details.scheduled_date).tz('Asia/Manila').format('MMMM D, YYYY [at] h:mm A') : 'To be determined';

    const statusColors = {
      pending: '#f39c12',
      scheduled: '#3498db',
      completed: '#27ae60',
      cancelled: '#95a5a6',
      rejected: '#e74c3c'
    };

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: details.email,
      subject: `Bible Study Update: ${status.charAt(0).toUpperCase() + status.slice(1)} - BBEK`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f7fafc; padding: 30px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-top: 0;">Bible Study Update</h2>
            <p>Dear ${recipientName},</p>
            <p>Your Bible Study request status has been updated to <strong>${status}</strong>.</p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColors[status] || '#3498db'};">
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> <span style="color: ${statusColors[status] || '#3498db'}; font-weight: bold; text-transform: uppercase;">${status}</span></p>
              <p style="margin: 0 0 10px 0;"><strong>Schedule:</strong> ${formattedDate}</p>
              <p style="margin: 0;"><strong>Location:</strong> ${details.location || 'N/A'}</p>
            </div>
            <p>God bless you!</p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending bible study details email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Promotion Visit details email
 * @param {Object} details - Visit details object
 */
const sendPromotionVisitDetails = async (details) => {
  try {
    if (!details || !details.email || !details.status) {
      return { success: false, message: 'Email and status are required' };
    }

    const transporter = createTransporter();
    const status = (details.status || '').toLowerCase();
    const recipientName = `${details.firstname || ''} ${details.lastname || ''}`.trim() || 'Member';
    const formattedDate = details.visit_date ? moment(details.visit_date).tz('Asia/Manila').format('MMMM D, YYYY') : 'To be determined';
    const formattedTime = details.visit_time || 'To be determined';

    const statusColors = {
      scheduled: '#3498db',
      completed: '#27ae60',
      cancelled: '#95a5a6',
    };

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: details.email,
      subject: `Promotion Visit Update: ${status.charAt(0).toUpperCase() + status.slice(1)} - BBEK`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f0f7ff; padding: 30px; border-radius: 8px;">
            <h2 style="color: #1e40af; margin-top: 0;">🏡 Promotion Visit Update</h2>
            <p>Dear ${recipientName},</p>
            <p>We have an update regarding your scheduled <strong>Promotion Visit</strong> from our church leaders.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColors[status] || '#3498db'};">
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> <span style="color: ${statusColors[status] || '#3498db'}; font-weight: bold; text-transform: uppercase;">${status}</span></p>
              <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
              <p style="margin: 0;"><strong>Location:</strong> ${details.location || 'N/A'}</p>
            </div>

            ${status === 'scheduled' ? `
            <p>Our team will visit you at the specified location and time. We look forward to meeting you and your family!</p>
            ` : ''}

            ${status === 'completed' ? `
            <p>Thank you for welcoming us! We are so glad to have connected with you. We hope to see you in our upcoming church services.</p>
            ` : ''}

            <p>If you have any questions or need to reschedule, please contact the church office.</p>
            <p>God bless you!</p>
            <p>BBEK Church Administration</p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending promotion visit details email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendAccountDetails,
  sendMarriageDetails,
  sendWaterBaptismDetails,
  sendChildDedicationDetails,
  sendBurialDetails,
  sendApprovalRequestNotification,
  sendApprovalStatusUpdate,
  sendTransactionCompletionNotification,
  sendFormSubmissionNotification,
  sendFormStatusUpdate,
  sendDonationNotification,
  sendDonorAcknowledgementEmail,
  sendDonorStatusUpdateEmail,
  sendDiscipleshipDetails,
  sendWaterBaptismInvitation,
  sendBibleStudyFormLink,
  sendSalvationRejection,
  sendBibleStudyInvitation,
  sendBibleStudyDetails,
  sendPromotionVisitDetails,
  generateResetToken,
};

