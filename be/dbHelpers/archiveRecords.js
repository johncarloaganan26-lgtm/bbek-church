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
 * BULK ARCHIVE - Archive multiple records in a single operation
 * @param {String} originalTable - Original table name
 * @param {Array<Object>} recordsToArchive - Array of { id, data } objects
 * @param {String} archivedBy - User ID who archived the records
 * @returns {Promise<Object>} Result object
 */
async function bulkArchiveRecords(originalTable, recordsToArchive, archivedBy = null) {
  try {
    if (!originalTable) {
      throw new Error('Original table name is required');
    }
    if (!Array.isArray(recordsToArchive) || recordsToArchive.length === 0) {
      return { success: true, message: 'No records to archive', data: [] };
    }

    const formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');
    const placeholders = recordsToArchive.map(() => '(?, ?, ?, ?, ?)').join(',');
    const sql = `
      INSERT INTO tbl_archives 
        (original_table, original_id, archived_data, archived_by, archived_at)
      VALUES ${placeholders}
    `;

    const params = [];
    recordsToArchive.forEach(item => {
      let archivedDataText = '';
      if (typeof item.data === 'string') {
        archivedDataText = item.data;
      } else if (typeof item.data === 'object') {
        archivedDataText = convertToPlainTextObject(item.data);
      } else {
        archivedDataText = String(item.data);
      }

      params.push(
        toPlainText(originalTable),
        toPlainText(item.id),
        archivedDataText,
        toPlainText(archivedBy),
        formattedDate
      );
    });

    await query(sql, params);

    return {
      success: true,
      message: `Successfully archived ${recordsToArchive.length} records`,
      count: recordsToArchive.length
    };
  } catch (error) {
    console.error('Error bulk archiving records:', error);
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
 * Helper function to clean data before insertion
 * Converts empty strings to null for MySQL compatibility
 * Handles JSON columns and date columns properly
 */
function cleanDataForInsertion(data, tableName) {
  const cleanedData = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      cleanedData[key] = null;
      continue;
    }

    // Handle date columns - convert empty strings to null
    if (['baptism_date', 'birth_date', 'marriage_date', 'death_date', 'service_date',
      'dedication_date', 'wedding_anniversary', 'anniversary', 'start_date', 'end_date',
      'scheduled_date', 'approved_at', 'completed_at', 'date_completed'].includes(key)) {
      if (value === '' || value === null || value === undefined) {
        cleanedData[key] = null;
      } else {
        cleanedData[key] = value;
      }
      continue;
    }

    // Handle JSON columns (children, family_members, etc.)
    if (['children', 'family_members', 'guardian_info', 'family_fields',
      'requester_info', 'additional_info', 'support_info'].includes(key)) {
      if (value === '' || value === null || value === undefined) {
        cleanedData[key] = null;
      } else if (typeof value === 'object') {
        // Convert object to JSON string
        try {
          cleanedData[key] = JSON.stringify(value);
        } catch (e) {
          cleanedData[key] = null;
        }
      } else if (typeof value === 'string') {
        // Validate JSON string
        const trimmedValue = value.trim();
        if (trimmedValue === '' || trimmedValue === '{}' || trimmedValue === '[]') {
          cleanedData[key] = null;
        } else {
          try {
            JSON.parse(trimmedValue);
            cleanedData[key] = trimmedValue;
          } catch (e) {
            cleanedData[key] = null;
          }
        }
      } else {
        cleanedData[key] = null;
      }
      continue;
    }

    // For other columns, convert empty strings to null
    if (value === '' || (typeof value === 'string' && value.trim() === '')) {
      cleanedData[key] = null;
    } else {
      cleanedData[key] = value;
    }
  }

  return cleanedData;
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

    if (!archiveResult.success || !archiveResult.data) {
      throw new Error('Archive record not found');
    }

    const archive = archiveResult.data;

    // Check if already restored
    if (archive.restored === 1 || archive.restored === true || archive.restored === '1') {
      return {
        success: false,
        message: 'Archive has already been restored',
        data: null
      };
    }

    // Get archived data - archived_data is already converted from Buffer to text
    let archivedData = archive.archived_data;

    // Parse archived data if it's a string
    if (typeof archivedData === 'string') {
      try {
        archivedData = JSON.parse(archivedData);
      } catch (e) {
        // If parsing fails, it might be plain text - but we need an object for restoration
        throw new Error('Invalid archive data format');
      }
    }

    if (!archivedData || typeof archivedData !== 'object') {
      throw new Error('Invalid or missing archived data');
    }

    // Get the actual table name from the archive
    const actualTableName = archive.original_table;

    // Map archived data to current table schema
    const { mapArchivedDataToCurrentSchema } = require('./columnMapping');
    let mappedData;
    try {
      mappedData = await mapArchivedDataToCurrentSchema(actualTableName, archivedData);
    } catch (mappingError) {
      console.error(`Error mapping archived data for ${actualTableName}:`, mappingError);
      console.error('Archived data keys:', Object.keys(archivedData || {}));
      throw new Error(`Failed to map archived data: ${mappingError.message}`);
    }

    // Clean data before insertion
    const cleanedData = cleanDataForInsertion(mappedData, actualTableName);

    // Build and execute insert
    const fields = Object.keys(cleanedData);
    const placeholders = fields.map(() => '?').join(',');
    const values = fields.map(field => cleanedData[field]);

    const insertSql = `
      INSERT IGNORE INTO \`${actualTableName}\` (${fields.map(f => `\`${f}\``).join(', ')})
      VALUES (${placeholders})
    `;

    const [insertResult] = await query(insertSql, values);
    if (insertResult.affectedRows === 0) {
      console.log(`ℹ️ Record already exists in ${actualTableName} or was not inserted, marking archive as restored.`);
    } else {
      console.log(`✅ Successfully restored record into ${actualTableName} with ID: ${insertResult.insertId}`);
    }

    // Update archive record to mark as restored
    const updateSql = `
      UPDATE tbl_archives 
      SET restored = 1, restored_at = ?, restored_by = ?, restore_notes = ?
      WHERE archive_id = ?
    `;

    const formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');
    await query(updateSql, [formattedDate, restoredBy, restoreNotes, archiveId]);

    return {
      success: true,
      message: 'Archive restored successfully',
      data: {
        archive_id: archiveId,
        original_table: actualTableName,
        restored_at: formattedDate,
        restored_by: restoredBy
      }
    };
  } catch (error) {
    console.error('Error restoring archive:', error);
    throw error;
  }
}

/**
 * GET SUMMARY - Get archive summary statistics
 * @returns {Promise<Object>} Summary object
 */
async function getArchiveSummary() {
  try {
    // Get total count
    const [totalResult] = await query('SELECT COUNT(*) as total FROM tbl_archives');
    const totalArchives = totalResult[0]?.total || 0;

    // Get restored count
    const [restoredResult] = await query('SELECT COUNT(*) as restored FROM tbl_archives WHERE restored = 1');
    const restoredArchives = restoredResult[0]?.restored || 0;

    // Get archived count
    const [archivedResult] = await query('SELECT COUNT(*) as archived FROM tbl_archives WHERE restored = 0');
    const activeArchives = archivedResult[0]?.archived || 0;

    // Get count by table
    const [tableResult] = await query(`
      SELECT original_table, COUNT(*) as count 
      FROM tbl_archives 
      GROUP BY original_table
    `);

    return {
      success: true,
      message: 'Archive summary retrieved successfully',
      data: {
        total_count: totalArchives,
        restored_count: restoredArchives,
        not_restored_count: activeArchives,
        restore_percentage: totalArchives > 0 ? ((restoredArchives / totalArchives) * 100).toFixed(1) : 0,
        by_table: tableResult
      }
    };
  } catch (error) {
    console.error('Error fetching archive summary:', error);
    throw error;
  }
}

/**
 * READ BY DATE RANGE - Get archives within a date range
 * @param {String} dateFrom - Start date
 * @param {String} dateTo - End date
 * @param {Object} options - Additional options (limit, offset, etc.)
 * @returns {Promise<Object>} Paginated archives
 */
async function getArchivesByDateRange(dateFrom, dateTo, options = {}) {
  try {
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;

    const formattedDateFrom = moment(dateFrom).format('YYYY-MM-DD 00:00:00');
    const formattedDateTo = moment(dateTo).format('YYYY-MM-DD 23:59:59');

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
        CONCAT(
          COALESCE(m.firstname, ''),
          IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
          IF(m.lastname IS NOT NULL AND m.lastname != '', CONCAT(' ', m.lastname), '')
        ) as archived_by_name
      FROM tbl_archives a
      LEFT JOIN tbl_accounts acc ON a.archived_by = acc.acc_id
      LEFT JOIN tbl_members m ON acc.email = m.email
      WHERE a.archived_at BETWEEN ? AND ?
    `;

    const params = [formattedDateFrom, formattedDateTo];

    // Add limit if specified
    if (limit !== undefined) {
      sql += ` LIMIT ${parseInt(limit)}`;
      if (offset !== undefined) {
        sql += ` OFFSET ${parseInt(offset)}`;
      }
    }

    const [rows] = await query(sql, params);
    const parsedRows = rows.map(row => convertRowBuffersToText(row));

    return {
      success: true,
      message: 'Archives retrieved successfully',
      data: parsedRows,
      count: parsedRows.length
    };
  } catch (error) {
    console.error('Error fetching archives by date range:', error);
    throw error;
  }
}

