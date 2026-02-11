const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const { archiveBeforeDelete } = require('../archiveHelper');

/**
 * Safely convert Buffer or any value to string
 * @param {*} value - Value to convert
 * @param {String} defaultValue - Default value if conversion fails
 * @returns {String} String representation
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
      return JSON.stringify(value);
    } catch (e) {
      return defaultValue;
    }
  }

  return String(value);
}

/**
 * Tithes Records CRUD Operations
 * Based on tbl_tithes schema:
 * - tithes_id (INT, PK, NN, AI) - auto-incrementing
 * - member_id (VARCHAR(45), nullable)
 * - member_name (VARCHAR(100), nullable) - for non-member donors
 * - is_anonymous (TINYINT, default: 0)
 * - donation_type (ENUM: 'money', 'inkind', default: 'money')
 * - amount (DOUBLE, nullable for in-kind)
 * - type (VARCHAR(45), NN)
 * - payment_method (VARCHAR(45), nullable for in-kind)
 * - donation_items (TEXT, nullable) - description of in-kind items
 * - notes (VARCHAR(2000), nullable)
 * - status (VARCHAR(20), default: 'confirmed') - pending, confirmed, rejected
 * - date_created (DATETIME, NN)
 * - donation_date (DATE, nullable) - actual date of donation
 * - source (VARCHAR(20), default: 'in-person') - 'online' or 'in-person'
 * - proof_image (LONGBLOB, nullable) - receipt screenshot for online donations
 * - proof_image_type (VARCHAR(50), nullable) - MIME type of proof image
 * - donation_method (VARCHAR(50), nullable) - gcash, maya, others (for online)
 * - donation_method_other (VARCHAR(100), nullable) - if method is 'others'
 * - verified_by (INT, nullable) - admin who verified
 * - verified_date (DATETIME, nullable) - when verified
 * - rejection_reason (VARCHAR(500), nullable) - reason for rejection
 */

/**
 * CREATE - Insert a new tithe record
 * @param {Object} titheData - Tithe data object
 * @returns {Promise<Object>} Result object
 */
async function createTithe(titheData) {
  try {
    const {
      member_id = null,
      member_name = null,
      is_anonymous = false,
      donation_type = 'money',
      amount = 0,
      type = '',
      payment_method = null,
      donation_items = null,
      notes = null,
      date_created = new Date(),
      donation_date = null,
      source = 'in-person',
      donation_method = null,
      donation_method_other = null
    } = titheData;

    // Format dates
    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');
    const formattedDonationDate = donation_date ? moment(donation_date).format('YYYY-MM-DD') : moment(date_created).format('YYYY-MM-DD');

    // In-person donations created by admin are auto-confirmed
    const initialStatus = source === 'in-person' ? 'confirmed' : 'pending';

    // Build insert query based on donation type
    let sql, params;

    if (donation_type === 'money') {
      sql = `
        INSERT INTO tbl_tithes 
          (member_id, donation_type, member_name, is_anonymous, amount, type, payment_method, notes, status, date_created, donation_date, source, donation_method, donation_method_other)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        member_id ? String(member_id).trim() : null,
        donation_type,
        member_name || null,
        is_anonymous ? 1 : 0,
        parseFloat(amount) || 0,
        String(type).trim() || 'donation',
        payment_method ? String(payment_method).trim() : null,
        notes ? String(notes).trim() : null,
        initialStatus,
        formattedDateCreated,
        formattedDonationDate,
        source,
        donation_method || null,
        donation_method_other || null
      ];
    } else {
      sql = `
        INSERT INTO tbl_tithes 
          (member_id, donation_type, member_name, is_anonymous, amount, type, payment_method, donation_items, notes, status, date_created, donation_date, source, donation_method, donation_method_other)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        member_id ? String(member_id).trim() : null,
        donation_type,
        member_name || null,
        is_anonymous ? 1 : 0,
        0,
        String(type).trim() || 'other',
        null,
        safeToString(donation_items, ''),
        notes ? String(notes).trim() : null,
        initialStatus,
        formattedDateCreated,
        formattedDonationDate,
        source,
        donation_method || null,
        donation_method_other || null
      ];
    }

    const [result] = await query(sql, params);

    const createdTitheData = {
      tithes_id: result.insertId,
      member_id: member_id ? String(member_id).trim() : null,
      donation_type: donation_type,
      member_name: member_name || null,
      is_anonymous: is_anonymous ? 1 : 0,
      amount: parseFloat(amount) || 0,
      type: String(type).trim() || 'donation',
      payment_method: payment_method ? String(payment_method).trim() : null,
      donation_items: donation_type === 'inkind' ? safeToString(donation_items, '') : null,
      notes: notes ? String(notes).trim() : null,
      status: initialStatus,
      date_created: formattedDateCreated,
      donation_date: formattedDonationDate,
      source: source,
      donation_method: donation_method || null,
      donation_method_other: donation_method_other || null
    };

    return {
      success: true,
      message: 'Donation created successfully',
      data: createdTitheData
    };
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
}

