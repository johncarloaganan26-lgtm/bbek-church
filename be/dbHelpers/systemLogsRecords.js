const { query } = require('../database/db');
const moment = require('moment');

/**
 * SYSTEM LOGS v2 - Raw Data Only Storage
 * Uses tbl_system_logs table, stores data as plain text
 * No Buffers, no IDs, only readable text
 */
const TABLE_NAME = 'tbl_system_logs';

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
 * CREATE - Log a new system log entry (raw text only)
 * @param {Object} logData - Log data object
 * @returns {Promise<Object>} Result object
 */
async function createSystemLog(logData) {
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
    } = logData;

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
      INSERT INTO ${TABLE_NAME} 
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
      message: 'System log created successfully',
      data: { log_id: result.insertId }
    };
  } catch (error) {
    console.error('Error creating system log:', error);
    throw error;
  }
}

/**
 * READ ALL - Get system logs with pagination and filters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Paginated system logs
 */
async function getAllSystemLogs(options = {}) {
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
    let countSql = `SELECT COUNT(*) as total FROM ${TABLE_NAME}`;
    const countParams = [];

    // Build main query
    let sql = `SELECT * FROM ${TABLE_NAME}`;
    const params = [];

    // Check if requesting all data (no pagination)
    const showAll = options.showAll === true || options.pageSize === -1;

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

    // Add pagination - support "show all" and increase max limit
    let logRows;
    if (showAll) {
      // Fetch all data without limit
      const [rows] = await query(sql, params);
      logRows = rows.map(row => {
        const converted = {};
        for (const [key, value] of Object.entries(row)) {
          // Preserve date_created as Date object for frontend formatting
          if (key === 'date_created' && (value instanceof Date || typeof value === 'string')) {
            converted[key] = value;
          } else {
            converted[key] = toPlainText(value);
          }
        }
        return converted;
      });
      return {
        success: true,
        message: 'All system logs retrieved successfully',
        data: logRows,
        count: logRows.length,
        totalCount: logRows.length,
        pagination: {
          page: 1,
          pageSize: -1, // Keep as -1 to indicate "Show All"
          totalPages: 1,
          totalCount: logRows.length,
          hasNextPage: false,
          hasPreviousPage: false,
          showAll: true
        }
      };
    }

    const finalLimit = Math.min(Math.max(1, pageSize), 1000); // Increased to 1000 max, use pageSize
    const finalOffset = Math.max(0, offset);

    if (finalOffset > 0) {
      sql += ` LIMIT ${finalLimit} OFFSET ${finalOffset}`;
    } else {
      sql += ` LIMIT ${finalLimit}`;
    }

    // Execute query
    const [rows] = await query(sql, params);

    // Convert any Buffer values to text (keep date_created as Date object)
    const parsedRows = rows.map(row => {
      const converted = {};
      for (const [key, value] of Object.entries(row)) {
        // Preserve date_created as Date object for frontend formatting
        if (key === 'date_created' && (value instanceof Date || typeof value === 'string')) {
          converted[key] = value;
        } else {
          converted[key] = toPlainText(value);
        }
      }
      return converted;
    });

    // Calculate pagination metadata
    const currentPage = page;
    const totalPages = Math.ceil(totalCount / finalLimit);

    return {
      success: true,
      message: 'System logs retrieved successfully',
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
    console.error('Error fetching system logs:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single system log by ID
 * @param {Number} logId - Log ID
 * @returns {Promise<Object>} System log entry
 */
async function getSystemLogById(logId) {
  try {
    if (!logId) {
      throw new Error('Log ID is required');
    }

    const sql = `SELECT * FROM ${TABLE_NAME} WHERE log_id = ?`;
    const [rows] = await query(sql, [logId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'System log not found',
        data: null
      };
    }

    const row = rows[0];
    const converted = {};
    for (const [key, value] of Object.entries(row)) {
      // Preserve date_created as Date object for frontend formatting
      if (key === 'date_created' && (value instanceof Date || typeof value === 'string')) {
        converted[key] = value;
      } else {
        converted[key] = toPlainText(value);
      }
    }

    return {
      success: true,
      message: 'System log retrieved successfully',
      data: converted
    };
  } catch (error) {
    console.error('Error fetching system log:', error);
    throw error;
  }
}

/**
 * DELETE - Delete system logs older than specified date
 * @param {String} dateBefore - Delete logs before this date (YYYY-MM-DD)
 * @returns {Promise<Object>} Result object
 */
async function deleteSystemLogsBefore(dateBefore) {
  try {
    if (!dateBefore) {
      throw new Error('Date is required');
    }

    const sql = `DELETE FROM ${TABLE_NAME} WHERE date_created < ?`;
    const [result] = await query(sql, [dateBefore]);

    return {
      success: true,
      message: `Deleted ${result.affectedRows} system log(s) older than ${dateBefore}`,
      data: { deletedCount: result.affectedRows }
    };
  } catch (error) {
    console.error('Error deleting system logs:', error);
    throw error;
  }
}

/**
 * GET STATS - Get system log statistics
 * @returns {Promise<Object>} Statistics object
 */
async function getSystemLogsStats() {
  try {
    // Total count
    const [totalResult] = await query(`SELECT COUNT(*) as total FROM ${TABLE_NAME}`);
    const totalCount = totalResult[0]?.total || 0;

    // Count by action type
    const [actionResult] = await query(`
      SELECT action_type, COUNT(*) as count 
      FROM ${TABLE_NAME} 
      GROUP BY action_type 
      ORDER BY count DESC
      LIMIT 10
    `);

    // Count by entity type
    const [entityResult] = await query(`
      SELECT entity_type, COUNT(*) as count 
      FROM ${TABLE_NAME} 
      GROUP BY entity_type 
      ORDER BY count DESC
      LIMIT 10
    `);

    // Count by status
    const [statusResult] = await query(`
      SELECT status, COUNT(*) as count 
      FROM ${TABLE_NAME} 
      GROUP BY status
    `);

    return {
      success: true,
      message: 'System logs stats retrieved successfully',
      data: {
        total_count: totalCount,
        by_action: actionResult,
        by_entity: entityResult,
        by_status: statusResult
      }
    };
  } catch (error) {
    console.error('Error fetching system logs stats:', error);
    throw error;
  }
}

module.exports = {
  createSystemLog,
  getAllSystemLogs,
  getSystemLogById,
  deleteSystemLogsBefore,
  getSystemLogsStats
};
