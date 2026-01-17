const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

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
      from: `"Bible Baptist Ekklesia of Kawit Administrator"`,
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
      from: `"Bible Baptist Ekklesia of Kawit" <${process.env.EMAIL_USER}>`,
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
 * @param {string} [baptismDetails.location] - Baptism location (optional)
 * @param {string} [baptismDetails.recipientName] - Recipient name (optional)
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
    const baptismDate = baptismDetails.baptismDate || 'To be determined';
    const location = baptismDetails.location || 'To be determined';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${process.env.EMAIL_USER}>`,
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
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
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Baptism Service Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Member Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${memberName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Baptism Date:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${baptismDate}</td>
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
 * @param {string} dedicationDetails.status - Status: 'pending', 'ongoing', or 'completed'
 * @param {string} [dedicationDetails.childName] - Child's name (optional)
 * @param {string} [dedicationDetails.parentName] - Parent's name (optional)
 * @param {string} [dedicationDetails.dedicationDate] - Dedication date (optional)
 * @param {string} [dedicationDetails.location] - Dedication location (optional)
 * @param {string} [dedicationDetails.recipientName] - Recipient name (optional)
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
      completed: 'Your child dedication has been completed successfully.',
      cancelled: 'Your child dedication request has been cancelled.',
    };

    const recipientName = dedicationDetails.recipientName || 'Valued Member';
    const childName = dedicationDetails.childName || 'N/A';
    const parentName = dedicationDetails.parentName || 'N/A';
    const dedicationDate = dedicationDetails.dedicationDate || 'To be determined';
    const location = dedicationDetails.location || 'To be determined';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${process.env.EMAIL_USER}>`,
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
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
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Dedication Service Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Child Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${childName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Parent Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${parentName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Dedication Date:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${dedicationDate}</td>
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
      message: 'Child dedication details email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending child dedication details email:', error);
    return buildErrorResult('Failed to send child dedication details email', error);
  }
};

/**
 * Send burial service request notification email (for new requests)
 * @param {Object} requestDetails - Burial service request details object
 * @param {string} requestDetails.email - Recipient email
 * @param {string} requestDetails.recipientName - Recipient name (family member requesting service)
 * @param {string} requestDetails.deceasedName - Deceased person's name
 * @param {string} requestDetails.relationship - Relationship to deceased
 * @param {string} requestDetails.deceasedBirthDate - Deceased birth date
 * @param {string} requestDetails.dateOfDeath - Date of death
 * @param {string} requestDetails.burialServiceId - Burial service ID
 * @returns {Promise<Object>} - Result object with success status and message
 */
const sendBurialServiceRequestNotification = async (requestDetails) => {
  try {
    if (!requestDetails || !requestDetails.email) {
      return {
        success: false,
        message: 'Email is required',
      };
    }

    const transporter = createTransporter();
    const recipientName = requestDetails.recipientName || 'Valued Member';
    const deceasedName = requestDetails.deceasedName || 'N/A';
    const relationship = requestDetails.relationship || 'N/A';
    const deceasedBirthDate = requestDetails.deceasedBirthDate 
      ? new Date(requestDetails.deceasedBirthDate).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'N/A';
    const dateOfDeath = requestDetails.dateOfDeath
      ? new Date(requestDetails.dateOfDeath).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'N/A';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${process.env.EMAIL_USER}>`,
      to: requestDetails.email,
      subject: 'Burial Service Request Received - Bible Baptist Ekklesia of Kawit',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Burial Service Request Received</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Burial Service Request Received</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>We have received your burial service request. During this difficult time, we want to extend our deepest condolences and assure you that we are here to support you and your family.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
              <p style="margin: 0 0 10px 0;"><strong>Request Status:</strong> 
                <span style="color: #f39c12; font-weight: bold; text-transform: uppercase;">
                  Pending Review
                </span>
              </p>
            </div>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Burial Service Request Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Request ID:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${requestDetails.burialServiceId || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Deceased Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${deceasedName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Your Relationship:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${relationship}</td>
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
    const burialDate = burialDetails.burialDate || 'To be determined';
    const location = burialDetails.location || 'To be determined';

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${process.env.EMAIL_USER}>`,
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
      from: `"Bible Baptist Ekklesia of Kawit" <${process.env.EMAIL_USER}>`,
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
      from: `"Bible Baptist Ekklesia of Kawit" <${process.env.EMAIL_USER}>`,
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
      from: `"Bible Baptist Ekklesia of Kawit" <${process.env.EMAIL_USER}>`,
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
        ? new Date(formDetails.formData.originalDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : 'N/A';
      const requestedDate = formDetails.formData.requestedDate
        ? new Date(formDetails.formData.requestedDate).toLocaleDateString('en-US', { 
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
      from: `"Bible Baptist Ekklesia of Kawit" <${process.env.EMAIL_USER}>`,
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
        ? new Date(formDetails.formData.originalDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : 'N/A';
      const requestedDate = formDetails.formData.requestedDate
        ? new Date(formDetails.formData.requestedDate).toLocaleDateString('en-US', { 
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
      from: `"Bible Baptist Ekklesia of Kawit" <${process.env.EMAIL_USER}>`,
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

module.exports = {
  sendAccountDetails,
  sendMarriageDetails,
  sendWaterBaptismDetails,
  sendChildDedicationDetails,
  sendBurialServiceRequestNotification,
  sendBurialDetails,
  sendApprovalRequestNotification,
  sendApprovalStatusUpdate,
  sendTransactionCompletionNotification,
  sendFormSubmissionNotification,
  sendFormStatusUpdate,
  generateResetToken,
};

