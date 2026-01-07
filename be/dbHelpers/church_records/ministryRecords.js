const { query } = require('../../database/db');
const moment = require('moment');
const fs = require('fs');
const { archiveBeforeDelete } = require('../archiveHelper');

/**
 * Ministry Records CRUD Operations
 * Based on tbl_ministry schema:
 * - ministry_id (INT, PK, NN, AI) - auto-incrementing
 * - ministry_name (VARCHAR(45), NN)
 * - schedule (DATETIME, nullable)
 * - leader_id (VARCHAR(45), NN)
 * - department_id (INT, NN) - Foreign key to tbl_departments
 * - members (VARCHAR(2000), NN) - JSON stringified array
 * - status (VARCHAR(45), NN, default: 'active')
 * - date_created (DATETIME, NN)
 * - image (LONGBLOB, nullable)
 * - description (VARCHAR(1000), nullable)
 */

/**
 * Helper function to convert image to blob
 * Supports: base64 string, Buffer, file path
 * @param {String|Buffer|Object} imageInput - Image as base64 string, Buffer, or file path
 * @returns {Buffer|null} - Image as Buffer (blob) or null
 */
function convertImageToBlob(imageInput) {
  try {
    // If null or undefined, return null
    if (!imageInput) {
      return null;
    }

    // If already a Buffer, return it
    if (Buffer.isBuffer(imageInput)) {
      return imageInput;
    }

    // If it's a file object from multer (has buffer property)
    if (imageInput.buffer && Buffer.isBuffer(imageInput.buffer)) {
      return imageInput.buffer;
    }

    // If it's a file path (string starting with / or containing path separators)
    if (typeof imageInput === 'string' && (imageInput.startsWith('/') || imageInput.includes('\\') || imageInput.includes('/'))) {
      // Check if file exists
      if (fs.existsSync(imageInput)) {
        return fs.readFileSync(imageInput);
      }
      return null;
    }

    // If it's a base64 string
    if (typeof imageInput === 'string') {
      // Remove data URL prefix if present (e.g., "data:image/png;base64,")
      const base64Data = imageInput.includes(',') 
        ? imageInput.split(',')[1] 
        : imageInput;
      
      // Convert base64 to Buffer
      return Buffer.from(base64Data, 'base64');
    }

    return null;
  } catch (error) {
    console.error('Error converting image to blob:', error);
    throw new Error('Failed to convert image to blob: ' + error.message);
  }
}

/**
 * Helper function to convert blob to base64 string for JSON responses
 * @param {Buffer|null} blob - Image blob as Buffer
 * @returns {String|null} - Base64 string or null
 */
function convertBlobToBase64(blob) {
  try {
    if (!blob) {
      return null;
    }
    
    if (Buffer.isBuffer(blob)) {
      return blob.toString('base64');
    }
    
    return null;
  } catch (error) {
    console.error('Error converting blob to base64:', error);
    return null;
  }
}

/**
 * CREATE - Insert a new ministry record
 * @param {Object} ministryData - Ministry data object
 * @returns {Promise<Object>} Result object
 */
