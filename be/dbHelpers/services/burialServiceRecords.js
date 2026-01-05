const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const { sendBurialDetails } = require('../emailHelperSendGrid');
const { archiveBeforeDelete } = require('../archiveHelper');

/**
 * Burial Service Records CRUD Operations
 * Based on tbl_burialservice schema:
 * - burial_id (VARCHAR(45), PK, NN)
 * - relationship (VARCHAR(45), NN)
 * - location (VARCHAR(45), NN)
 * - pastor_id (VARCHAR(45), NN)
 * - service_date (DATETIME, NN)
 * - status (VARCHAR(45), NN, default: 'pending')
 * - date_created (DATETIME, NN)
 * - member_id (VARCHAR(45), NN)
 * - deceased_name (VARCHAR(100))
 * - deceased_birthdate (DATE)
 * - date_death (DATETIME)
 */

/**
 * Get the next burial_id (incremental)
 * @returns {Promise<String>} Next burial_id as zero-padded string
 */
async function getNextBurialId() {
  try {
    const sql = 'SELECT MAX(burial_id) AS max_burial_id FROM tbl_burialservice';
    const [rows] = await query(sql);
    
    // If no records exist, start with 1, otherwise increment by 1
    const maxId = rows[0]?.max_burial_id || null;
    
    if (!maxId) {
      // First record - return "0000000001"
      return '0000000001';
    }
    
    // Extract numeric part if burial_id has prefix (e.g., "BURIAL0000000001" -> 1)
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
    console.error('Error getting next burial ID:', error);
    throw error;
  }
}

/**
 * CREATE - Insert a new burial service record
 * @param {Object} burialData - Burial service data object
 * @returns {Promise<Object>} Result object
 */
