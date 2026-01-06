const { query } = require('../database/db');
const moment = require('moment');

/**
 * Safely convert Buffer or any value to plain text string
 * @param {*} value - Value to convert
 * @param {String} defaultValue - Default value if conversion fails
 * @returns {String} Plain text string representation
 */
function safeToString(value, defaultValue = null) {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return defaultValue;
    }
  }
  
  return String(value);
}

/**
 * Convert any value to plain text (handles Buffer conversion)
 * @param {*} value - Value to convert
 * @param {String} defaultValue - Default value if conversion fails
 * @returns {String} Plain text string
 */
function toPlainText(value, defaultValue = '') {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  // Handle Buffer - convert to UTF-8 string (like tithesRecords.js)
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8').trim();
  }
  
  // Handle objects - convert to readable text
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return defaultValue;
    }
  }
  
  // Handle numbers - convert to string
  if (typeof value === 'number') {
    return String(value);
  }
  
  // Handle booleans - convert to string
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  // Handle strings - trim and return
  return String(value).trim();
}

/**
 * Convert all Buffer fields in a row to text (for reading data)
 * @param {Object} row - Database row
 * @returns {Object} Row with all Buffers converted to text
 */
function convertRowBuffersToText(row) {
  if (!row || typeof row !== 'object') {
    return row;
  }
  
  const converted = {};
  for (const [key, value] of Object.entries(row)) {
    converted[key] = toPlainText(value);
  }
  return converted;
}

/**
 * Convert an object to plain text values (no Buffers, no IDs)
 * @param {Object} obj - Object to convert
 * @returns {Object} Object with plain text values
 */
function convertToPlainTextObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return toPlainText(obj);
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive fields
    if (['password', 'token', 'secret', 'key', 'acc_password'].includes(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = toPlainText(value);
    }
  }
  return result;
}

/**
 * Audit Trail Records CRUD Operations
 * Based on tbl_audit_trail schema:
 * - audit_id (INT, PK, AI, NN) - Auto-incrementing
 * - user_id (VARCHAR(45), NN) - User/Account ID who performed the action
 * - user_email (VARCHAR(255), nullable) - User email
 * - user_name (VARCHAR(255), nullable) - User full name
 * - user_position (VARCHAR(100), nullable) - User position/role
 * - action_type (VARCHAR(50), NN) - Type of action (CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, etc.)
 * - entity_type (VARCHAR(100), NN) - Type of entity affected (member, transaction, event, etc.)
 * - entity_id (VARCHAR(45), nullable) - ID of the affected entity
 * - description (TEXT, nullable) - The API route/endpoint that was accessed (e.g., GET /api/church-records/members/createMember)
 * - ip_address (VARCHAR(45), nullable) - IP address of the user
 * - user_agent (TEXT, nullable) - User agent/browser information
 * - old_values (JSON, nullable) - Previous values before update (for UPDATE actions)
 * - new_values (JSON, nullable) - New values after action (for CREATE/UPDATE actions)
 * - status (VARCHAR(45), NN, default: 'success') - Action status (success, failed, error)
 * - error_message (TEXT, nullable) - Error message if action failed
 * - date_created (DATETIME, NN) - Timestamp of the action
 */

/**
 * CREATE - Insert a new audit trail record
 * All data is stored as plain text (no Buffers, no IDs)
 * @param {Object} auditData - Audit trail data object
 * @returns {Promise<Object>} Result object
 */
