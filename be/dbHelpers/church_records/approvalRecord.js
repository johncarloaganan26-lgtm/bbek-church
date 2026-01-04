const { query } = require('../../database/db');
const moment = require('moment');
const { sendApprovalRequestNotification, sendApprovalStatusUpdate } = require('../emailHelper');
const { archiveBeforeDelete } = require('../archiveHelper');

/**
 * Approval Records helpers for tbl_approval
 * Schema reference:
 * - approval_id (INT, PK, AI)
 * - type (VARCHAR(45), default 'event')
 * - email (VARCHAR(45))
 * - status (VARCHAR(45), default 'pending')
 * - date_created (DATETIME)
 * - request_id (INT)
 */

function normalizeStatus(status) {
  return status ? status.toString().trim().toLowerCase() : null;
}

/**
 * READ ALL - Get approvals with pagination, search, filters
 * @param {Object} options
 */
async function getAllApprovals(options = {}) {
  const search = options.search || options.q || null;
  const status = options.status || null;
  const type = options.type || null;
  const sortBy = options.sortBy || null;

  const limit = options.pageSize !== undefined
    ? parseInt(options.pageSize)
    : (options.limit !== undefined ? parseInt(options.limit) : 10);
  const page = options.page !== undefined ? parseInt(options.page) : 1;
  const offset = options.offset !== undefined
    ? parseInt(options.offset)
    : (page - 1) * limit;

  // Base queries
  let baseSql = `
    FROM tbl_approval a
    LEFT JOIN tbl_events e ON a.type = 'event' AND a.request_id = e.event_id
    LEFT JOIN tbl_ministry m ON a.type = 'ministry' AND a.request_id = m.ministry_id
  `;
  const where = [];
  const params = [];

  // Search across type, email, status, request_id
  if (search && search.trim() !== '') {
    const pattern = `%${search.trim()}%`;
    where.push(`(a.type LIKE ? OR a.email LIKE ? OR a.status LIKE ? OR a.request_id LIKE ?)`);
    params.push(pattern, pattern, pattern, pattern);
  }

  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus && normalizedStatus !== 'all statuses') {
    where.push('LOWER(a.status) = ?');
    params.push(normalizedStatus);
  }

  if (type && type !== 'All Types') {
    where.push('a.type = ?');
    params.push(type);
  }

  if (where.length) {
    baseSql += ` WHERE ${where.join(' AND ')}`;
  }

  // Count total with filters
  const [countRows] = await query(`SELECT COUNT(*) AS total ${baseSql}`, params);
  const totalCount = countRows[0]?.total || 0;

  // Summary stats (overall table, no filters)
  const [summaryRows] = await query(`
    SELECT
      COUNT(*) AS totalApprovals,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingApprovals,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approvedApprovals,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejectedApprovals
    FROM tbl_approval
  `);
  const summaryStats = {
    totalApprovals: summaryRows[0]?.totalApprovals || 0,
    pendingApprovals: summaryRows[0]?.pendingApprovals || 0,
    approvedApprovals: summaryRows[0]?.approvedApprovals || 0,
    rejectedApprovals: summaryRows[0]?.rejectedApprovals || 0
  };

  // Sorting
  let orderBy = 'ORDER BY a.date_created DESC';
  switch (sortBy) {
    case 'Date Created (Oldest)':
      orderBy = 'ORDER BY a.date_created ASC';
      break;
    case 'Status (A-Z)':
      orderBy = 'ORDER BY a.status ASC';
      break;
    case 'Type (A-Z)':
      orderBy = 'ORDER BY a.type ASC';
      break;
    case 'Email (A-Z)':
      orderBy = 'ORDER BY a.email ASC';
      break;
    default:
      orderBy = 'ORDER BY a.date_created DESC';
  }

  // Pagination
  let limitClause = '';
  if (!isNaN(limit) && limit > 0) {
    const safeLimit = Math.max(1, limit);
    const safeOffset = Math.max(0, isNaN(offset) ? 0 : offset);
    limitClause = ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  }

  // Fetch rows
  const [rows] = await query(
    `SELECT 
      a.approval_id, 
      a.type, 
      a.email, 
      a.status, 
      a.date_created, 
      a.request_id,
      COALESCE(e.title, m.ministry_name) AS request_title,
      e.title AS event_title,
      m.ministry_name AS ministry_name
    ${baseSql} ${orderBy} ${limitClause}`,
    params
  );

  const currentPage = page || 1;
  const pageSize = !isNaN(limit) && limit > 0 ? limit : rows.length;
  const totalPages = pageSize ? Math.ceil(totalCount / pageSize) || 1 : 1;

  return {
    success: true,
    message: 'Approvals retrieved successfully',
    data: rows,
    count: rows.length,
    totalCount,
    summaryStats,
    pagination: {
      page: currentPage,
      pageSize,
      totalPages,
      totalCount,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    }
  };
}

