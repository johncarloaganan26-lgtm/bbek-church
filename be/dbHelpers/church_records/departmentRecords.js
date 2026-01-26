const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const { archiveBeforeDelete } = require('../archiveHelper');

/**
 * Department Records CRUD Operations
 * Based on tbl_departments schema:
 * - department_id (INT, PK, NN)
 * - department_name (VARCHAR(45), NN)
 * - status (VARCHAR(45), NN)
 * - date_created (DATETIME, NN)
 * - member_id (VARCHAR(45), nullable) - Foreign key to tbl_members
 * - joined_members (TEXT, nullable) - JSON array of member IDs
 */

/**
 * Check if a department with the same name already exists
 * @param {String} departmentName - Department name to check
 * @param {Number} excludeDepartmentId - Optional department_id to exclude from check (for updates)
 * @returns {Promise<Object>} Object with isDuplicate flag
 */
async function checkDuplicateDepartment(departmentName, excludeDepartmentId = null) {
  try {
    let sql = 'SELECT department_id, department_name FROM tbl_departments WHERE LOWER(TRIM(department_name)) = LOWER(TRIM(?))';
    const params = [departmentName];

    if (excludeDepartmentId) {
      sql += ' AND department_id != ?';
      params.push(excludeDepartmentId);
    }

    const [rows] = await query(sql, params);

    return {
      isDuplicate: rows.length > 0,
      department: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Error checking for duplicate department:', error);
    throw error;
  }
}

/**
 * CREATE - Insert a new department record
 * @param {Object} departmentData - Department data object
 * @returns {Promise<Object>} Result object
 */
async function createDepartment(departmentData) {
  try {
    const {
      department_name,
      status = 'active',
      date_created = new Date(),
      member_id = null,
      joined_members = null
    } = departmentData;

    // Validate required fields
    if (!department_name) {
      throw new Error('Missing required field: department_name');
    }

    // Check for duplicate department name
    const duplicateCheck = await checkDuplicateDepartment(department_name);
    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        message: 'A department with this name already exists',
        error: 'Duplicate department name'
      };
    }

    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');

    // Validate and format joined_members if provided
    let joinedMembersJson = null;
    if (joined_members !== null && joined_members !== undefined) {
      if (Array.isArray(joined_members)) {
        joinedMembersJson = JSON.stringify(joined_members);
        if (joinedMembersJson.length > 2000) {
          return {
            success: false,
            message: 'joined_members array is too large (max 2000 characters)',
            error: 'joined_members length exceeded'
          };
        }
      } else if (typeof joined_members === 'string') {
        // If it's already a JSON string, validate it
        try {
          const parsed = JSON.parse(joined_members);
          if (!Array.isArray(parsed)) {
            return {
              success: false,
              message: 'joined_members must be an array',
              error: 'Invalid joined_members format'
            };
          }
          joinedMembersJson = joined_members;
          if (joinedMembersJson.length > 2000) {
            return {
              success: false,
              message: 'joined_members length exceeded',
              error: 'joined_members length exceeded'
            };
          }
        } catch (e) {
          return {
            success: false,
            message: 'Invalid JSON format for joined_members',
            error: 'Invalid joined_members format'
          };
        }
      } else {
        return {
          success: false,
          message: 'joined_members must be an array or JSON string',
          error: 'Invalid joined_members format'
        };
      }
    }

    const sql = `
      INSERT INTO tbl_departments 
        (department_name, status, date_created, member_id, joined_members)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      department_name.trim(),
      status,
      formattedDateCreated,
      member_id ? member_id.trim() : null,
      joinedMembersJson
    ];

    const [result] = await query(sql, params);
    
    // Fetch the created department
    const createdDepartment = await getDepartmentById(result.insertId);

    return {
      success: true,
      message: 'Department created successfully',
      data: createdDepartment.data
    };
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all department records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, status, sortBy)
 * @returns {Promise<Object>} Object with paginated department records and metadata
 */
async function getAllDepartments(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const status = options.status || null;
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

    // Build base query for counting total records
    let countSql = 'SELECT COUNT(*) as total FROM tbl_departments d LEFT JOIN tbl_members m ON d.member_id = m.member_id';
    let countParams = [];

    // Build query for fetching records with JOIN to get member fullname
    let sql = `SELECT 
      d.department_id,
      d.department_name,
      d.status,
      d.date_created,
      d.member_id,
      d.joined_members,
      m.firstname as member_firstname,
      m.lastname as member_lastname,
      m.middle_name as member_middle_name,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as member_fullname,
      CASE 
        WHEN d.joined_members IS NULL OR d.joined_members = '' THEN 0
        ELSE JSON_LENGTH(d.joined_members)
      END as joined_members_count
    FROM tbl_departments d
    LEFT JOIN tbl_members m ON d.member_id = m.member_id`;
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality (search by department name or member name)
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(d.department_name LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ? OR m.middle_name LIKE ? OR CONCAT(m.firstname, ' ', IFNULL(m.middle_name, ''), ' ', m.lastname) LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add status filter
    if (status && status !== 'All Statuses') {
      whereConditions.push('d.status = ?');
      countParams.push(status);
      params.push(status);
      hasWhere = true;
    }

    // Add date range filter
    if (startDate && endDate) {
      whereConditions.push('DATE(d.date_created) BETWEEN ? AND ?');
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
      whereConditions.push('MONTH(d.date_created) = ? AND YEAR(d.date_created) = YEAR(CURDATE())');
      countParams.push(monthIndex);
      params.push(monthIndex);
      hasWhere = true;
    } else if (sortByValue === 'This Month') {
      whereConditions.push('MONTH(d.date_created) = MONTH(CURDATE()) AND YEAR(d.date_created) = YEAR(CURDATE())');
      hasWhere = true;
    } else if (sortByValue === 'Last Month') {
      whereConditions.push('MONTH(d.date_created) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(d.date_created) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))');
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
      case 'Department Name (A-Z)':
        orderByClause += 'd.department_name ASC';
        break;
      case 'Department Name (Z-A)':
        orderByClause += 'd.department_name DESC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'd.date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'd.date_created ASC';
        break;
      case 'Status (A-Z)':
        orderByClause += 'd.status ASC';
        break;
      default:
        orderByClause += 'd.date_created DESC'; // Default sorting
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

    // Get total joined members across all departments (not just current page)
    let totalJoinedMembersQuery = 'SELECT SUM(CASE WHEN d.joined_members IS NULL OR d.joined_members = "" THEN 0 ELSE JSON_LENGTH(d.joined_members) END) as total FROM tbl_departments d LEFT JOIN tbl_members m ON d.member_id = m.member_id';
    if (hasWhere) {
      totalJoinedMembersQuery += ' WHERE ' + whereConditions.join(' AND ');
    }
    const [totalJoinedResult] = await query(totalJoinedMembersQuery, countParams);
    const totalJoinedMembers = totalJoinedResult[0]?.total || 0;

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
      message: 'Departments retrieved successfully',
      data: rows,
      count: rows.length,
      totalCount: totalCount,
      summaryStats: {
        totalJoinedMembers: totalJoinedMembers
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
    console.error('Error fetching departments:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single department by ID
 * @param {Number} departmentId - Department ID
 * @returns {Promise<Object>} Department record
 */
async function getDepartmentById(departmentId) {
  try {
    if (!departmentId) {
      throw new Error('Department ID is required');
    }

    const sql = `SELECT 
      d.department_id,
      d.department_name,
      d.status,
      d.date_created,
      d.member_id,
      d.joined_members,
      m.firstname as member_firstname,
      m.lastname as member_lastname,
      m.middle_name as member_middle_name,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as member_fullname,
      CASE 
        WHEN d.joined_members IS NULL OR d.joined_members = '' THEN 0
        ELSE JSON_LENGTH(d.joined_members)
      END as joined_members_count
    FROM tbl_departments d
    LEFT JOIN tbl_members m ON d.member_id = m.member_id
    WHERE d.department_id = ?`;
    const [rows] = await query(sql, [departmentId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Department not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Department retrieved successfully',
      data: rows[0]
    };
  } catch (error) {
    console.error('Error fetching department:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single department by name
 * @param {String} departmentName - Department name
 * @returns {Promise<Object>} Department record
 */
async function getDepartmentByName(departmentName) {
  try {
    if (!departmentName) {
      throw new Error('Department name is required');
    }

    const sql = 'SELECT * FROM tbl_departments WHERE LOWER(TRIM(department_name)) = LOWER(TRIM(?))';
    const [rows] = await query(sql, [departmentName]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Department not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Department retrieved successfully',
      data: rows[0]
    };
  } catch (error) {
    console.error('Error fetching department by name:', error);
    throw error;
  }
}

/**
 * UPDATE - Update an existing department record
 * @param {Number} departmentId - Department ID
 * @param {Object} departmentData - Updated department data
 * @returns {Promise<Object>} Result object
 */
async function updateDepartment(departmentId, departmentData) {
  try {
    if (!departmentId) {
      throw new Error('Department ID is required');
    }

    // Check if department exists
    const departmentCheck = await getDepartmentById(departmentId);
    if (!departmentCheck.success) {
      return {
        success: false,
        message: 'Department not found',
        data: null
      };
    }

    const {
      department_name,
      status,
      date_created,
      member_id,
      joined_members
    } = departmentData;

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (department_name !== undefined) {
      // Check for duplicate department name (excluding current department)
      const duplicateCheck = await checkDuplicateDepartment(department_name.trim(), departmentId);
      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          message: 'A department with this name already exists',
          error: 'Duplicate department name'
        };
      }

      fields.push('department_name = ?');
      params.push(department_name.trim());
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

    if (member_id !== undefined) {
      fields.push('member_id = ?');
      params.push(member_id ? member_id.trim() : null);
    }

    if (joined_members !== undefined) {
      // Validate and format joined_members if provided
      let joinedMembersJson = null;
      if (joined_members !== null) {
        if (Array.isArray(joined_members)) {
          joinedMembersJson = JSON.stringify(joined_members);
          if (joinedMembersJson.length > 2000) {
            return {
              success: false,
              message: 'joined_members array is too large (max 2000 characters)',
              error: 'joined_members length exceeded'
            };
          }
        } else if (typeof joined_members === 'string') {
          // If it's already a JSON string, validate it
          try {
            const parsed = JSON.parse(joined_members);
            if (!Array.isArray(parsed)) {
              return {
                success: false,
                message: 'joined_members must be an array',
                error: 'Invalid joined_members format'
              };
            }
            joinedMembersJson = joined_members;
            if (joinedMembersJson.length > 2000) {
              return {
                success: false,
                message: 'joined_members length exceeded',
                error: 'joined_members length exceeded'
              };
            }
          } catch (e) {
            return {
              success: false,
              message: 'Invalid JSON format for joined_members',
              error: 'Invalid joined_members format'
            };
          }
        } else {
          return {
            success: false,
            message: 'joined_members must be an array or JSON string',
            error: 'Invalid joined_members format'
          };
        }
      }
      fields.push('joined_members = ?');
      params.push(joinedMembersJson);
    }

    if (fields.length === 0) {
      return {
        success: false,
        message: 'No fields to update',
        data: null
      };
    }

    params.push(departmentId);

    const sql = `
      UPDATE tbl_departments
      SET ${fields.join(', ')}
      WHERE department_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Department not found or no changes made',
        data: null
      };
    }

    // Fetch updated department
    const updatedDepartment = await getDepartmentById(departmentId);

    return {
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment.data
    };
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
}

