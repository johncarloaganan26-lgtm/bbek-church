const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const { archiveBeforeDelete } = require('../archiveHelper');

/**
 * Church Leader Records CRUD Operations
 * Based on tbl_churchleaders schema:
 * - leader_id (INT, PK, NN, AI) - auto-incrementing
 * - member_id (VARCHAR(45), NN)
 * - joined_date (DATETIME, NN)
 * - date_created (DATETIME, NN)
 */

/**
 * Check if a church leader with the same member_id already exists
 * @param {String} memberId - Member ID to check
 * @param {Number} excludeLeaderId - Optional leader_id to exclude from check (for updates)
 * @returns {Promise<Object>} Object with isDuplicate flag
 */
async function checkDuplicateChurchLeader(memberId, excludeLeaderId = null) {
  try {
    let sql = 'SELECT leader_id, member_id FROM tbl_churchleaders WHERE member_id = ?';
    const params = [memberId];

    if (excludeLeaderId) {
      sql += ' AND leader_id != ?';
      params.push(excludeLeaderId);
    }

    const [rows] = await query(sql, params);

    return {
      isDuplicate: rows.length > 0,
      leader: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Error checking for duplicate church leader:', error);
    throw error;
  }
}

/**
 * CREATE - Insert a new church leader record
 * @param {Object} leaderData - Church leader data object
 * @returns {Promise<Object>} Result object
 */
async function createChurchLeader(leaderData) {
  try {
    const {
      member_id,
      joined_date,
      date_created = new Date()
    } = leaderData;

    // Validate required fields
    if (!member_id) {
      throw new Error('Missing required field: member_id');
    }
    if (!joined_date) {
      throw new Error('Missing required field: joined_date');
    }

    // Check for duplicate member_id
    const duplicateCheck = await checkDuplicateChurchLeader(member_id);
    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        message: 'A church leader with this member_id already exists',
        error: 'Duplicate member_id',
        duplicateDetails: duplicateCheck.leader
      };
    }

    // Validate joined_date
    const joinedDate = new Date(joined_date);
    if (isNaN(joinedDate.getTime())) {
      throw new Error('Invalid joined_date format');
    }

    // Format dates
    const formattedJoinedDate = moment(joined_date).format('YYYY-MM-DD HH:mm:ss');
    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');

    const sql = `
      INSERT INTO tbl_churchleaders 
        (member_id, joined_date, date_created)
      VALUES (?, ?, ?)
    `;

    const params = [
      member_id.trim(),
      formattedJoinedDate,
      formattedDateCreated
    ];

    const [result] = await query(sql, params);
    
    // Fetch the created church leader using the auto-generated ID
    const createdLeader = await getChurchLeaderById(result.insertId);

    return {
      success: true,
      message: 'Church leader created successfully',
      data: createdLeader.data
    };
  } catch (error) {
    console.error('Error creating church leader:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all church leader records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, sortBy)
 * @returns {Promise<Object>} Object with paginated church leader records and metadata
 */
async function getAllChurchLeaders(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const sortBy = options.sortBy || null;
    let startDate = null;
    let endDate = null;
    if (options.dateRange) {
      try {
        const [start, end] = typeof options.dateRange === 'string' ? JSON.parse(options.dateRange) : options.dateRange;
        startDate = start;
        endDate = end;
      } catch (error) {
        console.warn('Invalid date range format:', options.dateRange);
      }
    }

    // Build base query for counting total records (with JOIN for accurate count)
    let countSql = 'SELECT COUNT(*) as total FROM tbl_churchleaders cl INNER JOIN tbl_members m ON cl.member_id = m.member_id';
    let countParams = [];

    // Build query for fetching records with member data
    let sql = `SELECT 
      cl.leader_id,
      cl.member_id,
      cl.joined_date,
      cl.date_created,
      m.firstname,
      m.lastname,
      m.middle_name,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as fullname
    FROM tbl_churchleaders cl
    INNER JOIN tbl_members m ON cl.member_id = m.member_id`;
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality (search by member_id or member name)
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(cl.member_id LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ? OR m.middle_name LIKE ? OR CONCAT(m.firstname, ' ', IFNULL(m.middle_name, ''), ' ', m.lastname) LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add date range filter
    if (startDate && endDate) {
      whereConditions.push('DATE(cl.date_created) BETWEEN ? AND ?');
      countParams.push(startDate, endDate);
      params.push(startDate, endDate);
      hasWhere = true;
    }

    // Initialize sortByValue before using it
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;

    // Add month filter (e.g., 'January', 'February', 'This Month', 'Last Month')
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (sortByValue && monthNames.includes(sortByValue)) {
      const monthIndex = monthNames.indexOf(sortByValue) + 1; // 1-12
      whereConditions.push('MONTH(cl.date_created) = ? AND YEAR(cl.date_created) = YEAR(CURDATE())');
      countParams.push(monthIndex);
      params.push(monthIndex);
      hasWhere = true;
    } else if (sortByValue === 'This Month') {
      whereConditions.push('MONTH(cl.date_created) = MONTH(CURDATE()) AND YEAR(cl.date_created) = YEAR(CURDATE())');
      hasWhere = true;
    } else if (sortByValue === 'Last Month') {
      whereConditions.push('MONTH(cl.date_created) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(cl.date_created) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))');
      hasWhere = true;
    }

    // Apply WHERE clause if any conditions exist
    if (hasWhere) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      countSql += whereClause;
      sql += whereClause;
    }

    // Add sorting
    let orderByClause = ' ORDER BY ';
    switch (sortByValue) {
      case 'Leader ID (Low to High)':
        orderByClause += 'cl.leader_id ASC';
        break;
      case 'Leader ID (High to Low)':
        orderByClause += 'cl.leader_id DESC';
        break;
      case 'Member ID (A-Z)':
        orderByClause += 'cl.member_id ASC';
        break;
      case 'Member ID (Z-A)':
        orderByClause += 'cl.member_id DESC';
        break;
      case 'Joined Date (Newest)':
        orderByClause += 'cl.joined_date DESC';
        break;
      case 'Joined Date (Oldest)':
        orderByClause += 'cl.joined_date ASC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'cl.date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'cl.date_created ASC';
        break;
      default:
        orderByClause += 'cl.date_created DESC'; // Default sorting
    }
    sql += orderByClause;

    // Determine pagination values
    let finalLimit, finalOffset;

    if (page !== undefined && pageSize !== undefined) {
      const pageNum = parseInt(page) || 1;
      const size = parseInt(pageSize) || 10;
      finalLimit = size;
      finalOffset = (pageNum - 1) * size;
    } else if (limit !== undefined) {
      finalLimit = parseInt(limit) || 10;
      finalOffset = offset !== undefined ? parseInt(offset) : 0;
    } else {
      finalLimit = null;
      finalOffset = null;
    }

    // Get total count (before pagination)
    const [countResult] = await query(countSql, countParams);
    const totalCount = countResult[0]?.total || 0;

    // Add pagination to main query
    if (finalLimit !== null) {
      const limitValue = Math.max(1, parseInt(finalLimit) || 10);
      const offsetValue = Math.max(0, parseInt(finalOffset) || 0);

      if (offsetValue > 0) {
        sql += ` LIMIT ${limitValue} OFFSET ${offsetValue}`;
      } else {
        sql += ` LIMIT ${limitValue}`;
      }
    }

    // Execute query to get paginated results
    const [rows] = await query(sql, params);

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || rows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Church leaders retrieved successfully',
      data: rows,
      count: rows.length,
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
    console.error('Error fetching church leaders:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single church leader by ID
 * @param {Number} leaderId - Leader ID
 * @returns {Promise<Object>} Church leader record
 */
async function getChurchLeaderById(leaderId) {
  try {
    if (!leaderId) {
      throw new Error('Leader ID is required');
    }

    const sql = 'SELECT * FROM tbl_churchleaders WHERE leader_id = ?';
    const [rows] = await query(sql, [leaderId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Church leader not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Church leader retrieved successfully',
      data: rows[0]
    };
  } catch (error) {
    console.error('Error fetching church leader:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single church leader by member_id
 * @param {String} memberId - Member ID
 * @returns {Promise<Object>} Church leader record
 */
async function getChurchLeaderByMemberId(memberId) {
  try {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    const sql = 'SELECT * FROM tbl_churchleaders WHERE member_id = ?';
    const [rows] = await query(sql, [memberId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Church leader not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Church leader retrieved successfully',
      data: rows[0]
    };
  } catch (error) {
    console.error('Error fetching church leader:', error);
    throw error;
  }
}

/**
 * UPDATE - Update an existing church leader record
 * @param {Number} leaderId - Leader ID
 * @param {Object} leaderData - Updated church leader data
 * @returns {Promise<Object>} Result object
 */
async function updateChurchLeader(leaderId, leaderData) {
  try {
    if (!leaderId) {
      throw new Error('Leader ID is required');
    }

    // Check if church leader exists
    const leaderCheck = await getChurchLeaderById(leaderId);
    if (!leaderCheck.success) {
      return {
        success: false,
        message: 'Church leader not found',
        data: null
      };
    }

    const {
      member_id,
      joined_date,
      date_created
    } = leaderData;

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (member_id !== undefined) {
      // Check for duplicate member_id (excluding current leader)
      const duplicateCheck = await checkDuplicateChurchLeader(member_id, leaderId);
      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          message: 'A church leader with this member_id already exists',
          error: 'Duplicate member_id',
          duplicateDetails: duplicateCheck.leader
        };
      }
      fields.push('member_id = ?');
      params.push(member_id.trim());
    }

    if (joined_date !== undefined) {
      // Validate joined_date
      const joinedDate = new Date(joined_date);
      if (isNaN(joinedDate.getTime())) {
        throw new Error('Invalid joined_date format');
      }
      const formattedJoinedDate = moment(joined_date).format('YYYY-MM-DD HH:mm:ss');
      fields.push('joined_date = ?');
      params.push(formattedJoinedDate);
    }

    if (date_created !== undefined) {
      const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');
      fields.push('date_created = ?');
      params.push(formattedDateCreated);
    }

    if (fields.length === 0) {
      return {
        success: false,
        message: 'No fields to update',
        data: null
      };
    }

    params.push(leaderId);

    const sql = `
      UPDATE tbl_churchleaders
      SET ${fields.join(', ')}
      WHERE leader_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Church leader not found or no changes made',
        data: null
      };
    }

    // Fetch updated church leader
    const updatedLeader = await getChurchLeaderById(leaderId);

    return {
      success: true,
      message: 'Church leader updated successfully',
      data: updatedLeader.data
    };
  } catch (error) {
    console.error('Error updating church leader:', error);
    throw error;
  }
}

/**
 * DELETE - Delete a church leader record (archives it first)
 * @param {Number} leaderId - Leader ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteChurchLeader(leaderId, archivedBy = null) {
  try {
    if (!leaderId) {
      throw new Error('Leader ID is required');
    }

    // Check if church leader exists
    const leaderCheck = await getChurchLeaderById(leaderId);
    if (!leaderCheck.success) {
      return {
        success: false,
        message: 'Church leader not found',
        data: null
      };
    }

    // Archive the record before deleting
    await archiveBeforeDelete(
      'tbl_churchleaders',
      String(leaderId),
      leaderCheck.data,
      archivedBy
    );

    // Delete from original table
    const sql = 'DELETE FROM tbl_churchleaders WHERE leader_id = ?';
    const [result] = await query(sql, [leaderId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Church leader not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Church leader archived and deleted successfully',
      data: { leader_id: leaderId }
    };
  } catch (error) {
    console.error('Error deleting church leader:', error);
    throw error;
  }
}

/**
 * EXPORT - Export church leader records to Excel
 * @param {Object} options - Optional query parameters (same as getAllChurchLeaders: search, sortBy)
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportChurchLeadersToExcel(options = {}) {
  try {
    // Get all church leaders matching the filters (without pagination for export)
    const exportOptions = { ...options };
    // Remove pagination to get all records
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    const result = await getAllChurchLeaders(exportOptions);
    
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No church leaders found to export');
    }

    const leaders = result.data;

    // Prepare data for Excel export
    const excelData = leaders.map((leader, index) => {
      return {
        'No.': index + 1,
        'Leader ID': leader.leader_id || '',
        'Member ID': leader.member_id || '',
        'Joined Date': leader.joined_date ? moment(leader.joined_date).format('YYYY-MM-DD HH:mm:ss') : '',
        'Date Created': leader.date_created ? moment(leader.date_created).format('YYYY-MM-DD HH:mm:ss') : '',
        'Created Date': leader.date_created ? moment(leader.date_created).format('YYYY-MM-DD') : ''
      };
    });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 12 },  // Leader ID
      { wch: 15 },  // Member ID
      { wch: 20 },  // Joined Date
      { wch: 20 },  // Date Created
      { wch: 12 }   // Created Date
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Church Leaders');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });

    return excelBuffer;
  } catch (error) {
    console.error('Error exporting church leaders to Excel:', error);
    throw error;
  }
}

/**
 * Get all church leaders for select elements (simplified data)
 * @returns {Promise<Object>} Object with leader list (id, name)
 */
async function getAllChurchLeadersForSelect() {
  try {
    const sql = `SELECT 
      cl.leader_id,
      cl.member_id,
      m.firstname,
      m.lastname,
      m.middle_name,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as fullname
    FROM tbl_churchleaders cl
    INNER JOIN tbl_members m ON cl.member_id = m.member_id
    ORDER BY m.firstname ASC, m.lastname ASC`;

    const [rows] = await query(sql);

    return {
      success: true,
      message: 'Church leaders retrieved successfully for select',
      data: rows.map(leader => ({
        id: leader.leader_id, // Use leader_id (integer) for pastor_id
        name: leader.fullname || `${leader.firstname} ${leader.lastname}`.trim()
      }))
    };
  } catch (error) {
    console.error('Error fetching church leaders for select:', error);
    throw error;
  }
}

/**
 * BULK DELETE CHURCH LEADERS - Permanently delete multiple church leader records in a single operation
 * @param {Array<Number>} leaderIds - Array of Leader IDs to delete
 * @param {String} archivedBy - User ID who is archiving the records
 * @returns {Promise<Object>} Result object with success/failure counts
 */
async function bulkDeleteChurchLeaders(leaderIds, archivedBy = null) {
  try {
    if (!Array.isArray(leaderIds) || leaderIds.length === 0) {
      throw new Error('Leader IDs array is required and cannot be empty');
    }

    // Validate all IDs are numbers
    const validIds = leaderIds.filter(id => typeof id === 'number' && id > 0);
    if (validIds.length === 0) {
      throw new Error('No valid leader IDs provided');
    }

    // Archive church leaders before bulk delete
    const leadersToDelete = [];

    // Get leader data for archiving
    for (const leaderId of validIds) {
      try {
        const leader = await getChurchLeaderById(leaderId);
        if (leader.success && leader.data) {
          leadersToDelete.push(leader.data);
          await archiveBeforeDelete('tbl_churchleaders', String(leaderId), leader.data, archivedBy);
        }
      } catch (error) {
        console.warn(`Failed to archive church leader ${leaderId}:`, error.message);
        // Continue with deletion even if archiving fails
      }
    }

    // Perform bulk delete
    const placeholders = validIds.map(() => '?').join(',');
    const deleteSql = `DELETE FROM tbl_churchleaders WHERE leader_id IN (${placeholders})`;
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
        archived_leaders: leadersToDelete
      }
    };
  } catch (error) {
    console.error('Error bulk deleting church leaders:', error);
    throw error;
  }
}

module.exports = {
  createChurchLeader,
  getAllChurchLeaders,
  getChurchLeaderById,
  getChurchLeaderByMemberId,
  updateChurchLeader,
  deleteChurchLeader,
  bulkDeleteChurchLeaders,
  exportChurchLeadersToExcel,
  getAllChurchLeadersForSelect
};

