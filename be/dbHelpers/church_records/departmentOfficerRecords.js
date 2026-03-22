const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const { archiveBeforeDelete } = require('../archiveHelper');
const { processImage } = require('../../utils/imageHandler');

/**
 * Department Officer Records CRUD Operations
 * Based on tbl_departmentofficers schema:
 * - officer_id (INT, PK, NN, AI)
 * - member_id (VARCHAR(45), NN, UQ)
 * - joined_date (DATETIME, NN)
 * - date_created (DATETIME, NN, default: NULL)
 */

/**
 * Check if a department officer with the same member_id already exists
 * @param {String} memberId - Member ID to check
 * @param {Number} excludeOfficerId - Optional officer_id to exclude from check (for updates)
 * @returns {Promise<Object>} Object with isDuplicate flag
 */
async function checkDuplicateDepartmentOfficer(memberId, departmentId, role, excludeOfficerId = null) {
  try {
    let sql = 'SELECT officer_id, member_id, department_id, role FROM tbl_departmentofficers WHERE member_id = ? AND department_id = ? AND role = ?';
    const params = [memberId, departmentId, role];

    if (excludeOfficerId) {
      sql += ' AND officer_id != ?';
      params.push(excludeOfficerId);
    }

    const [rows] = await query(sql, params);

    return {
      isDuplicate: rows.length > 0,
      officer: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Error checking for duplicate department officer:', error);
    throw error;
  }
}

/**
 * CREATE - Insert a new department officer record
 * @param {Object} officerData - Department officer data object
 * @returns {Promise<Object>} Result object
 */
async function createDepartmentOfficer(officerData) {
  try {
    const {
      member_id,
      department_id,
      role = '',
      joined_date,
      bio = null,
      image = null,
      status = 'Active',
      date_created = new Date()
    } = officerData;

    // Validate required fields
    if (!member_id) {
      throw new Error('Missing required field: member_id');
    }

    // Check for duplicate member_id + department + role
    const duplicateCheck = await checkDuplicateDepartmentOfficer(member_id, department_id, role);
    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        message: 'A department officer with this member ID already exists',
        error: 'Duplicate member_id'
      };
    }

    // Validate joined_date format if provided
    let formattedJoinedDate = joined_date;
    if (joined_date) {
      formattedJoinedDate = moment(joined_date).format('YYYY-MM-DD HH:mm:ss');
    } else {
      formattedJoinedDate = moment().format('YYYY-MM-DD HH:mm:ss');
    }

    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');

    const sql = `
      INSERT INTO tbl_departmentofficers 
        (member_id, department_id, role, status, joined_date, bio, image, date_created)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      member_id.trim(),
      department_id,
      role,
      status || 'Active',
      formattedJoinedDate,
      bio,
      image,
      formattedDateCreated
    ];

    const [result] = await query(sql, params);
    
    // Fetch the created officer
    const createdOfficer = await getDepartmentOfficerById(result.insertId);

    return {
      success: true,
      message: 'Department officer created successfully',
      data: createdOfficer.data
    };
  } catch (error) {
    console.error('Error creating department officer:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all department officer records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, sortBy)
 * @returns {Promise<Object>} Object with paginated department officer records and metadata
 */
async function getAllDepartmentOfficers(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const sortBy = options.sortBy || null;

    // Build base query for counting total records (with JOIN for accurate count)
    let countSql = 'SELECT COUNT(*) as total FROM tbl_departmentofficers do INNER JOIN tbl_members m ON do.member_id = m.member_id';
    let countParams = [];

    // Build query for fetching records with member data
    let sql = `SELECT 
      do.officer_id,
      do.member_id,
      do.department_id,
      d.department_name,
      do.role,
      do.joined_date,
      do.bio,
      do.image,
      do.status,
      do.date_created,
      m.firstname,
      m.lastname,
      m.middle_name,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as fullname
    FROM tbl_departmentofficers do
    INNER JOIN tbl_members m ON do.member_id = m.member_id
    LEFT JOIN tbl_departments d ON do.department_id = d.department_id`;
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality (search by member_id or member name)
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(do.member_id LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ? OR m.middle_name LIKE ? OR CONCAT(m.firstname, ' ', IFNULL(m.middle_name, ''), ' ', m.lastname) LIKE ? OR d.department_name LIKE ? OR do.role LIKE ? OR do.status LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
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
      case 'Member ID (A-Z)':
        orderByClause += 'do.member_id ASC';
        break;
      case 'Member ID (Z-A)':
        orderByClause += 'do.member_id DESC';
        break;
      case 'Joined Date (Newest)':
        orderByClause += 'do.joined_date DESC';
        break;
      case 'Joined Date (Oldest)':
        orderByClause += 'do.joined_date ASC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'do.date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'do.date_created ASC';
        break;
      default:
        orderByClause += 'do.date_created DESC'; // Default sorting
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
      message: 'Department officers retrieved successfully',
      data: rows.map(row => ({
        ...row,
        image: processImage(row.image)
      })),
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
    console.error('Error fetching department officers:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single department officer by ID
 * @param {Number} officerId - Officer ID
 * @returns {Promise<Object>} Department officer record
 */
async function getDepartmentOfficerById(officerId) {
  try {
    if (!officerId) {
      throw new Error('Officer ID is required');
    }

    const sql = 'SELECT * FROM tbl_departmentofficers WHERE officer_id = ?';
    const [rows] = await query(sql, [officerId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Department officer not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Department officer retrieved successfully',
      data: {
        ...rows[0],
        image: processImage(rows[0].image)
      }
    };
  } catch (error) {
    console.error('Error fetching department officer:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single department officer by member_id
 * @param {String} memberId - Member ID
 * @returns {Promise<Object>} Department officer record
 */
async function getDepartmentOfficerByMemberId(memberId) {
  try {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    const sql = 'SELECT * FROM tbl_departmentofficers WHERE member_id = ?';
    const [rows] = await query(sql, [memberId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Department officer not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Department officer retrieved successfully',
      data: {
        ...rows[0],
        image: processImage(rows[0].image)
      }
    };
  } catch (error) {
    console.error('Error fetching department officer by member ID:', error);
    throw error;
  }
}

/**
 * UPDATE - Update an existing department officer record
 * @param {Number} officerId - Officer ID
 * @param {Object} officerData - Updated department officer data
 * @returns {Promise<Object>} Result object
 */
async function updateDepartmentOfficer(officerId, officerData) {
  try {
    if (!officerId) {
      throw new Error('Officer ID is required');
    }

    // Check if officer exists
    const officerCheck = await getDepartmentOfficerById(officerId);
    if (!officerCheck.success) {
      return {
        success: false,
        message: 'Department officer not found',
        data: null
      };
    }

    const {
      member_id,
      department_id,
      role,
      joined_date,
      bio,
      image,
      status,
      date_created
    } = officerData;

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (member_id !== undefined || department_id !== undefined || role !== undefined) {
      const checkMemberId = member_id !== undefined ? member_id : officerCheck.data.member_id;
      const checkDeptId = department_id !== undefined ? department_id : officerCheck.data.department_id;
      const checkRole = role !== undefined ? role : officerCheck.data.role;

      // Check for duplicate (excluding current officer)
      const duplicateCheck = await checkDuplicateDepartmentOfficer(checkMemberId, checkDeptId, checkRole, officerId);
      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          message: 'An officer with this same member, department, and role already exists',
          error: 'Duplicate officer role'
        };
      }
    }

    if (member_id !== undefined) {
      fields.push('member_id = ?');
      params.push(member_id.trim());
    }

    if (department_id !== undefined) {
      fields.push('department_id = ?');
      params.push(department_id);
    }

    if (role !== undefined) {
      fields.push('role = ?');
      params.push(role);
    }

    if (joined_date !== undefined) {
      const formattedJoinedDate = moment(joined_date).format('YYYY-MM-DD HH:mm:ss');
      fields.push('joined_date = ?');
      params.push(formattedJoinedDate);
    }

    if (bio !== undefined) {
      fields.push('bio = ?');
      params.push(bio);
    }

    if (image !== undefined) {
      fields.push('image = ?');
      params.push(image);
    }

    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
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

    params.push(officerId);

    const sql = `
      UPDATE tbl_departmentofficers
      SET ${fields.join(', ')}
      WHERE officer_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Department officer not found or no changes made',
        data: null
      };
    }

    // Fetch updated officer
    const updatedOfficer = await getDepartmentOfficerById(officerId);

    return {
      success: true,
      message: 'Department officer updated successfully',
      data: {
        ...updatedOfficer.data,
        image: processImage(updatedOfficer.data.image)
      }
    };
  } catch (error) {
    console.error('Error updating department officer:', error);
    throw error;
  }
}