/**
 * DELETE - Delete a department record (archives it first)
 * @param {Number} departmentId - Department ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteDepartment(departmentId, archivedBy = null) {
  try {
    if (!departmentId) {
      throw new Error('Department ID is required');
    }

    // Check if department exists
    const departmentCheck = await getDepartmentById(departmentId);
    if (!departmentCheck.success) {
      return {
        success: false,
        message: 'Department not found',
        data: null
      };
    }

    // Archive the record before deleting
    await archiveBeforeDelete(
      'tbl_departments',
      String(departmentId),
      departmentCheck.data,
      archivedBy
    );

    // Delete from original table
    const sql = 'DELETE FROM tbl_departments WHERE department_id = ?';
    const [result] = await query(sql, [departmentId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Department not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Department archived and deleted successfully',
      data: { department_id: departmentId }
    };
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
}

/**
 * EXPORT - Export department records to Excel
 * @param {Object} options - Optional query parameters (same as getAllDepartments: search, status, sortBy)
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportDepartmentsToExcel(options = {}) {
  try {
    // Get all departments matching the filters (without pagination for export)
    // Note: getAllDepartments already includes JOIN with members table for member_fullname
    const exportOptions = { ...options };
    // Remove pagination to get all records
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    const result = await getAllDepartments(exportOptions);
    
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No departments found to export');
    }

    const departments = result.data;

    // Prepare data for Excel export
    const excelData = departments.map((department, index) => {
      return {
        'No.': index + 1,
        'Department ID': department.department_id || '',
        'Department Name': department.department_name || '',
        'Member': department.member_fullname || '',
        'Status': department.status || '',
        'Date Created': department.date_created ? moment(department.date_created).format('YYYY-MM-DD HH:mm:ss') : '',
        'Created Date': department.date_created ? moment(department.date_created).format('YYYY-MM-DD') : ''
      };
    });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 15 },  // Department ID
      { wch: 25 },  // Department Name
      { wch: 30 },  // Member
      { wch: 12 },  // Status
      { wch: 20 },  // Date Created
      { wch: 15 }   // Created Date
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Departments');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });

    return excelBuffer;
  } catch (error) {
    console.error('Error exporting departments to Excel:', error);
    throw error;
  }
}

/**
 * Get all departments for select elements (simplified data)
 * @returns {Promise<Object>} Object with department list (id, name)
 */
