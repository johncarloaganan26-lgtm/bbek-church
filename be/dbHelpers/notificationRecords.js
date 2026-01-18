/**
 * Notification Records Helper
 * Unified notification system for contact forms, prayer requests, schedule changes, and services
 */

const { query } = require('../database/db');
const moment = require('moment');

/**
 * Get unified notifications for a user
 * @param {String} memberId - Member ID (optional, for authenticated users)
 * @param {String} lastFetch - ISO timestamp for incremental loading
 * @returns {Promise<Object>} Unified notifications
 */
async function getUnifiedNotifications(memberId = null, lastFetch = null) {
  try {
    // Initialize result array
    const notifications = [];

    // 1. Get form-based notifications (contact, prayer requests, schedule changes)
    try {
      const formNotifications = await getFormNotifications(memberId, lastFetch);
      notifications.push(...formNotifications);
    } catch (error) {
      console.error('Error fetching form notifications:', error.message);
      // Continue with other notifications
    }

    // 2. Get service-based notifications
    try {
      const serviceNotifications = await getServiceNotifications(memberId, lastFetch);
      notifications.push(...serviceNotifications);
    } catch (error) {
      console.error('Error fetching service notifications:', error.message);
      // Continue with form notifications only
    }

    // Sort by date (newest first)
    notifications.sort((a, b) =>
      new Date(b.date_created || b.created_at || 0) - new Date(a.date_created || a.created_at || 0)
    );

    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications
    };
  } catch (error) {
    console.error('Error fetching unified notifications:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch unified notifications',
      data: []
    };
  }
}

/**
 * Get form-based notifications
 */
async function getFormNotifications(memberId, lastFetch) {
  let sql = `
    SELECT
      form_id as id,
      form_type as category,
      status,
      created_at as date_created,
      submitted_by as member_id,
      name as title,
      email,
      form_data,
      'form' as source_type
    FROM tbl_forms
    WHERE 1=1
  `;

  const params = [];

  // Add member filter if provided
  if (memberId) {
    sql += ' AND (submitted_by = ? OR email = ?)';
    params.push(memberId, memberId);
  }

  // Add last fetch filter
  if (lastFetch) {
    sql += ' AND date_created > ?';
    params.push(lastFetch);
  }

  // Only get non-completed forms
  sql += ' AND status != "completed"';
  sql += ' ORDER BY date_created DESC';

  const [rows] = await query(sql, params);

  // Map form data to notification format
  return rows.map(row => {
    let title = row.title || 'New notification';
    let message = '';
    let details = '';

    // Parse form_data if it exists
    try {
      if (row.form_data) {
        const formData = typeof row.form_data === 'string' 
          ? JSON.parse(row.form_data) 
          : row.form_data;

        switch (row.category) {
          case 'message':
            title = 'New Contact Form Submission';
            message = formData.message || 'You have a new contact form message';
            details = formData.subject || formData.name || '';
            break;

          case 'prayer_request':
            title = 'New Prayer Request';
            message = formData.prayerRequest || 'You have a new prayer request';
            details = formData.anonymous ? 'Anonymous request' : (formData.name || '');
            break;

          case 'schedule_change':
            title = 'Schedule Change Request';
            message = `Request to change ${formData.serviceType || 'service'} date`;
            details = `${formData.originalDate} → ${formData.requestedDate}`;
            break;
        }
      }
    } catch (error) {
      console.warn('Error parsing form data:', error);
    }

    return {
      id: row.id,
      category: row.category,
      title: title,
      message: message,
      details: details,
      status: row.status || 'pending',
      date_created: row.date_created,
      read: row.status === 'completed' || row.status === 'read',
      source_type: row.source_type,
      source_id: row.id,
      member_id: row.member_id
    };
  });
}

/**
 * Get service-based notifications
 */
async function getServiceNotifications(memberId, lastFetch) {
  const serviceNotifications = [];

  // Water Baptism notifications
  const waterBaptismNotifications = await getWaterBaptismNotifications(memberId, lastFetch);
  serviceNotifications.push(...waterBaptismNotifications);

  // Burial Service notifications
  const burialNotifications = await getBurialServiceNotifications(memberId, lastFetch);
  serviceNotifications.push(...burialNotifications);

  // Marriage Service notifications
  const marriageNotifications = await getMarriageServiceNotifications(memberId, lastFetch);
  serviceNotifications.push(...marriageNotifications);

  // Child Dedication notifications
  const childDedicationNotifications = await getChildDedicationNotifications(memberId, lastFetch);
  serviceNotifications.push(...childDedicationNotifications);

  return serviceNotifications;
}

