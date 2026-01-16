const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
require('dotenv').config();

// Church branding constants
const CHURCH_NAME = 'Bible Baptist Ekklesia of Kawit';
const CHURCH_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'jabano120@gmail.com';
const CHURCH_WEBSITE = 'https://bbek.vercel.app';
const CHURCH_PHONE = '(046) 123-4567';
const CHURCH_ADDRESS = 'Kawit, Cavite, Philippines';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Lightweight token generator
const generateResetToken = () => crypto.randomBytes(32).toString('hex');

// Error handler
const buildErrorResult = (message, error) => {
  return {
    success: false,
    message,
    error: error?.message || null,
    code: error?.code || null,
    response: error?.response || null,
    responseCode: error?.responseCode || null,
  };
};

// Simple email header - plain text based
const getEmailHeader = (title) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
      <h2 style="margin: 0; color: #333;">${CHURCH_NAME}</h2>
    </div>
`;

// Simple email footer
const getEmailFooter = () => `
    <div style="border-top: 1px solid #ccc; padding-top: 15px; margin-top: 30px; font-size: 12px; color: #666;">
      <p style="margin: 5px 0;">${CHURCH_NAME}</p>
      <p style="margin: 5px 0;">${CHURCH_ADDRESS} | ${CHURCH_PHONE}</p>
      <p style="margin: 10px 0 0 0;">This is an automated message. Please do not reply.</p>
    </div>
  </body>
  </html>
`;

// Simple status badge
const getStatusBadge = (status, statusColors, statusMessages) => {
  const message = statusMessages[status.toLowerCase()] || status;
  return `
    <div style="background-color: #f5f5f5; padding: 12px; border-left: 4px solid #333; margin: 15px 0;">
      <strong>${status.toUpperCase()}:</strong> ${message}
    </div>
  `;
};

// Simple CTA Button
const getCTAButton = (text, url) => `
  <div style="margin: 20px 0;">
    <a href="${url}" style="background-color: #333; color: white; padding: 12px 25px; text-decoration: none; display: inline-block;">${text}</a>
  </div>
`;

// Simple Info box
const getInfoBox = (title, items) => `
  <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0;">
    <h3 style="margin: 0 0 10px 0; font-size: 16px;">${title}</h3>
    <table style="width: 100%; border-collapse: collapse;">
      ${items.map(item => `
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px solid #eee;">${item.label}</td>
          <td style="padding: 5px 0; border-bottom: 1px solid #eee; text-align: right;">${item.value}</td>
        </tr>
      `).join('')}
    </table>
  </div>
`;

// Simple Next steps
const getNextSteps = (steps) => `
  <div style="margin: 15px 0;">
    <strong>Next Steps:</strong>
    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
      ${steps.map(step => `<li style="margin: 5px 0;">${step}</li>`).join('')}
    </ul>
  </div>
