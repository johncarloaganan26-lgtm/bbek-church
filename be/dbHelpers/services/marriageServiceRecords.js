const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const { archiveBeforeDelete } = require('../archiveHelper');
const { sendMarriageDetails } = require('../emailHelper');

/**
 * Update civil status of groom and bride to 'married' when marriage is completed
 * @param {String} marriageId - Marriage ID
 * @returns {Promise<void>}
 */
async function updateMarriageMembersCivilStatus(marriageId) {
  try {
    // Get groom and bride member IDs (only update if member_id exists)
    const sql = 'SELECT groom_member_id, bride_member_id FROM tbl_marriageservice WHERE marriage_id = ?';
    const [rows] = await query(sql, [marriageId]);
    
    if (rows.length === 0) {
      console.warn(`Marriage service ${marriageId} not found for civil status update`);
      return;
    }
    
    const { groom_member_id, bride_member_id } = rows[0];
    
    // Update civil status only for members who have member_id (not for external names)
    const updateSql = 'UPDATE tbl_members SET civil_status = ? WHERE member_id = ?';
    
    if (groom_member_id) {
      await query(updateSql, ['married', groom_member_id]);
    }
    
    if (bride_member_id) {
      await query(updateSql, ['married', bride_member_id]);
    }
  } catch (error) {
    // Log but don't throw - civil status update should not block the main operation
    console.error('Error updating marriage members civil status:', error);
  }
}

/**
 * Marriage Service Records CRUD Operations
 * Based on tbl_marriageservice schema:
 * - marriage_id (VARCHAR(45), PK, NN)
 * - groom_member_id (VARCHAR(45), NN)
 * - bride_member_id (VARCHAR(45), NN)
 * - guardians (VARCHAR(1000), NN) - JSON stringified array
 * - pastor_id (VARCHAR(45), NN)
 * - location (VARCHAR(45), NN)
 * - marriage_date (DATETIME, NN)
 * - status (VARCHAR(45), NN, default: 'pending')
 * - date_created (DATETIME, nullable)
 */

/**
 * Check for marriage date conflicts
 * @param {String} marriageDate - Marriage date to check
 * @param {String} groomMemberId - Groom member ID (optional)
 * @param {String} brideMemberId - Bride member ID (optional)
 * @param {String} pastorId - Pastor ID (optional)
 * @param {String} excludeMarriageId - Marriage ID to exclude from conflict check (for updates)
 * @returns {Promise<Object|null>} Conflict details or null if no conflict
 */
async function checkMarriageDateConflict(marriageDate, groomMemberId, brideMemberId, pastorId, excludeMarriageId = null) {
  try {
    const formattedMarriageDate = moment(marriageDate).format('YYYY-MM-DD HH:mm:ss');
    const conflictConditions = [];
    const conflictParams = [];

    // Check for groom conflict (if groom_member_id is provided)
    if (groomMemberId) {
      conflictConditions.push('(groom_member_id = ? AND marriage_date = ?)');
      conflictParams.push(groomMemberId.trim(), formattedMarriageDate);
    }

    // Check for bride conflict (if bride_member_id is provided)
    if (brideMemberId) {
      conflictConditions.push('(bride_member_id = ? AND marriage_date = ?)');
      conflictParams.push(brideMemberId.trim(), formattedMarriageDate);
    }

    // Check for pastor conflict (if pastor_id is provided)
    if (pastorId) {
      conflictConditions.push('(pastor_id = ? AND marriage_date = ?)');
      conflictParams.push(pastorId.trim(), formattedMarriageDate);
    }

    // If no conditions to check, return null (no conflict possible)
    if (conflictConditions.length === 0) {
      return null;
    }

    // Build conflict check query
    let conflictSql = `
      SELECT marriage_id, groom_member_id, bride_member_id, pastor_id, marriage_date, status
      FROM tbl_marriageservice
      WHERE (${conflictConditions.join(' OR ')})
    `;

    // Exclude current marriage_id if provided (for update operations)
    if (excludeMarriageId) {
      conflictSql += ' AND marriage_id != ?';
      conflictParams.push(excludeMarriageId.trim());
    }

    const [conflictRows] = await query(conflictSql, conflictParams);

    if (conflictRows && conflictRows.length > 0) {
      // Determine conflict type
      const conflict = conflictRows[0];
      let conflictType = [];
      let conflictMessage = 'Marriage date conflict detected: ';

      if (groomMemberId && conflict.groom_member_id === groomMemberId.trim()) {
        conflictType.push('groom');
        conflictMessage += 'Groom already has a marriage scheduled on this date. ';
      }
      if (brideMemberId && conflict.bride_member_id === brideMemberId.trim()) {
        conflictType.push('bride');
        conflictMessage += 'Bride already has a marriage scheduled on this date. ';
      }
      if (pastorId && conflict.pastor_id === pastorId.trim()) {
        conflictType.push('pastor');
        conflictMessage += 'Pastor already has a marriage scheduled on this date. ';
      }

      return {
        hasConflict: true,
        conflictType: conflictType,
        message: conflictMessage.trim(),
        conflictingMarriage: {
          marriage_id: conflict.marriage_id,
          marriage_date: conflict.marriage_date,
          status: conflict.status
        }
      };
    }

    return null; // No conflict
  } catch (error) {
    console.error('Error checking marriage date conflict:', error);
    // Don't throw - allow the operation to proceed if conflict check fails
    return null;
  }
}

