const { query } = require('../database/db');
const moment = require('moment');

/**
 * AUDIT TRAIL v2 - Raw Data Only Storage
 * Uses existing tbl_audit_trail table, but stores data as plain text
 * No Buffers, no IDs, only readable text
 */

/**
 * Convert any value to plain text string
 * @param {*} value - Value to convert
 * @returns {String} Plain text string
 */
function toPlainText(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8').trim();
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return String(value);
    }
  }
  
  return String(value).trim();
}

/**
 * CREATE - Log a new audit trail entry (raw text only)
 * @param {Object} auditData - Audit data object
 * @returns {Promise<Object>} Result object
 */
async function createAuditLog(auditData) {
  try {
    const {
      user_email = null,
      action_type,
      entity_type,
      entity_name = null,
      description,
      ip_address = null,
      status = 'success',
      error_message = null
    } = auditData;

    // Validate required fields
    if (!action_type) {
      throw new Error('Action type is required');
    }
    if (!entity_type) {
      throw new Error('Entity type is required');
    }
    if (!description) {
      throw new Error('Description is required');
    }

    const sql = `
      INSERT INTO tbl_audit_trail 
        (user_email, action_type, entity_type, entity_name, description, ip_address, status, error_message, date_created)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    const params = [
      toPlainText(user_email),
      toPlainText(action_type),
      toPlainText(entity_type),
      toPlainText(entity_name),
      toPlainText(description),
      toPlainText(ip_address),
      toPlainText(status),
      toPlainText(error_message),
      formattedDate
    ];

    const [result] = await query(sql, params);

    return {
      success: true,
      message: 'Audit log created successfully',
      data: { audit_id: result.insertId }
    };
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
}

/**
 * READ ALL - Get audit logs with pagination and filters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated audit logs
 */
async function getAllAuditLogs(options = {}) {
  try {
    const search = options.search || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : 25;
    const offset = options.offset !== undefined ? parseInt(options.offset) : 0;
    const page = options.page !== undefined ? parseInt(options.page) : 1;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : 25;
    const action_type = options.action_type || null;
    const entity_type = options.entity_type || null;
    const status = options.status || null;
    const date_from = options.date_from || null;
    const date_to = options.date_to || null;
    const sortBy = options.sortBy || 'Date (Newest)';

    // Build count query
    let countSql = 'SELECT COUNT(*) as total FROM tbl_audit_trail';
    const countParams = [];

    // Build main query
    let sql = 'SELECT * FROM tbl_audit_trail';
    const params = [];

    // WHERE conditions
    const whereConditions = [];

    // Search by description or entity_name
    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      whereConditions.push('(description LIKE ? OR entity_name LIKE ? OR user_email LIKE ?)');
      countParams.push(searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Filter by action_type
    if (action_type && action_type !== 'All Actions') {
      whereConditions.push('action_type = ?');
      countParams.push(action_type);
      params.push(action_type);
    }

    // Filter by entity_type
    if (entity_type && entity_type !== 'All Entities') {
      whereConditions.push('entity_type = ?');
      countParams.push(entity_type);
      params.push(entity_type);
    }

    // Filter by status
    if (status && status !== 'All Status') {
      whereConditions.push('status = ?');
      countParams.push(status);
      params.push(status);
    }

    // Date range filters
    if (date_from) {
      const formattedDateFrom = moment(date_from).format('YYYY-MM-DD 00:00:00');
      whereConditions.push('date_created >= ?');
      countParams.push(formattedDateFrom);
      params.push(formattedDateFrom);
    }

    if (date_to) {
      const formattedDateTo = moment(date_to).format('YYYY-MM-DD 23:59:59');
      whereConditions.push('date_created <= ?');
      countParams.push(formattedDateTo);
      params.push(formattedDateTo);
    }

    // Apply WHERE clause
    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      countSql += whereClause;
      sql += whereClause;
    }

    // Add sorting
    let orderByClause = ' ORDER BY ';
    switch (sortBy) {
      case 'Date (Newest)':
        orderByClause += 'date_created DESC';
        break;
      case 'Date (Oldest)':
        orderByClause += 'date_created ASC';
        break;
      case 'Action (A-Z)':
        orderByClause += 'action_type ASC';
        break;
      case 'Entity (A-Z)':
        orderByClause += 'entity_type ASC';
        break;
      default:
        orderByClause += 'date_created DESC';
    }
    sql += orderByClause;

    // Get total count
    const [countResult] = await query(countSql, countParams);
    const totalCount = countResult[0]?.total || 0;

    // Add pagination
    const finalLimit = Math.min(Math.max(1, limit), 100);
    const finalOffset = Math.max(0, offset);

    if (finalOffset > 0) {
      sql += ` LIMIT ${finalLimit} OFFSET ${finalOffset}`;
    } else {
      sql += ` LIMIT ${finalLimit}`;
    }

    // Execute query
    const [rows] = await query(sql, params);

    // Convert any Buffer values to text
    const parsedRows = rows.map(row => {
      const converted = {};
      for (const [key, value] of Object.entries(row)) {
        converted[key] = toPlainText(value);
      }
      return converted;
    });

    // Calculate pagination metadata
    const currentPage = page;
    const totalPages = Math.ceil(totalCount / finalLimit);

    return {
      success: true,
      message: 'Audit logs retrieved successfully',
      data: parsedRows,
      count: parsedRows.length,
      totalCount: totalCount,
      pagination: {
        page: currentPage,
        pageSize: finalLimit,
        totalPages: totalPages,
        totalCount: totalCount,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      }
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single audit log by ID
 * @param {Number} auditId - Audit ID
 * @returns {Promise<Object>} Audit log entry
 */
async function getAuditLogById(auditId) {
  try {
    if (!auditId) {
      throw new Error('Audit ID is required');
    }

    const sql = 'SELECT * FROM tbl_audit_trail WHERE audit_id = ?';
    const [rows] = await query(sql, [auditId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Audit log not found',
        data: null
      };
    }

    const row = rows[0];
    const converted = {};
    for (const [key, value] of Object.entries(row)) {
      converted[key] = toPlainText(value);
    }

    return {
      success: true,
      message: 'Audit log retrieved successfully',
      data: converted
    };
  } catch (error) {
    console.error('Error fetching audit log:', error);
    throw error;
  }
}

/**
 * DELETE - Delete audit logs older than specified date
 * @param {String} dateBefore - Delete logs before this date (YYYY-MM-DD)
 * @returns {Promise<Object>} Result object
 */
async function deleteAuditLogsBefore(dateBefore) {
  try {
    if (!dateBefore) {
      throw new Error('Date is required');
    }

    const sql = 'DELETE FROM tbl_audit_trail WHERE date_created < ?';
    const [result] = await query(sql, [dateBefore]);

    return {
      success: true,
      message: `Deleted ${result.affectedRows} audit log(s) older than ${dateBefore}`,
      data: { deletedCount: result.affectedRows }
    };
  } catch (error) {
    console.error('Error deleting audit logs:', error);
    throw error;
  }
}

/**
 * GET STATS - Get audit log statistics
 * @returns {Promise<Object>} Statistics object
 */
async function getAuditStats() {
  try {
    // Total count
    const [totalResult] = await query('SELECT COUNT(*) as total FROM tbl_audit_trail');
    const totalCount = totalResult[0]?.total || 0;

    // Count by action type
    const [actionResult] = await query(`
      SELECT action_type, COUNT(*) as count 
      FROM tbl_audit_trail 
      GROUP BY action_type 
      ORDER BY count DESC
      LIMIT 10
    `);

    // Count by entity type
    const [entityResult] = await query(`
      SELECT entity_type, COUNT(*) as count 
      FROM tbl_audit_trail 
      GROUP BY entity_type 
      ORDER BY count DESC
      LIMIT 10
    `);

    // Count by status
    const [statusResult] = await query(`
      SELECT status, COUNT(*) as count 
      FROM tbl_audit_trail 
      GROUP BY status
    `);

    return {
      success: true,
      message: 'Audit stats retrieved successfully',
      data: {
        total_count: totalCount,
        by_action: actionResult,
        by_entity: entityResult,
        by_status: statusResult
      }
    };
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    throw error;
  }
}

module.exports = {
  createAuditLog,
  getAllAuditLogs,
  getAuditLogById,
  deleteAuditLogsBefore,
  getAuditStats
};