`;

/**
 * Send account details email for password change
 */
const sendAccountDetails = async (accountDetails) => {
  try {
    if (!accountDetails || !accountDetails.acc_id || !accountDetails.email) {
      return {
        success: false,
        message: 'Account ID and email are required',
      };
    }
    
    const emailType = accountDetails.type || 'forgot_password';
    const frontendUrl = process.env.FRONTEND_URL1 || 'http://localhost:5173';
    const token = accountDetails.token || accountDetails.resetToken || generateResetToken();
    const resetUrlBase = `${frontendUrl}/change-password/${accountDetails.acc_id}`;
    const resetUrl = token
      ? `${resetUrlBase}?token=${encodeURIComponent(token)}&type=${encodeURIComponent(emailType)}`
      : resetUrlBase;
    const recipientName = accountDetails.name || 'Member';
    
    let subject, title, mainMessage, buttonText, importantNotes;
    
    if (emailType === 'new_account') {
      subject = `Welcome to ${CHURCH_NAME}!`;
      title = 'Welcome to Our Church Family!';
      mainMessage = `We're delighted to have you join our church family at ${CHURCH_NAME}. To get started with your account, please set your password by clicking the button below.`;
      buttonText = 'Set Up My Account';
      importantNotes = [
        'Please set your password as soon as possible to secure your account',
        'This link will expire after 24 hours for security reasons',
        'Do not share this link with anyone'
      ];
      if (accountDetails.temporaryPassword) {
        importantNotes.push(`Your temporary password is: ${accountDetails.temporaryPassword}`);
      }
    } else {
      subject = `Password Reset - ${CHURCH_NAME}`;
      title = 'Password Reset Request';
      mainMessage = `We received a request to reset your password for your ${CHURCH_NAME} account. Click the button below to create a new password.`;
      buttonText = 'Reset My Password';
      importantNotes = [
        'This link will expire after 1 hour for security reasons',
        'If you did not request this, please ignore this email',
        'Do not share this link with anyone'
      ];
    }
    
    const msg = {
      to: accountDetails.email,
      from: {
        email: CHURCH_EMAIL,
        name: CHURCH_NAME
      },
      subject: subject,
      html: getEmailHeader(title) + `
        <p style="font-size: 16px; color: #555;">Dear ${recipientName},</p>
        <p style="font-size: 15px; color: #555;">${mainMessage}</p>
        ${getCTAButton(buttonText, resetUrl)}
        ${getInfoBox('Important Information', importantNotes.map(note => ({ label: 'Note', value: note })))}
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">
          If the button doesn't work, copy this link:<br>
          <a href="${resetUrl}" style="color: #1a5f2a; word-break: break-all; font-size: 12px;">${resetUrl}</a>
        </p>
        ${getNextSteps(['Our team is here to help if you have any questions', 'Feel free to contact us for assistance'])}
      ` + getEmailFooter(),
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      message: `Account details email sent successfully (${emailType === 'new_account' ? 'new account' : 'password reset'})`,
    };
  } catch (error) {
    console.error('Error sending account details email:', error);
    return buildErrorResult('Failed to send account details email', error);
  }
};

/**
 * Send marriage service details email
 */
const sendMarriageDetails = async (marriageDetails) => {
  try {
    if (!marriageDetails || !marriageDetails.email || !marriageDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }
    
    const status = marriageDetails.status.toLowerCase();
    const statusMessages = {
      pending: 'Your marriage service request is currently under review by our pastoral team.',
      ongoing: 'Your marriage service arrangements are being finalized.',
      completed: 'Congratulations! Your marriage service has been completed successfully.',
    };
    
    const recipientName = marriageDetails.recipientName || 'Brother/Sister';
    
    const msg = {
      to: marriageDetails.email,
      from: {
        email: CHURCH_EMAIL,
        name: CHURCH_NAME
      },
      subject: `Marriage Service Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: getEmailHeader('Marriage Service Update') + `
        <p style="font-size: 16px; color: #555;">Dear ${recipientName},</p>
        <p style="font-size: 15px; color: #555;">${statusMessages[status] || 'Your marriage service status has been updated.'}</p>
        ${getStatusBadge(status, {}, statusMessages)}
        ${getInfoBox('Marriage Service Details', [
          { label: 'Groom', value: marriageDetails.groomName || 'N/A' },
          { label: 'Bride', value: marriageDetails.brideName || 'N/A' },
          { label: 'Marriage Date', value: marriageDetails.marriageDate || 'To be determined' },
          { label: 'Location', value: marriageDetails.location || 'To be determined' }
        ])}
        ${getNextSteps([
          'Our pastoral team will contact you shortly',
          'Please prepare necessary documents as requested',
          'Contact us if you have any questions about the ceremony'
        ])}
      ` + getEmailFooter(),
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      message: 'Marriage details email sent successfully',
    };
  } catch (error) {
    console.error('Error sending marriage details email:', error);
    return buildErrorResult('Failed to send marriage details email', error);
  }
};

/**
 * Send water baptism service details email
 */
const sendWaterBaptismDetails = async (baptismDetails) => {
  try {
    if (!baptismDetails || !baptismDetails.email || !baptismDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }
    
    const status = baptismDetails.status.toLowerCase();
    const statusMessages = {
      pending: 'Your water baptism request is currently under review.',
      approved: 'Great news! Your water baptism request has been approved.',
      disapproved: 'We regret to inform you that your water baptism request was not approved at this time.',
      completed: 'Congratulations! Your water baptism ceremony has been completed successfully.',
      cancelled: 'Your water baptism request has been cancelled.',
    };
    
    const recipientName = baptismDetails.recipientName || 'Brother/Sister';
    
    const msg = {
      to: baptismDetails.email,
      from: {
        email: CHURCH_EMAIL,
        name: CHURCH_NAME
      },
      subject: `Water Baptism Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: getEmailHeader('Water Baptism Service Update') + `
        <p style="font-size: 16px; color: #555;">Dear ${recipientName},</p>
        <p style="font-size: 15px; color: #555;">${statusMessages[status] || 'Your water baptism service status has been updated.'}</p>
        ${getStatusBadge(status, {}, statusMessages)}
        ${getInfoBox('Baptism Details', [
          { label: 'Name', value: baptismDetails.memberName || 'N/A' },
          { label: 'Baptism Date', value: baptismDetails.baptismDate || 'To be determined' },
          { label: 'Location', value: baptismDetails.location || 'To be determined' }
        ])}
        ${status === 'approved' ? getNextSteps([
          'Prepare for your baptism ceremony',
          'Arrive at the church 30 minutes before scheduled time',
          'Bring a change of clothes for after the ceremony'
        ]) : ''}
        ${status === 'disapproved' ? getNextSteps([
          'Please contact our pastoral team for more information',
          'We are here to help guide you through the process'
        ]) : ''}
      ` + getEmailFooter(),
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      message: 'Water baptism details email sent successfully',
    };
  } catch (error) {
    console.error('Error sending water baptism details email:', error);
    return buildErrorResult('Failed to send water baptism details email', error);
  }
};