/**
 * CREATE - Insert a new approval record
 * @param {Object} approvalData - Approval data object
 * @returns {Promise<Object>} Result object
 */
async function createApproval(approvalData) {
  try {
    const {
      type = 'event',
      email,
      status = 'pending',
      date_created = new Date(),
      request_id
    } = approvalData;

    // Validate required fields
    if (!email || !email.trim()) {
      return {
        success: false,
        message: 'Email is required',
        data: null
      };
    }

    if (!request_id) {
      return {
        success: false,
        message: 'Request ID is required',
        data: null
      };
    }

    // Validate request_id is a number
    const requestIdInt = parseInt(request_id);
    if (isNaN(requestIdInt)) {
      return {
        success: false,
        message: 'Request ID must be a valid integer',
        data: null
      };
    }

    // Validate type
    const validTypes = ['event', 'ministry'];
    const normalizedType = type.toLowerCase().trim();
    if (!validTypes.includes(normalizedType)) {
      return {
        success: false,
        message: `Type must be one of: ${validTypes.join(', ')}`,
        data: null
      };
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected'];
    const normalizedStatus = normalizeStatus(status);
    if (!normalizedStatus || !validStatuses.includes(normalizedStatus)) {
      return {
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        data: null
      };
    }

    // Verify that the request_id exists in the corresponding table
    if (normalizedType === 'event') {
      const [eventRows] = await query(
        `SELECT event_id FROM tbl_events WHERE event_id = ?`,
        [requestIdInt]
      );
      if (eventRows.length === 0) {
        return {
          success: false,
          message: 'Event not found with the provided request_id',
          data: null
        };
      }
    } else if (normalizedType === 'ministry') {
      const [ministryRows] = await query(
        `SELECT ministry_id FROM tbl_ministry WHERE ministry_id = ?`,
        [requestIdInt]
      );
      if (ministryRows.length === 0) {
        return {
          success: false,
          message: 'Ministry not found with the provided request_id',
          data: null
        };
      }
    }

    // Format date_created
    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');

    // Insert approval record
    const sql = `
      INSERT INTO tbl_approval (type, email, status, date_created, request_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      normalizedType,
      email.trim(),
      normalizedStatus,
      formattedDateCreated,
      requestIdInt
    ];

    const [result] = await query(sql, params);

    // Fetch the created approval using the auto-generated ID
    const createdApproval = await getApprovalById(result.insertId);

    // Send email notification (non-blocking - don't fail if email fails)
    try {
      // Get member name from email
      const [memberRows] = await query(
        `SELECT firstname, lastname FROM tbl_members WHERE email = ? LIMIT 1`,
        [email.trim()]
      );
      const memberName = memberRows.length > 0 
        ? `${memberRows[0].firstname} ${memberRows[0].lastname}`
        : null;

      // Get request title (event or ministry name)
      let requestTitle = 'N/A';
      if (normalizedType === 'event') {
        const [eventRows] = await query(
          `SELECT title FROM tbl_events WHERE event_id = ? LIMIT 1`,
          [requestIdInt]
        );
        if (eventRows.length > 0) {
          requestTitle = eventRows[0].title;
        }
      } else if (normalizedType === 'ministry') {
        const [ministryRows] = await query(
          `SELECT ministry_name FROM tbl_ministry WHERE ministry_id = ? LIMIT 1`,
          [requestIdInt]
        );
        if (ministryRows.length > 0) {
          requestTitle = ministryRows[0].ministry_name;
        }
      }

      await sendApprovalRequestNotification({
        email: email.trim(),
        type: normalizedType,
        requestTitle: requestTitle,
        recipientName: memberName,
        approvalId: result.insertId
      });
    } catch (emailError) {
      // Log email error but don't fail the approval creation
      console.error('Error sending approval request notification email:', emailError);
    }

    return {
      success: true,
      message: 'Approval created successfully',
      data: createdApproval.data
    };
  } catch (error) {
    console.error('Error creating approval:', error);
    return {
      success: false,
      message: 'Failed to create approval: ' + error.message,
      data: null
    };
  }
}

/**
 * READ ONE - Get approval by id
 */
async function getApprovalById(id) {
  const approvalId = parseInt(id);
  if (isNaN(approvalId)) {
    return { success: false, message: 'Invalid approval ID', data: null };
  }

  const [rows] = await query(
    `SELECT 
       a.approval_id, 
       a.type, 
       a.email, 
       a.status, 
       a.date_created, 
       a.request_id,
       e.title AS event_title,
       m.ministry_name AS ministry_name,
       COALESCE(e.title, m.ministry_name) AS request_title
     FROM tbl_approval a
     LEFT JOIN tbl_events e ON a.type = 'event' AND a.request_id = e.event_id
     LEFT JOIN tbl_ministry m ON a.type = 'ministry' AND a.request_id = m.ministry_id
     WHERE a.approval_id = ?`,
    [approvalId]
  );

  if (!rows.length) {
    return { success: false, message: 'Approval not found', data: null };
  }

  return {
    success: true,
    message: 'Approval retrieved successfully',
    data: rows[0]
  };
}

/**
 * UPDATE - Update approval status
 */
async function updateApprovalStatus(id, status) {
  const approvalId = parseInt(id);
  if (isNaN(approvalId)) {
    return { success: false, message: 'Invalid approval ID', data: null };
  }

  const normalizedStatus = normalizeStatus(status);
  if (!normalizedStatus || !['pending', 'approved', 'rejected'].includes(normalizedStatus)) {
    return { success: false, message: 'Invalid status value', data: null };
  }

  // Fetch approval to know type/email/request_id for membership update
  const approval = await getApprovalById(approvalId);
  if (!approval.success || !approval.data) {
    return { success: false, message: 'Approval not found', data: null };
  }

  const { type, email, request_id } = approval.data;

  // If approving, push member_id into related table members/joined_members
  if (normalizedStatus === 'approved' && email && request_id) {
    try {
      // Get member_id from tbl_members using email
      const [memberRows] = await query(`SELECT member_id FROM tbl_members WHERE email = ?`, [email]);
      if (!memberRows.length) {
        return { success: false, message: 'Member not found with the provided email', data: null };
      }
      const memberId = memberRows[0].member_id;

      if (type === 'event') {
        const [rows] = await query(`SELECT joined_members FROM tbl_events WHERE event_id = ?`, [request_id]);
        if (!rows.length) {
          return { success: false, message: 'Event not found', data: null };
        }
        let joined = [];
        if (rows[0].joined_members) {
          try {
            const parsed = JSON.parse(rows[0].joined_members);
            joined = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            joined = [];
          }
        }
        if (!joined.includes(memberId)) {
          joined.push(memberId);
          const json = JSON.stringify(joined);
          if (json.length > 2000) {
            return { success: false, message: 'joined_members length exceeded', data: null };
          }
          await query(`UPDATE tbl_events SET joined_members = ? WHERE event_id = ?`, [json, request_id]);
        }
      } else if (type === 'ministry') {
        const [rows] = await query(`SELECT members FROM tbl_ministry WHERE ministry_id = ?`, [request_id]);
        if (!rows.length) {
          return { success: false, message: 'Ministry not found', data: null };
        }
        let members = [];
        if (rows[0].members) {
          try {
            const parsed = JSON.parse(rows[0].members);
            members = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            members = [];
          }
        }
        if (!members.includes(memberId)) {
          members.push(memberId);
          const json = JSON.stringify(members);
          if (json.length > 2000) {
            return { success: false, message: 'members length exceeded', data: null };
          }
          await query(`UPDATE tbl_ministry SET members = ? WHERE ministry_id = ?`, [json, request_id]);
        }
      }
    } catch (err) {
      console.error('Error updating membership on approval:', err);
      return { success: false, message: 'Failed to update related members', data: null };
    }
  }

  const [result] = await query(
    `UPDATE tbl_approval SET status = ? WHERE approval_id = ?`,
    [normalizedStatus, approvalId]
  );

  if (result.affectedRows === 0) {
    return { success: false, message: 'Approval not found', data: null };
  }

  const updated = await getApprovalById(approvalId);

  // Send email notification (non-blocking - don't fail if email fails)
  try {
    // Get member name from email
    const [memberRows] = await query(
      `SELECT firstname, lastname FROM tbl_members WHERE email = ? LIMIT 1`,
      [email]
    );
    const memberName = memberRows.length > 0 
      ? `${memberRows[0].firstname} ${memberRows[0].lastname}`
      : null;

    // Get request title from updated approval data
    const requestTitle = updated.data?.request_title || updated.data?.event_title || updated.data?.ministry_name || 'N/A';

    await sendApprovalStatusUpdate({
      email: email,
      status: normalizedStatus,
      type: type,
      requestTitle: requestTitle,
      recipientName: memberName,
      approvalId: approvalId
    });
  } catch (emailError) {
    // Log email error but don't fail the status update
    console.error('Error sending approval status update email:', emailError);
  }

  return {
    success: true,
    message: 'Approval status updated successfully',
    data: updated.data
  };
}

/**
 * CHECK - Check if member already has approval/joined for a request
 * @param {string} email - Member email
 * @param {string} type - Type of request ('event' or 'ministry')
 * @param {number} request_id - Request ID (event_id or ministry_id)
 * @returns {Promise<Object>} Result object with exists flag
 */
async function checkMemberApprovalExists(email, type, request_id) {
  try {
    if (!email || !email.trim()) {
      return {
        success: false,
        message: 'Email is required',
        data: { exists: false }
      };
    }

    if (!type || !request_id) {
      return {
        success: false,
        message: 'Type and request_id are required',
        data: { exists: false }
      };
    }

    const normalizedType = type.toLowerCase().trim();
    const requestIdInt = parseInt(request_id);
    
    if (isNaN(requestIdInt)) {
      return {
        success: false,
        message: 'Request ID must be a valid integer',
        data: { exists: false }
      };
    }

    // Check if approval record exists
    const [approvalRows] = await query(
      `SELECT approval_id, status 
       FROM tbl_approval 
       WHERE email = ? AND type = ? AND request_id = ?`,
      [email.trim(), normalizedType, requestIdInt]
    );

    // If approval exists, return true
    if (approvalRows.length > 0) {
      return {
        success: true,
        message: 'Member approval found',
        data: {
          exists: true,
          approval_id: approvalRows[0].approval_id,
          status: approvalRows[0].status
        }
      };
    }

    // Also check if member_id is already in the joined_members/members array
    // First, get member_id from email
    const [memberRows] = await query(
      `SELECT member_id FROM tbl_members WHERE email = ?`,
      [email.trim()]
    );

    if (memberRows.length === 0) {
      // Member not found, so no approval exists
      return {
        success: true,
        message: 'Member not found, no approval exists',
        data: { exists: false }
      };
    }

    const memberId = memberRows[0].member_id;

    // Check if member_id is in the event's joined_members or ministry's members
    if (normalizedType === 'event') {
      const [eventRows] = await query(
        `SELECT joined_members FROM tbl_events WHERE event_id = ?`,
        [requestIdInt]
      );

      if (eventRows.length > 0 && eventRows[0].joined_members) {
        try {
          const parsed = JSON.parse(eventRows[0].joined_members);
          const joined = Array.isArray(parsed) ? parsed : [];
          if (joined.includes(memberId)) {
            return {
              success: true,
              message: 'Member already joined the event',
              data: { exists: true, status: 'approved' }
            };
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    } else if (normalizedType === 'ministry') {
      const [ministryRows] = await query(
        `SELECT members FROM tbl_ministry WHERE ministry_id = ?`,
        [requestIdInt]
      );

      if (ministryRows.length > 0 && ministryRows[0].members) {
        try {
          const parsed = JSON.parse(ministryRows[0].members);
          const members = Array.isArray(parsed) ? parsed : [];
          if (members.includes(memberId)) {
            return {
              success: true,
              message: 'Member already joined the ministry',
              data: { exists: true, status: 'approved' }
            };
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }

    // No approval found and member not in joined list
    return {
      success: true,
      message: 'No approval found for member',
      data: { exists: false }
    };
  } catch (error) {
    console.error('Error checking member approval:', error);
    return {
      success: false,
      message: 'Failed to check member approval: ' + error.message,
      data: { exists: false }
    };
  }
}

/**
 * DELETE - Delete approval (archives it first)
 * @param {String|Number} id - Approval ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteApproval(id, archivedBy = null) {
  const approvalId = parseInt(id);
  if (isNaN(approvalId)) {
    return { success: false, message: 'Invalid approval ID', data: null };
  }

  // Get approval data before deleting
  const approvalCheck = await getApprovalById(approvalId);
  if (!approvalCheck.success) {
    return { success: false, message: 'Approval not found', data: null };
  }

  // Archive the record before deleting
  await archiveBeforeDelete(
    'tbl_approval',
    String(approvalId),
    approvalCheck.data,
    archivedBy
  );

  // Delete from original table
  const [result] = await query(
    `DELETE FROM tbl_approval WHERE approval_id = ?`,
    [approvalId]
  );

  if (result.affectedRows === 0) {
    return { success: false, message: 'Approval not found', data: null };
  }

  return {
    success: true,
    message: 'Approval archived and deleted successfully',
    data: { approval_id: approvalId }
  };
}

module.exports = {
  createApproval,
  getAllApprovals,
  getApprovalById,
  updateApprovalStatus,
  deleteApproval,
  checkMemberApprovalExists
};