async function createBurialService(burialData) {
  try {
    // Get next burial_id if not provided
    const new_burial_id = await getNextBurialId();
    console.log('New burial ID:', new_burial_id);
    
    const {
      burial_id = new_burial_id,
      member_id,
      relationship,
      location,
      pastor_name,
      service_date,
      status = 'pending',
      date_created = new Date(),
      deceased_name = null,
      deceased_birthdate = null,
      date_death = null
    } = burialData;

    // Validate required fields (burial_id is auto-generated if not provided)
    if (!member_id) {
      throw new Error('Missing required field: member_id');
    }
    if (!relationship) {
      throw new Error('Missing required field: relationship');
    }
    if (!location) {
      throw new Error('Missing required field: location');
    }
   

    // Check for possible duplicate: same member + same deceased name + same death date (if provided)
    const duplicateCheckSql = `
      SELECT burial_id 
      FROM tbl_burialservice
      WHERE member_id = ?
        AND (${deceased_name ? 'deceased_name = ?' : '1=1'})
        AND (${date_death ? 'date_death = ?' : '1=1'})
      LIMIT 1
    `;
    const duplicateParams = [String(member_id).trim()];
    if (deceased_name) duplicateParams.push(deceased_name.trim());
    if (date_death) duplicateParams.push(moment(date_death).format('YYYY-MM-DD HH:mm:ss'));

    const [duplicateRows] = await query(duplicateCheckSql, duplicateParams);
    if (duplicateRows && duplicateRows.length > 0) {
      return {
        success: false,
        message: 'A burial service record already exists for this member with the same deceased information.'
      };
    }

    // Ensure burial_id is set and convert to string
    const final_burial_id = String(burial_id || new_burial_id).trim();
    
    // Convert member_id to string, pastor_name to string
    const final_member_id = String(member_id).trim();
    const final_pastor_name = pastor_name ? String(pastor_name).trim() : null;

    // Format dates
    // Handle null, empty string, or falsy values as null for service_date
    const formattedServiceDate = (service_date === null || service_date === '' || !service_date) 
      ? null 
      : moment(service_date).format('YYYY-MM-DD HH:mm:ss');
    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');
    const formattedBirthdate = deceased_birthdate ? moment(deceased_birthdate).format('YYYY-MM-DD') : null;
    const formattedDateDeath = date_death ? moment(date_death).format('YYYY-MM-DD HH:mm:ss') : null;

    const sql = `
      INSERT INTO tbl_burialservice 
        (burial_id, member_id, relationship, location, pastor_name, service_date, status, date_created, deceased_name, deceased_birthdate, date_death)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      final_burial_id,
      final_member_id,
      relationship.trim(),
      location.trim(),
      final_pastor_name,
      formattedServiceDate,
      status,
      formattedDateCreated,
      deceased_name ? deceased_name.trim() : null,
      formattedBirthdate,
      formattedDateDeath
    ];

    const [result] = await query(sql, params);
    
    // Fetch the created burial service
    const createdBurialService = await getBurialServiceById(final_burial_id);

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

        await sendBurialDetails({
          email: member.email,
          status: createdBurialService.data.status,
          deceasedName: createdBurialService.data.deceased_name,
          familyContact: recipientName || member.phone_number || 'N/A',
          burialDate: createdBurialService.data.service_date
            ? moment(createdBurialService.data.service_date).format('YYYY-MM-DD HH:mm:ss')
            : 'To be determined',
          location: createdBurialService.data.location,
          recipientName
        });
      }
    } catch (emailError) {
      // Log but don't block record creation if email fails
      console.error('Error sending burial creation email:', emailError);
    }

    return {
      success: true,
      message: 'Burial service created successfully',
      data: createdBurialService.data
    };
  } catch (error) {
    console.error('Error creating burial service:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all burial service records with pagination and filters
 * Enhanced with FULLTEXT search capabilities
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, status, sortBy, useFulltext)
 * @returns {Promise<Object>} Object with paginated burial service records and metadata
 */
async function getAllBurialServices(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const status = options.status || null;
    const sortBy = options.sortBy || null;
    const useFulltext = options.useFulltext !== false; // Default to true for better performance

    // Build base query for counting total records (with JOIN for accurate count)
    let countSql = 'SELECT COUNT(*) as total FROM tbl_burialservice bs INNER JOIN tbl_members m ON bs.member_id = m.member_id';
    let countParams = [];

    // Build query for fetching records with member data using FULLTEXT
    let sql = `SELECT 
      bs.*,
      m.firstname,
      m.lastname,
      m.middle_name,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as fullname
    FROM tbl_burialservice bs
    INNER JOIN tbl_members m ON bs.member_id = m.member_id`;
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality with FULLTEXT support
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      if (useFulltext) {
        // Use FULLTEXT search for better performance and relevance
        const fulltextCondition = `MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name) AGAINST(? IN NATURAL LANGUAGE MODE)`;
        const memberFulltextCondition = `MATCH(m.firstname, m.lastname, m.middle_name) AGAINST(? IN NATURAL LANGUAGE MODE)`;
        
        // Combine FULLTEXT conditions with OR logic
        const searchCondition = `(${fulltextCondition} OR ${memberFulltextCondition})`;
        
        whereConditions.push(searchCondition);
        countParams.push(searchValue, searchValue);
        params.push(searchValue, searchValue);
      } else {
        // Fallback to LIKE search for compatibility
        const searchCondition = `(bs.burial_id LIKE ? OR bs.deceased_name LIKE ? OR bs.location LIKE ? OR bs.pastor_name LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ? OR m.middle_name LIKE ? OR CONCAT(m.firstname, ' ', IFNULL(m.middle_name, ''), ' ', m.lastname) LIKE ?)`;
        const searchPattern = `%${searchValue}%`;

        whereConditions.push(searchCondition);
        countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }
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

    // Add sorting with FULLTEXT relevance support
    let orderByClause = ' ORDER BY ';
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;
    switch (sortByValue) {
      case 'Burial ID (A-Z)':
        orderByClause += 'bs.burial_id ASC';
        break;
      case 'Burial ID (Z-A)':
        orderByClause += 'bs.burial_id DESC';
        break;
      case 'Service Date (Newest)':
        orderByClause += 'bs.service_date DESC';
        break;
      case 'Service Date (Oldest)':
        orderByClause += 'bs.service_date ASC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'bs.date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'bs.date_created ASC';
        break;
      case 'Status (A-Z)':
        orderByClause += 'bs.status ASC';
        break;
      case 'Pastor Name (A-Z)':
        orderByClause += 'bs.pastor_name ASC';
        break;
      case 'Pastor Name (Z-A)':
        orderByClause += 'bs.pastor_name DESC';
        break;
      case 'Location (A-Z)':
        orderByClause += 'bs.location ASC';
        break;
      case 'Location (Z-A)':
        orderByClause += 'bs.location DESC';
        break;
      case 'Relevance':
        // Only available with FULLTEXT search
        if (useFulltext && searchValue) {
          orderByClause += 'MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name) AGAINST(? IN NATURAL LANGUAGE MODE) DESC, ';
          params.push(searchValue);
        }
        orderByClause += 'bs.date_created DESC';
        break;
      default:
        orderByClause += 'bs.date_created DESC'; // Default sorting
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
      'SELECT status, COUNT(*) as count FROM tbl_burialservice GROUP BY status'
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
    const [allTotalResult] = await query('SELECT COUNT(*) as total FROM tbl_burialservice');
    summaryStats.total = allTotalResult[0]?.total || 0;
    
    // Map status counts
    allStatusCountsResult.forEach(row => {
      if (summaryStats.hasOwnProperty(row.status)) {
        summaryStats[row.status] = row.count;
      }
    });

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
      message: 'Burial services retrieved successfully',
      data: rows,
      count: rows.length,
      totalCount: totalCount,
      summaryStats: summaryStats,
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
    console.error('Error fetching burial services:', error);
    throw error;
  }
}

/**
 * READ - Get burial services by member_id
 * @param {String} memberId - Member ID
 * @returns {Promise<Object>} Burial service records
 */
async function getBurialServicesByMemberId(memberId) {
  try {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    // Convert member_id to string for comparison (burial service uses VARCHAR member_id)
    const memberIdStr = String(memberId).trim();

    const sql = `SELECT 
      bs.*,
      m.firstname,
      m.lastname,
      m.middle_name,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as fullname
    FROM tbl_burialservice bs
    INNER JOIN tbl_members m ON bs.member_id = m.member_id
    WHERE bs.member_id = ?
    ORDER BY bs.date_created DESC`;
    const [rows] = await query(sql, [memberIdStr]);

    return {
      success: true,
      message: 'Burial services retrieved successfully',
      data: rows
    };
  } catch (error) {
    console.error('Error fetching burial services by member ID:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single burial service by ID
 * @param {String} burialId - Burial ID
 * @returns {Promise<Object>} Burial service record
 */
async function getBurialServiceById(burialId) {
  try {
    if (!burialId) {
      throw new Error('Burial ID is required');
    }

    const sql = 'SELECT * FROM tbl_burialservice WHERE burial_id = ?';
    const [rows] = await query(sql, [burialId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Burial service not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Burial service retrieved successfully',
      data: rows[0]
    };
  } catch (error) {
    console.error('Error fetching burial service:', error);
    throw error;
  }
}

/**
 * UPDATE - Update an existing burial service record
 * @param {String} burialId - Burial ID
 * @param {Object} burialData - Updated burial service data
 * @returns {Promise<Object>} Result object
 */
async function updateBurialService(burialId, burialData) {
  try {
    if (!burialId) {
      throw new Error('Burial ID is required');
    }

    // Check if burial service exists
    const burialCheck = await getBurialServiceById(burialId);
    if (!burialCheck.success) {
      return {
        success: false,
        message: 'Burial service not found',
        data: null
      };
    }

    const {
      member_id,
      relationship,
      location,
      pastor_name,
      service_date,
      status,
      date_created,
      deceased_name,
      deceased_birthdate,
      date_death
    } = burialData;

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (member_id !== undefined) {
      fields.push('member_id = ?');
      params.push(String(member_id).trim());
    }

    if (relationship !== undefined) {
      fields.push('relationship = ?');
      params.push(relationship.trim());
    }

    if (location !== undefined) {
      fields.push('location = ?');
      params.push(location.trim());
    }

    if (pastor_name !== undefined) {
      fields.push('pastor_name = ?');
      params.push(pastor_name ? String(pastor_name).trim() : null);
    }

    if (service_date !== undefined) {
      // Handle null, empty string, or falsy values as null
      if (service_date === null || service_date === '' || !service_date) {
        fields.push('service_date = ?');
        params.push(null);
      } else {
      const formattedServiceDate = moment(service_date).format('YYYY-MM-DD HH:mm:ss');
      fields.push('service_date = ?');
      params.push(formattedServiceDate);
      }
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

    if (deceased_name !== undefined) {
      fields.push('deceased_name = ?');
      params.push(deceased_name ? deceased_name.trim() : null);
    }

    if (deceased_birthdate !== undefined) {
      const formattedBirthdate = deceased_birthdate ? moment(deceased_birthdate).format('YYYY-MM-DD') : null;
      fields.push('deceased_birthdate = ?');
      params.push(formattedBirthdate);
    }

    if (date_death !== undefined) {
      const formattedDateDeath = date_death ? moment(date_death).format('YYYY-MM-DD HH:mm:ss') : null;
      fields.push('date_death = ?');
      params.push(formattedDateDeath);
    }

    if (fields.length === 0) {
      return {
        success: false,
        message: 'No fields to update',
        data: null
      };
    }

    params.push(burialId);

    const sql = `
      UPDATE tbl_burialservice
      SET ${fields.join(', ')}
      WHERE burial_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Burial service not found or no changes made',
        data: null
      };
    }

    // Fetch updated burial service
    const updatedBurialService = await getBurialServiceById(burialId);

    // Send email notification to the member (if we can resolve email)
    try {
      // Get member contact details
      const [memberRows] = await query(
        `SELECT firstname, lastname, middle_name, email, phone_number
         FROM tbl_members
         WHERE member_id = ?`,
        [updatedBurialService.data.member_id]
      );

      if (memberRows && memberRows.length > 0) {
        const member = memberRows[0];
        const recipientName = `${member.firstname || ''} ${member.middle_name ? member.middle_name + ' ' : ''}${member.lastname || ''}`.trim() || 'Valued Member';

        await sendBurialDetails({
          email: member.email,
          status: updatedBurialService.data.status,
          deceasedName: updatedBurialService.data.deceased_name,
          familyContact: recipientName || member.phone_number || 'N/A',
          burialDate: updatedBurialService.data.service_date
            ? moment(updatedBurialService.data.service_date).format('YYYY-MM-DD HH:mm:ss')
            : 'To be determined',
          location: updatedBurialService.data.location,
          recipientName
        });
      }
    } catch (emailError) {
      // Do not block update flow on email failure, just log for diagnostics
      console.error('Error sending burial update email:', emailError);
    }

    return {
      success: true,
      message: 'Burial service updated successfully',
      data: updatedBurialService.data
    };
  } catch (error) {
    console.error('Error updating burial service:', error);
    throw error;
  }
}