/**
 * DELETE - Permanently delete an archive record
 * @param {Number} archiveId - Archive ID
 * @returns {Promise<Object>} Result object
 */
async function deleteArchivePermanently(archiveId) {
  try {
    if (!archiveId) {
      throw new Error('Archive ID is required');
    }

    // First, get the archive to check if it exists
    const archiveResult = await getArchiveById(archiveId);

    if (!archiveResult.success || !archiveResult.data) {
      return {
        success: false,
        message: 'Archive record not found'
      };
    }

    const archive = archiveResult.data;

    // Delete the archive record permanently
    const deleteSql = 'DELETE FROM tbl_archives WHERE archive_id = ?';
    const [deleteResult] = await query(deleteSql, [archiveId]);

    return {
      success: true,
      message: 'Archive permanently deleted',
      data: {
        archive_id: archiveId,
        original_table: archive.original_table,
        original_id: archive.original_id,
        deleted_at: moment().format('YYYY-MM-DD HH:mm:ss')
      }
    };
  } catch (error) {
    console.error('Error permanently deleting archive:', error);
    throw error;
  }
}

/**
 * BULK DELETE - Permanently delete multiple archive records
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

    let deletedCount = 0;
    let failedCount = 0;
    const failedArchives = [];

    // Process each archive individually for detailed tracking
    for (const archiveId of validIds) {
      try {
        const archiveResult = await getArchiveById(archiveId);

        if (!archiveResult.success || !archiveResult.data) {
          failedCount++;
          failedArchives.push({
            archive_id: archiveId,
            reason: 'Archive record not found'
          });
          continue;
        }

        // Delete the archive record permanently
        const deleteSql = 'DELETE FROM tbl_archives WHERE archive_id = ?';
        await query(deleteSql, [archiveId]);
        deletedCount++;

      } catch (error) {
        failedCount++;
        failedArchives.push({
          archive_id: archiveId,
          reason: error.message
        });
      }
    }

    return {
      success: true,
      message: `Bulk delete completed: ${deletedCount} deleted, ${failedCount} failed`,
      data: {
        requested: validIds.length,
        deleted: deletedCount,
        failed: failedCount,
        deleted_archives: failedArchives
      }
    };
  } catch (error) {
    console.error('Error bulk deleting archives:', error);
    throw error;
  }
}

/**
 * BULK RESTORE - Restore multiple archived records back to their original tables
 * @param {Array<Number>} archiveIds - Array of Archive IDs to restore
 * @param {String} restoredBy - User ID who is restoring the records
 * @param {String} restoreNotes - Optional notes about the restoration
 * @returns {Promise<Object>} Result object with success/failure counts
 */
