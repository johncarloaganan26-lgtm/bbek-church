const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const { archiveBeforeDelete } = require('../archiveHelper');
const { sendWaterBaptismDetails } = require('../emailHelper');

/**
 * Water Baptism Records CRUD Operations
 * Supports both member and non-member registrations
 * 
 * tbl_waterbaptism schema:
 * - baptism_id (VARCHAR(45), PK, NN)
 * - member_id (VARCHAR(45), nullable for non-members)
 * - firstname, lastname, middle_name, email, phone_number, birthdate, age, gender, address, civil_status (for non-members)
 * - baptism_date (DATETIME, nullable) - can be null for pending baptisms
 * - preferred_baptism_time (TIME, nullable) - preferred time for baptism
 * - status (VARCHAR(45), NN, default: 'pending')
 * - date_created (VARCHAR(45), NN)
 * - is_member (TINYINT(1), default 1) - 1=member, 0=non-member
 */

/**
 * Check if an email already exists in accounts table
 * @param {String} email - Email to check
 * @returns {Promise<Object>} Object with isDuplicate flag
 */
async function checkDuplicateEmail(email) {
  try {
    const sql = 'SELECT acc_id, email FROM tbl_accounts WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))';
    const [rows] = await query(sql, [email]);

    return {
      isDuplicate: rows.length > 0,
      account: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Error checking for duplicate email:', error);
    throw error;
  }
}

/**
 * Check if a time slot is available for water baptism
 * @param {String} baptismDate - Baptism date to check
 * @param {String} preferredBaptismTime - Preferred baptism time to check
 * @param {String} excludeBaptismId - Optional baptism_id to exclude from check (for updates)
 * @returns {Promise<Object>} Object with isBooked flag and conflicting baptism
 */
async function checkTimeSlotAvailability(baptismDate, preferredBaptismTime, excludeBaptismId = null) {
  try {
    const formattedDate = baptismDate && moment(baptismDate, 'YYYY-MM-DD', true).isValid()
      ? baptismDate
      : moment(baptismDate).format('YYYY-MM-DD');

    // Normalize time format to HH:mm:ss for consistent comparison
    let formattedTime = preferredBaptismTime;
    if (formattedTime) {
      // Handle various time formats
      let timeMoment;
      if (formattedTime.includes(':')) {
        // Try 24-hour formats first
        timeMoment = moment(formattedTime, ['HH:mm:ss', 'HH:mm', 'H:mm'], true);
        if (!timeMoment.isValid()) {
          // Try 12-hour formats
          timeMoment = moment(formattedTime, ['h:mm:ss A', 'h:mm A', 'h:mm:ss a', 'h:mm a'], true);
        }
      }

      if (timeMoment && timeMoment.isValid()) {
        formattedTime = timeMoment.format('HH:mm:ss');
      } else {
        // Fallback: ensure it's in HH:mm:ss format
        console.warn('Could not parse time format:', formattedTime, '- using as-is');
      }
    }

    // Extract minutes from the formatted time
    const minutes = formattedTime ? formattedTime.split(':')[1] : null;

    if (!minutes) {
      console.warn('Could not extract minutes from time:', formattedTime);
      return {
        isBooked: false,
        conflictingBaptism: null
      };
    }

    let sql = `
      SELECT baptism_id, firstname, lastname, preferred_baptism_time, status
      FROM tbl_waterbaptism
      WHERE DATE(baptism_date) = ?
      AND preferred_baptism_time LIKE CONCAT('%:', ?, ':%')
      AND status = 'approved'
    `;
    const params = [formattedDate, minutes];

    if (excludeBaptismId) {
      sql += ' AND baptism_id != ?';
      params.push(excludeBaptismId);
    }

    const [rows] = await query(sql, params);

    console.log('Minute slot check - Water Baptism:', {
      date: formattedDate,
      minutes: minutes,
      originalTime: preferredBaptismTime,
      conflicts: rows.length,
      status: rows.length > 0 ? 'BLOCKED' : 'ALLOWED'
    });

    return {
      isBooked: rows.length > 0,
      conflictingBaptism: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    // Don't throw - allow the operation to proceed if check fails
    return {
      isBooked: false,
      conflictingBaptism: null
    };
  }
}

/**
 * Utility function to convert buffer data to string
 * MySQL sometimes returns string fields as Buffer objects, especially with utf8mb4 encoding
 * @param {*} value - The value to convert
 * @returns {string|null} - The string value or null if invalid
 */
function convertBufferToString(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString('utf8');
  }
  return String(value);
}

/**
 * Process baptism record to convert any buffer data to strings
 * @param {Object} record - The baptism record from database
 * @returns {Object} - Processed record with string values
 */
function processBaptismRecord(record) {
  const fieldsToConvert = [
    'address', 'firstname', 'lastname', 'middle_name', 'email', 'phone_number',
    'civil_status', 'profession', 'spouse_name', 'desire_ministry', 'location', 'pastor_name', 'status', 'guardian_name',
    'guardian_contact', 'guardian_relationship', 'member_address', 'member_email',
    'member_phone_number', 'member_firstname', 'member_lastname', 'member_middle_name',
    'member_guardian_name', 'member_guardian_contact', 'member_guardian_relationship'
  ];
  
  const processed = { ...record };
  
  for (const field of fieldsToConvert) {
    if (processed[field] !== undefined) {
      processed[field] = convertBufferToString(processed[field]);
    }
  }
  
  return processed;
}

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
 * Supports both member and non-member registrations
 * @param {Object} baptismData - Water baptism data object
 * @param {string} baptismData.member_id - Member ID (optional for non-members)
 * @param {boolean} baptismData.is_member - Whether this is a member (default: true)
 * @param {string} baptismData.firstname - First name (for non-members)
 * @param {string} baptismData.lastname - Last name (for non-members)
 * @param {string} baptismData.email - Email (for non-members)
 * @param {string} baptismData.phone_number - Phone number (for non-members)
 * @param {Date|string|null} baptismData.baptism_date - Baptism date (optional, can be null)
 * @param {string|null} baptismData.baptism_time - Baptism time (optional, HH:MM format)
 * @param {string} baptismData.status - Status (default: 'pending')
 * @returns {Promise<Object>} Result object
 */
async function createWaterBaptism(baptismData) {
  try {
    let timeSlotWarning = null;

    // Get next baptism_id if not provided
    const new_baptism_id = await getNextBaptismId();
    console.log('New baptism ID:', new_baptism_id);
    
    const {
      baptism_id = new_baptism_id,
      member_id,
      is_member = true,
      firstname,
      lastname,
      middle_name,
      email,
      phone_number,
      birthdate,
      age,
      gender,
      address,
      civil_status,
      profession,
      spouse_name,
      marriage_date,
      children,
      desire_ministry,
      baptism_date,
      baptism_time,
      location,
      pastor_name,
      status = 'pending',
      date_created = new Date(),
      guardian_name,
      guardian_contact,
      guardian_relationship
    } = baptismData;

    // Validate: either member_id (for members) or personal info (for non-members) is required
    if (!member_id && is_member) {
      throw new Error('Missing required field: member_id for member registration');
    }
    
    if (!is_member && (!firstname || !lastname || !email)) {
      throw new Error('Missing required fields: firstname, lastname, and email are required for non-member registration');
    }

    // Check if email already exists in accounts table (for non-members)
    // This prevents creating duplicate accounts when baptism status changes to "completed"
    if (!is_member && email) {
      const emailCheck = await checkDuplicateEmail(email);
      if (emailCheck.isDuplicate) {
        throw new Error('An account with this email already exists. Please use a different email address.');
      }
    }

    // Check for time slot conflicts - Only check time, not date
    // Multiple water baptisms are allowed on the same date, but not at the same time
    if (baptism_date && baptism_time) {
      const timeSlotCheck = await checkTimeSlotAvailability(
        baptism_date,
        baptism_time,
        null // No exclusion for new records
      );

      if (timeSlotCheck.isBooked) {
        timeSlotWarning = `Time slot conflict: ${baptism_date} at ${baptism_time} is already booked.`;
      }
    }

    // Ensure baptism_id is set and convert to string
    const final_baptism_id = String(baptism_id || new_baptism_id).trim();
    
    // Convert member_id to string (can be null for non-members)
    const final_member_id = member_id ? String(member_id).trim() : null;

    // Format dates - baptism_date can be null
    const formattedBaptismDate = baptism_date ? moment(baptism_date).format('YYYY-MM-DD HH:mm:ss') : null;
    // date_created is VARCHAR(45), so format as string - use UTC to ensure consistency
    const formattedDateCreated = moment.utc(date_created).format('YYYY-MM-DD HH:mm:ss');
    const formattedBirthdate = birthdate ? moment(birthdate).format('YYYY-MM-DD') : null;

    // Build SQL conditionally based on whether baptism_date is provided
    let sql;
    let params;
    
    // Format marriage_date
    const formattedMarriageDate = marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null;

    if (formattedBaptismDate === null) {
      // Omit baptism_date column when it's null
      sql = `
        INSERT INTO tbl_waterbaptism
          (baptism_id, member_id, is_member, firstname, lastname, middle_name, email, phone_number, birthdate, age, gender, address, civil_status, profession, spouse_name, marriage_date, children, desire_ministry, preferred_baptism_time, location, pastor_name, status, guardian_name, guardian_contact, guardian_relationship, date_created)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        final_baptism_id,
        final_member_id,
        is_member ? 1 : 0,
        firstname || null,
        lastname || null,
        middle_name || null,
        email || null,
        phone_number || null,
        formattedBirthdate,
        age || null,
        gender || null,
        address || null,
        civil_status || null,
        profession || null,
        spouse_name || null,
        formattedMarriageDate,
        children || null,
        desire_ministry || null,
        baptism_time || null,
        location || null,
        pastor_name || null,
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
          (baptism_id, member_id, is_member, firstname, lastname, middle_name, email, phone_number, birthdate, age, gender, address, civil_status, profession, spouse_name, marriage_date, children, desire_ministry, baptism_date, preferred_baptism_time, location, pastor_name, status, guardian_name, guardian_contact, guardian_relationship, date_created)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        final_baptism_id,
        final_member_id,
        is_member ? 1 : 0,
        firstname || null,
        lastname || null,
        middle_name || null,
        email || null,
        phone_number || null,
        formattedBirthdate,
        age || null,
        gender || null,
        address || null,
        civil_status || null,
        profession || null,
        spouse_name || null,
        formattedMarriageDate,
        children || null,
        desire_ministry || null,
        formattedBaptismDate,
        baptism_time || null,
        location || null,
        pastor_name || null,
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

    // Send email notification (best-effort; do not fail creation)
    try {
      let recipientName, recipientEmail;
      
      if (is_member && member_id) {
        // Get member details from tbl_members
        const [memberRows] = await query(
          `SELECT firstname, lastname, middle_name, email, phone_number
           FROM tbl_members
           WHERE member_id = ?`,
          [final_member_id]
        );
        
        if (memberRows && memberRows.length > 0 && memberRows[0].email) {
          const member = memberRows[0];
          recipientName = `${member.firstname || ''} ${member.middle_name ? member.middle_name + ' ' : ''}${member.lastname || ''}`.trim() || 'Valued Member';
          recipientEmail = member.email;
        }
      } else {
        // Use non-member details directly from the baptism record
        recipientName = `${firstname || ''} ${middle_name ? middle_name + ' ' : ''}${lastname || ''}`.trim() || 'Valued Member';
        recipientEmail = email;
      }
      
      if (recipientEmail) {
        await sendWaterBaptismDetails({
          email: recipientEmail,
          status: createdBaptism.data.status,
          recipientName: recipientName,
          memberName: recipientName,
          baptismDate: createdBaptism.data.baptism_date
            ? moment(createdBaptism.data.baptism_date).format('YYYY-MM-DD HH:mm:ss')
            : 'To be determined',
          location: createdBaptism.data.location || 'To be determined',
          pastorName: createdBaptism.data.pastor_name,
          isMember: is_member && !!member_id
        });
      }
    } catch (emailError) {
      // Log but don't block record creation if email fails
      console.error('Error sending water baptism creation email:', emailError);
    }

    return {
      success: true,
      message: 'Water baptism created successfully',
      data: createdBaptism.data,
      timeSlotWarning: timeSlotWarning
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
    let dateRange = options.dateRange || null;

    // Parse dateRange if it's a JSON string
    if (dateRange && typeof dateRange === 'string') {
      try {
        dateRange = JSON.parse(dateRange);
      } catch (e) {
        console.warn('Failed to parse dateRange:', dateRange);
        dateRange = null;
      }
    }

    // Build base query for counting total records (with LEFT JOIN for accurate count including non-members)
    let countSql = 'SELECT COUNT(*) as total FROM tbl_waterbaptism wb LEFT JOIN tbl_members m ON wb.member_id = m.member_id';
    let countParams = [];

    // Build query for fetching records with member data
    // Use LEFT JOIN to include non-member records (where member_id is null)
    let sql = `SELECT
      wb.*,
      wb.preferred_baptism_time as baptism_time,
      m.firstname as member_firstname,
      m.lastname as member_lastname,
      m.middle_name as member_middle_name,
      m.birthdate as member_birthdate,
      m.age as member_age,
      m.gender as member_gender,
      m.address as member_address,
      m.email as member_email,
      m.phone_number as member_phone_number,
      m.civil_status as member_civil_status,
      m.position as member_position,
      m.guardian_name as member_guardian_name,
      m.guardian_contact as member_guardian_contact,
      m.guardian_relationship as member_guardian_relationship,
      -- For members: use member table data
      -- For non-members: use waterbaptism table's own fields
      COALESCE(m.firstname, wb.firstname) as firstname,
      COALESCE(m.lastname, wb.lastname) as lastname,
      COALESCE(m.middle_name, wb.middle_name) as middle_name,
      COALESCE(m.birthdate, wb.birthdate) as birthdate,
      COALESCE(m.age, wb.age) as age,
      COALESCE(m.gender, wb.gender) as gender,
      COALESCE(m.address, wb.address) as address,
      COALESCE(m.email, wb.email) as email,
      COALESCE(m.phone_number, wb.phone_number) as phone_number,
      COALESCE(m.civil_status, wb.civil_status) as civil_status,
      COALESCE(m.guardian_name, wb.guardian_name) as guardian_name,
      COALESCE(m.guardian_contact, wb.guardian_contact) as guardian_contact,
      COALESCE(m.guardian_relationship, wb.guardian_relationship) as guardian_relationship,
      CONCAT(
        COALESCE(m.firstname, wb.firstname),
        IF(COALESCE(m.middle_name, wb.middle_name) IS NOT NULL AND COALESCE(m.middle_name, wb.middle_name) != '', CONCAT(' ', COALESCE(m.middle_name, wb.middle_name)), ''),
        ' ',
        COALESCE(m.lastname, wb.lastname)
      ) as fullname
    FROM tbl_waterbaptism wb
    LEFT JOIN tbl_members m ON wb.member_id = m.member_id`;
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality (search by baptism_id, member_id, member name, non-member name, location, or pastor_name)
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue && searchValue.length >= 2) {
      const searchCondition = `(wb.baptism_id LIKE ? OR wb.member_id LIKE ?
        OR m.firstname LIKE ? OR m.lastname LIKE ? OR m.middle_name LIKE ?
        OR wb.firstname LIKE ? OR wb.lastname LIKE ? OR wb.email LIKE ?
        OR wb.location LIKE ? OR wb.pastor_name LIKE ?
        OR CONCAT(m.firstname, ' ', IFNULL(m.middle_name, ''), ' ', m.lastname) LIKE ?
        OR CONCAT(wb.firstname, ' ', IFNULL(wb.middle_name, ''), ' ', wb.lastname) LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add status filter
    if (status && status !== 'All Statuses') {
      whereConditions.push('status = ?');
      countParams.push(status);
      params.push(status);
      hasWhere = true;
    }

    // Add baptism date range filter
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      if (startDate && endDate) {
        whereConditions.push('wb.baptism_date BETWEEN ? AND ?');
        countParams.push(startDate, endDate);
        params.push(startDate, endDate);
        hasWhere = true;
      }
    }

    // Initialize sortByValue before using it
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;

    // Add month filter (e.g., 'January', 'February', 'This Month', 'Last Month')
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (sortByValue && monthNames.includes(sortByValue)) {
      const monthIndex = monthNames.indexOf(sortByValue) + 1; // 1-12
      whereConditions.push('MONTH(wb.baptism_date) = ? AND YEAR(wb.baptism_date) = YEAR(CURDATE())');
      countParams.push(monthIndex);
      params.push(monthIndex);
      hasWhere = true;
    } else if (sortByValue === 'This Month') {
      whereConditions.push('MONTH(wb.baptism_date) = MONTH(CURDATE()) AND YEAR(wb.baptism_date) = YEAR(CURDATE())');
      hasWhere = true;
    } else if (sortByValue === 'Last Month') {
      whereConditions.push('MONTH(wb.baptism_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(wb.baptism_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))');
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
      case 'Status (Pending First)':
        orderByClause += `CASE wb.status 
          WHEN 'Pending' THEN 1 
          WHEN 'Approved' THEN 2 
          WHEN 'Disapproved' THEN 3 
          WHEN 'Completed' THEN 4 
          WHEN 'Cancelled' THEN 5 
          ELSE 6 
        END, wb.date_created DESC`;
       break;
     case 'Date Range (Newest)':
       orderByClause += 'wb.baptism_date DESC';
       break;
     case 'Date Range (Oldest)':
       orderByClause += 'wb.baptism_date ASC';
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
    
    // Process all records to convert any buffer data to strings
    const processedRows = rows.map(processBaptismRecord);

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || rows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Water baptisms retrieved successfully',
      data: processedRows,
      count: processedRows.length,
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
      B.civil_status,
      B.position,
      B.guardian_name as member_guardian_name,
      B.guardian_contact as member_guardian_contact,
      B.guardian_relationship as member_guardian_relationship,
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
    
    // Process all records to convert any buffer data to strings
    const processedRows = rows.map(processBaptismRecord);
    
    return {
      success: true,
      message: 'Water baptism records retrieved successfully',
      data: processedRows
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

    // Process the record to convert any buffer data to strings
    const processedData = processBaptismRecord(rows[0]);

    return {
      success: true,
      message: 'Water baptism retrieved successfully',
      data: processedData
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
    let timeSlotWarning = null;

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
      is_member,
      firstname,
      lastname,
      middle_name,
      email,
      phone_number,
      birthdate,
      age,
      gender,
      address,
      civil_status,
      profession,
      spouse_name,
      marriage_date,
      children,
      desire_ministry,
      baptism_date,
      baptism_time,
      location,
      pastor_name,
      status,
      date_created,
      guardian_name,
      guardian_contact,
      guardian_relationship
    } = baptismData;

    // Check for time slot conflicts before updating
    const currentData = baptismCheck.data;
    const finalBaptismDate = baptism_date !== undefined ? baptism_date : currentData.baptism_date;
    const finalBaptismTime = baptism_time !== undefined ? baptism_time : currentData.preferred_baptism_time;

    // Only check conflicts if baptism_date or baptism_time is being updated
    if (baptism_date !== undefined || baptism_time !== undefined) {
      if (finalBaptismDate && finalBaptismTime) {
        const timeSlotCheck = await checkTimeSlotAvailability(
          finalBaptismDate,
          finalBaptismTime,
          baptismId
        );

        if (timeSlotCheck.isBooked) {
          timeSlotWarning = `Time slot conflict: ${finalBaptismDate} at ${finalBaptismTime} is already booked.`;
        }
      }
    }

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (member_id !== undefined) {
      fields.push('member_id = ?');
      params.push(member_id ? String(member_id).trim() : null);
    }

    if (is_member !== undefined) {
      fields.push('is_member = ?');
      params.push(is_member ? 1 : 0);
    }

    if (firstname !== undefined) {
      fields.push('firstname = ?');
      params.push(firstname);
    }

    if (lastname !== undefined) {
      fields.push('lastname = ?');
      params.push(lastname);
    }

    if (middle_name !== undefined) {
      fields.push('middle_name = ?');
      params.push(middle_name);
    }

    if (email !== undefined) {
      fields.push('email = ?');
      params.push(email);
    }

    if (phone_number !== undefined) {
      fields.push('phone_number = ?');
      params.push(phone_number);
    }

    if (birthdate !== undefined) {
      const formattedBirthdate = birthdate ? moment(birthdate).format('YYYY-MM-DD') : null;
      fields.push('birthdate = ?');
      params.push(formattedBirthdate);
    }

    if (age !== undefined) {
      fields.push('age = ?');
      params.push(age);
    }

    if (gender !== undefined) {
      fields.push('gender = ?');
      params.push(gender);
    }

    if (address !== undefined) {
      fields.push('address = ?');
      params.push(address);
    }

    if (civil_status !== undefined) {
      fields.push('civil_status = ?');
      params.push(civil_status);
    }

    if (profession !== undefined) {
      fields.push('profession = ?');
      params.push(profession);
    }

    if (spouse_name !== undefined) {
      fields.push('spouse_name = ?');
      params.push(spouse_name);
    }

    if (marriage_date !== undefined) {
      const formattedMarriageDate = marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null;
      fields.push('marriage_date = ?');
      params.push(formattedMarriageDate);
    }

    if (children !== undefined) {
      fields.push('children = ?');
      params.push(children);
    }

    if (desire_ministry !== undefined) {
      fields.push('desire_ministry = ?');
      params.push(desire_ministry);
    }

    if (baptism_date !== undefined) {
      const formattedBaptismDate = moment(baptism_date).format('YYYY-MM-DD HH:mm:ss');
      fields.push('baptism_date = ?');
      params.push(formattedBaptismDate);
    }

    if (baptism_time !== undefined) {
      fields.push('preferred_baptism_time = ?');
      params.push(baptism_time && baptism_time.trim() !== '' ? baptism_time : null);
    }

    if (location !== undefined) {
      fields.push('location = ?');
      params.push(location || null);
    }

    if (pastor_name !== undefined) {
      fields.push('pastor_name = ?');
      params.push(pastor_name || null);
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

    // Send email notification to the member/non-member (if we can resolve email)
    try {
      let recipientName, recipientEmail;
      
      if (updatedBaptism.data.is_member === 1 && updatedBaptism.data.member_id) {
        // Get member contact details from tbl_members
        const [memberRows] = await query(
          `SELECT firstname, lastname, middle_name, email, phone_number
           FROM tbl_members
           WHERE member_id = ?`,
          [updatedBaptism.data.member_id]
        );

        if (memberRows && memberRows.length > 0 && memberRows[0].email) {
          const member = memberRows[0];
          recipientName = `${member.firstname || ''} ${member.middle_name ? member.middle_name + ' ' : ''}${member.lastname || ''}`.trim() || 'Valued Member';
          recipientEmail = member.email;
        }
      } else {
        // Use non-member details directly from the baptism record
        recipientName = `${updatedBaptism.data.firstname || ''} ${updatedBaptism.data.middle_name ? updatedBaptism.data.middle_name + ' ' : ''}${updatedBaptism.data.lastname || ''}`.trim() || 'Valued Member';
        recipientEmail = updatedBaptism.data.email;
      }
      
      if (recipientEmail) {
        await sendWaterBaptismDetails({
          email: recipientEmail,
          status: updatedBaptism.data.status,
          recipientName: recipientName,
          memberName: recipientName,
          baptismDate: updatedBaptism.data.baptism_date
            ? moment(updatedBaptism.data.baptism_date).format('YYYY-MM-DD HH:mm:ss')
            : 'To be determined',
          location: updatedBaptism.data.location || 'To be determined',
          pastorName: updatedBaptism.data.pastor_name,
          isMember: updatedBaptism.data.is_member === 1 && !!updatedBaptism.data.member_id
        });
      }
    } catch (emailError) {
      // Do not block update flow on email failure, just log for diagnostics
      console.error('Error sending water baptism update email:', emailError);
    }

    return {
      success: true,
      message: 'Water baptism updated successfully',
      data: updatedBaptism.data,
      timeSlotWarning: timeSlotWarning
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
 * Bulk delete water baptisms with archiving
 * @param {Array<string>} baptismIds - Array of baptism IDs to delete
 * @param {number|null} archivedBy - User ID who performed the deletion
 * @returns {Object} Result object with success status and details
 */
async function bulkDeleteWaterBaptisms(baptismIds, archivedBy = null) {
  try {
    if (!Array.isArray(baptismIds) || baptismIds.length === 0) {
      throw new Error('Baptism IDs array is required and cannot be empty');
    }

    // Validate all IDs are provided
    const validIds = baptismIds.filter(id => typeof id === 'string' && id.trim().length > 0);
    if (validIds.length === 0) {
      throw new Error('No valid baptism IDs provided');
    }

    // Archive baptisms before bulk delete
    const baptismsToDelete = [];

    // Get baptism data for archiving
    for (const baptismId of validIds) {
      try {
        const baptism = await getWaterBaptismById(baptismId);
        if (baptism.success && baptism.data) {
          baptismsToDelete.push(baptism.data);
          await archiveBeforeDelete('tbl_waterbaptism', String(baptismId), baptism.data, archivedBy);
        }
      } catch (error) {
        console.warn(`Failed to archive water baptism ${baptismId}:`, error.message);
        // Continue with deletion even if archiving fails
      }
    }

    // Perform bulk delete
    const placeholders = validIds.map(() => '?').join(',');
    const deleteSql = `DELETE FROM tbl_waterbaptism WHERE baptism_id IN (${placeholders})`;
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
        archived_baptisms: baptismsToDelete
      }
    };
  } catch (error) {
    console.error('Error bulk deleting water baptisms:', error);
    throw error;
  }
}

/**
 * EXPORT - Export water baptism records to Excel
 * @param {Object} options - Optional query parameters (same as getAllWaterBaptisms: search, status, sortBy, dateRange)
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
        'Is Member': baptism.is_member === 1 ? 'Yes' : 'No',
        'First Name': baptism.firstname || '',
        'Middle Name': baptism.middle_name || '',
        'Last Name': baptism.lastname || '',
        'Birthdate': baptism.birthdate || '',
        'Age': baptism.age || '',
        'Gender': baptism.gender || '',
        'Address': baptism.address || '',
        'Email': baptism.email || '',
        'Phone Number': baptism.phone_number || '',
        'Civil Status': baptism.civil_status || '',
        'Profession': baptism.profession || '',
        'Spouse Name': baptism.spouse_name || '',
        'Marriage Date': baptism.marriage_date || '',
        'Children': baptism.children || '',
        'Desire Ministry': baptism.desire_ministry || '',
        'Location': baptism.location || '',
        'Pastor Name': baptism.pastor_name || '',
        'Baptism Date': baptism.baptism_date ? moment(baptism.baptism_date).format('YYYY-MM-DD') : '',
        'Baptism Time': baptism.baptism_time || '',
        'Status': baptism.status || '',
        'Guardian Name': baptism.guardian_name || '',
        'Guardian Contact': baptism.guardian_contact || '',
        'Guardian Relationship': baptism.guardian_relationship || '',
        'Date Created': baptism.date_created ? moment(baptism.date_created).format('YYYY-MM-DD HH:mm:ss') : ''
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 15 },  // Baptism ID
      { wch: 15 },  // Member ID
      { wch: 15 },  // First Name
      { wch: 15 },  // Middle Name
      { wch: 15 },  // Last Name
      { wch: 15 },  // Birthdate
      { wch: 8 },   // Age
      { wch: 10 },  // Gender
      { wch: 40 },  // Address
      { wch: 25 },  // Email
      { wch: 15 },  // Phone Number
      { wch: 15 },  // Civil Status
      { wch: 20 },  // Profession
      { wch: 20 },  // Spouse Name
      { wch: 15 },  // Marriage Date
      { wch: 30 },  // Children
      { wch: 20 },  // Desire Ministry
      { wch: 25 },  // Location
      { wch: 20 },  // Pastor Name
      { wch: 20 },  // Baptism Date
      { wch: 15 },  // Baptism Time
      { wch: 15 },  // Status
      { wch: 20 },  // Guardian Name
      { wch: 20 },  // Guardian Contact
      { wch: 20 },  // Guardian Relationship
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
      // Process the record to convert any buffer data to strings
      return processBaptismRecord(rows[0]);
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
  bulkDeleteWaterBaptisms,
  exportWaterBaptismsToExcel,
  getSpecificWaterBaptismDataByMemberIdIfBaptized,
  checkTimeSlotAvailability
};