/**
 * DELETE - Delete a burial service record (archives it first)
 * @param {String} burialId - Burial ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteBurialService(burialId, archivedBy = null) {
  try {
    if (!burialId) {
      throw new Error('Burial ID is required');
    }

    // Check if burial service exists
    const burialCheck = await getBurialServiceById(burialId);
    if (!burialCheck.success) {
      return {
        success: false,
        message: 'Burial service not found',
        data: null
      };
    }

    // Archive the record before deleting
    await archiveBeforeDelete(
      'tbl_burialservice',
      String(burialId),
      burialCheck.data,
      archivedBy
    );

    // Delete from original table
    const sql = 'DELETE FROM tbl_burialservice WHERE burial_id = ?';
    const [result] = await query(sql, [burialId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Burial service not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Burial service archived and deleted successfully',
      data: { burial_id: burialId }
    };
  } catch (error) {
    console.error('Error deleting burial service:', error);
    throw error;
  }
}

/**
 * EXPORT - Export burial service records to Excel
 * @param {Object} options - Optional query parameters (same as getAllBurialServices: search, status, sortBy)
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportBurialServicesToExcel(options = {}) {
  try {
    const exportOptions = { ...options };
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    const result = await getAllBurialServices(exportOptions);
    
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No burial services found to export');
    }

    const services = result.data;

    const excelData = services.map((service, index) => {
      return {
        'No.': index + 1,
        'Burial ID': service.burial_id || '',
        'Member ID': service.member_id || '',
        'Member Name': service.fullname || '',
        'Deceased Name': service.deceased_name || '',
        'Relationship': service.relationship || '',
        'Location': service.location || '',
        'Pastor Name': service.pastor_name || '',
        'Service Date': service.service_date ? moment(service.service_date).format('YYYY-MM-DD HH:mm:ss') : '',
        'Status': service.status || '',
        'Date Created': service.date_created ? moment(service.date_created).format('YYYY-MM-DD HH:mm:ss') : '',
        'Deceased Birthdate': service.deceased_birthdate ? moment(service.deceased_birthdate).format('YYYY-MM-DD') : '',
        'Date of Death': service.date_death ? moment(service.date_death).format('YYYY-MM-DD HH:mm:ss') : ''
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 15 },  // Burial ID
      { wch: 15 },  // Member ID
      { wch: 25 },  // Member Name
      { wch: 30 },  // Deceased Name
      { wch: 20 },  // Relationship
      { wch: 25 },  // Location
      { wch: 25 },  // Pastor Name
      { wch: 20 },  // Service Date
      { wch: 15 },  // Status
      { wch: 20 },  // Date Created
      { wch: 18 },  // Deceased Birthdate
      { wch: 22 }   // Date of Death
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Burial Services');

    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });

    return excelBuffer;
  } catch (error) {
    console.error('Error exporting burial services to Excel:', error);
    throw error;
  }
}

/**
 * FULLTEXT SEARCH - Specialized function for advanced search using FULLTEXT indexes
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results with relevance scoring
 */