/**
 * CREATE ONLINE DONATION - Submit an online donation with proof image
 * Called from the public Give page (no auth required)
 * @param {Object} donationData - Online donation data
 * @returns {Promise<Object>} Result object
 */
async function createOnlineDonation(donationData) {
  try {
    const {
      donor_name = null,
      is_anonymous = false,
      email = null,
      amount = 0,
      type = 'donation',
      donation_method = 'gcash',
      donation_method_other = null,
      proof_image = null,
      proof_image_type = null,
      notes = null,
      donation_date = null
    } = donationData;

    const formattedDateCreated = moment().format('YYYY-MM-DD HH:mm:ss');
    const formattedDonationDate = donation_date ? moment(donation_date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');

    // Convert base64 proof image to Buffer
    let proofImageBuffer = null;
    let proofImageMimeType = proof_image_type || null;

    if (proof_image && typeof proof_image === 'string') {
      // Handle base64 data URL format: data:image/png;base64,iVBOR...
      if (proof_image.startsWith('data:')) {
        const matches = proof_image.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          proofImageMimeType = matches[1];
          proofImageBuffer = Buffer.from(matches[2], 'base64');
        }
      } else {
        // Raw base64 string
        proofImageBuffer = Buffer.from(proof_image, 'base64');
      }
    }

    const finalDonorName = is_anonymous ? 'Anonymous' : (donor_name || 'Anonymous');
    const finalPaymentMethod = donation_method === 'others'
      ? (donation_method_other || 'other')
      : donation_method;

    const sql = `
      INSERT INTO tbl_tithes 
        (member_id, donation_type, member_name, donor_email, is_anonymous, amount, type, payment_method, 
         notes, status, date_created, donation_date, source, proof_image, proof_image_type, 
         donation_method, donation_method_other)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      null, // member_id - online donors are not members
      'money',
      finalDonorName,
      email ? String(email).trim() : null,
      is_anonymous ? 1 : 0,
      parseFloat(amount) || 0,
      String(type).trim() || 'donation',
      finalPaymentMethod,
      notes ? String(notes).trim() : null,
      'pending', // Online donations always start as pending
      formattedDateCreated,
      formattedDonationDate,
      'online', // source is always online
      proofImageBuffer,
      proofImageMimeType,
      donation_method,
      donation_method_other || null
    ];

    const [result] = await query(sql, params);

    return {
      success: true,
      message: 'Online donation submitted successfully. It will be reviewed by the church admin.',
      data: {
        tithes_id: result.insertId,
        donor_name: finalDonorName,
        email: email,
        is_anonymous: is_anonymous ? 1 : 0,
        amount: parseFloat(amount) || 0,
        type: String(type).trim() || 'donation',
        donation_method: donation_method,
        status: 'pending',
        source: 'online',
        donation_date: formattedDonationDate,
        date_created: formattedDateCreated
      }
    };
  } catch (error) {
    console.error('Error creating online donation:', error);
    throw error;
  }
}

/**
 * VERIFY DONATION - Admin confirms or rejects an online donation
 * @param {Number} tithesId - Tithes ID
 * @param {String} action - 'confirmed' or 'rejected'
 * @param {Number} verifiedBy - Admin account ID
 * @param {String} rejectionReason - Reason for rejection (optional)
 * @param {String} adminProofImage - Base64 string of admin verification proof (optional)
 * @returns {Promise<Object>} Result object
 */
async function verifyDonation(tithesId, action, verifiedBy, rejectionReason = null, adminProofImage = null) {
  try {
    if (!tithesId) throw new Error('Tithes ID is required');
    if (!['confirmed', 'rejected'].includes(action)) throw new Error('Invalid action. Must be confirmed or rejected.');

    const verifiedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    // Process Admin Proof Image
    let adminProofBuffer = null;
    let adminProofMimeType = null;

    if (adminProofImage && typeof adminProofImage === 'string') {
      if (adminProofImage.startsWith('data:')) {
        const matches = adminProofImage.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          adminProofMimeType = matches[1];
          adminProofBuffer = Buffer.from(matches[2], 'base64');
        }
      } else {
        adminProofBuffer = Buffer.from(adminProofImage, 'base64');
      }
    }

    let sql, params;
    if (action === 'rejected') {
      sql = `
        UPDATE tbl_tithes 
        SET status = ?, verified_by = ?, verified_date = ?, rejection_reason = ?, 
            admin_proof_image = ?, admin_proof_image_type = ?
        WHERE tithes_id = ?
      `;
      params = [
        action, verifiedBy, verifiedDate, rejectionReason || null,
        adminProofBuffer, adminProofMimeType, tithesId
      ];
    } else {
      sql = `
        UPDATE tbl_tithes 
        SET status = ?, verified_by = ?, verified_date = ?, rejection_reason = NULL,
            admin_proof_image = ?, admin_proof_image_type = ?
        WHERE tithes_id = ?
      `;
      params = [
        action, verifiedBy, verifiedDate,
        adminProofBuffer, adminProofMimeType, tithesId
      ];
    }

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Donation not found',
        data: null
      };
    }

    const updatedTithe = await getTitheById(tithesId);

    return {
      success: true,
      message: `Donation ${action} successfully`,
      data: updatedTithe.data
    };
  } catch (error) {
    console.error('Error verifying donation:', error);
    throw error;
  }
}

/**
 * GET ADMIN PROOF IMAGE - Retrieve the admin proof image for a donation
 * @param {Number} tithesId - Tithes ID
 * @returns {Promise<Object>} Object with image buffer and MIME type
 */
async function getAdminProofImage(tithesId) {
  try {
    if (!tithesId) throw new Error('Tithes ID is required');

    const sql = 'SELECT admin_proof_image, admin_proof_image_type FROM tbl_tithes WHERE tithes_id = ?';
    const [rows] = await query(sql, [tithesId]);

    if (rows.length === 0) {
      return { success: false, message: 'Donation not found', data: null };
    }

    const row = rows[0];
    if (!row.admin_proof_image) {
      return { success: false, message: 'No admin proof image found for this donation', data: null };
    }

    const imageBuffer = row.admin_proof_image;
    const mimeType = row.admin_proof_image_type || 'image/png';
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return {
      success: true,
      message: 'Admin proof image retrieved successfully',
      data: {
        image: dataUrl,
        mimeType: mimeType
      }
    };
  } catch (error) {
    console.error('Error getting admin proof image:', error);
    throw error;
  }
}

/**
 * GET PROOF IMAGE - Retrieve the proof image for a donation
 * @param {Number} tithesId - Tithes ID
 * @returns {Promise<Object>} Object with image buffer and MIME type
 */
async function getProofImage(tithesId) {
  try {
    if (!tithesId) throw new Error('Tithes ID is required');

    const sql = 'SELECT proof_image, proof_image_type FROM tbl_tithes WHERE tithes_id = ?';
    const [rows] = await query(sql, [tithesId]);

    if (rows.length === 0) {
      return { success: false, message: 'Donation not found', data: null };
    }

    const row = rows[0];
    if (!row.proof_image) {
      return { success: false, message: 'No proof image found for this donation', data: null };
    }

    // Convert Buffer to base64 data URL
    const imageBuffer = row.proof_image;
    const mimeType = row.proof_image_type || 'image/png';
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return {
      success: true,
      message: 'Proof image retrieved successfully',
      data: {
        image: dataUrl,
        mimeType: mimeType
      }
    };
  } catch (error) {
    console.error('Error getting proof image:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all tithe records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, type, donationType, sortBy)
 * @returns {Promise<Object>} Object with paginated tithe records and metadata
 */
async function getAllTithes(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const type = options.type || null;
    const donationType = options.donationType || null;
    const sortBy = options.sortBy || null;
    let dateRange = options.dateRange || null;
    // Parse dateRange if it's a JSON string
    if (typeof dateRange === 'string') {
      try {
        dateRange = JSON.parse(dateRange);
      } catch (e) {
        dateRange = null;
      }
    }

    // Extract additional filter params
    const source = options.source || null;
    const status = options.status || null;

    // Build base query for counting total records
    let countSql = 'SELECT COUNT(*) as total FROM tbl_tithes t LEFT JOIN tbl_members m ON t.member_id = m.member_id';
    let countParams = [];

    // Build query for fetching records with member data (exclude proof_image BLOB from list queries)
    let sql = `SELECT 
      t.tithes_id,
      t.member_id,
      t.donation_type,
      t.member_name,
      t.donor_email,
      t.is_anonymous,
      t.amount,
      t.type,
      t.payment_method,
      t.donation_items,
      t.notes,
      t.status,
      t.date_created,
      t.donation_date,
      t.source,
      t.donation_method,
      t.donation_method_other,
      t.verified_by,
      t.verified_date,
      t.rejection_reason,
      IF(t.proof_image IS NOT NULL, 1, 0) as has_proof_image,
      t.proof_image_type,
      IF(t.admin_proof_image IS NOT NULL, 1, 0) as has_admin_proof_image,
      t.admin_proof_image_type,
      m.firstname,
      m.lastname,
      m.middle_name,
      COALESCE(
        t.member_name,
        CONCAT(
          m.firstname,
          IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
          ' ',
          m.lastname
        )
      ) as fullname
    FROM tbl_tithes t
    LEFT JOIN tbl_members m ON t.member_id = m.member_id`;
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(t.member_id LIKE ? OR t.member_name LIKE ? OR t.type LIKE ? OR t.payment_method LIKE ? OR t.donation_items LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ? OR m.middle_name LIKE ? OR CONCAT(m.firstname, ' ', IFNULL(m.middle_name, ''), ' ', m.lastname) LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add type filter
    if (type && type !== 'All Types') {
      whereConditions.push('t.type = ?');
      countParams.push(type);
      params.push(type);
      hasWhere = true;
    }

    // Add donation_type filter
    if (donationType && donationType !== 'all') {
      whereConditions.push('t.donation_type = ?');
      countParams.push(donationType);
      params.push(donationType);
      hasWhere = true;
    }

    // Add date range filter (using donation_date instead of date_created, fallback to date_created)
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      whereConditions.push('DATE(COALESCE(t.donation_date, t.date_created)) BETWEEN ? AND ?');
      countParams.push(dateRange[0], dateRange[1]);
      params.push(dateRange[0], dateRange[1]);
      hasWhere = true;
    }

    // Add source filter (online / in-person)
    if (source && source !== 'all') {
      whereConditions.push('t.source = ?');
      countParams.push(source);
      params.push(source);
      hasWhere = true;
    }

    // Add status filter (pending / confirmed / rejected)
    if (status && status !== 'all') {
      whereConditions.push('t.status = ?');
      countParams.push(status);
      params.push(status);
      hasWhere = true;
    }

    // Initialize sortByValue before using it
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;

    // Apply WHERE clause if any conditions exist
    if (hasWhere) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      countSql += whereClause;
      sql += whereClause;
    }

    // Add sorting
    let orderByClause = ' ORDER BY ';
    switch (sortByValue) {
      case 'Tithes ID (Low to High)':
        orderByClause += 't.tithes_id ASC';
        break;
      case 'Tithes ID (High to Low)':
        orderByClause += 't.tithes_id DESC';
        break;
      case 'Amount (Low to High)':
        orderByClause += 't.amount ASC';
        break;
      case 'Amount (High to Low)':
        orderByClause += 't.amount DESC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'COALESCE(STR_TO_DATE(t.date_created, \'%Y-%m-%d %H:%i:%s\'), STR_TO_DATE(t.date_created, \'%Y-%m-%d\'), CAST(\'9999-12-31\' AS DATE)) DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'COALESCE(STR_TO_DATE(t.date_created, \'%Y-%m-%d %H:%i:%s\'), STR_TO_DATE(t.date_created, \'%Y-%m-%d\'), CAST(\'9999-12-31\' AS DATE)) ASC';
        break;
      case 'Donation Date (Newest)':
        orderByClause += 'COALESCE(t.donation_date, t.date_created) DESC';
        break;
      case 'Donation Date (Oldest)':
        orderByClause += 'COALESCE(t.donation_date, t.date_created) ASC';
        break;
      case 'Type (A-Z)':
        orderByClause += 't.type ASC';
        break;
      case 'Name (A-Z)':
        orderByClause += 'fullname ASC';
        break;
      case 'Name (Z-A)':
        orderByClause += 'fullname DESC';
        break;
      default:
        orderByClause += 't.date_created DESC';
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

    // Get summary statistics with the same filters as the main query
    // Only count CONFIRMED donations in summary totals
    let summarySql = `
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) as totalDonations,
        COALESCE(SUM(CASE WHEN status = 'confirmed' AND type = 'tithe' THEN amount ELSE 0 END), 0) as totalTithes,
        COALESCE(SUM(CASE WHEN status = 'confirmed' AND type = 'offering' THEN amount ELSE 0 END), 0) as totalOfferings,
        COALESCE(SUM(CASE WHEN status = 'confirmed' AND type IN ('missions', 'love_gift', 'building_fund', 'donation', 'other') THEN amount ELSE 0 END), 0) as totalSpecialOfferings,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pendingCount
      FROM tbl_tithes
    `;
    const summaryParams = [];

    // Build WHERE conditions for summary stats (same as main query)
    const summaryWhereConditions = [];

    // Add type filter to summary
    if (type && type !== 'All Types') {
      summaryWhereConditions.push('type = ?');
      summaryParams.push(type);
    }

    // Add donation_type filter to summary
    if (donationType && donationType !== 'all') {
      summaryWhereConditions.push('donation_type = ?');
      summaryParams.push(donationType);
    }

    // Add date range filter to summary (using donation_date, fallback to date_created)
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      summaryWhereConditions.push('DATE(COALESCE(donation_date, date_created)) BETWEEN ? AND ?');
      summaryParams.push(dateRange[0], dateRange[1]);
    }

    // Add source filter to summary
    if (source && source !== 'all') {
      summaryWhereConditions.push('source = ?');
      summaryParams.push(source);
    }

    // Add status filter to summary
    if (status && status !== 'all') {
      summaryWhereConditions.push('status = ?');
      summaryParams.push(status);
    }

    // Apply WHERE clause to summary query
    if (summaryWhereConditions.length > 0) {
      summarySql += ' WHERE ' + summaryWhereConditions.join(' AND ');
    }

    const [summaryStatsResult] = await query(summarySql, summaryParams);

    const summaryStats = {
      totalDonations: parseFloat(summaryStatsResult[0]?.totalDonations || 0),
      totalTithes: parseFloat(summaryStatsResult[0]?.totalTithes || 0),
      totalOfferings: parseFloat(summaryStatsResult[0]?.totalOfferings || 0),
      totalSpecialOfferings: parseFloat(summaryStatsResult[0]?.totalSpecialOfferings || 0),
      pendingCount: parseInt(summaryStatsResult[0]?.pendingCount || 0)
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

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || rows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Donations retrieved successfully',
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
    console.error('Error fetching donations:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single tithe by ID
 * @param {Number} tithesId - Tithes ID
 * @returns {Promise<Object>} Tithe record
 */
async function getTitheById(tithesId) {
  try {
    if (!tithesId) {
      throw new Error('Tithes ID is required');
    }

    const sql = 'SELECT * FROM tbl_tithes WHERE tithes_id = ?';
    const [rows] = await query(sql, [tithesId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Donation not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Donation retrieved successfully',
      data: rows[0]
    };
  } catch (error) {
    console.error('Error fetching donation:', error);
    throw error;
  }
}

/**
 * UPDATE - Update an existing donation record
 * @param {Number} tithesId - Tithes ID
 * @param {Object} titheData - Updated donation data
 * @returns {Promise<Object>} Result object
 */
async function updateTithe(tithesId, titheData) {
  try {
    if (!tithesId) {
      throw new Error('Tithes ID is required');
    }

    // Skip initial existence check - UPDATE will tell us if row exists
    // Middleware captures before state for audit trail

    const {
      member_id,
      member_name,
      is_anonymous,
      donation_type,
      amount,
      type,
      payment_method,
      donation_items,
      notes,
      date_created,
      donation_date
    } = titheData;

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (member_id !== undefined) {
      fields.push('member_id = ?');
      params.push(member_id ? member_id.trim() : null);
    }

    if (member_name !== undefined) {
      fields.push('member_name = ?');
      params.push(member_name || null);
    }

    if (is_anonymous !== undefined) {
      fields.push('is_anonymous = ?');
      params.push(is_anonymous ? 1 : 0);
    }

    if (donation_type !== undefined) {
      fields.push('donation_type = ?');
      params.push(donation_type);
    }

    if (amount !== undefined) {
      const amountValue = parseFloat(amount);
      fields.push('amount = ?');
      params.push(isNaN(amountValue) ? 0 : amountValue);
    }

    if (type !== undefined) {
      fields.push('type = ?');
      params.push(type.trim());
    }

    if (payment_method !== undefined) {
      fields.push('payment_method = ?');
      params.push(payment_method ? payment_method.trim() : null);
    }

    if (donation_items !== undefined) {
      fields.push('donation_items = ?');
      params.push(donation_items ? donation_items.trim() : null);
    }

    if (notes !== undefined) {
      fields.push('notes = ?');
      params.push(notes ? notes.trim() : null);
    }

    if (date_created !== undefined) {
      const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');
      fields.push('date_created = ?');
      params.push(formattedDateCreated);
    }

    if (donation_date !== undefined) {
      const formattedDonationDate = moment(donation_date).format('YYYY-MM-DD');
      fields.push('donation_date = ?');
      params.push(formattedDonationDate);
    }

    if (fields.length === 0) {
      return {
        success: false,
        message: 'No fields to update',
        data: null
      };
    }

    params.push(tithesId);

    const sql = `
      UPDATE tbl_tithes
      SET ${fields.join(', ')}
      WHERE tithes_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Donation not found or no changes made',
        data: null
      };
    }

    // Fetch updated donation
    const updatedTithe = await getTitheById(tithesId);

    return {
      success: true,
      message: 'Donation updated successfully',
      data: updatedTithe.data
    };
  } catch (error) {
    console.error('Error updating donation:', error);
    throw error;
  }
}