/**
 * Send child dedication service details email
 */
const sendChildDedicationDetails = async (dedicationDetails) => {
  try {
    if (!dedicationDetails || !dedicationDetails.email || !dedicationDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }
    
    const status = dedicationDetails.status.toLowerCase();
    const statusMessages = {
      pending: 'Your child dedication request is currently under review.',
      approved: 'Your child dedication request has been approved!',
      disapproved: 'We regret to inform you that your child dedication request was not approved at this time.',
      completed: 'Your child dedication ceremony has been completed successfully.',
      cancelled: 'Your child dedication request has been cancelled.',
    };
    
    const recipientName = dedicationDetails.recipientName || 'Brother/Sister';
    
    // Build dedication details based on status
    let dedicationDetailsItems = [
      { label: 'Child Name', value: dedicationDetails.childName || 'N/A' },
      { label: 'Parent(s)', value: dedicationDetails.parentName || 'N/A' },
      { label: 'Dedication Date', value: dedicationDetails.dedicationDate || 'To be determined' },
      { label: 'Location', value: dedicationDetails.location || 'To be determined' }
    ];
    
    // Add additional details for approved status
    if (status === 'approved') {
      dedicationDetailsItems = [
        { label: 'Child Name', value: dedicationDetails.childName || 'N/A' },
        { label: 'Parent(s)', value: dedicationDetails.parentName || 'N/A' },
        { label: 'Dedication Date', value: dedicationDetails.dedicationDate || 'To be determined' },
        { label: 'Dedication Time', value: dedicationDetails.dedicationTime || 'To be determined' },
        { label: 'Location', value: dedicationDetails.location || 'To be determined' },
        { label: 'Pastor', value: dedicationDetails.pastor || 'To be determined' }
      ];
    }
    
    const msg = {
      to: dedicationDetails.email,
      from: {
        email: CHURCH_EMAIL,
        name: CHURCH_NAME
      },
      subject: `Child Dedication Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: getEmailHeader('Child Dedication Service Update') + `
        <p style="font-size: 16px; color: #555;">Dear ${recipientName},</p>
        <p style="font-size: 15px; color: #555;">${statusMessages[status] || 'Your child dedication service status has been updated.'}</p>
        ${getStatusBadge(status, {}, statusMessages)}
        ${getInfoBox('Dedication Details', dedicationDetailsItems)}
        ${status === 'approved' ? getNextSteps([
          'Prepare for this special dedication ceremony',
          'Invite family and friends to witness this moment',
          'Arrive at the church 30 minutes early'
        ]) : ''}
      ` + getEmailFooter(),
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      message: 'Child dedication details email sent successfully',
    };
  } catch (error) {
    console.error('Error sending child dedication details email:', error);
    return buildErrorResult('Failed to send child dedication details email', error);
  }
};

/**
 * Send burial service request notification email
 */
const sendBurialServiceRequestNotification = async (requestDetails) => {
  try {
    if (!requestDetails || !requestDetails.email) {
      return {
        success: false,
        message: 'Email is required',
      };
    }
    
    const recipientName = requestDetails.recipientName || 'Brother/Sister';
    const deceasedBirthDate = requestDetails.deceasedBirthDate 
      ? new Date(requestDetails.deceasedBirthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A';
    const dateOfDeath = requestDetails.dateOfDeath
      ? new Date(requestDetails.dateOfDeath).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A';
    
    const msg = {
      to: requestDetails.email,
      from: {
        email: CHURCH_EMAIL,
        name: CHURCH_NAME
      },
      subject: `Burial Service Request Received - ${CHURCH_NAME}`,
      html: getEmailHeader('Burial Service Request Received') + `
        <p style="font-size: 16px; color: #555;">Dear ${recipientName},</p>
        <p style="font-size: 15px; color: #555;">We have received your burial service request. During this difficult time, we want to extend our deepest condolences and assure you that we are here to support you and your family.</p>
        ${getStatusBadge('pending', {}, { pending: 'Request Status: Under Review' })}
        ${getInfoBox('Request Details', [
          { label: 'Request ID', value: requestDetails.burialServiceId || 'N/A' },
          { label: 'Deceased Name', value: requestDetails.deceasedName || 'N/A' },
          { label: 'Your Relationship', value: requestDetails.relationship || 'N/A' },
          { label: 'Date of Birth', value: deceasedBirthDate },
          { label: 'Date of Death', value: dateOfDeath }
        ])}
        ${getNextSteps([
          'Our pastoral team will review your request within 24 hours',
          'You will receive a follow-up email with service details',
          'Our chaplain will contact you to discuss arrangements'
        ])}
        <p style="font-size: 14px; color: #555; margin-top: 20px; text-align: center;">
          Please know that our thoughts and prayers are with you and your family during this time.
        </p>
      ` + getEmailFooter(),
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      message: 'Burial service request notification email sent successfully',
    };
  } catch (error) {
    console.error('Error sending burial service request notification email:', error);
    return buildErrorResult('Failed to send burial service request notification email', error);
  }
};

/**
 * Send burial service details email
 */
const sendBurialDetails = async (burialDetails) => {
  try {
    if (!burialDetails || !burialDetails.email || !burialDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }
    
    const status = burialDetails.status.toLowerCase();
    const statusMessages = {
      pending: 'Your burial service request is currently under review.',
      approved: 'Your burial service request has been approved.',
      disapproved: 'We regret to inform you that your burial service request was not approved.',
      completed: 'Your burial service has been completed successfully.',
      cancelled: 'Your burial service request has been cancelled.',
    };
    
    const recipientName = burialDetails.recipientName || 'Brother/Sister';
    
    const msg = {
      to: burialDetails.email,
      from: {
        email: CHURCH_EMAIL,
        name: CHURCH_NAME
      },
      subject: `Burial Service Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: getEmailHeader('Burial Service Update') + `
        <p style="font-size: 16px; color: #555;">Dear ${recipientName},</p>
        <p style="font-size: 15px; color: #555;">${statusMessages[status] || 'Your burial service status has been updated.'}</p>
        ${getStatusBadge(status, {}, statusMessages)}
        ${getInfoBox('Burial Service Details', [
          { label: 'Deceased Name', value: burialDetails.deceasedName || 'N/A' },
          { label: 'Family Contact', value: burialDetails.familyContact || 'N/A' },
          { label: 'Burial Date', value: burialDetails.burialDate || 'To be determined' },
          { label: 'Location', value: burialDetails.location || 'To be determined' }
        ])}
        ${status === 'approved' ? getNextSteps([
          'Our pastoral team will contact you to finalize arrangements',
          'Please prepare necessary documents',
          'We will guide you through the service planning'
        ]) : ''}
      ` + getEmailFooter(),
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      message: 'Burial details email sent successfully',
    };
  } catch (error) {
    console.error('Error sending burial details email:', error);
    return buildErrorResult('Failed to send burial details email', error);
  }
};