async function searchBurialServicesFulltext(options = {}) {
  try {
    const {
      search,
      limit = 50,
      offset = 0,
      minRelevance = 0
    } = options;

    if (!search || search.trim() === '') {
      return {
        success: false,
        message: 'Search term is required for FULLTEXT search',
        data: [],
        count: 0
      };
    }

    const searchTerm = search.trim();

    // FULLTEXT search query with relevance scoring
    const sql = `SELECT 
      bs.*,
      m.firstname,
      m.lastname,
      m.middle_name,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as fullname,
      MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name) AGAINST(? IN NATURAL LANGUAGE MODE) as burial_relevance,
      MATCH(m.firstname, m.lastname, m.middle_name) AGAINST(? IN NATURAL LANGUAGE MODE) as member_relevance,
      (MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name) AGAINST(? IN NATURAL LANGUAGE MODE) +
       MATCH(m.firstname, m.lastname, m.middle_name) AGAINST(? IN NATURAL LANGUAGE MODE)) as total_relevance
    FROM tbl_burialservice bs
    INNER JOIN tbl_members m ON bs.member_id = m.member_id
    WHERE MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name) AGAINST(? IN NATURAL LANGUAGE MODE)
       OR MATCH(m.firstname, m.lastname, m.middle_name) AGAINST(? IN NATURAL LANGUAGE MODE)
    HAVING total_relevance > ?
    ORDER BY total_relevance DESC, bs.date_created DESC
    LIMIT ? OFFSET ?`;

    const params = [
      searchTerm, searchTerm, searchTerm, // For MATCH AGAINST
      minRelevance,
      parseInt(limit),
      parseInt(offset)
    ];

    const [rows] = await query(sql, params);

    // Get total count for pagination
    const countSql = `SELECT COUNT(*) as total
      FROM tbl_burialservice bs
      INNER JOIN tbl_members m ON bs.member_id = m.member_id
      WHERE MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name) AGAINST(? IN NATURAL LANGUAGE MODE)
         OR MATCH(m.firstname, m.lastname, m.middle_name) AGAINST(? IN NATURAL LANGUAGE MODE)
      HAVING (MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name) AGAINST(? IN NATURAL LANGUAGE MODE) +
              MATCH(m.firstname, m.lastname, m.middle_name) AGAINST(? IN NATURAL LANGUAGE MODE)) > ?`;
    
    const [countResult] = await query(countSql, [searchTerm, searchTerm, searchTerm, searchTerm, minRelevance]);
    const totalCount = countResult[0]?.total || 0;

    return {
      success: true,
      message: 'FULLTEXT search completed successfully',
      data: rows,
      count: rows.length,
      totalCount: totalCount,
      searchTerm: searchTerm,
      relevanceThreshold: minRelevance
    };
  } catch (error) {
    console.error('Error in FULLTEXT search:', error);
    throw error;
  }
}

module.exports = {
  createBurialService,
  getAllBurialServices,
  getBurialServiceById,
  getBurialServicesByMemberId,
  updateBurialService,
  deleteBurialService,
  exportBurialServicesToExcel,
  searchBurialServicesFulltext  // New FULLTEXT search function
};