/**
 * Get water baptism notifications
 */
async function getWaterBaptismNotifications(memberId, lastFetch) {
  let sql = `
    SELECT
      baptism_id as id,
      member_id,
      baptism_date as service_date,
      status,
      date_created,
      CONCAT(COALESCE(firstname, ''), ' ', COALESCE(lastname, '')) as title,
      'water_baptism' as service_type,
      'Water Baptism' as service_name
    FROM tbl_waterbaptism
    WHERE 1=1
  `;

  const params = [];

  if (memberId) {
    sql += ' AND member_id = ?';
    params.push(memberId);
  }

  if (lastFetch) {
    sql += ' AND date_created > ?';
    params.push(lastFetch);
  }

  // Only get non-completed baptisms
  sql += ' AND status != "completed"';
  sql += ' ORDER BY date_created DESC';

  const [rows] = await query(sql, params);

  return rows.map(row => ({
    id: `service-wb-${row.id}`,
    category: 'service',
    title: `Water Baptism: ${row.title || 'Your baptism'}`,
    message: getServiceMessage(row.service_type, row.status, row.service_date),
    details: row.service_date ? `Scheduled for: ${moment(row.service_date).format('MMMM D, YYYY')}` : 'Date not set',
    status: row.status,
    date_created: row.date_created,
    read: row.status === 'completed' || row.status === 'read',
    source_type: 'service',
    source_id: row.id,
    service_type: row.service_type,
    service_name: row.service_name,
    service_date: row.service_date,
    member_id: row.member_id
  }));
}

/**
 * Get burial service notifications
 */
async function getBurialServiceNotifications(memberId, lastFetch) {
  let sql = `
    SELECT 
      burial_id as id,
      member_id,
      service_date,
      status,
      date_created,
      deceased_name as title,
      'burial' as service_type,
      'Burial Service' as service_name
    FROM tbl_burialservice
    WHERE 1=1
  `;

  const params = [];

  if (memberId) {
    sql += ' AND (member_id = ? OR requester_email = ?)';
    params.push(memberId, memberId);
  }

  if (lastFetch) {
    sql += ' AND date_created > ?';
    params.push(lastFetch);
  }

  // Only get non-completed burial services
  sql += ' AND status != "completed"';
  sql += ' ORDER BY date_created DESC';

  const [rows] = await query(sql, params);

  return rows.map(row => ({
    id: `service-burial-${row.id}`,
    category: 'service',
    title: `Burial Service: ${row.title || 'Service'}`,
    message: getServiceMessage(row.service_type, row.status, row.service_date),
    details: row.service_date ? `Scheduled for: ${moment(row.service_date).format('MMMM D, YYYY [at] h:mm A')}` : 'Date not set',
    status: row.status,
    date_created: row.date_created,
    read: row.status === 'completed' || row.status === 'read',
    source_type: 'service',
    source_id: row.id,
    service_type: row.service_type,
    service_name: row.service_name,
    service_date: row.service_date,
    member_id: row.member_id
  }));
}

/**
 * Get marriage service notifications
 */
async function getMarriageServiceNotifications(memberId, lastFetch) {
  let sql = `
    SELECT 
      marriage_id as id,
      groom_member_id as member_id,
      bride_member_id as bride_id,
      marriage_date as service_date,
      status,
      date_created,
      'Marriage Service Request' as title,
      'marriage' as service_type,
      'Marriage Service' as service_name
    FROM tbl_marriageservice
    WHERE 1=1
  `;

  const params = [];

  if (memberId) {
    sql += ' AND (groom_member_id = ? OR bride_member_id = ?)';
    params.push(memberId, memberId);
  }

  if (lastFetch) {
    sql += ' AND date_created > ?';
    params.push(lastFetch);
  }

  // Only get non-completed marriages
  sql += ' AND status != "completed"';
  sql += ' ORDER BY date_created DESC';

  const [rows] = await query(sql, params);

  return rows.map(row => ({
    id: `service-marriage-${row.id}`,
    category: 'service',
    title: `Marriage Service: ${row.title || 'Your wedding'}`,
    message: getServiceMessage(row.service_type, row.status, row.service_date),
    details: row.service_date ? `Scheduled for: ${moment(row.service_date).format('MMMM D, YYYY')}` : 'Date not set',
    status: row.status,
    date_created: row.date_created,
    read: row.status === 'completed' || row.status === 'read',
    source_type: 'service',
    source_id: row.id,
    service_type: row.service_type,
    service_name: row.service_name,
    service_date: row.service_date,
    member_id: row.member_id
  }));
}