/**
 * Send approval request notification email
 */
const sendApprovalRequestNotification = async (approvalDetails) => {
  try {
    if (!approvalDetails || !approvalDetails.email || !approvalDetails.type) {
      return {
        success: false,
        message: 'Email and type are required',
      };
    }
    
    const recipientName = approvalDetails.recipientName || 'Brother/Sister';
    const typeLabel = approvalDetails.type === 'event' ? 'Event' : 'Ministry';
    
    const msg = {
      to: approvalDetails.email,
      from: {
        email: CHURCH_EMAIL,
        name: CHURCH_NAME
      },
      subject: `${typeLabel} Join Request Received - ${CHURCH_NAME}`,
      html: getEmailHeader(`${typeLabel} Join Request Received`) + `
        <p style="font-size: 16px; color: #555;">Dear ${recipientName},</p>
        <p style="font-size: 15px; color: #555;">We have received your request to join the <strong>${approvalDetails.requestTitle || 'church activity'}</strong>. Thank you for your interest in participating!</p>
        ${getStatusBadge('pending', {}, { pending: 'Request Status: Pending Review' })}
        ${getInfoBox('Request Details', [
          { label: 'Request ID', value: approvalDetails.approvalId || 'N/A' },
          { label: 'Type', value: typeLabel },
          { label: 'Name', value: approvalDetails.requestTitle || 'N/A' }
        ])}
        ${getNextSteps([
          'Our leadership will review your request within 24-48 hours',
          'You will receive an email once your request has been reviewed',
          'If approved, you will receive participation details'
        ])}
      ` + getEmailFooter(),
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      message: 'Approval request notification email sent successfully',
    };
  } catch (error) {
    console.error('Error sending approval request notification email:', error);
    return buildErrorResult('Failed to send approval request notification email', error);
  }
};

