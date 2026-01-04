const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const { archiveBeforeDelete } = require('../archiveHelper');
const { sendWaterBaptismDetails } = require('../emailHelper');

/**
 * Water Baptism Records CRUD Operations
 * Based on tbl_waterbaptism schema:
 * - baptism_id (VARCHAR(45), PK, NN)
 * - member_id (VARCHAR(45), NN)
 * - baptism_date (DATETIME, nullable) - can be null for pending baptisms
 * - status (VARCHAR(45), NN, default: 'pending')
 * - date_created (VARCHAR(45), NN)
 */

/**
 * Get the next baptism_id (incremental)
 * @returns {Promise<String>} Next baptism_id as zero-padded string
 */
async function getNextBaptismId() {
  try {
    const sql = 'SELECT MAX(baptism_id) AS max_baptism_id FROM tbl_waterbaptism';
    const [rows] = await query(sql);
    
    // If no records exist, start with 1, otherwise increment by 1
    const maxId = rows[0]?.max_baptism_id || null;
    
    if (!maxId) {
      // First record - return "0000000001"
      return '0000000001';
    }
    
    // Extract numeric part if baptism_id has prefix (e.g., "BAPTISM0000000001" -> 1)
    // Or if it's just numeric, use it directly
    const numericMatch = maxId.match(/\d+$/);
    if (numericMatch) {
      const numericPart = parseInt(numericMatch[0]);
      const newNumericId = numericPart + 1;
      return newNumericId.toString().padStart(9, '0');
    }
    
    // If no numeric part found, start from 1
    return '0000000001';
  } catch (error) {
    console.error('Error getting next baptism ID:', error);
    throw error;
  }
}

/**
 * CREATE - Insert a new water baptism record
 * @param {Object} baptismData - Water baptism data object
 * @param {string} baptismData.member_id - Member ID (required)
 * @param {Date|string|null} baptismData.baptism_date - Baptism date (optional, can be null)
 * @param {string} baptismData.status - Status (default: 'pending')
 * @returns {Promise<Object>} Result object
 */