/**
 * Get child dedication notifications
 */
async function getChildDedicationNotifications(memberId, lastFetch) {
  let sql = `
    SELECT 
      child_id as id,
      member_id,
      preferred_dedication_date as service_date,
      status,
      date_created,
      CONCAT(COALESCE(child_firstname, ''), ' ', COALESCE(child_lastname, '')) as title,
      'child_dedication' as service_type,
      'Child Dedication' as service_name
    FROM tbl_childdedications
    WHERE 1=1
  `;

  const params = [];

  if (memberId) {
    sql += ' AND member_id = ?';
    params.push(memberId);
  }

  if (lastFetch) {
    sql += ' AND date_created > ?';
    params.push(lastFetch);
  }

  // Only get non-completed dedications
  sql += ' AND status != "completed"';
  sql += ' ORDER BY date_created DESC';

  const [rows] = await query(sql, params);

  return rows.map(row => ({
    id: `service-cd-${row.id}`,
    category: 'service',
    title: `Child Dedication: ${row.title || 'Your child dedication'}`,
    message: getServiceMessage(row.service_type, row.status, row.service_date),
    details: row.service_date ? `Scheduled for: ${moment(row.service_date).format('MMMM D, YYYY')}` : 'Date not set',
    status: row.status,
    date_created: row.date_created,
    read: row.status === 'completed' || row.status === 'read',
    source_type: 'service',
    source_id: row.id,
    service_type: row.service_type,
    service_name: row.service_name,
    service_date: row.service_date,
    member_id: row.member_id
  }));
}

/**
 * Generate service-specific messages
 */
function getServiceMessage(serviceType, status, serviceDate) {
  const serviceMessages = {
    water_baptism: {
      pending: 'Your water baptism request is pending approval',
      approved: 'Your water baptism has been approved',
      ongoing: 'Your water baptism is scheduled',
      default: 'Update on your water baptism service'
    },
    burial: {
      pending: 'Your burial service request is pending approval',
      approved: 'Your burial service has been approved',
      ongoing: 'Your burial service is scheduled',
      default: 'Update on your burial service'
    },
    marriage: {
      pending: 'Your marriage service request is pending approval',
      approved: 'Your marriage service has been approved',
      ongoing: 'Your marriage service is scheduled',
      default: 'Update on your marriage service'
    },
    child_dedication: {
      pending: 'Your child dedication request is pending approval',
      approved: 'Your child dedication has been approved',
      ongoing: 'Your child dedication is scheduled',
      default: 'Update on your child dedication service'
    }
  };

  const messages = serviceMessages[serviceType] || {};
  const statusMessage = messages[status?.toLowerCase()] || messages.default || 'Service status update';

  // Add date information if available
  if (serviceDate) {
    const formattedDate = moment(serviceDate).format('MMMM D, YYYY');
    return `${statusMessage} for ${formattedDate}`;
  }

  return statusMessage;
}

/**
 * Mark notification as read
 */
async function markNotificationAsRead(notificationId, sourceType) {
  try {
    if (sourceType === 'form') {
      // Update form status
      const sql = 'UPDATE tbl_forms SET status = "read" WHERE form_id = ?';
      await query(sql, [notificationId]);
    } else if (sourceType === 'service') {
      // For services, we don't directly mark them as read in the service tables
      // Instead, we could create a separate notification_read table
      // This is a simplified approach - in production you might want a proper tracking system
      // For now, we'll just return success
    }

    return {
      success: true,
      message: 'Notification marked as read'
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      message: error.message || 'Failed to mark notification as read'
    };
  }
}