/**
 * Get the next marriage_id (incremental)
 * @returns {Promise<String>} Next marriage_id as zero-padded string
 */
async function getNextMarriageId() {
  try {
    const sql = 'SELECT MAX(marriage_id) AS max_marriage_id FROM tbl_marriageservice';
    const [rows] = await query(sql);
    
    // If no records exist, start with 1, otherwise increment by 1
    const maxId = rows[0]?.max_marriage_id || null;
    
    if (!maxId) {
      // First record - return "0000000001"
      return '0000000001';
    }
    
    // Extract numeric part if marriage_id has prefix (e.g., "MARRIAGE0000000001" -> 1)
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
    console.error('Error getting next marriage ID:', error);
    throw error;
  }
}

/**
 * CREATE - Insert a new marriage service record
 * @param {Object} marriageData - Marriage service data object
 * @returns {Promise<Object>} Result object
 */
async function createMarriageService(marriageData) {
  try {
    // Get next marriage_id if not provided
    const new_marriage_id = await getNextMarriageId();
    console.log('New marriage ID:', new_marriage_id);
    
    const {
      marriage_id = new_marriage_id,
      groom_member_id,
      groom_name,
      bride_member_id,
      bride_name,
      guardians, // Should be an array
      pastor_id,
      location,
      marriage_date,
      status = 'pending',
      date_created = new Date()
    } = marriageData;

    // Validate required fields (marriage_id is auto-generated if not provided)
    // At least one of groom_member_id or bride_member_id must be provided
    if (!groom_member_id && !bride_member_id) {
      throw new Error('At least one member (groom or bride) must be selected');
    }
    
    // If groom_member_id is not provided, groom_name is required
    if (!groom_member_id && (!groom_name || !groom_name.trim())) {
      throw new Error('Groom name is required when groom member is not selected');
    }
    
    // If bride_member_id is not provided, bride_name is required
    if (!bride_member_id && (!bride_name || !bride_name.trim())) {
      throw new Error('Bride name is required when bride member is not selected');
    }
    if (!guardians) {
      throw new Error('Missing required field: guardians');
    }
    if (!location) {
      throw new Error('Missing required field: location');
    }
    // marriage_date is optional - can be null if not scheduled yet

    // Ensure marriage_id is set
    const final_marriage_id = marriage_id || new_marriage_id;

    // Convert guardians array to JSON string
    let guardiansJson = '';
    if (Array.isArray(guardians)) {
      guardiansJson = JSON.stringify(guardians);
    } else if (typeof guardians === 'string') {
      // If it's already a string, try to parse and re-stringify to validate
      try {
        const parsed = JSON.parse(guardians);
        guardiansJson = JSON.stringify(parsed);
      } catch (e) {
        // If not valid JSON, treat as plain string and wrap in array
        guardiansJson = JSON.stringify([guardians]);
      }
    } else {
      guardiansJson = JSON.stringify([guardians]);
    }

    // Validate guardians JSON length (max 1000 characters)
    if (guardiansJson.length > 1000) {
      return {
        success: false,
        message: 'Guardians data exceeds maximum length of 1000 characters',
        error: 'Guardians data too long'
      };
    }

    // Format dates - marriage_date can be null
    const formattedMarriageDate = marriage_date ? moment(marriage_date).format('YYYY-MM-DD HH:mm:ss') : null;
    const formattedDateCreated = date_created ? moment(date_created).format('YYYY-MM-DD HH:mm:ss') : null;

    // Check for marriage date conflicts only if marriage_date is provided
    if (marriage_date) {
      const conflictCheck = await checkMarriageDateConflict(
        marriage_date,
        groom_member_id,
        bride_member_id,
        pastor_id,
        null // No exclusion for new records
      );

      if (conflictCheck && conflictCheck.hasConflict) {
        return {
          success: false,
          message: conflictCheck.message,
          error: 'Marriage date conflict',
          conflict: conflictCheck.conflictingMarriage
        };
      }
    }

    const sql = `
      INSERT INTO tbl_marriageservice 
        (marriage_id, groom_member_id, groom_name, bride_member_id, bride_name, guardians, pastor_id, location, marriage_date, status, date_created)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      final_marriage_id.trim(),
      groom_member_id ? groom_member_id.trim() : null,
      groom_member_id ? null : (groom_name ? groom_name.trim() : null),
      bride_member_id ? bride_member_id.trim() : null,
      bride_member_id ? null : (bride_name ? bride_name.trim() : null),
      guardiansJson,
      pastor_id ? pastor_id.trim() : null,
      location.trim(),
      formattedMarriageDate,
      status,
      formattedDateCreated
    ];

    const [result] = await query(sql, params);
    
    // Fetch the created marriage service
    const createdMarriageService = await getMarriageServiceById(final_marriage_id);

    // Send email notification to groom and bride (best-effort; do not fail creation)
    try {
      // Get groom and bride details
      const [memberRows] = await query(
        `SELECT 
          ms.groom_member_id,
          ms.groom_name,
          groom.member_id as groom_member_id_from_table,
          groom.firstname as groom_firstname,
          groom.lastname as groom_lastname,
          groom.middle_name as groom_middle_name,
          groom.email as groom_email,
          ms.bride_member_id,
          ms.bride_name,
          bride.member_id as bride_member_id_from_table,
          bride.firstname as bride_firstname,
          bride.lastname as bride_lastname,
          bride.middle_name as bride_middle_name,
          bride.email as bride_email
         FROM tbl_marriageservice ms
         LEFT JOIN tbl_members groom ON ms.groom_member_id = groom.member_id
         LEFT JOIN tbl_members bride ON ms.bride_member_id = bride.member_id
         WHERE ms.marriage_id = ?`,
        [final_marriage_id]
      );

      if (memberRows && memberRows.length > 0) {
        const row = memberRows[0];
        // Use groom_name if groom_member_id is null, otherwise use member name
        const groomName = row.groom_member_id 
          ? `${row.groom_firstname || ''} ${row.groom_middle_name ? row.groom_middle_name + ' ' : ''}${row.groom_lastname || ''}`.trim() 
          : (row.groom_name || 'Groom');
        // Use bride_name if bride_member_id is null, otherwise use member name
        const brideName = row.bride_member_id 
          ? `${row.bride_firstname || ''} ${row.bride_middle_name ? row.bride_middle_name + ' ' : ''}${row.bride_lastname || ''}`.trim() 
          : (row.bride_name || 'Bride');
        const marriageDate = createdMarriageService.data.marriage_date
          ? moment(createdMarriageService.data.marriage_date).format('YYYY-MM-DD HH:mm:ss')
          : 'To be determined';
        const location = createdMarriageService.data.location || 'To be determined';

        // Send email to groom if available
        if (row.groom_email) {
          await sendMarriageDetails({
            email: row.groom_email,
            status: createdMarriageService.data.status,
            recipientName: groomName,
            groomName: groomName,
            brideName: brideName,
            marriageDate: marriageDate,
            location: location
          });
        }

        // Send email to bride if available
        if (row.bride_email) {
          await sendMarriageDetails({
            email: row.bride_email,
            status: createdMarriageService.data.status,
            recipientName: brideName,
            groomName: groomName,
            brideName: brideName,
            marriageDate: marriageDate,
            location: location
          });
        }
      }
    } catch (emailError) {
      // Log but don't block record creation if email fails
      console.error('Error sending marriage service creation email:', emailError);
    }

    return {
      success: true,
      message: 'Marriage service created successfully',
      data: createdMarriageService.data
    };
  } catch (error) {
    console.error('Error creating marriage service:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all marriage service records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, status, sortBy)
 * @returns {Promise<Object>} Object with paginated marriage service records and metadata
 */
async function getAllMarriageServices(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const status = options.status || null;
    const sortBy = options.sortBy || null;

    // Build base query for counting total records (count directly from tbl_marriageservice)
    let countSql = 'SELECT COUNT(*) as total FROM tbl_marriageservice ms';
    let countParams = [];

    // Build query for fetching records with member data (using LEFT JOIN to include records with null member_ids)
    let sql = `SELECT 
      ms.*,
      groom.firstname as groom_firstname,
      groom.lastname as groom_lastname,
      groom.middle_name as groom_middle_name,
      CONCAT(
        groom.firstname,
        IF(groom.middle_name IS NOT NULL AND groom.middle_name != '', CONCAT(' ', groom.middle_name), ''),
        ' ',
        groom.lastname
      ) as groom_fullname,
      bride.firstname as bride_firstname,
      bride.lastname as bride_lastname,
      bride.middle_name as bride_middle_name,
      CONCAT(
        bride.firstname,
        IF(bride.middle_name IS NOT NULL AND bride.middle_name != '', CONCAT(' ', bride.middle_name), ''),
        ' ',
        bride.lastname
      ) as bride_fullname
    FROM tbl_marriageservice ms
    LEFT JOIN tbl_members groom ON ms.groom_member_id = groom.member_id
    LEFT JOIN tbl_members bride ON ms.bride_member_id = bride.member_id`;
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality (search by marriage_id, member_ids, location, pastor_id, member names, or groom_name/bride_name)
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(ms.marriage_id LIKE ? OR ms.groom_member_id LIKE ? OR ms.bride_member_id LIKE ? OR ms.location LIKE ? OR ms.pastor_id LIKE ? OR ms.groom_name LIKE ? OR ms.bride_name LIKE ? OR groom.firstname LIKE ? OR groom.lastname LIKE ? OR bride.firstname LIKE ? OR bride.lastname LIKE ? OR CONCAT(groom.firstname, ' ', IFNULL(groom.middle_name, ''), ' ', groom.lastname) LIKE ? OR CONCAT(bride.firstname, ' ', IFNULL(bride.middle_name, ''), ' ', bride.lastname) LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      // Add 13 search patterns for count and main query
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
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
      case 'Marriage ID (A-Z)':
        orderByClause += 'ms.marriage_id ASC';
        break;
      case 'Marriage ID (Z-A)':
        orderByClause += 'ms.marriage_id DESC';
        break;
      case 'Marriage Date (Newest)':
        orderByClause += 'ms.marriage_date DESC';
        break;
      case 'Marriage Date (Oldest)':
        orderByClause += 'ms.marriage_date ASC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'ms.date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'ms.date_created ASC';
        break;
      case 'Groom Member ID (A-Z)':
        orderByClause += 'ms.groom_member_id ASC';
        break;
      case 'Bride Member ID (A-Z)':
        orderByClause += 'ms.bride_member_id ASC';
        break;
      case 'Status (A-Z)':
        orderByClause += 'ms.status ASC';
        break;
      default:
        orderByClause += 'ms.date_created DESC'; // Default sorting
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
      'SELECT status, COUNT(*) as count FROM tbl_marriageservice GROUP BY status'
    );
    const summaryStats = {
      total: 0,
      completed: 0,
      pending: 0,
      ongoing: 0
    };
    
    // Get total count of all records
    const [allTotalResult] = await query('SELECT COUNT(*) as total FROM tbl_marriageservice');
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

    // Parse guardians JSON string back to array for each record
    const parsedRows = rows.map(row => {
      try {
        if (row.guardians) {
          row.guardians = JSON.parse(row.guardians);
        }
      } catch (e) {
        // If parsing fails, keep as string or set to empty array
        console.warn('Failed to parse guardians JSON for marriage_id:', row.marriage_id);
        row.guardians = [];
      }
      return row;
    });

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || parsedRows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Marriage services retrieved successfully',
      data: parsedRows,
      count: parsedRows.length,
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
    console.error('Error fetching marriage services:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single marriage service by ID
 * @param {String} marriageId - Marriage ID
 * @returns {Promise<Object>} Marriage service record
 */
async function getMarriageServiceById(marriageId) {
  try {
    if (!marriageId) {
      throw new Error('Marriage ID is required');
    }

    const sql = 'SELECT * FROM tbl_marriageservice WHERE marriage_id = ?';
    const [rows] = await query(sql, [marriageId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Marriage service not found',
        data: null
      };
    }

    // Parse guardians JSON string back to array
    const row = rows[0];
    try {
      if (row.guardians) {
        row.guardians = JSON.parse(row.guardians);
      }
    } catch (e) {
      console.warn('Failed to parse guardians JSON for marriage_id:', marriageId);
      row.guardians = [];
    }

    return {
      success: true,
      message: 'Marriage service retrieved successfully',
      data: row
    };
  } catch (error) {
    console.error('Error fetching marriage service:', error);
    throw error;
  }
}

/**
 * READ ONE - Get marriage services by groom_member_id
 * @param {String} groomMemberId - Groom Member ID
 * @returns {Promise<Object>} Marriage service records
 */
async function getMarriageServicesByGroomMemberId(groomMemberId) {
  try {
    if (!groomMemberId) {
      throw new Error('Groom Member ID is required');
    }

    // Convert member_id to string for comparison (marriage service uses VARCHAR member_id)
    const groomMemberIdStr = String(groomMemberId).trim();

    const sql = 'SELECT * FROM tbl_marriageservice WHERE groom_member_id = ?';
    const [rows] = await query(sql, [groomMemberIdStr]);

    // Parse guardians JSON string back to array for each record
    const parsedRows = rows.map(row => {
      try {
        if (row.guardians) {
          row.guardians = JSON.parse(row.guardians);
        }
      } catch (e) {
        console.warn('Failed to parse guardians JSON for marriage_id:', row.marriage_id);
        row.guardians = [];
      }
      return row;
    });

    return {
      success: true,
      message: 'Marriage services retrieved successfully',
      data: parsedRows
    };
  } catch (error) {
    console.error('Error fetching marriage services by groom member ID:', error);
    throw error;
  }
}

/**
 * READ ONE - Get marriage services by bride_member_id
 * @param {String} brideMemberId - Bride Member ID
 * @returns {Promise<Object>} Marriage service records
 */
async function getMarriageServicesByBrideMemberId(brideMemberId) {
  try {
    if (!brideMemberId) {
      throw new Error('Bride Member ID is required');
    }

    // Convert member_id to string for comparison (marriage service uses VARCHAR member_id)
    const brideMemberIdStr = String(brideMemberId).trim();

    const sql = 'SELECT * FROM tbl_marriageservice WHERE bride_member_id = ?';
    const [rows] = await query(sql, [brideMemberIdStr]);

    // Parse guardians JSON string back to array for each record
    const parsedRows = rows.map(row => {
      try {
        if (row.guardians) {
          row.guardians = JSON.parse(row.guardians);
        }
      } catch (e) {
        console.warn('Failed to parse guardians JSON for marriage_id:', row.marriage_id);
        row.guardians = [];
      }
      return row;
    });

    return {
      success: true,
      message: 'Marriage services retrieved successfully',
      data: parsedRows
    };
  } catch (error) {
    console.error('Error fetching marriage services by bride member ID:', error);
    throw error;
  }
}

/**
 * UPDATE - Update an existing marriage service record
 * @param {String} marriageId - Marriage ID
 * @param {Object} marriageData - Updated marriage service data
 * @returns {Promise<Object>} Result object
 */
async function updateMarriageService(marriageId, marriageData) {
  try {
    if (!marriageId) {
      throw new Error('Marriage ID is required');
    }

    // Check if marriage service exists
    const marriageCheck = await getMarriageServiceById(marriageId);
    if (!marriageCheck.success) {
      return {
        success: false,
        message: 'Marriage service not found',
        data: null
      };
    }

    const {
      groom_member_id,
      groom_name,
      bride_member_id,
      bride_name,
      guardians,
      pastor_id,
      location,
      marriage_date,
      status,
      date_created
    } = marriageData;

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (groom_member_id !== undefined) {
      fields.push('groom_member_id = ?');
      params.push(groom_member_id ? groom_member_id.trim() : null);
      // If groom_member_id is set, clear groom_name; if not set and groom_name provided, set it
      if (groom_member_id) {
        fields.push('groom_name = ?');
        params.push(null);
      } else if (groom_name !== undefined) {
        fields.push('groom_name = ?');
        params.push(groom_name ? groom_name.trim() : null);
      }
    } else if (groom_name !== undefined) {
      // Only update groom_name if groom_member_id is not being updated
      fields.push('groom_name = ?');
      params.push(groom_name ? groom_name.trim() : null);
    }

    if (bride_member_id !== undefined) {
      fields.push('bride_member_id = ?');
      params.push(bride_member_id ? bride_member_id.trim() : null);
      // If bride_member_id is set, clear bride_name; if not set and bride_name provided, set it
      if (bride_member_id) {
        fields.push('bride_name = ?');
        params.push(null);
      } else if (bride_name !== undefined) {
        fields.push('bride_name = ?');
        params.push(bride_name ? bride_name.trim() : null);
      }
    } else if (bride_name !== undefined) {
      // Only update bride_name if bride_member_id is not being updated
      fields.push('bride_name = ?');
      params.push(bride_name ? bride_name.trim() : null);
    }

    if (guardians !== undefined) {
      // Convert guardians array to JSON string
      let guardiansJson = '';
      if (Array.isArray(guardians)) {
        guardiansJson = JSON.stringify(guardians);
      } else if (typeof guardians === 'string') {
        // If it's already a string, try to parse and re-stringify to validate
        try {
          const parsed = JSON.parse(guardians);
          guardiansJson = JSON.stringify(parsed);
        } catch (e) {
          // If not valid JSON, treat as plain string and wrap in array
          guardiansJson = JSON.stringify([guardians]);
        }
      } else {
        guardiansJson = JSON.stringify([guardians]);
      }

      // Validate guardians JSON length (max 1000 characters)
      if (guardiansJson.length > 1000) {
        return {
          success: false,
          message: 'Guardians data exceeds maximum length of 1000 characters',
          error: 'Guardians data too long'
        };
      }

      fields.push('guardians = ?');
      params.push(guardiansJson);
    }

    if (pastor_id !== undefined) {
      fields.push('pastor_id = ?');
      params.push(pastor_id ? pastor_id.trim() : null);
    }

    if (location !== undefined) {
      fields.push('location = ?');
      params.push(location.trim());
    }

    // Check for marriage date conflicts before updating
    // We need to check using the final values (new values if provided, otherwise current values)
    if (marriage_date !== undefined || groom_member_id !== undefined || bride_member_id !== undefined || pastor_id !== undefined) {
      const currentMarriage = marriageCheck.data;
      const finalGroomMemberId = groom_member_id !== undefined 
        ? (groom_member_id ? groom_member_id.trim() : null)
        : currentMarriage.groom_member_id;
      const finalBrideMemberId = bride_member_id !== undefined 
        ? (bride_member_id ? bride_member_id.trim() : null)
        : currentMarriage.bride_member_id;
      const finalPastorId = pastor_id !== undefined 
        ? (pastor_id ? pastor_id.trim() : null)
        : currentMarriage.pastor_id;
      const finalMarriageDate = marriage_date !== undefined ? marriage_date : currentMarriage.marriage_date;

      // Only check conflicts if marriage_date is provided and is being updated or if members/pastor are changing
      if (finalMarriageDate && (marriage_date !== undefined || finalGroomMemberId !== currentMarriage.groom_member_id || 
          finalBrideMemberId !== currentMarriage.bride_member_id || finalPastorId !== currentMarriage.pastor_id)) {
        const conflictCheck = await checkMarriageDateConflict(
          finalMarriageDate,
          finalGroomMemberId,
          finalBrideMemberId,
          finalPastorId,
          marriageId // Exclude current marriage for update
        );

        if (conflictCheck && conflictCheck.hasConflict) {
          return {
            success: false,
            message: conflictCheck.message,
            error: 'Marriage date conflict',
            conflict: conflictCheck.conflictingMarriage
          };
        }
      }
    }

    if (marriage_date !== undefined) {
      const formattedMarriageDate = marriage_date ? moment(marriage_date).format('YYYY-MM-DD HH:mm:ss') : null;
      fields.push('marriage_date = ?');
      params.push(formattedMarriageDate);
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

    params.push(marriageId);

    const sql = `
      UPDATE tbl_marriageservice
      SET ${fields.join(', ')}
      WHERE marriage_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Marriage service not found or no changes made',
        data: null
      };
    }

    // Fetch updated marriage service
    const updatedMarriageService = await getMarriageServiceById(marriageId);

    // Update civil status to 'married' for groom and bride if status is 'completed'
    if (updatedMarriageService.data && updatedMarriageService.data.status === 'completed') {
      try {
        await updateMarriageMembersCivilStatus(marriageId);
      } catch (civilStatusError) {
        // Log but don't block the update flow
        console.error('Error updating civil status:', civilStatusError);
      }
    }

    // Send email notification to groom and bride (if we can resolve emails)
    try {
      // Get groom and bride details
      const [memberRows] = await query(
        `SELECT 
          ms.groom_member_id,
          ms.groom_name,
          groom.member_id as groom_member_id_from_table,
          groom.firstname as groom_firstname,
          groom.lastname as groom_lastname,
          groom.middle_name as groom_middle_name,
          groom.email as groom_email,
          ms.bride_member_id,
          ms.bride_name,
          bride.member_id as bride_member_id_from_table,
          bride.firstname as bride_firstname,
          bride.lastname as bride_lastname,
          bride.middle_name as bride_middle_name,
          bride.email as bride_email
         FROM tbl_marriageservice ms
         LEFT JOIN tbl_members groom ON ms.groom_member_id = groom.member_id
         LEFT JOIN tbl_members bride ON ms.bride_member_id = bride.member_id
         WHERE ms.marriage_id = ?`,
        [marriageId]
      );

      if (memberRows && memberRows.length > 0) {
        const row = memberRows[0];
        // Use groom_name if groom_member_id is null, otherwise use member name
        const groomName = row.groom_member_id 
          ? `${row.groom_firstname || ''} ${row.groom_middle_name ? row.groom_middle_name + ' ' : ''}${row.groom_lastname || ''}`.trim() 
          : (row.groom_name || 'Groom');
        // Use bride_name if bride_member_id is null, otherwise use member name
        const brideName = row.bride_member_id 
          ? `${row.bride_firstname || ''} ${row.bride_middle_name ? row.bride_middle_name + ' ' : ''}${row.bride_lastname || ''}`.trim() 
          : (row.bride_name || 'Bride');
        const marriageDate = updatedMarriageService.data.marriage_date
          ? moment(updatedMarriageService.data.marriage_date).format('YYYY-MM-DD HH:mm:ss')
          : 'To be determined';
        const location = updatedMarriageService.data.location || 'To be determined';

        // Send email to groom if available
        if (row.groom_email) {
          await sendMarriageDetails({
            email: row.groom_email,
            status: updatedMarriageService.data.status,
            recipientName: groomName,
            groomName: groomName,
            brideName: brideName,
            marriageDate: marriageDate,
            location: location
          });
        }

        // Send email to bride if available
        if (row.bride_email) {
          await sendMarriageDetails({
            email: row.bride_email,
            status: updatedMarriageService.data.status,
            recipientName: brideName,
            groomName: groomName,
            brideName: brideName,
            marriageDate: marriageDate,
            location: location
          });
        }
      }
    } catch (emailError) {
      // Do not block update flow on email failure, just log for diagnostics
      console.error('Error sending marriage service update email:', emailError);
    }

    return {
      success: true,
      message: 'Marriage service updated successfully',
      data: updatedMarriageService.data
    };
  } catch (error) {
    console.error('Error updating marriage service:', error);
    throw error;
  }
}

