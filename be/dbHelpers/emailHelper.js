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
 * Universal email template wrapper for Bible Baptist Ekklesia of Kawit
 * @param {Object} options - Template options
 * @param {string} options.title - Main heading of the email
 * @param {string} [options.preheader] - Small uppercase text above the title
 * @param {string} options.body - HTML content of the email body
 * @param {Object} [options.action] - Optional button link { url, label }
 * @param {string} [options.statusColor] - Primary accent color (default: blue)
 */
const renderEmailLayout = ({ title, preheader, body, action, statusColor = '#2563eb' }) => {
  const logoUrl = 'https://biblebaptistekklesiaofkawit.xyz/logo.png';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td, p, a { font-family: Arial, sans-serif !important; }
    </style>
    <![endif]-->
    <style>
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; border-collapse: collapse; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        .header { padding: 48px 40px 32px; text-align: center; background: linear-gradient(to bottom, #ffffff, #f1f5f9); }
        .logo { height: 72px; width: auto; margin-bottom: 24px; }
        .content { padding: 0 48px 48px; color: #334155; line-height: 1.7; font-size: 16px; }
        .content h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.02em; }
        .content p { margin-bottom: 20px; }
        .button-container { padding: 32px 0; text-align: center; }
        .button { background-color: ${statusColor}; color: #ffffff !important; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: transform 0.2s; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); }
        .button:hover { opacity: 0.9; }
        .footer { padding: 40px; text-align: center; background-color: #f1f5f9; color: #64748b; font-size: 14px; }
        .footer-logo { height: 32px; width: auto; opacity: 0.5; margin-bottom: 16px; }
        .social-links { margin: 24px 0; }
        .social-link { margin: 0 8px; color: #94a3b8; text-decoration: none; font-weight: 500; }
        @media only screen and (max-width: 600px) {
            .container { border-radius: 0; margin-top: 0; margin-bottom: 0; }
            .content { padding: 0 32px 40px; }
        }
    </style>
</head>
<body>
    <table class="wrapper">
        <tr>
            <td>
                <div class="container">
                    <div class="header">
                        <img src="${logoUrl}" alt="BBEK Logo" class="logo">
                    </div>
                    <div class="content">
                        ${preheader ? `<p style="font-weight: 600; text-transform: uppercase; color: ${statusColor}; font-size: 12px; letter-spacing: 0.1em; margin-bottom: 8px;">${preheader}</p>` : ''}
                        <h1>${title}</h1>
                        ${body}
                        ${action ? `
                        <div class="button-container">
                            <a href="${action.url}" class="button">${action.label}</a>
                        </div>` : ''}
                    </div>
                    <div class="footer">
                        <img src="${logoUrl}" alt="BBEK Logo" class="footer-logo">
                        <p>&copy; ${new Date().getFullYear()} Bible Baptist Ekklesia of Kawit. All rights reserved.</p>
                        <p>Philippine Sangley Road, Kawit, Cavite</p>
                        <div class="social-links">
                            <a href="https://biblebaptistekklesiaofkawit.xyz" class="social-link">Website</a>
                        </div>
                        <p style="font-size: 11px; opacity: 0.7; max-width: 400px; margin: 0 auto; line-height: 1.4;">This is an automated notification. Please do not reply to this email. For assistance, please contact our support team.</p>
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

/**
 * Send a support inquiry confirmation email
 * @param {Object} supportDetails - Support inquiry details
 */
const sendSupportEmail = async (supportDetails) => {
  try {
    const { email, name, subject: inquirySubject, message, ticketId } = supportDetails;
    const transporter = createTransporter();

    const body = `
      <p>Dear ${name || 'Valued Member'},</p>
      <p>We have received your support inquiry regarding <strong>"${inquirySubject}"</strong>. Our team has been notified and we are currently reviewing your request.</p>
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Ticket ID:</strong> ${ticketId || 'N/A'}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #1e293b;"><strong>Your Message:</strong></p>
        <p style="margin: 4px 0 0 0; font-style: italic; color: #475569;">"${message}"</p>
      </div>
      <p>A church representative will contact you via this email address as soon as possible. Thank you for your patience.</p>
    `;

    const html = renderEmailLayout({
      title: 'Support Inquiry Received',
      preheader: 'Help & Support',
      body,
      statusColor: '#059669' // Green for support
    });

    const mailOptions = {
      from: `"BBEK Support" <${CHURCH_EMAIL}>`,
      to: email,
      subject: `[Support #${ticketId || 'NEW'}] Inquiry Received: ${inquirySubject}`,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending support email:', error);
    return buildErrorResult('Failed to send support email', error);
  }
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
          <li>This link will expire after 1 hour for security reasons.</li>
          <li>If you did not request this password reset, please ignore this email and contact the church administration immediately.</li>
          <li>For security, do not share this link with anyone.</li>
        </ul>
      `;
    }

    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>${mainMessage}</p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #3b82f6; margin: 24px 0;">
        ${importantNotes}
      </div>
      <p>If you have any questions or concerns, please contact the church administration.</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
      </p>
    `;

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: accountDetails.email,
      subject: subject,
      html: renderEmailLayout({
        title,
        preheader: emailType === 'new_account' ? 'Welcome' : 'Account Security',
        body,
        action: {
          url: resetUrl,
          label: buttonText
        },
        statusColor: '#3b82f6'
      })
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

    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>${statusMessages[status] || 'Your marriage service status has been updated.'}</p>
      
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border-left: 4px solid ${statusColors[status] || '#3b82f6'}; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Current Status</p>
        <p style="margin: 4px 0 0 0; color: ${statusColors[status] || '#3b82f6'}; font-size: 18px; font-weight: 800; text-transform: uppercase;">${status}</p>
      </div>
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>${statusMessages[status] || 'Your marriage service status has been updated.'}</p>
      
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border-left: 4px solid ${statusColors[status] || '#3b82f6'}; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Current Status</p>
        <p style="margin: 4px 0 0 0; color: ${statusColors[status] || '#3b82f6'}; font-size: 18px; font-weight: 800; text-transform: uppercase;">${status}</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 24px 0;">
        <div style="background-color: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
          <h3 style="margin: 0; font-size: 14px; color: #1e293b;">Marriage Service Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px; width: 40%;"><strong>Groom</strong></td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;">${groomName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;"><strong>Bride</strong></td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;">${brideName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 14px;"><strong>Marriage Date</strong></td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;">${marriageDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; color: #64748b; font-size: 14px;"><strong>Location</strong></td>
            <td style="padding: 12px 20px; color: #1e293b; font-size: 14px;">${location}</td>
          </tr>
        </table>
      </div>
      
      <p>If you have any questions or need to make changes, please contact the church administration.</p>
    `;

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: marriageDetails.email,
      subject: `Marriage Service Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: renderEmailLayout({
        title: 'Marriage Service Update',
        preheader: 'Church Services',
        body,
        statusColor: statusColors[status] || '#3b82f6'
      })
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
      scheduled: '#1e88e5',
      approved: '#27ae60',
      disapproved: '#e74c3c',
      completed: '#27ae60',
      cancelled: '#95a5a6',
    };
    const statusMessages = {
      pending: 'Your water baptism request is currently pending approval.',
      scheduled: 'Your water baptism has been scheduled. Please check the details below.',
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
      html: renderEmailLayout({
        title: 'Water Baptism Update',
        preheader: 'Baptism Records',
        body: `
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>${statusMessages[status] || 'Your water baptism service status has been updated.'}</p>
          
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border-left: 4px solid ${statusColors[status] || '#3b82f6'}; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Current Status</p>
            <p style="margin: 4px 0 0 0; color: ${statusColors[status] || '#3b82f6'}; font-size: 18px; font-weight: 800; text-transform: uppercase;">${status}</p>
          </div>
          
          ${status === 'pending' ? `
          <div style="background-color: #fffbeb; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 24px;">
            <p style="margin: 0; font-weight: 700; color: #92400e;">Next Steps:</p>
            <p style="margin: 8px 0 0 0; color: #b45309;">Our team is reviewing your registration. You may be contacted for a brief pastoral interview. Please wait for official approval.</p>
          </div>
          ` : ''}

          ${status === 'approved' ? `
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 12px; border-left: 4px solid #0ea5e9; margin-bottom: 24px;">
            <p style="margin: 0; font-weight: 700; color: #075985;">Preparation for Baptism:</p>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #0369a1;">
              <li>Attend the pre-baptism orientation as scheduled</li>
              <li>Please prepare a change of clothes and a towel</li>
              <li>Arrive at the venue least 30 minutes before the ceremony</li>
            </ul>
          </div>
          ` : ''}

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
            <div style="background-color: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
              <h3 style="margin: 0; font-size: 14px; color: #1e293b;">Service Details</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>${status === 'completed' ? 'Date Got Saved:' : 'Baptism Date:'}</strong></td>
                <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${baptismDate}</td>
              </tr>
              <tr>
                <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Pastor:</strong></td>
                <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${pastorName}</td>
              </tr>
              ${baptismDetails.location && baptismDetails.location.trim() !== '' ? `
              <tr>
                <td style="padding: 12px 20px; color: #64748b;"><strong>Location:</strong></td>
                <td style="padding: 12px 20px; color: #1e293b;">${baptismDetails.location}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
              <h3 style="margin: 0; font-size: 14px; color: #1e293b;">Registration Information</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Full Name:</strong></td><td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${fullName}</td></tr>
              <tr><td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Email:</strong></td><td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${email}</td></tr>
              <tr><td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Phone:</strong></td><td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${phoneNumber}</td></tr>
            </table>
          </div>

          <p style="margin-top: 24px;">If you have any questions, please contact the church administration.</p>
        `,
        statusColor: statusColors[status] || '#3b82f6'
      })
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

    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>${statusMessages[status] || 'Your child dedication service status has been updated.'}</p>
      
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border-left: 4px solid ${statusColors[status] || '#3b82f6'}; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Current Status</p>
        <p style="margin: 4px 0 0 0; color: ${statusColors[status] || '#3b82f6'}; font-size: 18px; font-weight: 800; text-transform: uppercase;">${status}</p>
      </div>

      ${status === 'pending' ? `
      <div style="background-color: #fffbeb; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 700; color: #92400e;">Next Steps:</p>
        <p style="margin: 8px 0 0 0; color: #b45309;">Our team is coordinating with our Officiating Pastors to confirm their availability. We will notify you once the schedule is confirmed.</p>
      </div>
      ` : ''}

      ${status === 'approved' ? `
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 12px; border-left: 4px solid #0ea5e9; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 700; color: #075985;">Preparation:</p>
        <p style="margin: 8px 0 0 0; color: #0369a1;">Schedule confirmed! Please coordinate with the church office to finalize the names of godparents and invite your loved ones.</p>
      </div>
      ` : ''}

      ${status === 'completed' ? `
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 12px; border-left: 4px solid #22c55e; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 700; color: #166534;">Congratulations!</p>
        <p style="margin: 8px 0 0 0; color: #15803d;">Your child's dedication is now officially recorded. You may now log in to download the official Digital Certificate.</p>
      </div>
      ` : ''}

      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <div style="background-color: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
          <h3 style="margin: 0; font-size: 14px; color: #1e293b;">Dedication Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 40%;"><strong>Date & Time</strong></td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${fullDedicationDateTime}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Officiating Pastor</strong></td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${pastorName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; color: #64748b;"><strong>Location</strong></td>
            <td style="padding: 12px 20px; color: #1e293b;">${location}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
          <h3 style="margin: 0; font-size: 14px; color: #1e293b;">Child Information</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Full Name</strong></td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${childName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; color: #64748b;"><strong>Gender</strong></td>
            <td style="padding: 12px 20px; color: #1e293b;">${dedicationDetails.childGender || 'N/A'}</td>
          </tr>
        </table>
      </div>

      <p style="margin-top: 24px;">If you have any questions, please contact the church administration.</p>
    `;

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: dedicationDetails.email,
      subject: `Child Dedication Service Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: renderEmailLayout({
        title: 'Child Dedication Update',
        preheader: 'Church Records',
        body,
        statusColor: statusColors[status] || '#3b82f6'
      })
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
 * Send burial service request notification email
 * @param {Object} burialDetails - Burial service details
 */
const sendBurialRequestNotification = async (burialDetails) => {
  try {
    const { email, recipientName, deceasedName, deceasedBirthDate, dateOfDeath } = burialDetails;
    const transporter = createTransporter();

    const body = `
      <p>Dear <strong>${recipientName || 'Valued Member'}</strong>,</p>
      <p>We have received your burial service request for <strong>${deceasedName || 'N/A'}</strong>. Our hearts go out to you and your family during this difficult time.</p>
      
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #1e293b;">Deceased Information</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 40%;"><strong>Name</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${deceasedName}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Date of Birth</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${deceasedBirthDate || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;"><strong>Date of Death</strong></td><td style="padding: 8px 0; color: #1e293b;">${dateOfDeath || 'N/A'}</td></tr>
        </table>
      </div>

      <div style="background-color: #fffbeb; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 700; color: #92400e;">Next Steps:</p>
        <p style="margin: 8px 0 0 0; color: #b45309;">Our pastoral team will review your request within 24 hours. A representative will reach out shortly for coordination and spiritual support.</p>
      </div>
      
      <p>If you have any urgent questions, please contact the church administration.</p>
    `;

    const html = renderEmailLayout({
      title: 'Burial Service Request',
      preheader: 'Bereavement Support',
      body,
      statusColor: '#f59e0b'
    });

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: email,
      subject: 'Burial Service Request Update',
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending burial notification:', error);
    return buildErrorResult('Failed to send burial notification', error);
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
      return { success: false, message: 'Email and status are required' };
    }

    const transporter = createTransporter();
    const status = (burialDetails.status || 'pending').toLowerCase();
    
    // Status color mapping for premium look
    const statusColors = {
      pending: '#f59e0b',
      approved: '#059669',
      completed: '#059669',
      disapproved: '#dc2626',
      cancelled: '#4b5563'
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
    
    // Format burial date
    const burialDateMoment = moment(burialDetails.burialDate);
    const burialDate = burialDateMoment.isValid() 
      ? burialDateMoment.tz('Asia/Manila').format('MMMM D, YYYY [at] h:mm A') 
      : 'To be determined';
      
    const location = burialDetails.location || 'To be determined';

    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>${statusMessages[status] || 'Your burial service status has been updated.'}</p>
      
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border-left: 4px solid ${statusColors[status] || '#3b82f6'}; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Current Status</p>
        <p style="margin: 4px 0 0 0; color: ${statusColors[status] || '#3b82f6'}; font-size: 18px; font-weight: 800; text-transform: uppercase;">${status}</p>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <div style="background-color: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
          <h3 style="margin: 0; font-size: 14px; color: #1e293b;">Service Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 40%;"><strong>Deceased Name</strong></td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${deceasedName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Burial Date</strong></td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${burialDate}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; color: #64748b;"><strong>Location</strong></td>
            <td style="padding: 12px 20px; color: #1e293b;">${location}</td>
          </tr>
        </table>
      </div>

      <p>If you have any questions or need to make adjustments, please reach out to the church administration. We are here to support you in every way possible.</p>
    `;

    const html = renderEmailLayout({
      title: 'Burial Service Update',
      preheader: 'Bereavement Support',
      body,
      statusColor: statusColors[status] || '#3b82f6'
    });

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: burialDetails.email,
      subject: `Burial Service Update - ${status.toUpperCase()}`,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
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
      return { success: false, message: 'Email and type are required' };
    }

    const transporter = createTransporter();
    const recipientName = approvalDetails.recipientName || 'Valued Member';
    const requestTitle = approvalDetails.requestTitle || 'N/A';
    const approvalId = approvalDetails.approvalId || 'N/A';
    const typeLabel = approvalDetails.type === 'event' ? 'Event' : 'Ministry';

    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>We have received your request to join the ${typeLabel.toLowerCase()} <strong>${requestTitle}</strong>. Thank you for your interest!</p>
      
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Request Status</p>
        <p style="margin: 4px 0 0 0; color: #f59e0b; font-size: 18px; font-weight: 800; text-transform: uppercase;">Pending Review</p>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <div style="background-color: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
          <h3 style="margin: 0; font-size: 14px; color: #1e293b;">Request Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 40%;"><strong>Request ID</strong></td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${approvalId}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Type</strong></td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; color: #64748b;"><strong>${typeLabel} Name</strong></td>
            <td style="padding: 12px 20px; color: #1e293b;">${requestTitle}</td>
          </tr>
        </table>
      </div>

      <p>Our team will review your request within 24-48 hours. You will receive another notification once a decision has been made.</p>
    `;

    const html = renderEmailLayout({
      title: `${typeLabel} Join Request`,
      preheader: 'Notification Received',
      body,
      statusColor: '#f59e0b'
    });

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: approvalDetails.email,
      subject: `${typeLabel} Join Request Received`,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending approval request notification:', error);
    return buildErrorResult('Failed to send approval request notification', error);
  }
};


/**
 * Send approval status update email
 * @param {Object} approvalDetails - Approval status details object
 */
const sendApprovalStatusUpdate = async (approvalDetails) => {
  try {
    if (!approvalDetails || !approvalDetails.email || !approvalDetails.status) {
      return { success: false, message: 'Email and status are required' };
    }

    const transporter = createTransporter();
    const status = (approvalDetails.status || 'pending').toLowerCase();
    
    const statusColors = {
      approved: '#059669',
      rejected: '#dc2626',
      pending: '#f59e0b'
    };

    const statusMessages = {
      approved: 'Congratulations! Your request has been approved. You can now participate in this activity.',
      rejected: 'We regret to inform you that your request has been rejected.',
      pending: 'Your request is currently pending review.'
    };

    const recipientName = approvalDetails.recipientName || 'Valued Member';
    const requestTitle = approvalDetails.requestTitle || 'N/A';
    const typeLabel = approvalDetails.type === 'event' ? 'Event' : 'Ministry';

    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>${statusMessages[status] || 'Your request status has been updated.'}</p>
      
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border-left: 4px solid ${statusColors[status] || '#3b82f6'}; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Update Information</p>
        <p style="margin: 4px 0 0 0; color: ${statusColors[status] || '#3b82f6'}; font-size: 18px; font-weight: 800; text-transform: uppercase;">${status}</p>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
          <h3 style="margin: 0; font-size: 14px; color: #1e293b;">Request Details</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 40%;"><strong>Type</strong></td>
            <td style="padding: 12px 20px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; color: #64748b;"><strong>Activity</strong></td>
            <td style="padding: 12px 20px; color: #1e293b;">${requestTitle}</td>
          </tr>
        </table>
      </div>

      <p style="margin-top: 24px;">If you have any questions, please contact the church administration.</p>
    `;

    const html = renderEmailLayout({
      title: 'Join Request Update',
      preheader: 'Notification Update',
      body,
      statusColor: statusColors[status] || '#3b82f6'
    });

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: approvalDetails.email,
      subject: `${typeLabel} Join Request Update`,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending approval status update:', error);
    return buildErrorResult('Failed to send approval status update', error);
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
      subject: `✅ New Online Donation Received & Auto-Confirmed - ${formattedAmount}`,
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
            <h1 style="color: white; margin: 0; font-size: 24px;">New Online Donation (Auto-Confirmed)</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">A new donation has been received and auto-confirmed by the system</p>
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

            <div style="background-color: #e6fffa; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-top: 20px;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                ✅ This donation was auto-confirmed. You may review the proof, update status, or publish a transparency proof if desired.
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
          <h2 style="color: #1a365d;">Thank you — your donation is confirmed!</h2>
          <p>Dear ${donor_name},</p>
          <p>We have received and confirmed your donation. Thank you for your generosity. If the admin chooses to publish a transparency proof, you may receive an additional notification.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Reference ID:</strong> #${tithes_id}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${formattedAmount}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${type.toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> Confirmed</p>
          </div>
          
          <p>If the admin publishes a transparency proof or updates the donation status, you will receive an update by email.</p>
          
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
        return 'Your Bible Study session has been marked as completed. Praise God for your growth!';
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
              ${details.pastor_name ? `<p style="margin: 0 0 5px 0;"><strong>Pastor:</strong> ${details.pastor_name}</p>` : ''}
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
    const registrationUrl = `${frontendUrl}/services/water-baptism/registration?reqId=${details.request_id}${details.email ? `&email=${encodeURIComponent(details.email)}` : ''}`;

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

            <p>As the next step in your spiritual journey, we warmly invite you to join our <strong>Bible Study sessions</strong>, held <strong>Daily (Monday to Saturday)</strong> at your preferred time.</p>

            <div style="background-color: #e0f2f1; border-left: 4px solid #0f766e; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #0f766e;">📅 Schedule: Monday — Saturday</p>
              <p style="margin: 8px 0 0 0; color: #555;">Our pastor will personally guide you through God's Word at your own pace, typically held at your residence for your convenience.</p>
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
              <p style="margin: 0 0 10px 0;"><strong>Schedule:</strong> ${formattedDate}</p>
              <p style="margin: 0 0 10px 0;"><strong>Address:</strong> ${location || 'Your Registered Address'}</p>
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

    // Build recipient list (Lead + Companions)
    let recipients = [details.email];
    
    // Check if there are group members in notes
    if (details.notes) {
      try {
        const notesData = typeof details.notes === 'string' ? JSON.parse(details.notes) : details.notes;
        if (notesData.is_group && notesData.companions && Array.isArray(notesData.companions)) {
          notesData.companions.forEach(member => {
            if (member.email && member.email.trim() !== '' && !recipients.includes(member.email.trim())) {
              recipients.push(member.email.trim());
            }
          });
        }
      } catch (e) {
        // Not a JSON notes or different format, ignore group parsing
      }
    }

    const statusColors = {
      pending: '#f39c12',
      scheduled: '#3498db',
      completed: '#27ae60',
      cancelled: '#95a5a6',
      rejected: '#e74c3c'
    };

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: recipients.join(', '),
      subject: `Bible Study Update: ${status.charAt(0).toUpperCase() + status.slice(1)} - BBEK`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f7fafc; padding: 30px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-top: 0;">Bible Study Update</h2>
            <p>Dear ${recipientName},</p>
            <p>Your Bible Study request status has been updated to <strong>${status}</strong>.</p>
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> <span style="color: ${statusColors[status] || '#3498db'}; font-weight: bold; text-transform: uppercase;">${status}</span></p>
              <p style="margin: 0 0 10px 0;"><strong>Schedule:</strong> ${formattedDate}</p>
              ${details.pastor_name ? `<p style="margin: 0 0 10px 0;"><strong>Pastor:</strong> ${details.pastor_name}</p>` : ''}
              <p style="margin: 0;"><strong>Address:</strong> ${details.location || details.address || 'Your Registered Address'}</p>
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

/**
 * Send Salvation Rejection email with Reason and Available Slots
 * Useful for when a specific date is rejected but church wants to offer alternatives
 */
const sendSalvationRejectionWithReason = async ({ email, firstname, lastname, reason, availableSlots, formLink, isBibleStudy = false }) => {
  try {
    const transporter = createTransporter();
    const recipientName = `${firstname || ''} ${lastname || ''}`.trim() || 'Friend';
    
    // Format available slots for email
    let slotsHtml = '';
    if (availableSlots && availableSlots.length > 0) {
      slotsHtml = `
        <div style="margin: 20px 0; background-color: #fff; padding: 15px; border-radius: 8px; border: 1px solid ${isBibleStudy ? '#b2f5ea' : '#fed7d7'};">
          <h4 style="margin-top: 0; color: ${isBibleStudy ? '#2c7a7b' : '#c53030'};">Recommended Available Dates:</h4>
          <ul style="padding-left: 20px;">
            ${availableSlots.map(slot => {
              const date = moment(slot.date).format('MMMM D, YYYY');
              return slot.timeSlots.map(ts => `<li>${date} at ${ts.time}</li>`).join('');
            }).join('')}
          </ul>
        </div>
      `;
    }

    const mailOptions = {
      from: `"Bible Baptist Ekklesia of Kawit" <${CHURCH_EMAIL}>`,
      to: email,
      subject: `Update Regarding Your ${isBibleStudy ? 'Bible Study' : 'Salvation Talk'} Request`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: ${isBibleStudy ? '#e6fffa' : '#fff5f5'}; padding: 30px; border-radius: 8px; border-left: 5px solid ${isBibleStudy ? '#38b2ac' : '#feb2b2'};">
            <h2 style="color: ${isBibleStudy ? '#2c7a7b' : '#c53030'}; margin-top: 0;">${isBibleStudy ? 'Bible Study Request' : 'Salvation Talk Request'} Update</h2>
            <p>Dear <strong>${recipientName}</strong>,</p>
            
            <p>Thank you for your interest in scheduling a ${isBibleStudy ? 'Bible Study' : 'Salvation Talk'} with Bible Baptist Ekklesia of Kawit.</p>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 8px; border: 1px solid #fed7d7; margin: 20px 0;">
              <p style="margin: 0;"><strong>Update:</strong> We are unable to proceed with your requested schedule at this time.</p>
              ${reason ? `<p style="margin: 10px 0 0 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            
            <p>However, we are eager to meet with you! Based on our current church calendar, here are some other times we can manage:</p>
            
            ${slotsHtml}
            
            <p>If any of the times above work for you, you can quickly reschedule by clicking the button below. This will pre-fill your information so you only need to select your new preferred date.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${formLink}" 
                 style="background-color: ${isBibleStudy ? '#2c7a7b' : '#c53030'}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Reschedule Now
              </a>
            </div>

            <p style="font-size: 13px; color: #718096;">
              Or copy and paste this link into your browser:<br>
              <a href="${formLink}" style="color: #c53030;">${formLink}</a>
            </p>

            <p>We look forward to hearing from you soon!</p>
            
            <hr style="border: none; border-top: 1px solid #fed7d7; margin: 20px 0;">
            <p style="color: #718096; font-size: 12px; margin-bottom: 0;">
              This is an automated message from Bible Baptist Ekklesia of Kawit. 🙏
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending detailed salvation rejection email:', error);
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
  sendSalvationRejectionWithReason,
  sendBibleStudyInvitation,
  sendBibleStudyDetails,
  sendPromotionVisitDetails,
  sendSupportEmail,
  generateResetToken,
};