/**
 * Send approval status update email
 */
const sendApprovalStatusUpdate = async (approvalDetails) => {
  try {
    if (!approvalDetails || !approvalDetails.email || !approvalDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }
    
    const status = approvalDetails.status.toLowerCase();
    const statusMessages = {
      pending: 'Your request is currently pending review.',
      approved: 'Congratulations! Your request has been approved. Welcome!',
      rejected: 'We regret to inform you that your request was not approved.',
    };
    
    const recipientName = approvalDetails.recipientName || 'Brother/Sister';
    const typeLabel = approvalDetails.type === 'event' ? 'Event' : 'Ministry';
    
    const msg = {
      to: approvalDetails.email,
      from: {
        email: CHURCH_EMAIL,
        name: CHURCH_NAME
      },
      subject: `${typeLabel} Request ${status.charAt(0).toUpperCase() + status.slice(1)} - ${CHURCH_NAME}`,
      html: getEmailHeader(`${typeLabel} Request Update`) + `
        <p style="font-size: 16px; color: #555;">Dear ${recipientName},</p>
        <p style="font-size: 15px; color: #555;">${statusMessages[status] || 'Your request status has been updated.'}</p>
        ${getStatusBadge(status, {}, statusMessages)}
        ${getInfoBox('Request Details', [
          { label: 'Request ID', value: approvalDetails.approvalId || 'N/A' },
          { label: 'Type', value: typeLabel },
          { label: 'Name', value: approvalDetails.requestTitle || 'N/A' },
          ...(status === 'approved' && approvalDetails.approvalDate ? [
            { label: 'Approval Date', value: new Date(approvalDetails.approvalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }
          ] : [])
        ])}
        ${status === 'approved' ? getNextSteps([
          'You are now registered for this activity',
          'You will receive updates and information',
          'We look forward to seeing you!'
        ]) : ''}
        ${status === 'rejected' ? getNextSteps([
          'Please contact us if you have any questions',
          'We appreciate your interest in church activities'
        ]) : ''}
      ` + getEmailFooter(),
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      message: 'Approval status update email sent successfully',
    };
  } catch (error) {
    console.error('Error sending approval status update email:', error);
    return buildErrorResult('Failed to send approval status update email', error);
  }
};