/**
 * DELETE - Delete a marriage service record (archives it first)
 * @param {String} marriageId - Marriage ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteMarriageService(marriageId, archivedBy = null) {
  try {
    if (!marriageId) {
      throw new Error('Marriage ID is required');
    }

    // Check if marriage service exists
    const marriageCheck = await getMarriageServiceById(marriageId);
    if (!marriageCheck.success) {
      return {
        success: false,
        message: 'Marriage service not found',
        data: null
      };
    }

    // Archive the record before deleting
    await archiveBeforeDelete(
      'tbl_marriageservice',
      String(marriageId),
      marriageCheck.data,
      archivedBy
    );

    // Delete from original table
    const sql = 'DELETE FROM tbl_marriageservice WHERE marriage_id = ?';
    const [result] = await query(sql, [marriageId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Marriage service not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Marriage service archived and deleted successfully',
      data: { marriage_id: marriageId }
    };
  } catch (error) {
    console.error('Error deleting marriage service:', error);
    throw error;
  }
}

/**
 * EXPORT - Export marriage service records to Excel
 * @param {Object} options - Optional query parameters (same as getAllMarriageServices: search, status, sortBy)
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportMarriageServicesToExcel(options = {}) {
  try {
    const exportOptions = { ...options };
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    const result = await getAllMarriageServices(exportOptions);
    
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No marriage services found to export');
    }

    const marriages = result.data;

    const excelData = marriages.map((marriage, index) => {
      // Parse guardians if it's a JSON string, otherwise use as is
      let guardiansDisplay = '';
      if (marriage.guardians) {
        if (Array.isArray(marriage.guardians)) {
          guardiansDisplay = marriage.guardians.join(', ');
        } else if (typeof marriage.guardians === 'string') {
          try {
            const parsed = JSON.parse(marriage.guardians);
            guardiansDisplay = Array.isArray(parsed) ? parsed.join(', ') : parsed;
          } catch (e) {
            guardiansDisplay = marriage.guardians;
          }
        }
      }

      // Get groom and bride display names (fullname > name > member_id)
      const groomDisplay = marriage.groom_fullname || marriage.groom_name || marriage.groom_member_id || '';
      const brideDisplay = marriage.bride_fullname || marriage.bride_name || marriage.bride_member_id || '';

      return {
        'No.': index + 1,
        'Marriage ID': marriage.marriage_id || '',
        'Groom': groomDisplay,
        'Bride': brideDisplay,
        'Groom Member ID': marriage.groom_member_id || '',
        'Bride Member ID': marriage.bride_member_id || '',
        'Guardians': guardiansDisplay,
        'Pastor ID': marriage.pastor_id || '',
        'Location': marriage.location || '',
        'Marriage Date': marriage.marriage_date ? moment(marriage.marriage_date).format('YYYY-MM-DD HH:mm:ss') : '',
        'Status': marriage.status || '',
        'Date Created': marriage.date_created ? moment(marriage.date_created).format('YYYY-MM-DD HH:mm:ss') : ''
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 15 },  // Marriage ID
      { wch: 30 },  // Groom
      { wch: 30 },  // Bride
      { wch: 15 },  // Groom Member ID
      { wch: 15 },  // Bride Member ID
      { wch: 40 },  // Guardians
      { wch: 15 },  // Pastor ID
      { wch: 25 },  // Location
      { wch: 20 },  // Marriage Date
      { wch: 15 },  // Status
      { wch: 20 }   // Date Created
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marriage Services');

    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });

    return excelBuffer;
  } catch (error) {
    console.error('Error exporting marriage services to Excel:', error);
    throw error;
  }
}

module.exports = {
  createMarriageService,
  getAllMarriageServices,
  getMarriageServiceById,
  getMarriageServicesByGroomMemberId,
  getMarriageServicesByBrideMemberId,
  updateMarriageService,
  deleteMarriageService,
  exportMarriageServicesToExcel
};