async function createMinistry(ministryData) {
  try {
    const {
      ministry_name,
      schedule,
      leader_id,
      department_id,
      members, // Should be an array
      status = 'active',
      date_created = new Date(),
      image = null,
      description = null
    } = ministryData;

    // Validate required fields
    if (!ministry_name) {
      throw new Error('Missing required field: ministry_name');
    }
    // Schedule is optional (nullable in schema)
    // Format schedule if provided
    let formattedSchedule = null;
    if (schedule) {
      formattedSchedule = moment(schedule).format('YYYY-MM-DD HH:mm:ss');
    }
    if (!leader_id) {
      throw new Error('Missing required field: leader_id');
    }
    if (!department_id) {
      throw new Error('Missing required field: department_id');
    }
    if (!members) {
      throw new Error('Missing required field: members');
    }

    // Validate and convert department_id to integer
    const departmentIdInt = parseInt(department_id);
    if (isNaN(departmentIdInt)) {
      throw new Error('department_id must be a valid integer');
    }

    // Convert members array to JSON string
    let membersJson = '';
    if (Array.isArray(members)) {
      membersJson = JSON.stringify(members);
    } else if (typeof members === 'string') {
      // If it's already a string, try to parse and re-stringify to validate
      try {
        const parsed = JSON.parse(members);
        membersJson = JSON.stringify(parsed);
      } catch (e) {
        // If not valid JSON, treat as plain string and wrap in array
        membersJson = JSON.stringify([members]);
      }
    } else {
      membersJson = JSON.stringify([members]);
    }

    // Validate members JSON length (max 2000 characters)
    if (membersJson.length > 2000) {
      return {
        success: false,
        message: 'Members data exceeds maximum length of 2000 characters',
        error: 'Members data too long'
      };
    }

    // Validate description length (max 1000 characters)
    if (description && description.trim().length > 1000) {
      return {
        success: false,
        message: 'Description exceeds maximum length of 1000 characters',
        error: 'Description too long'
      };
    }

    // Format date
    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');

    // Convert image to blob
    const imageBlob = convertImageToBlob(image);
    console.log('Create Ministry - Image input type:', typeof image, image ? (image.buffer ? 'multer file' : 'base64/string') : 'null');
    console.log('Create Ministry - Image blob:', imageBlob ? `${imageBlob.length} bytes` : 'null');

    const sql = `
      INSERT INTO tbl_ministry 
        (ministry_name, schedule, leader_id, department_id, members, status, date_created, image, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      ministry_name.trim(),
      formattedSchedule,
      leader_id.trim(),
      departmentIdInt,
      membersJson,
      status,
      formattedDateCreated,
      imageBlob,
      description ? description.trim() : null
    ];

    const [result] = await query(sql, params);
    
    // Fetch the created ministry using the auto-generated ID
    const createdMinistry = await getMinistryById(result.insertId);

    return {
      success: true,
      message: 'Ministry created successfully',
      data: createdMinistry.data
    };
  } catch (error) {
    console.error('Error creating ministry:', error);
    throw error;
  }
}
/** Fetch public ministries 
 * @returns {Promise<Object>} Object with public ministries
 */
async function getPublicMinistries() {
  try {
    const sql = `SELECT * FROM tbl_ministry WHERE status = 'active'`;
    const [result] = await query(sql);
    
    // Process each ministry to convert image blob to base64 and create imageURL field
    const processedResult = result.map(row => {
      // Convert image blob to base64
      let imageUrl = null;
      if (row.image && Buffer.isBuffer(row.image)) {
        const base64String = convertBlobToBase64(row.image);
        if (base64String) {
          // Create data URL format for frontend use
          // Using generic image/jpeg type (can be adjusted based on actual image type if needed)
          imageUrl = `data:image/jpeg;base64,${base64String}`;
        }
      }
      
      // Create new object with imageURL field and remove original image blob
      const processedRow = { ...row };
      processedRow.imageUrl = imageUrl;
      processedRow.image = null; // Remove blob to avoid sending large data
      
      return processedRow;
    });
    
    return processedResult;
  } catch (error) {
    console.error('Error fetching public ministries:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all ministry records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, status, sortBy)
 * @returns {Promise<Object>} Object with paginated ministry records and metadata
 */
async function getAllMinistries(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const status = options.status || null;
    const sortBy = options.sortBy || null;
    const department_id = options.department_id || options.departmentId || null;
    const department_name_pattern = options.department_name_pattern || null;

    // Build base query for counting total records (with JOINs for accurate count)
    let countSql = `SELECT COUNT(*) as total 
      FROM tbl_ministry m
      LEFT JOIN tbl_departments d ON m.department_id = d.department_id
      LEFT JOIN tbl_members mem ON m.leader_id = mem.member_id`;
    let countParams = [];

    // Build query for fetching records with JOINs to get names
    let sql = `SELECT 
      m.ministry_id,
      m.ministry_name,
      m.schedule,
      m.leader_id,
      m.department_id,
      m.members,
      m.status,
      m.date_created,
      m.image,
      m.description,
      d.department_name,
      mem.firstname as leader_firstname,
      mem.lastname as leader_lastname,
      mem.middle_name as leader_middle_name,
      CONCAT(
        mem.firstname,
        IF(mem.middle_name IS NOT NULL AND mem.middle_name != '', CONCAT(' ', mem.middle_name), ''),
        ' ',
        mem.lastname
      ) as leader_fullname
    FROM tbl_ministry m
    LEFT JOIN tbl_departments d ON m.department_id = d.department_id
    LEFT JOIN tbl_members mem ON m.leader_id = mem.member_id`;
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality (search by ministry name, schedule, leader name, or department name)
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(m.ministry_name LIKE ? OR m.schedule LIKE ? OR m.leader_id LIKE ? OR m.department_id LIKE ? OR d.department_name LIKE ? OR mem.firstname LIKE ? OR mem.lastname LIKE ? OR mem.middle_name LIKE ? OR CONCAT(mem.firstname, ' ', IFNULL(mem.middle_name, ''), ' ', mem.lastname) LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add status filter (case-insensitive, aligns with FE options like "Active"/"active")
    const normalizedStatus = status && status !== 'All Statuses'
      ? status.toString().toLowerCase()
      : null;
    if (normalizedStatus) {
      whereConditions.push('LOWER(m.status) = ?');
      countParams.push(normalizedStatus);
      params.push(normalizedStatus);
      hasWhere = true;
    }

    // Add department_id filter
    if (department_id) {
      const departmentIdInt = parseInt(department_id);
      if (!isNaN(departmentIdInt)) {
        whereConditions.push('m.department_id = ?');
        countParams.push(departmentIdInt);
        params.push(departmentIdInt);
        hasWhere = true;
      }
    }

    // Add department_name_pattern filter (for category filtering like Adult, Ladies, Youth)
    if (department_name_pattern) {
      whereConditions.push('d.department_name LIKE ?');
      countParams.push(department_name_pattern);
      params.push(department_name_pattern);
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
      case 'Ministry Name (A-Z)':
        orderByClause += 'm.ministry_name ASC';
        break;
      case 'Ministry Name (Z-A)':
        orderByClause += 'm.ministry_name DESC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'm.date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'm.date_created ASC';
        break;
      case 'Schedule (A-Z)':
        orderByClause += 'm.schedule ASC';
        break;
      case 'Status (A-Z)':
        orderByClause += 'm.status ASC';
        break;
      default:
        orderByClause += 'm.date_created DESC'; // Default sorting
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
    // Get total ministries and active ministries count
    const [summaryStatsResult] = await query(`
      SELECT 
        COUNT(*) as totalMinistries,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeMinistries
      FROM tbl_ministry
    `);
    
    // Get total members count across all ministries
    // Need to parse JSON members field and count
    const [allMinistriesResult] = await query(`
      SELECT members FROM tbl_ministry WHERE members IS NOT NULL AND members != ''
    `);
    
    let totalMembers = 0;
    allMinistriesResult.forEach(row => {
      try {
        if (row.members) {
          const members = JSON.parse(row.members);
          if (Array.isArray(members)) {
            totalMembers += members.length;
          }
        }
      } catch (e) {
        // If parsing fails, skip
        console.warn('Failed to parse members JSON for summary stats');
      }
    });
    
    const summaryStats = {
      totalMinistries: summaryStatsResult[0]?.totalMinistries || 0,
      activeMinistries: summaryStatsResult[0]?.activeMinistries || 0,
      totalMembers: totalMembers
    };

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

    // Parse members JSON string back to array and convert image blob to base64 for each record
    const parsedRows = rows.map(row => {
      try {
        if (row.members) {
          row.members = JSON.parse(row.members);
        }
      } catch (e) {
        // If parsing fails, keep as string or set to empty array
        console.warn('Failed to parse members JSON for ministry_id:', row.ministry_id);
        row.members = [];
      }
      
      // Convert image blob to base64 and create imageURL field for JSON response
      let imageUrl = null;
      if (row.image && Buffer.isBuffer(row.image)) {
        const base64String = convertBlobToBase64(row.image);
        if (base64String) {
          // Create data URL format for frontend use
          imageUrl = `data:image/jpeg;base64,${base64String}`;
        }
      }
      row.imageUrl = imageUrl;
      // Keep base64 image for backward compatibility, but prefer imageUrl
      if (row.image && Buffer.isBuffer(row.image)) {
        row.image = convertBlobToBase64(row.image);
      } else {
        row.image = null;
      }
      
      return row;
    });

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || parsedRows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Ministries retrieved successfully',
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
    console.error('Error fetching ministries:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single ministry by ID
 * @param {Number} ministryId - Ministry ID
 * @returns {Promise<Object>} Ministry record
 */
async function getMinistryById(ministryId) {
  try {
    if (!ministryId) {
      throw new Error('Ministry ID is required');
    }

    const sql = `SELECT 
      m.ministry_id,
      m.ministry_name,
      m.schedule,
      m.leader_id,
      m.department_id,
      m.members,
      m.status,
      m.date_created,
      m.image,
      m.description,
      d.department_name,
      mem.firstname as leader_firstname,
      mem.lastname as leader_lastname,
      mem.middle_name as leader_middle_name,
      CONCAT(
        mem.firstname,
        IF(mem.middle_name IS NOT NULL AND mem.middle_name != '', CONCAT(' ', mem.middle_name), ''),
        ' ',
        mem.lastname
      ) as leader_fullname
    FROM tbl_ministry m
    LEFT JOIN tbl_departments d ON m.department_id = d.department_id
    LEFT JOIN tbl_members mem ON m.leader_id = mem.member_id
    WHERE m.ministry_id = ?`;
    const [rows] = await query(sql, [ministryId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Ministry not found',
        data: null
      };
    }

    // Parse members JSON string back to array and convert image blob to base64
    const row = rows[0];
    try {
      if (row.members) {
        row.members = JSON.parse(row.members);
      }
    } catch (e) {
      console.warn('Failed to parse members JSON for ministry_id:', ministryId);
      row.members = [];
    }
    
    // Convert image blob to base64 for JSON response
    if (row.image && Buffer.isBuffer(row.image)) {
      row.image = convertBlobToBase64(row.image);
    } else {
      row.image = null;
    }

    return {
      success: true,
      message: 'Ministry retrieved successfully',
      data: row
    };
  } catch (error) {
    console.error('Error fetching ministry:', error);
    throw error;
  }
}

/**
 * READ ALL BY MEMBER - Get all ministries where a specific member has joined
 * @param {Number} memberId - Member ID
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, status, sortBy)
 * @returns {Promise<Object>} Object with paginated ministry records and metadata
 */
async function getMinistriesByMemberId(memberId, options = {}) {
  try {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const status = options.status || null;
    const sortBy = options.sortBy || null;

    // Convert memberId to number for comparison
    const memberIdNum = parseInt(memberId);

    // Build base query to fetch all ministries with JOINs
    let sql = `SELECT 
      m.ministry_id,
      m.ministry_name,
      m.schedule,
      m.leader_id,
      m.department_id,
      m.members,
      m.status,
      m.date_created,
      m.image,
      m.description,
      d.department_name,
      mem.firstname as leader_firstname,
      mem.lastname as leader_lastname,
      mem.middle_name as leader_middle_name,
      CONCAT(
        mem.firstname,
        IF(mem.middle_name IS NOT NULL AND mem.middle_name != '', CONCAT(' ', mem.middle_name), ''),
        ' ',
        mem.lastname
      ) as leader_fullname
    FROM tbl_ministry m
    LEFT JOIN tbl_departments d ON m.department_id = d.department_id
    LEFT JOIN tbl_members mem ON m.leader_id = mem.member_id`;
    const params = [];

    // Build WHERE conditions array for other filters (not member_id)
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(m.ministry_name LIKE ? OR m.schedule LIKE ? OR m.description LIKE ? OR d.department_name LIKE ? OR mem.firstname LIKE ? OR mem.lastname LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add status filter
    if (status && status !== 'All Statuses') {
      const normalizedStatus = status.toString().toLowerCase();
      whereConditions.push('LOWER(m.status) = ?');
      params.push(normalizedStatus);
      hasWhere = true;
    }

    // Apply WHERE clause if any conditions exist
    if (hasWhere) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      sql += whereClause;
    }

    // Add sorting
    let orderByClause = ' ORDER BY ';
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;
    switch (sortByValue) {
      case 'Ministry Name (A-Z)':
        orderByClause += 'm.ministry_name ASC';
        break;
      case 'Ministry Name (Z-A)':
        orderByClause += 'm.ministry_name DESC';
        break;
      case 'Schedule (Newest)':
        orderByClause += 'm.schedule DESC';
        break;
      case 'Schedule (Oldest)':
        orderByClause += 'm.schedule ASC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'm.date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'm.date_created ASC';
        break;
      case 'Status (A-Z)':
        orderByClause += 'm.status ASC';
        break;
      default:
        orderByClause += 'm.date_created DESC'; // Default sorting
    }
    sql += orderByClause;

    // Execute query to get all ministries (before filtering by member_id)
    const [allRows] = await query(sql, params);

    // Filter ministries where member_id exists in members array
    // members is stored as VARCHAR string containing JSON array like "[1, 2, 3]"
    const filteredRows = allRows.filter(ministry => {
      // Check if members exists and is not empty
      if (!ministry.members || ministry.members.trim() === '') {
        return false;
      }

      try {
        // Parse the JSON string to array
        const membersArray = JSON.parse(ministry.members);
        
        // Check if it's an array and contains the member_id
        if (Array.isArray(membersArray)) {
          // Compare as numbers to handle zero-padded strings
          return membersArray.some(id => {
            const idNum = parseInt(id);
            return !isNaN(idNum) && idNum === memberIdNum;
          });
        }
        return false;
      } catch (e) {
        // If parsing fails, skip this ministry
        console.warn('Failed to parse members JSON for ministry_id:', ministry.ministry_id, e);
        return false;
      }
    });

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

    // Apply pagination to filtered results
    let rows;
    if (finalLimit !== null) {
      const limitValue = Math.max(1, parseInt(finalLimit) || 10);
      const offsetValue = Math.max(0, parseInt(finalOffset) || 0);
      rows = filteredRows.slice(offsetValue, offsetValue + limitValue);
    } else {
      rows = filteredRows;
    }

    // Convert image blobs to base64 and create imageURL field, parse members JSON for JSON response
    const processedRows = rows.map(ministry => {
      const processedMinistry = { ...ministry };
      
      // Convert image blob to base64 and create imageURL field
      let imageUrl = null;
      if (ministry.image && Buffer.isBuffer(ministry.image)) {
        const base64String = convertBlobToBase64(ministry.image);
        if (base64String) {
          // Create data URL format for frontend use
          imageUrl = `data:image/jpeg;base64,${base64String}`;
        }
      }
      processedMinistry.imageUrl = imageUrl;
      // Keep base64 image for backward compatibility, but prefer imageUrl
      if (ministry.image && Buffer.isBuffer(ministry.image)) {
        processedMinistry.image = convertBlobToBase64(ministry.image);
      } else {
        processedMinistry.image = null;
      }
      
      // Parse members JSON string back to array
      if (ministry.members) {
        try {
          processedMinistry.members = JSON.parse(ministry.members);
        } catch (e) {
          console.warn('Failed to parse members JSON for ministry_id:', ministry.ministry_id);
          processedMinistry.members = [];
        }
      } else {
        processedMinistry.members = [];
      }
      
      return processedMinistry;
    });

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null && finalLimit !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || processedRows.length;
    // Calculate total pages based on filtered results
    const totalFilteredCount = filteredRows.length;
    const totalPages = finalLimit ? Math.ceil(totalFilteredCount / finalLimit) : 1;
    const hasMore = currentPage < totalPages;

    return {
      success: true,
      message: 'Ministries retrieved successfully',
      data: processedRows,
      count: processedRows.length,
      pagination: {
        page: currentPage,
        pageSize: currentPageSize,
        totalPages: totalPages,
        hasNextPage: hasMore,
        hasPreviousPage: currentPage > 1
      }
    };
  } catch (error) {
    console.error('Error fetching ministries by member ID:', error);
    throw error;
  }
}

/**
 * UPDATE - Update an existing ministry record
 * @param {Number} ministryId - Ministry ID
 * @param {Object} ministryData - Updated ministry data
 * @returns {Promise<Object>} Result object
 */
async function updateMinistry(ministryId, ministryData) {
  try {
    if (!ministryId) {
      throw new Error('Ministry ID is required');
    }

    // Check if ministry exists
    const ministryCheck = await getMinistryById(ministryId);
    if (!ministryCheck.success) {
      return {
        success: false,
        message: 'Ministry not found',
        data: null
      };
    }

    const {
      ministry_name,
      schedule,
      leader_id,
      department_id,
      members,
      status,
      date_created,
      image,
      description
    } = ministryData;

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (ministry_name !== undefined) {
      fields.push('ministry_name = ?');
      params.push(ministry_name.trim());
    }

    if (schedule !== undefined) {
      // Format schedule if provided (DATETIME field)
      let formattedSchedule = null;
      if (schedule) {
        formattedSchedule = moment(schedule).format('YYYY-MM-DD HH:mm:ss');
      }
      fields.push('schedule = ?');
      params.push(formattedSchedule);
    }

    if (leader_id !== undefined) {
      fields.push('leader_id = ?');
      params.push(leader_id.trim());
    }

    if (department_id !== undefined) {
      // Validate and convert department_id to integer
      const departmentIdInt = parseInt(department_id);
      if (isNaN(departmentIdInt)) {
        return {
          success: false,
          message: 'department_id must be a valid integer',
          error: 'Invalid department_id'
        };
      }
      fields.push('department_id = ?');
      params.push(departmentIdInt);
    }

    if (members !== undefined) {
      // Convert members array to JSON string
      let membersJson = '';
      if (Array.isArray(members)) {
        membersJson = JSON.stringify(members);
      } else if (typeof members === 'string') {
        // If it's already a string, try to parse and re-stringify to validate
        try {
          const parsed = JSON.parse(members);
          membersJson = JSON.stringify(parsed);
        } catch (e) {
          // If not valid JSON, treat as plain string and wrap in array
          membersJson = JSON.stringify([members]);
        }
      } else {
        membersJson = JSON.stringify([members]);
      }

      // Validate members JSON length (max 2000 characters)
      if (membersJson.length > 2000) {
        return {
          success: false,
          message: 'Members data exceeds maximum length of 2000 characters',
          error: 'Members data too long'
        };
      }

      fields.push('members = ?');
      params.push(membersJson);
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

    if (image !== undefined) {
      // Convert image to blob
      const imageBlob = convertImageToBlob(image);
      console.log('Update Ministry - Image input type:', typeof image, image ? (image.buffer ? 'multer file' : 'base64/string') : 'null');
      console.log('Update Ministry - Image blob:', imageBlob ? `${imageBlob.length} bytes` : 'null');
      
      // Only update image if a valid blob was provided (not null/empty)
      // This prevents clearing the image when no new image is provided
      if (imageBlob && imageBlob.length > 0) {
        fields.push('image = ?');
        params.push(imageBlob);
      } else {
        console.log('Update Ministry - No valid image blob, skipping image update (keeping existing image)');
      }
      // If imageBlob is null/empty and image was explicitly set to null, don't update
      // (keeps existing image)
    }

    if (description !== undefined) {
      // Validate description length (max 1000 characters)
      if (description && description.trim().length > 1000) {
        return {
          success: false,
          message: 'Description exceeds maximum length of 1000 characters',
          error: 'Description too long'
        };
      }
      fields.push('description = ?');
      params.push(description ? description.trim() : null);
    }

    if (fields.length === 0) {
      return {
        success: false,
        message: 'No fields to update',
        data: null
      };
    }

    params.push(ministryId);

    const sql = `
      UPDATE tbl_ministry
      SET ${fields.join(', ')}
      WHERE ministry_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Ministry not found or no changes made',
        data: null
      };
    }

    // Fetch updated ministry
    const updatedMinistry = await getMinistryById(ministryId);

    return {
      success: true,
      message: 'Ministry updated successfully',
      data: updatedMinistry.data
    };
  } catch (error) {
    console.error('Error updating ministry:', error);
    throw error;
  }
}

/**
 * DELETE - Delete a ministry record (archives it first)
 * @param {Number} ministryId - Ministry ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteMinistry(ministryId, archivedBy = null) {
  try {
    if (!ministryId) {
      throw new Error('Ministry ID is required');
    }

    // Check if ministry exists
    const ministryCheck = await getMinistryById(ministryId);
    if (!ministryCheck.success) {
      return {
        success: false,
        message: 'Ministry not found',
        data: null
      };
    }

    // Archive the record before deleting
    await archiveBeforeDelete(
      'tbl_ministry',
      String(ministryId),
      ministryCheck.data,
      archivedBy
    );

    // Delete from original table
    const sql = 'DELETE FROM tbl_ministry WHERE ministry_id = ?';
    const [result] = await query(sql, [ministryId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Ministry not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Ministry archived and deleted successfully',
      data: { ministry_id: ministryId }
    };
  } catch (error) {
    console.error('Error deleting ministry:', error);
    throw error;
  }
}

module.exports = {
  createMinistry,
  getAllMinistries,
  getMinistryById,
  getMinistriesByMemberId,
  updateMinistry,
  deleteMinistry,
  getPublicMinistries
};