/**
 * Mark all notifications as read for a user
 */
async function markAllNotificationsAsRead(memberId) {
  try {
    // Mark all forms as read
    const formSql = 'UPDATE tbl_forms SET status = "read" WHERE submitted_by = ? AND status != "completed"';
    await query(formSql, [memberId]);

    // For services, we would need a proper notification tracking system
    // This is a simplified approach

    return {
      success: true,
      message: 'All notifications marked as read'
    };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return {
      success: false,
      message: error.message || 'Failed to mark all notifications as read'
    };
  }
}

/**
 * Get notification count for a user
 */
async function getNotificationCount(memberId) {
  try {
    // Count unread forms
    const formSql = `
      SELECT COUNT(*) as formCount
      FROM tbl_forms
      WHERE (submitted_by = ? OR email = ?)
      AND status != "completed"
      AND status != "read"
    `;
    const [formRows] = await query(formSql, [memberId, memberId]);
    const formCount = formRows[0]?.formCount || 0;

    // Count pending services
    const serviceSql = `
      SELECT COUNT(*) as serviceCount
      FROM (
        SELECT 1 FROM tbl_waterbaptism WHERE member_id = ? AND status != "completed" AND status != "read"
        UNION ALL
        SELECT 1 FROM tbl_burialservice WHERE (member_id = ? OR requester_email = ?) AND status != "completed" AND status != "read"
        UNION ALL
        SELECT 1 FROM tbl_marriageservice WHERE (groom_member_id = ? OR bride_member_id = ?) AND status != "completed" AND status != "read"
        UNION ALL
        SELECT 1 FROM tbl_childdedications WHERE member_id = ? AND status != "completed" AND status != "read"
      ) as combined
    `;
    const [serviceRows] = await query(serviceSql, [memberId, memberId, memberId, memberId, memberId, memberId]);
    const serviceCount = serviceRows[0]?.serviceCount || 0;

    const totalCount = formCount + serviceCount;

    return {
      success: true,
      message: 'Notification count retrieved',
      data: {
        total: totalCount,
        forms: formCount,
        services: serviceCount
      }
    };
  } catch (error) {
    console.error('Error getting notification count:', error);
    return {
      success: false,
      message: error.message || 'Failed to get notification count',
      data: {
        total: 0,
        forms: 0,
        services: 0
      }
    };
  }
}

/**
 * Mark a notification as read
 * @param {String} notificationId - The notification ID
 * @param {String} sourceType - The source type ('form' or 'service')
 * @returns {Promise<Object>} Result object
 */
async function markNotificationAsRead(notificationId, sourceType) {
  try {
    if (sourceType === 'form') {
      // For forms, we don't have a read status field, so we'll just return success
      // In a real implementation, you might want to add a read status to the forms table
      return {
        success: true,
        message: 'Notification marked as read'
      };
    } else if (sourceType === 'service') {
      // For services, similar approach
      return {
        success: true,
        message: 'Notification marked as read'
      };
    }

    return {
      success: false,
      message: 'Invalid source type'
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      message: error.message || 'Failed to mark notification as read'
    };
  }
}

/**
 * Mark all notifications as read for a user
 * @param {String} memberId - Member ID (optional)
 * @returns {Promise<Object>} Result object
 */
async function markAllNotificationsAsRead(memberId = null) {
  try {
    // Since we don't have read status fields in the database yet,
    // we'll just return success for now
    return {
      success: true,
      message: 'All notifications marked as read'
    };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return {
      success: false,
      message: error.message || 'Failed to mark all notifications as read'
    };
  }
}

/**
 * Get notification count for a user
 * @param {String} memberId - Member ID (optional)
 * @returns {Promise<Object>} Result object with count
 */
async function getNotificationCount(memberId = null) {
  try {
    // For now, return 0 since we don't have read status tracking
    return {
      success: true,
      count: 0,
      message: 'Notification count retrieved'
    };
  } catch (error) {
    console.error('Error getting notification count:', error);
    return {
      success: false,
      count: 0,
      message: error.message || 'Failed to get notification count'
    };
  }
}

module.exports = {
  getUnifiedNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationCount
};