async function createWaterBaptism(baptismData) {
  try {
    // Get next baptism_id if not provided
    const new_baptism_id = await getNextBaptismId();
    console.log('New baptism ID:', new_baptism_id);
    
    const {
      baptism_id = new_baptism_id,
      member_id,
      baptism_date,
      status = 'pending',
      date_created = new Date(),
      guardian_name,
      guardian_contact,
      guardian_relationship
    } = baptismData;

    // Validate required fields (baptism_id is auto-generated if not provided)
    if (!member_id) {
      throw new Error('Missing required field: member_id');
    }
    // baptism_date is optional and can be null

    // Ensure baptism_id is set and convert to string
    const final_baptism_id = String(baptism_id || new_baptism_id).trim();
    
    // Convert member_id to string
    const final_member_id = String(member_id).trim();

    // Format dates - baptism_date can be null
    const formattedBaptismDate = baptism_date ? moment(baptism_date).format('YYYY-MM-DD HH:mm:ss') : null;
    // date_created is VARCHAR(45), so format as string
    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');

    // Build SQL conditionally based on whether baptism_date is provided
    let sql;
    let params;
    
    if (formattedBaptismDate === null) {
      // Omit baptism_date column when it's null
      sql = `
        INSERT INTO tbl_waterbaptism
          (baptism_id, member_id, status, guardian_name, guardian_contact, guardian_relationship, date_created)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        final_baptism_id,
        final_member_id,
        status,
        guardian_name || null,
        guardian_contact || null,
        guardian_relationship || null,
        formattedDateCreated
      ];
    } else {
      // Include baptism_date when it has a value
      sql = `
        INSERT INTO tbl_waterbaptism
          (baptism_id, member_id, baptism_date, status, guardian_name, guardian_contact, guardian_relationship, date_created)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        final_baptism_id,
        final_member_id,
        formattedBaptismDate,
        status,
        guardian_name || null,
        guardian_contact || null,
        guardian_relationship || null,
        formattedDateCreated
      ];
    }

    const [result] = await query(sql, params);
    
    // Fetch the created baptism
    const createdBaptism = await getWaterBaptismById(final_baptism_id);

    // Send email notification to the member (best-effort; do not fail creation)
    try {
      const [memberRows] = await query(
        `SELECT firstname, lastname, middle_name, email, phone_number
         FROM tbl_members
         WHERE member_id = ?`,
        [final_member_id]
      );

      if (memberRows && memberRows.length > 0 && memberRows[0].email) {
        const member = memberRows[0];
        const recipientName = `${member.firstname || ''} ${member.middle_name ? member.middle_name + ' ' : ''}${member.lastname || ''}`.trim() || 'Valued Member';
        
        await sendWaterBaptismDetails({
          email: member.email,
          status: createdBaptism.data.status,
          recipientName: recipientName,
          memberName: recipientName,
          baptismDate: createdBaptism.data.baptism_date
            ? moment(createdBaptism.data.baptism_date).format('YYYY-MM-DD HH:mm:ss')
            : 'To be determined',
          location: 'To be determined'
        });
      }
    } catch (emailError) {
      // Log but don't block record creation if email fails
      console.error('Error sending water baptism creation email:', emailError);
    }

    return {
      success: true,
      message: 'Water baptism created successfully',
      data: createdBaptism.data
    };
  } catch (error) {
    console.error('Error creating water baptism:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all water baptism records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, status, sortBy)
 * @returns {Promise<Object>} Object with paginated water baptism records and metadata
 */
async function getAllWaterBaptisms(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const status = options.status || null;
    const sortBy = options.sortBy || null;

    // Build base query for counting total records (with JOIN for accurate count)
    let countSql = 'SELECT COUNT(*) as total FROM tbl_waterbaptism wb INNER JOIN tbl_members m ON wb.member_id = m.member_id';
    let countParams = [];

    // Build query for fetching records with member data
    let sql = `SELECT 
      wb.*,
      m.firstname,
      m.lastname,
      m.middle_name,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as fullname
    FROM tbl_waterbaptism wb
    INNER JOIN tbl_members m ON wb.member_id = m.member_id`;
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality (search by baptism_id, member_id, or member name)
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(wb.baptism_id LIKE ? OR wb.member_id LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ? OR m.middle_name LIKE ? OR CONCAT(m.firstname, ' ', IFNULL(m.middle_name, ''), ' ', m.lastname) LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add status filter
    if (status && status !== 'All Statuses') {
      whereConditions.push('status = ?');
      countParams.push(status);
      params.push(status);
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
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;
    switch (sortByValue) {
      case 'Baptism ID (A-Z)':
        orderByClause += 'wb.baptism_id ASC';
        break;
      case 'Baptism ID (Z-A)':
        orderByClause += 'wb.baptism_id DESC';
        break;
      case 'Baptism Date (Newest)':
        orderByClause += 'wb.baptism_date DESC';
        break;
      case 'Baptism Date (Oldest)':
        orderByClause += 'wb.baptism_date ASC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'wb.date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'wb.date_created ASC';
        break;
      case 'Status (A-Z)':
        orderByClause += 'wb.status ASC';
        break;
      default:
        orderByClause += 'wb.date_created DESC'; // Default sorting
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

    // Get summary statistics from ALL records (ignoring filters for summary cards)
    const [allStatusCountsResult] = await query(
      'SELECT status, COUNT(*) as count FROM tbl_waterbaptism GROUP BY status'
    );
    const summaryStats = {
      total: 0,
      completed: 0,
      pending: 0,
      approved: 0,
      disapproved: 0,
      cancelled: 0
    };
    
    // Get total count of all records
    const [allTotalResult] = await query('SELECT COUNT(*) as total FROM tbl_waterbaptism');
    summaryStats.total = allTotalResult[0]?.total || 0;
    
    // Map status counts
    allStatusCountsResult.forEach(row => {
      if (summaryStats.hasOwnProperty(row.status)) {
        summaryStats[row.status] = row.count;
      }
    });

    // Get this year count from ALL records
    const [thisYearResult] = await query(
      'SELECT COUNT(*) as count FROM tbl_waterbaptism WHERE YEAR(baptism_date) = YEAR(CURDATE())'
    );
    const thisYearCount = thisYearResult[0]?.count || 0;

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
      message: 'Water baptisms retrieved successfully',
      data: rows,
      count: rows.length,
      totalCount: totalCount,
      summaryStats: summaryStats,
      thisYearCount: thisYearCount,
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
    console.error('Error fetching water baptisms:', error);
    throw error;
  }
}
/** 
 * get water baptism by member_id
 * @param {String} memberId - Member ID
 * @returns {Promise<Object>} Water baptism record
 */
async function getWaterBaptismByMemberId(memberId) {
  console.log('getWaterBaptismByMemberId:')
  try {
    if (!memberId) {
      throw new Error('Member ID is required');
    }
    // Convert member_id to integer for comparison (water baptism uses INT member_id)
    const memberIdInt = parseInt(memberId);
    if (isNaN(memberIdInt)) {
      throw new Error('Invalid member ID: must be a valid integer');
    }
    
    const sql = `SELECT 
      A.*, 
      B.member_id as member_member_id,
      B.firstname, 
      B.lastname, 
      B.middle_name, 
      B.birthdate,
      B.age,
      B.gender,
      B.address,
      B.email,
      B.phone_number,
      B.position,
      B.date_created as member_date_created,
      CONCAT(B.firstname, " ", IFNULL(B.middle_name, ""), " ", B.lastname) as fullname 
    FROM tbl_waterbaptism A 
    INNER JOIN tbl_members B ON A.member_id = B.member_id 
    WHERE A.member_id = ?`;
    console.log('SQL:', sql)
    const [rows] = await query(sql, [memberIdInt]);
    console.log('Rows:', rows)
    if (rows.length === 0) {
      return {
        success: true,
        message: 'Water baptism records retrieved successfully',
        data: []
      };
    }
    return {
      success: true,
      message: 'Water baptism records retrieved successfully',
      data: rows
    };
  } catch (error) {
    console.error('Error fetching water baptism by member ID:', error);
    throw error;
  }
}
/**
 * READ ONE - Get a single water baptism by ID
 * @param {String} baptismId - Baptism ID
 * @returns {Promise<Object>} Water baptism record
 */
async function getWaterBaptismById(baptismId) {
  try {
    if (!baptismId) {
      throw new Error('Baptism ID is required');
    }

    const sql = 'SELECT * FROM tbl_waterbaptism WHERE baptism_id = ?';
    const [rows] = await query(sql, [baptismId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Water baptism not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Water baptism retrieved successfully',
      data: rows[0]
    };
  } catch (error) {
    console.error('Error fetching water baptism:', error);
    throw error;
  }
}


/**
 * UPDATE - Update an existing water baptism record
 * @param {String} baptismId - Baptism ID
 * @param {Object} baptismData - Updated water baptism data
 * @returns {Promise<Object>} Result object
 */
async function updateWaterBaptism(baptismId, baptismData) {
  try {
    if (!baptismId) {
      throw new Error('Baptism ID is required');
    }

    // Check if baptism exists
    const baptismCheck = await getWaterBaptismById(baptismId);
    if (!baptismCheck.success) {
      return {
        success: false,
        message: 'Water baptism not found',
        data: null
      };
    }

    const {
      member_id,
      baptism_date,
      status,
      date_created,
      guardian_name,
      guardian_contact,
      guardian_relationship
    } = baptismData;

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (member_id !== undefined) {
      fields.push('member_id = ?');
      params.push(String(member_id).trim());
    }

    if (baptism_date !== undefined) {
      const formattedBaptismDate = moment(baptism_date).format('YYYY-MM-DD HH:mm:ss');
      fields.push('baptism_date = ?');
      params.push(formattedBaptismDate);
    }

    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }

    if (date_created !== undefined) {
      // date_created is VARCHAR(45), so format as string
      const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');
      fields.push('date_created = ?');
      params.push(formattedDateCreated);
    }

    if (guardian_name !== undefined) {
      fields.push('guardian_name = ?');
      params.push(guardian_name);
    }

    if (guardian_contact !== undefined) {
      fields.push('guardian_contact = ?');
      params.push(guardian_contact);
    }

    if (guardian_relationship !== undefined) {
      fields.push('guardian_relationship = ?');
      params.push(guardian_relationship);
    }

    if (fields.length === 0) {
      return {
        success: false,
        message: 'No fields to update',
        data: null
      };
    }

    params.push(baptismId);

    const sql = `
      UPDATE tbl_waterbaptism
      SET ${fields.join(', ')}
      WHERE baptism_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Water baptism not found or no changes made',
        data: null
      };
    }

    // Fetch updated baptism
    const updatedBaptism = await getWaterBaptismById(baptismId);

    // Send email notification to the member (if we can resolve email)
    try {
      // Get member contact details
      const [memberRows] = await query(
        `SELECT firstname, lastname, middle_name, email, phone_number
         FROM tbl_members
         WHERE member_id = ?`,
        [updatedBaptism.data.member_id]
      );

      if (memberRows && memberRows.length > 0 && memberRows[0].email) {
        const member = memberRows[0];
        const recipientName = `${member.firstname || ''} ${member.middle_name ? member.middle_name + ' ' : ''}${member.lastname || ''}`.trim() || 'Valued Member';
        
        await sendWaterBaptismDetails({
          email: member.email,
          status: updatedBaptism.data.status,
          recipientName: recipientName,
          memberName: recipientName,
          baptismDate: updatedBaptism.data.baptism_date
            ? moment(updatedBaptism.data.baptism_date).format('YYYY-MM-DD HH:mm:ss')
            : 'To be determined',
          location: 'To be determined'
        });
      }
    } catch (emailError) {
      // Do not block update flow on email failure, just log for diagnostics
      console.error('Error sending water baptism update email:', emailError);
    }

    return {
      success: true,
      message: 'Water baptism updated successfully',
      data: updatedBaptism.data
    };
  } catch (error) {
    console.error('Error updating water baptism:', error);
    throw error;
  }
}

/**
 * DELETE - Delete a water baptism record (archives it first)
 * @param {String} baptismId - Baptism ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteWaterBaptism(baptismId, archivedBy = null) {
  try {
    if (!baptismId) {
      throw new Error('Baptism ID is required');
    }

    // Check if baptism exists
    const baptismCheck = await getWaterBaptismById(baptismId);
    if (!baptismCheck.success) {
      return {
        success: false,
        message: 'Water baptism not found',
        data: null
      };
    }

    // Archive the record before deleting
    await archiveBeforeDelete(
      'tbl_waterbaptism',
      String(baptismId),
      baptismCheck.data,
      archivedBy
    );

    // Delete from original table
    const sql = 'DELETE FROM tbl_waterbaptism WHERE baptism_id = ?';
    const [result] = await query(sql, [baptismId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Water baptism not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Water baptism archived and deleted successfully',
      data: { baptism_id: baptismId }
    };
  } catch (error) {
    console.error('Error deleting water baptism:', error);
    throw error;
  }
}

/**
 * EXPORT - Export water baptism records to Excel
 * @param {Object} options - Optional query parameters (same as getAllWaterBaptisms: search, status, sortBy)
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportWaterBaptismsToExcel(options = {}) {
  try {
    const exportOptions = { ...options };
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    const result = await getAllWaterBaptisms(exportOptions);
    
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No water baptisms found to export');
    }

    const baptisms = result.data;

    const excelData = baptisms.map((baptism, index) => {
      return {
        'No.': index + 1,
        'Baptism ID': baptism.baptism_id || '',
        'Member ID': baptism.member_id || '',
        'Baptism Date': baptism.baptism_date ? moment(baptism.baptism_date).format('YYYY-MM-DD HH:mm:ss') : '',
        'Status': baptism.status || '',
        'Date Created': baptism.date_created ? moment(baptism.date_created).format('YYYY-MM-DD HH:mm:ss') : ''
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 15 },  // Baptism ID
      { wch: 15 },  // Member ID
      { wch: 20 },  // Baptism Date
      { wch: 15 },  // Status
      { wch: 20 }   // Date Created
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Water Baptisms');

    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });

    return excelBuffer;
  } catch (error) {
    console.error('Error exporting water baptisms to Excel:', error);
    throw error;
  }
}
/**
 * get specific water baptism data by member_id
 * @param {String} memberId - Member ID
 * @returns {Promise<Object>} Water baptism record
 */
async function getSpecificWaterBaptismDataByMemberIdIfBaptized(memberId) {
  try {
    const sql = 'SELECT * FROM tbl_waterbaptism WHERE member_id = ? and status = "completed"';
    const [rows] = await query(sql, [memberId]);
    if(rows.length === 0) {
      return null;
    }else{
      return rows[0];
    }
  } catch (error) {
    console.error('Error getting specific water baptism data by member ID:', error);
    throw error;
  }
}
 
module.exports = {
  createWaterBaptism,
  getAllWaterBaptisms,
  getWaterBaptismById,
  getWaterBaptismByMemberId,
  updateWaterBaptism,
  deleteWaterBaptism,
  exportWaterBaptismsToExcel,
  getSpecificWaterBaptismDataByMemberIdIfBaptized
};