async function createAuditLog(auditData) {
  try {
    const {
      user_id,
      user_email = null,
      user_name = null,
      user_position = null,
      action_type,
      entity_type,
      entity_id = null,
      description = null,
      ip_address = null,
      user_agent = null,
      old_values = null,
      new_values = null,
      status = 'success',
      error_message = null,
      date_created = new Date()
    } = auditData;

    // Validate required fields
    if (!user_id) {
      throw new Error('Missing required field: user_id');
    }
    if (!action_type) {
      throw new Error('Missing required field: action_type');
    }
    if (!entity_type) {
      throw new Error('Missing required field: entity_type');
    }

    // Format date_created
    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');

    // Convert all values to plain text (no Buffers, no IDs)
    const plainUserId = toPlainText(user_id);
    const plainUserEmail = toPlainText(user_email);
    const plainUserName = toPlainText(user_name);
    const plainUserPosition = toPlainText(user_position);
    const plainActionType = toPlainText(action_type).toUpperCase();
    const plainEntityType = toPlainText(entity_type);
    const plainEntityId = toPlainText(entity_id); // This now stores description text, not ID
    const plainDescription = toPlainText(description);
    const plainIpAddress = toPlainText(ip_address);
    const plainUserAgent = toPlainText(user_agent);
    const plainStatus = toPlainText(status).toLowerCase();
    const plainErrorMessage = toPlainText(error_message);

    // Convert old_values and new_values to plain text JSON
    let oldValuesJson = null;
    let newValuesJson = null;

    if (old_values !== null && old_values !== undefined) {
      const plainOldValues = convertToPlainTextObject(old_values);
      oldValuesJson = JSON.stringify(plainOldValues, null, 2);
    }

    if (new_values !== null && new_values !== undefined) {
      const plainNewValues = convertToPlainTextObject(new_values);
      newValuesJson = JSON.stringify(plainNewValues, null, 2);
    }

    const sql = `
      INSERT INTO tbl_audit_trail 
        (user_id, user_email, user_name, user_position, action_type, entity_type, entity_id, 
         description, ip_address, user_agent, old_values, new_values, status, error_message, date_created)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      plainUserId,
      plainUserEmail,
      plainUserName,
      plainUserPosition,
      plainActionType,
      plainEntityType,
      plainEntityId,
      plainDescription,
      plainIpAddress,
      plainUserAgent,
      oldValuesJson,
      newValuesJson,
      plainStatus,
      plainErrorMessage,
      formattedDateCreated
    ];

    const [result] = await query(sql, params);

    // Fetch the created audit log
    const createdAuditLog = await getAuditLogById(result.insertId);

    return {
      success: true,
      message: 'Audit log created successfully',
      data: createdAuditLog.data
    };
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all audit trail records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, user_id, action_type, entity_type, status, date_from, date_to, sortBy)
 * @returns {Promise<Object>} Object with paginated audit trail records and metadata
 */
async function getAllAuditLogs(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const user_id = options.user_id || null;
    const action_type = options.action_type || null;
    const entity_type = options.entity_type || null;
    const status = options.status || null;
    const date_from = options.date_from || null;
    const date_to = options.date_to || null;
    const sortBy = options.sortBy || null;

    // Build base query for counting total records
    let countSql = 'SELECT COUNT(*) as total FROM tbl_audit_trail';
    let countParams = [];

    // Build query for fetching records
    let sql = 'SELECT * FROM tbl_audit_trail';
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality (search by user_name, user_email, description, entity_type)
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(user_name LIKE ? OR user_email LIKE ? OR description LIKE ? OR entity_type LIKE ? OR entity_id LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add user_id filter
    if (user_id) {
      whereConditions.push('user_id = ?');
      countParams.push(user_id);
      params.push(user_id);
      hasWhere = true;
    }

    // Add action_type filter
    if (action_type && action_type !== 'All Actions') {
      whereConditions.push('action_type = ?');
      countParams.push(action_type.toUpperCase());
      params.push(action_type.toUpperCase());
      hasWhere = true;
    }

    // Add entity_type filter
    if (entity_type && entity_type !== 'All Entities') {
      whereConditions.push('entity_type = ?');
      countParams.push(entity_type);
      params.push(entity_type);
      hasWhere = true;
    }

    // Add status filter
    if (status && status !== 'All Statuses') {
      whereConditions.push('status = ?');
      countParams.push(status.toLowerCase());
      params.push(status.toLowerCase());
      hasWhere = true;
    }

    // Add date range filters
    // IMPORTANT: Always enforce a date range to prevent "Out of sort memory" errors
    // MySQL sorts ALL matching records before applying LIMIT, so without a date filter,
    // it tries to sort potentially millions of records, causing memory issues.
    // Default to last 30 days (1 month) if no date range is provided.
    // Users can specify date_from/date_to to see older records.
    if (date_from) {
      const formattedDateFrom = moment(date_from).format('YYYY-MM-DD 00:00:00');
      whereConditions.push('date_created >= ?');
      countParams.push(formattedDateFrom);
      params.push(formattedDateFrom);
      hasWhere = true;
    } else {
      // Default to last 30 days (1 month) if no start date provided
      const defaultDateFrom = moment().subtract(30, 'days').format('YYYY-MM-DD 00:00:00');
      whereConditions.push('date_created >= ?');
      countParams.push(defaultDateFrom);
      params.push(defaultDateFrom);
      hasWhere = true;
    }

    if (date_to) {
      const formattedDateTo = moment(date_to).format('YYYY-MM-DD 23:59:59');
      whereConditions.push('date_created <= ?');
      countParams.push(formattedDateTo);
      params.push(formattedDateTo);
      hasWhere = true;
    } else {
      // Default to today if no end date provided
      const defaultDateTo = moment().format('YYYY-MM-DD 23:59:59');
      whereConditions.push('date_created <= ?');
      countParams.push(defaultDateTo);
      params.push(defaultDateTo);
      hasWhere = true;
    }

    // Apply WHERE clause if any conditions exist
    if (hasWhere) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      countSql += whereClause;
      sql += whereClause;
    }

    // Add sorting - use composite sort with audit_id for better performance
    // This helps MySQL use indexes more efficiently
    let orderByClause = ' ORDER BY ';
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;
    switch (sortByValue) {
      case 'Date (Newest)':
        // Use composite sort: date_created DESC, audit_id DESC for better index usage
        orderByClause += 'date_created DESC, audit_id DESC';
        break;
      case 'Date (Oldest)':
        orderByClause += 'date_created ASC, audit_id ASC';
        break;
      case 'User Name (A-Z)':
        // For text sorting, add audit_id as secondary sort for consistency
        orderByClause += 'user_name ASC, audit_id DESC';
        break;
      case 'Action Type (A-Z)':
        orderByClause += 'action_type ASC, audit_id DESC';
        break;
      case 'Entity Type (A-Z)':
        orderByClause += 'entity_type ASC, audit_id DESC';
        break;
      default:
        // Default sorting with composite key for better performance
        orderByClause += 'date_created DESC, audit_id DESC';
    }
    sql += orderByClause;

    // Determine pagination values
    // Always enforce pagination to prevent "Out of sort memory" errors
    let finalLimit, finalOffset;

    if (page !== undefined && pageSize !== undefined) {
      const pageNum = parseInt(page) || 1;
      const size = Math.min(parseInt(pageSize) || 10, 500); // Reduced max to 500 per page
      finalLimit = size;
      finalOffset = (pageNum - 1) * size;
    } else if (limit !== undefined) {
      finalLimit = Math.min(parseInt(limit) || 10, 500); // Reduced max to 500 records
      finalOffset = offset !== undefined ? parseInt(offset) : 0;
    } else {
      // Default pagination if none provided - prevents sorting entire table
      finalLimit = 50; // Reduced default to 50 records
      finalOffset = 0;
    }

    // Get total count (before pagination) - this is fast as it doesn't sort
    const [countResult] = await query(countSql, countParams);
    const totalCount = countResult[0]?.total || 0;

    // Always add pagination BEFORE executing query
    // Use smaller limits to prevent MySQL from sorting too many records
    const limitValue = Math.max(1, Math.min(parseInt(finalLimit) || 50, 500)); // Max 500, min 1
    const offsetValue = Math.max(0, parseInt(finalOffset) || 0);

    // Apply LIMIT immediately after ORDER BY to minimize sorting
    if (offsetValue > 0) {
      sql += ` LIMIT ${limitValue} OFFSET ${offsetValue}`;
    } else {
      sql += ` LIMIT ${limitValue}`;
    }

    // Execute query to get paginated results
    const [rows] = await query(sql, params);

    // Parse JSON fields and convert any Buffer values to text
    const parsedRows = rows.map(row => {
      // Convert any Buffer values to text first
      const convertedRow = convertRowBuffersToText(row);
      
      try {
        if (convertedRow.old_values && typeof convertedRow.old_values === 'string') {
          convertedRow.old_values = JSON.parse(convertedRow.old_values);
        }
        if (convertedRow.new_values && typeof convertedRow.new_values === 'string') {
          convertedRow.new_values = JSON.parse(convertedRow.new_values);
        }
      } catch (e) {
        console.warn('Error parsing JSON values for audit_id:', row.audit_id);
      }
      return convertedRow;
    });

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || parsedRows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Audit logs retrieved successfully',
      data: parsedRows,
      count: parsedRows.length,
      totalCount: totalCount,
      pagination: {
        page: currentPage,
        pageSize: currentPageSize,
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
 * @param {Number} auditId - Audit log ID
 * @returns {Promise<Object>} Audit log record
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
    
    // Convert any Buffer values to text first
    const convertedRow = convertRowBuffersToText(row);
    
    // Parse JSON fields
    try {
      if (convertedRow.old_values && typeof convertedRow.old_values === 'string') {
        convertedRow.old_values = JSON.parse(convertedRow.old_values);
      }
      if (convertedRow.new_values && typeof convertedRow.new_values === 'string') {
        convertedRow.new_values = JSON.parse(convertedRow.new_values);
      }
    } catch (e) {
      console.warn('Error parsing JSON values for audit_id:', auditId);
    }

    return {
      success: true,
      message: 'Audit log retrieved successfully',
      data: convertedRow
    };
  } catch (error) {
    console.error('Error fetching audit log:', error);
    throw error;
  }
}

/**
 * Get summary statistics for audit trail
 * @returns {Promise<Object>} Summary statistics
 */
async function getAuditTrailSummary() {
  try {
    // Get total count
    const [totalResult] = await query('SELECT COUNT(*) as total FROM tbl_audit_trail');
    const totalCount = totalResult[0]?.total || 0;

    // Get count by action type
    const [actionTypeResult] = await query(`
      SELECT action_type, COUNT(*) as count 
      FROM tbl_audit_trail 
      GROUP BY action_type 
      ORDER BY count DESC
    `);

    // Get count by entity type
    const [entityTypeResult] = await query(`
      SELECT entity_type, COUNT(*) as count 
      FROM tbl_audit_trail 
      GROUP BY entity_type 
      ORDER BY count DESC
    `);

    // Get count by status
    const [statusResult] = await query(`
      SELECT status, COUNT(*) as count 
      FROM tbl_audit_trail 
      GROUP BY status 
      ORDER BY count DESC
    `);

    // Get recent activity (last 24 hours)
    const [recentResult] = await query(`
      SELECT COUNT(*) as count 
      FROM tbl_audit_trail 
      WHERE date_created >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    const recentActivity = recentResult[0]?.count || 0;

    return {
      success: true,
      message: 'Audit trail summary retrieved successfully',
      data: {
        total_count: totalCount,
        recent_activity_24h: recentActivity,
        by_action_type: actionTypeResult,
        by_entity_type: entityTypeResult,
        by_status: statusResult
      }
    };
  } catch (error) {
    console.error('Error fetching audit trail summary:', error);
    throw error;
  }
}

module.exports = {
  createAuditLog,
  getAllAuditLogs,
  getAuditLogById,
  getAuditTrailSummary
};