async function getAllDepartmentsForSelect() {
  try {
    const sql = `SELECT 
      department_id,
      department_name
    FROM tbl_departments
    WHERE status = 'active'
    ORDER BY department_name ASC`;

    const [rows] = await query(sql);

    return {
      success: true,
      message: 'Departments retrieved successfully for select',
      data: rows.map(dept => ({
        id: dept.department_id,
        name: dept.department_name
      }))
    };
  } catch (error) {
    console.error('Error fetching departments for select:', error);
    throw error;
  }
}

/**
 * BULK DELETE DEPARTMENTS - Permanently delete multiple department records in a single operation
 * @param {Array<Number>} departmentIds - Array of Department IDs to delete
 * @param {String} archivedBy - User ID who is archiving the records
 * @returns {Promise<Object>} Result object with success/failure counts
 */
async function bulkDeleteDepartments(departmentIds, archivedBy = null) {
  try {
    if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
      throw new Error('Department IDs array is required and cannot be empty');
    }

    // Validate all IDs are numbers
    const validIds = departmentIds.filter(id => typeof id === 'number' && id > 0);
    if (validIds.length === 0) {
      throw new Error('No valid department IDs provided');
    }

    // Archive departments before bulk delete
    const departmentsToDelete = [];

    // Get department data for archiving
    for (const departmentId of validIds) {
      try {
        const department = await getDepartmentById(departmentId);
        if (department.success && department.data) {
          departmentsToDelete.push(department.data);
          await archiveBeforeDelete('tbl_departments', String(departmentId), department.data, archivedBy);
        }
      } catch (error) {
        console.warn(`Failed to archive department ${departmentId}:`, error.message);
        // Continue with deletion even if archiving fails
      }
    }

    // Perform bulk delete
    const placeholders = validIds.map(() => '?').join(',');
    const deleteSql = `DELETE FROM tbl_departments WHERE department_id IN (${placeholders})`;
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
        archived_departments: departmentsToDelete
      }
    };
  } catch (error) {
    console.error('Error bulk deleting departments:', error);
    throw error;
  }
}

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  getDepartmentByName,
  updateDepartment,
  deleteDepartment,
  bulkDeleteDepartments,
  checkDuplicateDepartment,
  exportDepartmentsToExcel,
  getAllDepartmentsForSelect
};