/**
 * DELETE - Delete a donation record (archives it first)
 * @param {Number} tithesId - Tithes ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteTithe(tithesId, archivedBy = null) {
  try {
    if (!tithesId) {
      throw new Error('Tithes ID is required');
    }

    // Check if donation exists
    const titheCheck = await getTitheById(tithesId);
    if (!titheCheck.success) {
      return {
        success: false,
        message: 'Donation not found',
        data: null
      };
    }

    // Archive the record before deleting
    await archiveBeforeDelete(
      'tbl_tithes',
      String(tithesId),
      titheCheck.data,
      archivedBy
    );

    // Delete from original table
    const sql = 'DELETE FROM tbl_tithes WHERE tithes_id = ?';
    const [result] = await query(sql, [tithesId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Donation not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Donation archived and deleted successfully',
      data: { tithes_id: tithesId }
    };
  } catch (error) {
    console.error('Error deleting donation:', error);
    throw error;
  }
}

/**
 * Bulk delete tithes with archiving
 * @param {Array<number>} tithesIds - Array of tithes IDs to delete
 * @param {number|null} archivedBy - User ID who performed the deletion
 * @returns {Object} Result object with success status and details
 */
async function bulkDeleteTithes(tithesIds, archivedBy = null) {
  try {
    if (!Array.isArray(tithesIds) || tithesIds.length === 0) {
      throw new Error('Tithes IDs array is required and cannot be empty');
    }

    // Validate all IDs are numbers
    const validIds = tithesIds.filter(id => typeof id === 'number' && id > 0);
    if (validIds.length === 0) {
      throw new Error('No valid tithes IDs provided');
    }

    // Archive tithes before bulk delete
    const tithesToDelete = [];

    // Get tithe data for archiving
    for (const tithesId of validIds) {
      try {
        const tithe = await getTitheById(tithesId);
        if (tithe.success && tithe.data) {
          tithesToDelete.push(tithe.data);
          await archiveBeforeDelete('tbl_tithes', String(tithesId), tithe.data, archivedBy);
        }
      } catch (error) {
        console.warn(`Failed to archive tithe ${tithesId}:`, error.message);
        // Continue with deletion even if archiving fails
      }
    }

    // Perform bulk delete
    const placeholders = validIds.map(() => '?').join(',');
    const deleteSql = `DELETE FROM tbl_tithes WHERE tithes_id IN (${placeholders})`;
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
        archived_tithes: tithesToDelete
      }
    };
  } catch (error) {
    console.error('Error bulk deleting tithes:', error);
    throw error;
  }
}