async function bulkRestoreArchives(archiveIds, restoredBy = null, restoreNotes = null) {
  try {
    if (!Array.isArray(archiveIds) || archiveIds.length === 0) {
      throw new Error('Archive IDs array is required and cannot be empty');
    }

    const validIds = archiveIds.filter(id => typeof id === 'number' && id > 0);
    if (validIds.length === 0) {
      throw new Error('No valid archive IDs provided');
    }

    const results = {
      restored: [],
      failed: [],
      skipped: []
    };

    const { mapArchivedDataToCurrentSchema } = require('./columnMapping');

    // 1. Fetch all archives in a single query
    const placeholders = validIds.map(() => '?').join(',');
    const fetchSql = `SELECT * FROM tbl_archives WHERE archive_id IN (${placeholders})`;
    const [archives] = await query(fetchSql, validIds);

    // 2. Group archives by table to minimize table schema lookups and allow bulk inserts
    const tableGroups = {};
    for (const archive of archives) {
      if (!tableGroups[archive.original_table]) {
        tableGroups[archive.original_table] = [];
      }
      tableGroups[archive.original_table].push(archive);
    }

    const formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    // 3. Process each table group
    for (const tableName in tableGroups) {
      const tableArchives = tableGroups[tableName];
      const recordsToInsert = [];
      const idsToMarkRestored = [];
      const tableColumns = [];

      try {
        // First, determine all column names needed for a bulk insert by mapping the first record
        // mapArchivedDataToCurrentSchema now uses a cache, so this is fast
        for (const archive of tableArchives) {
          try {
            // Check if already restored
            if (archive.restored === 1 || archive.restored === true || archive.restored === '1') {
              results.skipped.push({
                archive_id: archive.archive_id,
                original_table: archive.original_table,
                reason: 'Already restored'
              });
              continue;
            }

            // Parse archived data
            let archivedData = archive.archived_data;
            if (typeof archivedData === 'string') {
              try {
                archivedData = JSON.parse(archivedData);
              } catch (parseError) {
                results.failed.push({
                  archive_id: archive.archive_id,
                  original_table: archive.original_table,
                  reason: 'Invalid JSON data'
                });
                continue;
              }
            }

            // Map archived data to current table schema
            const mappedData = await mapArchivedDataToCurrentSchema(tableName, archivedData);
            const cleanedData = cleanDataForInsertion(mappedData, tableName);

            // Collect column names if we haven't yet (must be consistent for bulk insert)
            if (tableColumns.length === 0) {
              tableColumns.push(...Object.keys(cleanedData));
            }

            // Ensure row values match the tableColumns order
            const rowValues = tableColumns.map(col => cleanedData[col] !== undefined ? cleanedData[col] : null);
            recordsToInsert.push(rowValues);
            idsToMarkRestored.push(archive.archive_id);

          } catch (itemError) {
            console.error(`Error processing archive item ${archive.archive_id}:`, itemError);
            results.failed.push({
              archive_id: archive.archive_id,
              original_table: tableName,
              reason: itemError.message
            });
          }
        }

        // 4. Perform Bulk Insert for this table
        if (recordsToInsert.length > 0) {
          // Build bulk insert query with placeholders
          const placeholders = recordsToInsert.map(() => `(${tableColumns.map(() => '?').join(',')})`).join(',');
          const flatValues = recordsToInsert.flat();

          // Use INSERT IGNORE to handle existing records and prevent batch failure
          const insertSql = `
                        INSERT IGNORE INTO \`${tableName}\` (${tableColumns.map(c => `\`${c}\``).join(', ')})
                        VALUES ${placeholders}
                    `;

          try {
            await query(insertSql, flatValues);
            console.log(`✅ Bulk inserted ${recordsToInsert.length} records into ${tableName}`);

            // 5. Bulk Update archive status for successfully restored items in this table
            // We do this inside the table loop to maintain grouping logic
            if (idsToMarkRestored.length > 0) {
              const idPlaceholders = idsToMarkRestored.map(() => '?').join(',');
              const updateSql = `
                                UPDATE tbl_archives 
                                SET restored = 1, restored_at = ?, restored_by = ?, restore_notes = ?
                                WHERE archive_id IN (${idPlaceholders})
                            `;

              await query(updateSql, [formattedDate, restoredBy, restoreNotes, ...idsToMarkRestored]);

              // Log success for each ID
              idsToMarkRestored.forEach(id => {
                results.restored.push({
                  archive_id: id,
                  original_table: tableName
                });
              });
            }
          } catch (insertError) {
            console.error(`❌ Bulk insert failed for table ${tableName}:`, insertError);
            // Mark all IDs in this batch as failed
            idsToMarkRestored.forEach(id => {
              results.failed.push({
                archive_id: id,
                original_table: tableName,
                reason: `Bulk insert failure: ${insertError.message}`
              });
            });
          }
        }

      } catch (groupError) {
        console.error(`❌ Systematic error processing table ${tableName}:`, groupError);
        // Handle unhandled errors for the entire group
        tableArchives.forEach(archive => {
          if (!results.restored.find(r => r.archive_id === archive.archive_id) &&
            !results.failed.find(f => f.archive_id === archive.archive_id)) {
            results.failed.push({
              archive_id: archive.archive_id,
              original_table: tableName,
              reason: groupError.message
            });
          }
        });
      }
    }

    // Calculate final stats
    const totalProcessed = results.restored.length + results.failed.length + results.skipped.length;
    const totalRequested = validIds.length;
    const successRate = totalRequested > 0 ? ((results.restored.length / totalRequested) * 100).toFixed(1) : 0;

    return {
      success: true,
      message: `Bulk restore completed: ${results.restored.length} restored, ${results.failed.length} failed, ${results.skipped.length} skipped`,
      data: {
        requested: totalRequested,
        processed: totalProcessed,
        restored: results.restored.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        success_rate: parseFloat(successRate),
        restored_archives: results.restored,
        failed_archives: results.failed,
        skipped_archives: results.skipped
      }
    };
  } catch (error) {
    console.error('Error bulk restoring archives:', error);
    throw error;
  }
}

module.exports = {
  archiveRecord,
  bulkArchiveRecords,
  getAllArchives,
  getArchiveById,
  restoreArchive,
  getArchiveSummary,
  getArchivesByDateRange,
  deleteArchivePermanently,
  bulkDeleteArchivesPermanently,
  bulkRestoreArchives
};