/**
 * Send transaction completion notification email
 */
const sendTransactionCompletionNotification = async (transactionDetails) => {
  try {
    if (!transactionDetails || !transactionDetails.email || !transactionDetails.type_of_service) {
      return {
        success: false,
        message: 'Email and service type are required',
      };
    }
    
    const recipientName = transactionDetails.recipientName || 'Brother/Sister';
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
    const formattedAmount = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(totalAmount);
    
    const msg = {
      to: transactionDetails.email,
      from: {
        email: CHURCH_EMAIL,
        name: CHURCH_NAME
      },
      subject: `Transaction Completed - ${serviceTypeLabel} - ${CHURCH_NAME}`,
      html: getEmailHeader('Transaction Completed') + `
        <p style="font-size: 16px; color: #555;">Dear ${recipientName},</p>
        <p style="font-size: 15px; color: #555;">Thank you for your payment. Your transaction for <strong>${serviceName}</strong> has been completed successfully.</p>
        ${getStatusBadge('completed', {}, { completed: 'Transaction Status: Completed' })}
        ${getInfoBox('Transaction Details', [
          { label: 'Transaction ID', value: transactionDetails.transaction_id || 'N/A' },
          { label: 'Service Type', value: serviceTypeLabel },
          { label: 'Service ID', value: transactionDetails.service_id || 'N/A' },
          { label: 'Amount Paid', value: formattedAmount }
        ])}
        ${getNextSteps([
          'Your service has been confirmed',
          'You can request a certificate if needed',
          'Please keep your transaction ID for reference'
        ])}
        <p style="font-size: 14px; color: #555; margin-top: 20px; text-align: center;">
          Thank you for your generous contribution to ${CHURCH_NAME}!
        </p>
      ` + getEmailFooter(),
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      message: 'Transaction completion notification email sent successfully',
    };
  } catch (error) {
    console.error('Error sending transaction completion notification email:', error);
    return buildErrorResult('Failed to send transaction completion notification email', error);
  }
};

/**
 * Send form submission notification email
 */