/**
 * DELETE - Delete a department officer record (archives it first)
 * @param {Number} officerId - Officer ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteDepartmentOfficer(officerId, archivedBy = null) {
  try {
    if (!officerId) {
      throw new Error('Officer ID is required');
    }

    // Check if officer exists
    const officerCheck = await getDepartmentOfficerById(officerId);
    if (!officerCheck.success) {
      return {
        success: false,
        message: 'Department officer not found',
        data: null
      };
    }

    // Archive the record before deleting
    await archiveBeforeDelete(
      'tbl_departmentofficers',
      String(officerId),
      officerCheck.data,
      archivedBy
    );

    // Delete from original table
    const sql = 'DELETE FROM tbl_departmentofficers WHERE officer_id = ?';
    const [result] = await query(sql, [officerId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Department officer not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Department officer archived and deleted successfully',
      data: { officer_id: officerId }
    };
  } catch (error) {
    console.error('Error deleting department officer:', error);
    throw error;
  }
}

/**
 * EXPORT - Export department officer records to Excel
 * @param {Object} options - Optional query parameters (same as getAllDepartmentOfficers: search, sortBy)
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportDepartmentOfficersToExcel(options = {}) {
  try {
    // Get all department officers matching the filters (without pagination for export)
    const exportOptions = { ...options };
    // Remove pagination to get all records
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    const result = await getAllDepartmentOfficers(exportOptions);
    
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No department officers found to export');
    }

    const officers = result.data;

    // Prepare data for Excel export
    const excelData = officers.map((officer, index) => {
      return {
        'No.': index + 1,
        'Officer ID': officer.officer_id || '',
        'Member ID': officer.member_id || '',
        'Full Name': officer.fullname || '',
        'First Name': officer.firstname || '',
        'Last Name': officer.lastname || '',
        'Middle Name': officer.middle_name || '',
        'Joined Date': officer.joined_date ? moment(officer.joined_date).format('YYYY-MM-DD HH:mm:ss') : '',
        'Status': officer.status || '',
        'Date Created': officer.date_created ? moment(officer.date_created).format('YYYY-MM-DD HH:mm:ss') : '',
        'Created Date': officer.date_created ? moment(officer.date_created).format('YYYY-MM-DD') : ''
      };
    });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 12 },  // Officer ID
      { wch: 15 },  // Member ID
      { wch: 25 },  // Full Name
      { wch: 20 },  // First Name
      { wch: 20 },  // Last Name
      { wch: 15 },  // Middle Name
      { wch: 20 },  // Joined Date
      { wch: 20 },  // Date Created
      { wch: 15 }   // Created Date
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Department Officers');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });

    return excelBuffer;
  } catch (error) {
    console.error('Error exporting department officers to Excel:', error);
    throw error;
  }
}

module.exports = {
  createDepartmentOfficer,
  getAllDepartmentOfficers,
  getDepartmentOfficerById,
  getDepartmentOfficerByMemberId,
  updateDepartmentOfficer,
  deleteDepartmentOfficer,
  checkDuplicateDepartmentOfficer,
  exportDepartmentOfficersToExcel
};