/**
 * EXPORT - Export donation records to Excel
 * @param {Object} options - Optional query parameters
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportTithesToExcel(options = {}) {
  try {
    const exportOptions = { ...options };
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    const result = await getAllTithes(exportOptions);

    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No donations found to export');
    }

    const tithes = result.data;

    // Prepare data for Excel export
    const excelData = tithes.map((tithe, index) => {
      return {
        'No.': index + 1,
        'Tithes ID': tithe.tithes_id || '',
        'Member ID': tithe.member_id || '',
        'Member Name': tithe.member_name || '',
        'Anonymous': tithe.is_anonymous ? 'Yes' : 'No',
        'Donation Type': tithe.donation_type || 'money',
        'Full Name': tithe.fullname || '',
        'First Name': tithe.firstname || '',
        'Last Name': tithe.lastname || '',
        'Middle Name': tithe.middle_name || '',
        'Amount': tithe.amount || 0,
        'Type/Category': tithe.type || '',
        'Payment Method': tithe.payment_method || '',
        'Donation Items': tithe.donation_items || '',
        'Notes': tithe.notes || '',
        'Date Created': tithe.date_created ? moment(tithe.date_created).format('YYYY-MM-DD HH:mm:ss') : '',
        'Created Date': tithe.date_created ? moment(tithe.date_created).format('YYYY-MM-DD') : ''
      };
    });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 12 },  // Tithes ID
      { wch: 15 },  // Member ID
      { wch: 25 },  // Member Name
      { wch: 10 },  // Anonymous
      { wch: 12 },  // Donation Type
      { wch: 25 },  // Full Name
      { wch: 20 },  // First Name
      { wch: 20 },  // Last Name
      { wch: 15 },  // Middle Name
      { wch: 15 },  // Amount
      { wch: 15 },  // Type/Category
      { wch: 18 },  // Payment Method
      { wch: 30 },  // Donation Items
      { wch: 30 },  // Notes
      { wch: 20 },  // Date Created
      { wch: 15 }   // Created Date
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tithes & Offerings');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true
    });

    return excelBuffer;
  } catch (error) {
    console.error('Error exporting donations to Excel:', error);
    throw error;
  }
}

module.exports = {
  createTithe,
  createOnlineDonation,
  getAllTithes,
  getTitheById,
  updateTithe,
  deleteTithe,
  bulkDeleteTithes,
  exportTithesToExcel,
  verifyDonation,
  getProofImage,
  getAdminProofImage
};