const sendFormSubmissionNotification = async (formDetails) => {
  try {
    if (!formDetails || !formDetails.email) {
      return {
        success: false,
        message: 'Email is required',
      };
    }
    
    const recipientName = formDetails.recipientName || 'Brother/Sister';
    const formType = formDetails.formType || 'form';
    
    const formTypeLabels = {
      'schedule_change': 'Schedule Change Request',
      'prayer_request': 'Prayer Request',
      'message': 'Contact Message'
    };
    
    const formTypeLabel = formTypeLabels[formType] || 'Form Submission';
    
    // Custom message for prayer requests
    let statusMsg = 'Request Status: Under Review';
    if (formType === 'prayer_request') {
      statusMsg = 'Your prayer request has been received. The admin will read and respond to your prayer request shortly.';
    }
    
    let formDetailsHtml = '';
    
    if (formType === 'prayer_request' && formDetails.formData) {
      formDetailsHtml = `
        <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0;">
          <strong>Your Prayer Request:</strong>
          <p style="margin: 10px 0 0 0;">${formDetails.formData.request || 'N/A'}</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
            Submitted as: ${formDetails.formData.anonymous ? 'Anonymous' : 'Named Request'}
          </p>
        </div>
      `;
    } else if (formType === 'message' && formDetails.formData) {
      formDetailsHtml = `
        <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0;">
          <strong>${formDetails.formData.subject || 'Contact Message'}</strong>
          <p style="margin: 10px 0 0 0;">${formDetails.formData.message || 'N/A'}</p>
        </div>
      `;
    }
    
    const msg = {
      to: formDetails.email,
      from: {
        email: CHURCH_EMAIL,
        name: CHURCH_NAME
      },
      subject: `${formTypeLabel} Received - ${CHURCH_NAME}`,
      html: getEmailHeader(`${formTypeLabel} Received`) + `
        <p style="font-size: 16px; color: #555;">Dear ${recipientName},</p>
        <p style="font-size: 15px; color: #555;">Thank you for reaching out to us! We have received your ${formTypeLabel.toLowerCase()}.</p>
        ${getStatusBadge('pending', {}, { pending: statusMsg })}
        ${formDetailsHtml}
        ${getNextSteps([
          'Our team will review your request within 24-48 hours',
          'You will receive a follow-up email once reviewed',
          'We will get back to you as soon as possible'
        ])}
        <p style="font-size: 14px; color: #555; margin-top: 20px; text-align: center;">
          We are honored to pray for you and support you in every way possible.
        </p>
      ` + getEmailFooter(),
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      message: 'Form submission notification email sent successfully',
    };
  } catch (error) {
    console.error('Error sending form submission notification email:', error);
    return buildErrorResult('Failed to send form submission notification email', error);
  }
};

/**
 * Send form status update notification email
 */
const sendFormStatusUpdate = async (formDetails) => {
  try {
    if (!formDetails || !formDetails.email || !formDetails.status) {
      return {
        success: false,
        message: 'Email and status are required',
      };
    }
    
    const status = formDetails.status.toLowerCase();
    const statusMessages = {
      pending: 'Your request is currently pending review.',
      approved: 'Great news! Your request has been approved.',
      rejected: 'We regret to inform you that your request was not approved.',
    };
    
    // Custom message for prayer requests
    if (formDetails.formType === 'prayer_request') {
      statusMessages.approved = 'The admin has approved and read your prayer request. Wait patiently for the reply by admin.';
      statusMessages.pending = 'Your prayer request has been received and is awaiting admin review. The admin will read and respond to your prayer request shortly.';
    }
    
    const recipientName = formDetails.recipientName || 'Brother/Sister';
    const formType = formDetails.formType || 'form';
    
    const formTypeLabels = {
      'schedule_change': 'Schedule Change Request',
      'prayer_request': 'Prayer Request',
      'message': 'Contact Message'
    };
    
    const formTypeLabel = formTypeLabels[formType] || 'Form Submission';
    
    const msg = {
      to: formDetails.email,
      from: {
        email: CHURCH_EMAIL,
        name: CHURCH_NAME
      },
      subject: `${formTypeLabel} ${status.charAt(0).toUpperCase() + status.slice(1)} - ${CHURCH_NAME}`,
      html: getEmailHeader(`${formTypeLabel} Update`) + `
        <p style="font-size: 16px; color: #555;">Dear ${recipientName},</p>
        <p style="font-size: 15px; color: #555;">${statusMessages[status] || 'Your request status has been updated.'}</p>
        ${getStatusBadge(status, {}, statusMessages)}
        ${formDetails.adminNotes ? `
          <div style="background-color: #f9f9f9; padding: 12px; margin: 15px 0; border-left: 3px solid #333;">
            <strong>Admin Notes:</strong>
            <p style="margin: 5px 0 0 0;">${formDetails.adminNotes}</p>
          </div>
        ` : ''}
        ${status === 'approved' ? getNextSteps([
          'Your request has been processed successfully',
          'You will receive further instructions if needed',
          'Thank you for your patience'
        ]) : ''}
        ${status === 'rejected' ? getNextSteps([
          'Please contact us if you have questions',
          'We are here to help you find alternative solutions'
        ]) : ''}
      ` + getEmailFooter(),
    };
    
    await sgMail.send(msg);
    
    return {
      success: true,
      message: 'Form status update email sent successfully',
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
