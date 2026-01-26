const { query } = require('../database/db');
const moment = require('moment');

/**
 * Safely convert Buffer or any value to plain text string
 * @param {*} value - Value to convert
 * @param {String} defaultValue - Default value if conversion fails
 * @returns {String} Plain text string representation
 */
function safeToString(value, defaultValue = '') {
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
  
  // Handle Buffer - convert to UTF-8 string
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
 * Preserves date fields for proper formatting in frontend
 * @param {Object} row - Database row
 * @returns {Object} Row with all Buffers converted to text, date fields preserved
 */
function convertRowBuffersToText(row) {
  if (!row || typeof row !== 'object') {
    return row;
  }
  
  const converted = {};
  for (const [key, value] of Object.entries(row)) {
    // Preserve date fields as-is for frontend formatting
    if (['archived_at', 'restored_at', 'date_created'].includes(key)) {
      converted[key] = value;
    } else if (key === 'restored') {
      // Keep restored as number (0 or 1) so frontend can properly check it
      // The string "0" is truthy in JavaScript, causing display bugs
      converted[key] = value === 1 || value === true || value === '1' ? 1 : 0;
    } else {
      converted[key] = toPlainText(value);
    }
  }
  return converted;
}

/**
 * Convert an object to plain text values (no Buffers, no IDs)
 * @param {Object} obj - Object to convert
 * @returns {String} Plain text string representation
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
  return JSON.stringify(result, null, 2);
}

/**
 * Archive Records CRUD Operations
 * Based on tbl_archives schema:
 * - archive_id (INT, PK, AI, NN) - Auto-incrementing
 * - original_table (VARCHAR(100), NN) - Name of the original table
 * - original_id (VARCHAR(45), NN) - The ID of the record in the original table
 * - archived_data (JSON, NN) - Complete JSON data of the archived record
 * - archived_by (VARCHAR(45), nullable) - User ID who archived the record
 * - archived_at (DATETIME, NN) - Timestamp when the record was archived
 * - restored (TINYINT(1), NN, default: 0) - Whether the record has been restored
 * - restored_at (DATETIME, nullable) - Timestamp when the record was restored
 * - restored_by (VARCHAR(45), nullable) - User ID who restored the record
 * - restore_notes (TEXT, nullable) - Optional notes about the restoration
 */

/**
 * ARCHIVE - Archive a record from any table
 * Stores archived_data as plain text instead of JSON
 * @param {String} originalTable - Name of the original table
 * @param {String} originalId - ID of the record in the original table
 * @param {Object} recordData - Complete data of the record to archive
 * @param {String} archivedBy - User ID who is archiving the record
 * @returns {Promise<Object>} Result object
 */
async function archiveRecord(originalTable, originalId, recordData, archivedBy = null) {
  try {
    if (!originalTable) {
      throw new Error('Original table name is required');
    }
    if (!originalId) {
      throw new Error('Original ID is required');
    }
    if (!recordData) {
      throw new Error('Record data is required');
    }

    // Convert record data to plain text string (not JSON)
    let archivedDataText = '';
    if (typeof recordData === 'string') {
      archivedDataText = recordData;
    } else if (typeof recordData === 'object') {
      // Convert object to readable plain text
      archivedDataText = convertToPlainTextObject(recordData);
    } else {
      archivedDataText = String(recordData);
    }

    const sql = `
      INSERT INTO tbl_archives 
        (original_table, original_id, archived_data, archived_by, archived_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    const formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    const params = [
      toPlainText(originalTable),
      toPlainText(originalId),
      archivedDataText,
      toPlainText(archivedBy),
      formattedDate
    ];

    const [result] = await query(sql, params);

    // Fetch the created archive record
    const createdArchive = await getArchiveById(result.insertId);

    return {
      success: true,
      message: 'Record archived successfully',
      data: createdArchive.data
    };
  } catch (error) {
    console.error('Error archiving record:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all archived records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, original_table, restored, date_from, date_to, sortBy)
 * @returns {Promise<Object>} Object with paginated archive records and metadata
 */
async function getAllArchives(options = {}) {
  try {
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const original_table = options.original_table || null;
    const restored = options.restored !== undefined ? options.restored : null;
    const date_from = options.date_from || null;
    const date_to = options.date_to || null;
    const sortBy = options.sortBy || null;

    // Build base query for counting total records
    let countSql = 'SELECT COUNT(*) as total FROM tbl_archives a';
    let countParams = [];

    // Build query for fetching records with user names from members table
    // EXCLUDE archived_data JSON field to prevent memory issues - it's only needed when viewing a single record
    let sql = `
      SELECT 
        a.archive_id,
        a.original_table,
        a.original_id,
        a.archived_by,
        a.archived_at,
        a.restored,
        a.restored_at,
        a.restored_by,
        a.restore_notes,
        CONCAT(
          COALESCE(m.firstname, ''),
          IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
          IF(m.lastname IS NOT NULL AND m.lastname != '', CONCAT(' ', m.lastname), '')
        ) as archived_by_name,
        acc.email as archived_by_email,
        m.member_id as archived_by_member_id
      FROM tbl_archives a
      LEFT JOIN tbl_accounts acc ON a.archived_by = acc.acc_id
      LEFT JOIN tbl_members m ON acc.email = m.email
    `;
    const params = [];

    // Check if requesting all data (no pagination)
    const showAll = options.showAll === true || options.pageSize === -1;

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality (search by original_table, original_id only - removed archived_data for performance)
    // Searching JSON fields with LIKE is very inefficient and causes sort memory issues
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(a.original_table LIKE ? OR a.original_id LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern);
      params.push(searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add original_table filter
    if (original_table && original_table !== 'All Tables') {
      whereConditions.push('a.original_table = ?');
      countParams.push(original_table);
      params.push(original_table);
      hasWhere = true;
    }

    // Add restored filter
    if (restored !== null && restored !== undefined) {
      const restoredValue = restored === true || restored === 'true' || restored === 1 || restored === '1' ? 1 : 0;
      whereConditions.push('a.restored = ?');
      countParams.push(restoredValue);
      params.push(restoredValue);
      hasWhere = true;
    }

    // Add date range filters
    if (date_from) {
      const formattedDateFrom = moment(date_from).format('YYYY-MM-DD 00:00:00');
      whereConditions.push('a.archived_at >= ?');
      countParams.push(formattedDateFrom);
      params.push(formattedDateFrom);
      hasWhere = true;
    }

    if (date_to) {
      const formattedDateTo = moment(date_to).format('YYYY-MM-DD 23:59:59');
      whereConditions.push('a.archived_at <= ?');
      countParams.push(formattedDateTo);
      params.push(formattedDateTo);
      hasWhere = true;
    }

    // Apply WHERE clause if any conditions exist
    if (hasWhere) {
      // All conditions already use the 'a.' alias, so we can join them directly
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      countSql += whereClause;
      sql += whereClause;
    }

    // Add sorting - use indexed columns for better performance
    let orderByClause = ' ORDER BY ';
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;
    switch (sortByValue) {
      case 'Date (Newest)':
        orderByClause += 'a.archived_at DESC';
        break;
      case 'Date (Oldest)':
        orderByClause += 'a.archived_at ASC';
        break;
      case 'Table (A-Z)':
        orderByClause += 'a.original_table ASC';
        break;
      default:
        orderByClause += 'a.archived_at DESC'; // Default sorting - use indexed column
    }
    sql += orderByClause;

    // Determine pagination values - support "show all" and increase max limit
    let finalLimit, finalOffset;

    // If showAll, fetch all data without limit
    if (showAll) {
      // Get total count first
      const [countResult] = await query(countSql, countParams);
      const totalCount = countResult[0]?.total || 0;
      
      // Execute query without limit
      const [rows] = await query(sql, params);
      const parsedRows = rows.map(row => convertRowBuffersToText(row));
      
      return {
        success: true,
        message: 'All archived records retrieved successfully',
        data: parsedRows,
        count: parsedRows.length,
        totalCount: parsedRows.length,
        pagination: {
          page: 1,
          pageSize: parsedRows.length,
          totalPages: 1,
          totalCount: parsedRows.length,
          hasNextPage: false,
          hasPreviousPage: false,
          showAll: true
        }
      };
    }

    if (page !== undefined && pageSize !== undefined) {
      const pageNum = parseInt(page) || 1;
      const size = Math.min(parseInt(pageSize) || 100, 1000); // Max 1000 per page
      finalLimit = size;
      finalOffset = (pageNum - 1) * size;
    } else if (limit !== undefined) {
      finalLimit = Math.min(parseInt(limit) || 100, 1000); // Max 1000 per request
      finalOffset = offset !== undefined ? parseInt(offset) : 0;
    } else {
      // Default limit
      finalLimit = 100; // Default to 100 per page
      finalOffset = 0;
    }

    // Get total count (before pagination) - optimize count query
    const [countResult] = await query(countSql, countParams);
    const totalCount = countResult[0]?.total || 0;

    // Add pagination with increased limit
    const limitValue = Math.max(1, Math.min(parseInt(finalLimit) || 100, 1000)); // Enforce max 1000
    const offsetValue = Math.max(0, parseInt(finalOffset) || 0);

    if (offsetValue > 0) {
      sql += ` LIMIT ${limitValue} OFFSET ${offsetValue}`;
    } else {
      sql += ` LIMIT ${limitValue}`;
    }

    // Execute query to get paginated results
    const [rows] = await query(sql, params);

    // Convert any Buffer values to text in all rows
    const parsedRows = rows.map(row => convertRowBuffersToText(row));

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || parsedRows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Archived records retrieved successfully',
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
    console.error('Error fetching archives:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single archive record by ID
 * @param {Number} archiveId - Archive ID
 * @returns {Promise<Object>} Archive record
 */
async function getArchiveById(archiveId) {
  try {
    if (!archiveId) {
      throw new Error('Archive ID is required');
    }

    // Get archive with user name from members table
    const sql = `
      SELECT 
        a.*,
        CONCAT(
          COALESCE(m.firstname, ''),
          IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
          IF(m.lastname IS NOT NULL AND m.lastname != '', CONCAT(' ', m.lastname), '')
        ) as archived_by_name,
        acc.email as archived_by_email,
        m.member_id as archived_by_member_id
      FROM tbl_archives a
      LEFT JOIN tbl_accounts acc ON a.archived_by = acc.acc_id
      LEFT JOIN tbl_members m ON acc.email = m.email
      WHERE a.archive_id = ?
    `;
    const [rows] = await query(sql, [archiveId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Archive record not found',
        data: null
      };
    }

    const row = rows[0];
    
    // Convert any Buffer values to text first
    const convertedRow = convertRowBuffersToText(row);
    
    // archived_data is now stored as plain text, no need to parse JSON
    // If it's a string representation of an object, try to parse it for restoration
    let archivedData = convertedRow.archived_data;
    if (typeof archivedData === 'string') {
      // Try to parse as JSON first, if it fails, keep as plain text
      try {
        const parsed = JSON.parse(archivedData);
        // Check if parsed result is an object (not just a number or string)
        if (typeof parsed === 'object' && parsed !== null) {
          archivedData = parsed;
        }
      } catch (e) {
        // Not valid JSON, keep as plain text
      }
    }
    convertedRow.archived_data = archivedData;

    return {
      success: true,
      message: 'Archive record retrieved successfully',
      data: convertedRow
    };
  } catch (error) {
    console.error('Error fetching archive record:', error);
    throw error;
  }
}

/**
 * RESTORE - Restore an archived record back to its original table
 * @param {Number} archiveId - Archive ID
 * @param {String} restoredBy - User ID who is restoring the record
 * @param {String} restoreNotes - Optional notes about the restoration
 * @returns {Promise<Object>} Result object
 */
async function restoreArchive(archiveId, restoredBy = null, restoreNotes = null) {
  try {
    if (!archiveId) {
      throw new Error('Archive ID is required');
    }

    // Get the archive record
    const archiveResult = await getArchiveById(archiveId);
    if (!archiveResult.success) {
      return {
        success: false,
        message: 'Archive record not found',
        data: null
      };
    }

    const archive = archiveResult.data;

    // Check if already restored (handle both boolean and numeric values from MySQL)
    const isRestored = archive.restored === 1 || archive.restored === true || archive.restored === '1';
    if (isRestored) {
      return {
        success: false,
        message: 'This record has already been restored',
        data: null
      };
    }

    // Get the archived data
    let archivedData = archive.archived_data;
    if (!archivedData) {
      return {
        success: false,
        message: 'Archived data is missing',
        data: null
      };
    }

    // If archived_data is a string (plain text), try to parse it as JSON for restoration
    if (typeof archivedData === 'string') {
      try {
        const parsed = JSON.parse(archivedData);
        // Check if parsed result is an object (not just a number or string)
        if (typeof parsed === 'object' && parsed !== null) {
          archivedData = parsed;
        }
      } catch (e) {
        // Not valid JSON, keep as plain text - cannot restore
        return {
          success: false,
          message: 'Archived data is in plain text format and cannot be restored. Please restore manually.',
          data: null
        };
      }
    }

    // Ensure archivedData is an object for restoration
    if (typeof archivedData !== 'object' || archivedData === null) {
      return {
        success: false,
        message: 'Archived data is not in a valid format for restoration',
        data: null
      };
    }

    // Map of table names to their primary key fields
    const tablePrimaryKeys = {
      'tbl_members': 'member_id',
      'tbl_accounts': 'acc_id',
      'tbl_departments': 'department_id',
      'tbl_ministry': 'ministry_id',
      'tbl_events': 'event_id',
      'tbl_approval': 'approval_id',
      'tbl_tithes': 'tithes_id',
      'tbl_churchleaders': 'leader_id',
      'tbl_departmentofficers': 'officer_id',
      'tbl_waterbaptism': 'baptism_id',
      'tbl_marriageservice': 'marriage_id',
      'tbl_burialservice': 'burial_id',
      'tbl_childdedications': 'child_id',
      'tbl_transactions': 'transaction_id'
    };

    const originalTable = archive.original_table;
    
    // First, verify the table exists
    const { query: dbQuery } = require('../database/db');
    const checkTableSql = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND LOWER(TABLE_NAME) = LOWER(?)
    `;
    const [tableCheck] = await dbQuery(checkTableSql, [originalTable]);
    
    if (!tableCheck || tableCheck.length === 0) {
      // List similar tables to help debug
      const similarTablesSql = `
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME LIKE ?
        ORDER BY TABLE_NAME
      `;
      const tablePattern = originalTable.replace('tbl_', 'tbl_%');
      const [similarTables] = await dbQuery(similarTablesSql, [tablePattern]);
      
      const errorMessage = `Table ${originalTable} does not exist in the database.`;
      const similarTablesList = similarTables.map(t => t.TABLE_NAME).join(', ');
      const fullMessage = similarTablesList 
        ? `${errorMessage} Similar tables found: ${similarTablesList}`
        : `${errorMessage} No similar tables found.`;
      
      console.error(fullMessage);
      return {
        success: false,
        message: fullMessage,
        data: null
      };
    }
    
    // Use the actual table name from INFORMATION_SCHEMA (case-sensitive)
    const actualTableName = tableCheck[0].TABLE_NAME;
    console.log(`Restoring to table: ${actualTableName} (archived as: ${originalTable})`);
    
    const primaryKeyField = tablePrimaryKeys[originalTable] || tablePrimaryKeys[actualTableName];

    if (!primaryKeyField) {
      return {
        success: false,
        message: `Table ${actualTableName} is not supported for restoration. Supported tables: ${Object.keys(tablePrimaryKeys).join(', ')}`,
        data: null
      };
    }

    // Check if record already exists in original table (use actual table name)
    const checkSql = `SELECT * FROM \`${actualTableName}\` WHERE ${primaryKeyField} = ?`;
    const [existingRows] = await query(checkSql, [archive.original_id]);

    if (existingRows.length > 0) {
      return {
        success: false,
        message: 'A record with this ID already exists in the original table',
        data: null
      };
    }

    // Map archived data to current table schema (use actual table name)
    const { mapArchivedDataToCurrentSchema } = require('./columnMapping');
    let mappedData;
    try {
      mappedData = await mapArchivedDataToCurrentSchema(actualTableName, archivedData);
    } catch (mappingError) {
      console.error(`Error mapping archived data for ${actualTableName}:`, mappingError);
      console.error('Archived data keys:', Object.keys(archivedData || {}));
      return {
        success: false,
        message: `Failed to map archived data for ${actualTableName}: ${mappingError.message}`,
        data: null
      };
    }

    if (!mappedData || Object.keys(mappedData).length === 0) {
      console.error(`No valid columns found in archived data for table ${actualTableName}`);
      console.error('Archived data keys:', Object.keys(archivedData || {}));
      return {
        success: false,
        message: `No valid columns found in archived data for table ${actualTableName}. Archived data contains: ${Object.keys(archivedData || {}).join(', ')}`,
        data: null
      };
    }

    // Build INSERT query dynamically based on mapped data (use actual table name)
    const fields = Object.keys(mappedData);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(field => mappedData[field]);

    const insertSql = `
      INSERT INTO \`${actualTableName}\` (${fields.map(f => `\`${f}\``).join(', ')})
      VALUES (${placeholders})
    `;

    // Insert the record back into the original table
    try {
      await query(insertSql, values);
      console.log(`Successfully inserted record into ${originalTable} with ID: ${archive.original_id}`);
    } catch (insertError) {
      console.error(`Error inserting record into ${originalTable}:`, insertError);
      console.error('SQL:', insertSql);
      console.error('Values:', values);
      throw new Error(`Failed to insert record into ${originalTable}: ${insertError.message}`);
    }

    // Update archive record to mark as restored
    const updateSql = `
      UPDATE tbl_archives 
      SET restored = 1, 
          restored_at = ?, 
          restored_by = ?, 
          restore_notes = ?
      WHERE archive_id = ?
    `;

    const formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');
    await query(updateSql, [
      formattedDate,
      restoredBy ? String(restoredBy).trim() : null,
      restoreNotes ? String(restoreNotes).trim() : null,
      archiveId
    ]);

    return {
      success: true,
      message: 'Record restored successfully',
      data: {
        archive_id: archiveId,
        original_table: actualTableName,
        original_id: archive.original_id
      }
    };
  } catch (error) {
    console.error('Error restoring archive:', error);
    console.error('Archive ID:', archiveId);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    throw error;
  }
}

/**
 * Get archives within a specific date range
 * @param {String} dateFrom - Start date (YYYY-MM-DD)
 * @param {String} dateTo - End date (YYYY-MM-DD)
 * @param {Object} options - Optional query parameters (limit, offset, page, pageSize, original_table, restored)
 * @returns {Promise<Object>} Object with paginated archive records and metadata
 */
async function getArchivesByDateRange(dateFrom, dateTo, options = {}) {
  try {
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const original_table = options.original_table || null;
    const restored = options.restored !== undefined ? options.restored : null;
    const sortBy = options.sortBy || null;

    // Format dates
    const formattedDateFrom = moment(dateFrom).format('YYYY-MM-DD 00:00:00');
    const formattedDateTo = moment(dateTo).format('YYYY-MM-DD 23:59:59');

    // Build base query for counting total records
    let countSql = 'SELECT COUNT(*) as total FROM tbl_archives a';
    let countParams = [formattedDateFrom, formattedDateTo];

    // Build query for fetching records
    let sql = `
      SELECT 
        a.archive_id,
        a.original_table,
        a.original_id,
        a.archived_by,
        a.archived_at,
        a.restored,
        a.restored_at,
        a.restored_by,
        a.restore_notes,
        acc.email as archived_by_email
      FROM tbl_archives a
      LEFT JOIN tbl_accounts acc ON a.archived_by = acc.acc_id
      WHERE a.archived_at >= ? AND a.archived_at <= ?
    `;
    const params = [formattedDateFrom, formattedDateTo];

    // Add original_table filter
    if (original_table && original_table !== 'All Tables') {
      sql += ' AND a.original_table = ?';
      countSql += ' AND a.original_table = ?';
      countParams.push(original_table);
      params.push(original_table);
    }

    // Add restored filter
    if (restored !== null && restored !== undefined) {
      const restoredValue = restored === true || restored === 'true' || restored === 1 || restored === '1' ? 1 : 0;
      sql += ' AND a.restored = ?';
      countSql += ' AND a.restored = ?';
      countParams.push(restoredValue);
      params.push(restoredValue);
    }

    // Add sorting
    let orderByClause = ' ORDER BY ';
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;
    switch (sortByValue) {
      case 'Date (Newest)':
        orderByClause += 'a.archived_at DESC';
        break;
      case 'Date (Oldest)':
        orderByClause += 'a.archived_at ASC';
        break;
      case 'Table (A-Z)':
        orderByClause += 'a.original_table ASC';
        break;
      default:
        orderByClause += 'a.archived_at DESC';
    }
    sql += orderByClause;

    // Determine pagination values
    let finalLimit, finalOffset;

    if (page !== undefined && pageSize !== undefined) {
      const pageNum = parseInt(page) || 1;
      const size = Math.min(parseInt(pageSize) || 25, 50);
      finalLimit = size;
      finalOffset = (pageNum - 1) * size;
    } else if (limit !== undefined) {
      finalLimit = Math.min(parseInt(limit) || 25, 50);
      finalOffset = offset !== undefined ? parseInt(offset) : 0;
    } else {
      finalLimit = 25;
      finalOffset = 0;
    }

    // Get total count
    const [countResult] = await query(countSql, countParams);
    const totalCount = countResult[0]?.total || 0;

    // Add pagination
    const limitValue = Math.max(1, Math.min(parseInt(finalLimit) || 25, 50));
    const offsetValue = Math.max(0, parseInt(finalOffset) || 0);

    if (offsetValue > 0) {
      sql += ` LIMIT ${limitValue} OFFSET ${offsetValue}`;
    } else {
      sql += ` LIMIT ${limitValue}`;
    }

    // Execute query
    const [rows] = await query(sql, params);

    // Convert Buffer values to text
    const parsedRows = rows.map(row => convertRowBuffersToText(row));

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || parsedRows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Archives retrieved successfully',
      data: parsedRows,
      count: parsedRows.length,
      totalCount: totalCount,
      dateRange: {
        from: formattedDateFrom,
        to: formattedDateTo
      },
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
    console.error('Error fetching archives by date range:', error);
    throw error;
  }
}

/**
 * Get summary statistics for archives
 * @returns {Promise<Object>} Summary statistics
 */
async function getArchiveSummary() {
  try {
    // Get total count
    const [totalResult] = await query('SELECT COUNT(*) as total FROM tbl_archives');
    const totalCount = totalResult[0]?.total || 0;

    // Get count by table - add LIMIT to prevent sort memory issues
    const [tableResult] = await query(`
      SELECT original_table, COUNT(*) as count 
      FROM tbl_archives 
      WHERE restored = 0
      GROUP BY original_table 
      ORDER BY count DESC
      LIMIT 20
    `);

    // Get restored count
    const [restoredResult] = await query(`
      SELECT COUNT(*) as count 
      FROM tbl_archives 
      WHERE restored = 1
    `);
    const restoredCount = restoredResult[0]?.count || 0;

    // Get not restored count
    const notRestoredCount = totalCount - restoredCount;

    return {
      success: true,
      message: 'Archive summary retrieved successfully',
      data: {
        total_count: totalCount,
        restored_count: restoredCount,
        not_restored_count: notRestoredCount,
        by_table: tableResult
      }
    };
  } catch (error) {
    console.error('Error fetching archive summary:', error);
    throw error;
  }
}

/**
 * DELETE PERMANENTLY - Permanently delete an archive record
 * @param {Number} archiveId - Archive ID to delete
 * @returns {Promise<Object>} Result object
 */
async function deleteArchivePermanently(archiveId) {
  try {
    if (!archiveId) {
      throw new Error('Archive ID is required');
    }

    // First, get the archive record to return info about what was deleted
    const archiveResult = await getArchiveById(archiveId);
    if (!archiveResult.success) {
      return {
        success: false,
        message: 'Archive record not found',
        data: null
      };
    }

    const archive = archiveResult.data;

    // Permanently delete the archive record
    const sql = 'DELETE FROM tbl_archives WHERE archive_id = ?';
    const [result] = await query(sql, [archiveId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Archive record not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Archive record permanently deleted',
      data: {
        archive_id: archiveId,
        original_table: archive.original_table,
        original_id: archive.original_id
      }
    };
  } catch (error) {
    console.error('Error permanently deleting archive:', error);
    throw error;
  }
}

/**
 * BULK DELETE PERMANENTLY - Permanently delete multiple archive records in a single operation
 * @param {Array<Number>} archiveIds - Array of Archive IDs to delete
 * @returns {Promise<Object>} Result object with success/failure counts
 */
async function bulkDeleteArchivesPermanently(archiveIds) {
  try {
    if (!Array.isArray(archiveIds) || archiveIds.length === 0) {
      throw new Error('Archive IDs array is required and cannot be empty');
    }

    // Validate all IDs are numbers
    const validIds = archiveIds.filter(id => typeof id === 'number' && id > 0);
    if (validIds.length === 0) {
      throw new Error('No valid archive IDs provided');
    }

    // Get archive records info before deletion for audit trail
    const placeholders = validIds.map(() => '?').join(',');
    const selectSql = `SELECT archive_id, original_table, original_id FROM tbl_archives WHERE archive_id IN (${placeholders})`;
    const [archivesToDelete] = await query(selectSql, validIds);

    // Perform bulk delete
    const deleteSql = `DELETE FROM tbl_archives WHERE archive_id IN (${placeholders})`;
    const [deleteResult] = await query(deleteSql, validIds);

    const deletedCount = deleteResult.affectedRows || 0;
    const failedCount = validIds.length - deletedCount;

    return {
      success: true,
      message: `Bulk delete completed: ${deletedCount} deleted, ${failedCount} failed`,
      data: {
        requested: validIds.length,
        deleted: deletedCount,
        failed: failedCount,
        deleted_archives: archivesToDelete
      }
    };
  } catch (error) {
    console.error('Error bulk deleting archives:', error);
    throw error;
  }
}

module.exports = {
  archiveRecord,
  getAllArchives,
  getArchiveById,
  restoreArchive,
  getArchiveSummary,
  getArchivesByDateRange,
  deleteArchivePermanently,
  bulkDeleteArchivesPermanently
};

