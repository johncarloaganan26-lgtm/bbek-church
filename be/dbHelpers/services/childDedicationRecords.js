const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const { archiveBeforeDelete } = require('../archiveHelper');
const { sendChildDedicationDetails } = require('../emailHelperBrevo');

/**
 * Child Dedication Records CRUD Operations
 * Based on tbl_childdedications schema:
 * - child_id (VARCHAR(45), PK, NN) - Auto-generated ID
 * - requested_by (VARCHAR(45), NN) - Member ID of the requester (FK to tbl_members)
 * - child_firstname (VARCHAR(100), NN)
 * - child_lastname (VARCHAR(100), NN)
 * - child_middle_name (VARCHAR(100), NULL)
 * - date_of_birth (DATE, NN)
 * - place_of_birth (VARCHAR(255), NN)
 * - gender (VARCHAR(1), NN) - 'M' or 'F'
 * - preferred_dedication_date (DATE, NN)
 * - preferred_dedication_time (TIME, NULL) - Preferred time for dedication ceremony
 * - date_completed (DATE, NULL) - Actual date when dedication was completed
 * - contact_phone_number (VARCHAR(45), NN)
 * - contact_email (VARCHAR(255), NULL)
 * - contact_address (VARCHAR(500), NN)
 * - father_firstname, father_lastname, father_middle_name, father_phone_number, father_email, father_address (optional)
 * - mother_firstname, mother_lastname, mother_middle_name, mother_phone_number, mother_email, mother_address (optional)
 * - sponsors (VARCHAR(1000), NULL) - JSON stringified array of sponsor objects
 * - pastor (VARCHAR(255), NULL) - Name of the pastor conducting the dedication
 * - location (VARCHAR(255), NULL) - Location where the dedication will take place
 * - requester_relationship (VARCHAR(45), NULL) - Relationship of requester to child
 * - status (VARCHAR(45), NN, default: 'pending')
 * - date_created (DATETIME, NN)
 */

/**
 * Check if a child dedication request already exists for the same child by the same requester
 * @param {String} requestedBy - Member ID of the requester
 * @param {String} childFirstname - Child's first name
 * @param {String} childLastname - Child's last name
 * @param {String} dateOfBirth - Child's date of birth (YYYY-MM-DD)
 * @param {String} excludeChildId - Optional child_id to exclude from check (for updates)
 * @returns {Promise<Object>} Object with isDuplicate flag
 */
async function checkDuplicateChildDedication(requestedBy, childFirstname, childLastname, dateOfBirth, excludeChildId = null) {
  try {
    let sql = `SELECT child_id, requested_by, child_firstname, child_lastname, date_of_birth 
               FROM tbl_childdedications 
               WHERE requested_by = ? 
               AND LOWER(TRIM(child_firstname)) = LOWER(TRIM(?)) 
               AND LOWER(TRIM(child_lastname)) = LOWER(TRIM(?)) 
               AND date_of_birth = ?`;
    const params = [requestedBy, childFirstname, childLastname, dateOfBirth];

    if (excludeChildId) {
      sql += ' AND child_id != ?';
      params.push(excludeChildId);
    }

    const [rows] = await query(sql, params);

    return {
      isDuplicate: rows.length > 0,
      dedication: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Error checking for duplicate child dedication:', error);
    throw error;
  }
}

/**
 * Check for preferred dedication date conflicts
 * @param {String} preferredDedicationDate - Preferred dedication date to check
 * @param {String} requestedBy - Member ID of the requester
 * @param {String} excludeChildId - Child ID to exclude from conflict check (for updates)
 * @returns {Promise<Object|null>} Conflict details or null if no conflict
 */
async function checkPreferredDedicationDateConflict(preferredDedicationDate, requestedBy, excludeChildId = null) {
  try {
    // NOTE: Date conflicts are now allowed - multiple child dedications can be scheduled on the same date
    // Only time slot conflicts are checked in checkTimeSlotAvailability function
    return null; // No date conflict checking - always return null
  } catch (error) {
    console.error('Error checking preferred dedication date conflict:', error);
    // Don't throw - allow the operation to proceed if conflict check fails
    return null;
  }
}

/**
 * Get the next child_id (incremental)
 * @returns {Promise<String>} Next child_id as zero-padded string
 */
async function getNextChildId() {
  try {
    const sql = 'SELECT MAX(child_id) AS max_child_id FROM tbl_childdedications';
    const [rows] = await query(sql);
    
    // If no records exist, start with 1, otherwise increment by 1
    const maxId = rows[0]?.max_child_id || null;
    
    if (!maxId) {
      // First record - return "0000000001"
      return '0000000001';
    }
    
    // Extract numeric part if child_id has prefix (e.g., "CHILD0000000001" -> 1)
    // Or if it's just numeric, use it directly
    const numericMatch = maxId.match(/\d+$/);
    if (numericMatch) {
      const numericPart = parseInt(numericMatch[0]);
      const newNumericId = numericPart + 1;
      return newNumericId.toString().padStart(10, '0');
    }
    
    // If no numeric part found, start from 1
    return '0000000001';
  } catch (error) {
    console.error('Error getting next child ID:', error);
    throw error;
  }
}

/**
 * CREATE - Insert a new child dedication record
 * @param {Object} dedicationData - Child dedication data object
 * @returns {Promise<Object>} Result object
 */
async function createChildDedication(dedicationData) {
  try {
    // Get next child_id if not provided
    const new_child_id = await getNextChildId();
    console.log('New child ID:', new_child_id);
    
    const {
      child_id = new_child_id,
      requested_by,
      requester_relationship = null,
      child_firstname,
      child_lastname,
      child_middle_name = null,
      date_of_birth,
      place_of_birth,
      gender,
      preferred_dedication_date,
      preferred_dedication_time = null,
      date_completed = null,
      contact_phone_number,
      contact_email = null,
      contact_address,
      father_firstname = null,
      father_lastname = null,
      father_middle_name = null,
      father_phone_number = null,
      father_email = null,
      father_address = null,
      mother_firstname = null,
      mother_lastname = null,
      mother_middle_name = null,
      mother_phone_number = null,
      mother_email = null,
      mother_address = null,
      sponsors = null,
      pastor = null,
      location = null,
      status = 'pending',
      date_created = new Date()
    } = dedicationData;

    // Validate required fields
    if (!requested_by) {
      throw new Error('Missing required field: requested_by (member ID)');
    }
    if (!child_firstname || !child_firstname.trim()) {
      throw new Error('Missing required field: child_firstname');
    }
    if (!child_lastname || !child_lastname.trim()) {
      throw new Error('Missing required field: child_lastname');
    }
    if (!date_of_birth) {
      throw new Error('Missing required field: date_of_birth');
    }
    if (!place_of_birth || !place_of_birth.trim()) {
      throw new Error('Missing required field: place_of_birth');
    }
    if (!gender || !['M', 'F'].includes(gender.toUpperCase())) {
      throw new Error('Missing or invalid required field: gender (must be M or F)');
    }
    // Preferred dedication date is required only for admin/staff users
    // Admin/staff users are identified by having pastor/location fields set (not null/undefined)
    const isAdminStaffUser = pastor !== null && pastor !== undefined && location !== null && location !== undefined;

    if (isAdminStaffUser && !preferred_dedication_date) {
      throw new Error('Missing required field: preferred_dedication_date');
    }
    // Contact phone and address are optional for all users (can be auto-filled from member data)
    // Admin/staff users are identified by having pastor/location fields set

    // Validate pastor and location if provided (admin/staff fields)
    if (pastor !== undefined && pastor !== null) {
      if (!pastor || !pastor.trim()) {
        throw new Error('Missing required field: pastor');
      }
      if (typeof pastor !== 'string') {
        throw new Error('Invalid field: pastor must be a string');
      }
      if (pastor.length > 255) {
        throw new Error('Invalid field: pastor name exceeds maximum length of 255 characters');
      }
    }

    if (location !== undefined && location !== null) {
      if (!location || !location.trim()) {
        throw new Error('Missing required field: location');
      }
      if (typeof location !== 'string') {
        throw new Error('Invalid field: location must be a string');
      }
      if (location.length > 255) {
        throw new Error('Invalid field: location exceeds maximum length of 255 characters');
      }
    }

    // Convert sponsors array to JSON string if provided
    let sponsorsJson = null;
    if (sponsors !== null && sponsors !== undefined) {
      if (Array.isArray(sponsors)) {
        sponsorsJson = JSON.stringify(sponsors);
      } else if (typeof sponsors === 'string') {
        // If it's already a string, try to parse and re-stringify to validate
        try {
          const parsed = JSON.parse(sponsors);
          sponsorsJson = JSON.stringify(parsed);
        } catch (e) {
          // If not valid JSON, treat as plain string and wrap in array
          sponsorsJson = JSON.stringify([sponsors]);
        }
      } else {
        sponsorsJson = JSON.stringify([sponsors]);
      }

      // Validate sponsors JSON length (max 1000 characters)
      if (sponsorsJson.length > 1000) {
        return {
          success: false,
          message: 'Sponsors data exceeds maximum length of 1000 characters',
          error: 'Sponsors data too long'
        };
      }
    }

    // Check for duplicate (same requester, same child name, same birthdate)
    const duplicateCheck = await checkDuplicateChildDedication(
      requested_by.trim(),
      child_firstname.trim(),
      child_lastname.trim(),
      date_of_birth && moment(date_of_birth, 'YYYY-MM-DD', true).isValid()
        ? date_of_birth
        : moment(date_of_birth).format('YYYY-MM-DD')
    );
    
    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        message: 'A child dedication request for this child already exists from this member',
        error: 'Duplicate child dedication request'
      };
    }

    // Ensure child_id is set
    const final_child_id = child_id || new_child_id;

    // Format dates - check if already in YYYY-MM-DD format to avoid timezone issues
    const formattedDateOfBirth = date_of_birth && moment(date_of_birth, 'YYYY-MM-DD', true).isValid()
      ? date_of_birth
      : moment(date_of_birth).format('YYYY-MM-DD');
    
    // Handle preferred_dedication_date - can be null for member users
    const formattedPreferredDate = preferred_dedication_date && preferred_dedication_date.trim() !== ''
      ? (moment(preferred_dedication_date, 'YYYY-MM-DD', true).isValid()
          ? preferred_dedication_date
          : moment(preferred_dedication_date).format('YYYY-MM-DD'))
      : null;
    
    const formattedDateCompleted = date_completed
      ? (moment(date_completed, 'YYYY-MM-DD', true).isValid()
          ? date_completed
          : moment(date_completed).format('YYYY-MM-DD'))
      : null;
    
    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');

    // Check for time slot conflicts - Only check time, not date
    // Multiple child dedications are allowed on the same date, but not at the same time
    if (preferred_dedication_date && preferred_dedication_time) {
      const timeSlotCheck = await checkTimeSlotAvailability(
        preferred_dedication_date,
        preferred_dedication_time,
        null // No exclusion for new records
      );

      if (timeSlotCheck && timeSlotCheck.isBooked) {
        return {
          success: false,
          message: `Time slot conflict: ${preferred_dedication_date} at ${preferred_dedication_time} is already booked.`,
          error: 'Time slot conflict',
          conflict: timeSlotCheck.conflictingDedication
        };
      }
    }

    // Normalize gender to uppercase
    const normalizedGender = gender.toUpperCase();

    const sql = `
      INSERT INTO tbl_childdedications
        (child_id, requested_by, requester_relationship, child_firstname, child_lastname, child_middle_name,
         date_of_birth, place_of_birth, gender, preferred_dedication_date, preferred_dedication_time, date_completed,
         contact_phone_number, contact_email, contact_address,
         father_firstname, father_lastname, father_middle_name, father_phone_number, father_email, father_address,
         mother_firstname, mother_lastname, mother_middle_name, mother_phone_number, mother_email, mother_address,
         sponsors, pastor, location, status, date_created)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      final_child_id.trim(),
      requested_by.trim(),
      requester_relationship ? requester_relationship.trim() : null,
      child_firstname.trim(),
      child_lastname.trim(),
      child_middle_name ? child_middle_name.trim() : null,
      formattedDateOfBirth,
      place_of_birth.trim(),
      normalizedGender,
      formattedPreferredDate,
      preferred_dedication_time,
      formattedDateCompleted,
      contact_phone_number.trim(),
      contact_email ? contact_email.trim() : null,
      contact_address.trim(),
      father_firstname ? father_firstname.trim() : null,
      father_lastname ? father_lastname.trim() : null,
      father_middle_name ? father_middle_name.trim() : null,
      father_phone_number ? father_phone_number.trim() : null,
      father_email ? father_email.trim() : null,
      father_address ? father_address.trim() : null,
      mother_firstname ? mother_firstname.trim() : null,
      mother_lastname ? mother_lastname.trim() : null,
      mother_middle_name ? mother_middle_name.trim() : null,
      mother_phone_number ? mother_phone_number.trim() : null,
      mother_email ? mother_email.trim() : null,
      mother_address ? mother_address.trim() : null,
      sponsorsJson,
      pastor ? pastor.trim() : null,
      location ? location.trim() : null,
      status,
      formattedDateCreated
    ];

    let result;
    try {
      [result] = await query(sql, params);
    } catch (dbError) {
      console.error('Database error creating child dedication:', dbError);
      throw new Error(`Failed to create child dedication record: ${dbError.message}`);
    }

    // Fetch the created dedication
    let createdDedication;
    try {
      createdDedication = await getChildDedicationById(final_child_id);
      if (!createdDedication.success) {
        console.warn('Warning: Created dedication not found after creation');
        createdDedication = { data: null };
      }
    } catch (fetchError) {
      console.error('Error fetching created dedication:', fetchError);
      createdDedication = { data: null };
    }

    // Send email notifications to all relevant recipients (best-effort; do not fail creation)
    try {
      const [memberRows] = await query(
        `SELECT firstname, lastname, middle_name, email, phone_number
         FROM tbl_members
         WHERE member_id = ?`,
        [requested_by]
      );

      const childName = `${child_firstname} ${child_middle_name ? child_middle_name + ' ' : ''}${child_lastname}`.trim();
      const dedicationDate = createdDedication.data?.preferred_dedication_date
        ? moment(createdDedication.data.preferred_dedication_date).format('YYYY-MM-DD')
        : 'To be determined';

      const dedicationStatus = createdDedication.data?.status || 'pending';
      const dedicationLocation = createdDedication.data?.location || 'Church';

      // Collect unique email addresses to send to (to avoid duplicates)
      const emailRecipients = new Set();

      // 1. Requester (member) email
      if (memberRows && memberRows.length > 0 && memberRows[0].email) {
        const member = memberRows[0];
        const recipientName = `${member.firstname || ''} ${member.middle_name ? member.middle_name + ' ' : ''}${member.lastname || ''}`.trim() || 'Valued Member';
        emailRecipients.add(member.email.toLowerCase());

        // Send email to requester
        await sendChildDedicationDetails({
          email: member.email,
          status: dedicationStatus,
          recipientName: recipientName,
          childName: childName,
          parentName: recipientName,
          dedicationDate: dedicationDate,
          dedicationTime: createdDedication.data?.preferred_dedication_time || null,
          location: dedicationLocation,
          pastor: createdDedication.data?.pastor || null
        });
      }

      // 2. Contact email (if different from requester)
      if (contact_email && contact_email.trim()) {
        const contactEmailLower = contact_email.trim().toLowerCase();
        if (!emailRecipients.has(contactEmailLower)) {
          emailRecipients.add(contactEmailLower);
          await sendChildDedicationDetails({
            email: contact_email.trim(),
            status: dedicationStatus,
            recipientName: 'Valued Member',
            childName: childName,
            parentName: 'Valued Member',
            dedicationDate: dedicationDate,
            dedicationTime: createdDedication.data?.preferred_dedication_time || null,
            location: dedicationLocation,
            pastor: createdDedication.data?.pastor || null
          });
        }
      }

      // 3. Father's email (if provided)
      if (father_email && father_email.trim()) {
        const fatherEmailLower = father_email.trim().toLowerCase();
        if (!emailRecipients.has(fatherEmailLower)) {
          emailRecipients.add(fatherEmailLower);
          const fatherName = father_firstname || father_lastname
            ? `${father_firstname || ''} ${father_middle_name ? father_middle_name + ' ' : ''}${father_lastname || ''}`.trim()
            : 'Valued Member';
          await sendChildDedicationDetails({
            email: father_email.trim(),
            status: dedicationStatus,
            recipientName: fatherName,
            childName: childName,
            parentName: fatherName,
            dedicationDate: dedicationDate,
            dedicationTime: createdDedication.data?.preferred_dedication_time || null,
            location: dedicationLocation,
            pastor: createdDedication.data?.pastor || null
          });
        }
      }

      // 4. Mother's email (if provided)
      if (mother_email && mother_email.trim()) {
        const motherEmailLower = mother_email.trim().toLowerCase();
        if (!emailRecipients.has(motherEmailLower)) {
          emailRecipients.add(motherEmailLower);
          const motherName = mother_firstname || mother_lastname
            ? `${mother_firstname || ''} ${mother_middle_name ? mother_middle_name + ' ' : ''}${mother_lastname || ''}`.trim()
            : 'Valued Member';
          await sendChildDedicationDetails({
            email: mother_email.trim(),
            status: dedicationStatus,
            recipientName: motherName,
            childName: childName,
            parentName: motherName,
            dedicationDate: dedicationDate,
            dedicationTime: createdDedication.data?.preferred_dedication_time || null,
            location: dedicationLocation,
            pastor: createdDedication.data?.pastor || null
          });
        }
      }
    } catch (emailError) {
      // Log but don't block record creation if email fails
      console.error('Error sending child dedication creation email:', emailError);
    }

    return {
      success: true,
      message: 'Child dedication request created successfully',
      data: createdDedication.data || {
        child_id: final_child_id,
        requested_by,
        requester_relationship,
        child_firstname,
        child_lastname,
        child_middle_name,
        date_of_birth: formattedDateOfBirth,
        place_of_birth,
        gender: normalizedGender,
        preferred_dedication_date: formattedPreferredDate,
        preferred_dedication_time,
        date_completed: formattedDateCompleted,
        contact_phone_number,
        contact_email,
        contact_address,
        father_firstname,
        father_lastname,
        father_middle_name,
        father_phone_number,
        father_email,
        father_address,
        mother_firstname,
        mother_lastname,
        mother_middle_name,
        mother_phone_number,
        mother_email,
        mother_address,
        sponsors: sponsorsJson,
        pastor,
        location,
        status,
        date_created: formattedDateCreated
      }
    };
  } catch (error) {
    console.error('Error creating child dedication:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all child dedication records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, status, sortBy)
 * @returns {Promise<Object>} Object with paginated child dedication records and metadata
 */
async function getAllChildDedications(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const status = options.status || null;
    const sortBy = options.sortBy || null;

    // Build base query for counting total records (with JOIN for requester info)
    let countSql = `SELECT COUNT(*) as total 
                    FROM tbl_childdedications cd 
                    INNER JOIN tbl_members m ON cd.requested_by = m.member_id`;
    let countParams = [];

    // Build query for fetching records with requester data
    let sql = `SELECT 
      cd.*,
      m.firstname as requester_firstname,
      m.lastname as requester_lastname,
      m.middle_name as requester_middle_name,
      m.gender as requester_gender,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as requester_fullname,
      CONCAT(
        cd.child_firstname,
        IF(cd.child_middle_name IS NOT NULL AND cd.child_middle_name != '', CONCAT(' ', cd.child_middle_name), ''),
        ' ',
        cd.child_lastname
      ) as child_fullname,
      CONCAT(
        IFNULL(cd.father_firstname, ''),
        IF(cd.father_middle_name IS NOT NULL AND cd.father_middle_name != '', CONCAT(' ', cd.father_middle_name), ''),
        IF(cd.father_lastname IS NOT NULL AND cd.father_lastname != '', CONCAT(' ', cd.father_lastname), '')
      ) as father_fullname,
      CONCAT(
        IFNULL(cd.mother_firstname, ''),
        IF(cd.mother_middle_name IS NOT NULL AND cd.mother_middle_name != '', CONCAT(' ', cd.mother_middle_name), ''),
        IF(cd.mother_lastname IS NOT NULL AND cd.mother_lastname != '', CONCAT(' ', cd.mother_lastname), '')
      ) as mother_fullname
    FROM tbl_childdedications cd
    INNER JOIN tbl_members m ON cd.requested_by = m.member_id`;
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality (search by child_id, child name, requester name, etc.)
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(
        cd.child_id LIKE ? OR 
        cd.child_firstname LIKE ? OR 
        cd.child_lastname LIKE ? OR 
        cd.child_middle_name LIKE ? OR
        CONCAT(cd.child_firstname, ' ', IFNULL(cd.child_middle_name, ''), ' ', cd.child_lastname) LIKE ? OR
        m.firstname LIKE ? OR 
        m.lastname LIKE ? OR 
        m.middle_name LIKE ? OR
        CONCAT(m.firstname, ' ', IFNULL(m.middle_name, ''), ' ', m.lastname) LIKE ? OR
        cd.contact_phone_number LIKE ? OR
        cd.contact_email LIKE ?
      )`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      // Add searchPattern 12 times for all the LIKE conditions
      for (let i = 0; i < 12; i++) {
        countParams.push(searchPattern);
        params.push(searchPattern);
      }
      hasWhere = true;
    }

    // Add status filter
    if (status && status !== 'All Statuses') {
      whereConditions.push('cd.status = ?');
      countParams.push(status);
      params.push(status);
      hasWhere = true;
    }

    // Initialize sortByValue before using it
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;

    // Add month filter (e.g., 'January', 'February', 'This Month', 'Last Month')
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (sortByValue && monthNames.includes(sortByValue)) {
      const monthIndex = monthNames.indexOf(sortByValue) + 1; // 1-12
      whereConditions.push('MONTH(cd.preferred_dedication_date) = ? AND YEAR(cd.preferred_dedication_date) = YEAR(CURDATE())');
      countParams.push(monthIndex);
      params.push(monthIndex);
      hasWhere = true;
    } else if (sortByValue === 'This Month') {
      whereConditions.push('MONTH(cd.preferred_dedication_date) = MONTH(CURDATE()) AND YEAR(cd.preferred_dedication_date) = YEAR(CURDATE())');
      hasWhere = true;
    } else if (sortByValue === 'Last Month') {
      whereConditions.push('MONTH(cd.preferred_dedication_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(cd.preferred_dedication_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))');
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
      case 'Child ID (A-Z)':
        orderByClause += 'cd.child_id ASC';
        break;
      case 'Child ID (Z-A)':
        orderByClause += 'cd.child_id DESC';
        break;
      case 'Child Name (A-Z)':
        orderByClause += 'cd.child_firstname ASC, cd.child_lastname ASC';
        break;
      case 'Child Name (Z-A)':
        orderByClause += 'cd.child_firstname DESC, cd.child_lastname DESC';
        break;
      case 'Preferred Date (Newest)':
        orderByClause += 'cd.preferred_dedication_date DESC';
        break;
      case 'Preferred Date (Oldest)':
        orderByClause += 'cd.preferred_dedication_date ASC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'cd.date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'cd.date_created ASC';
        break;
      case 'Status (A-Z)':
        orderByClause += 'cd.status ASC';
        break;
      case 'Status (Pending First)':
        orderByClause += `CASE cd.status 
          WHEN 'Pending' THEN 1 
          WHEN 'Approved' THEN 2 
          WHEN 'Disapproved' THEN 3 
          WHEN 'Completed' THEN 4 
          WHEN 'Cancelled' THEN 5 
          ELSE 6 
        END, cd.date_created DESC`;
        break;
      default:
        orderByClause += 'cd.date_created DESC'; // Default sorting
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
      'SELECT status, COUNT(*) as count FROM tbl_childdedications GROUP BY status'
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
    const [allTotalResult] = await query('SELECT COUNT(*) as total FROM tbl_childdedications');
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

    // Parse sponsors JSON string back to array for each record
    const parsedRows = rows.map(row => {
      try {
        if (row.sponsors) {
          row.sponsors = JSON.parse(row.sponsors);
        }
      } catch (e) {
        console.warn('Failed to parse sponsors JSON for child_id:', row.child_id);
        row.sponsors = [];
      }
      return row;
    });

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || rows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Child dedications retrieved successfully',
      data: parsedRows,
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
    console.error('Error fetching child dedications:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single child dedication by ID
 * @param {String} childId - Child ID
 * @returns {Promise<Object>} Child dedication record
 */
async function getChildDedicationById(childId) {
  try {
    if (!childId) {
      throw new Error('Child ID is required');
    }

    const sql = `SELECT 
      cd.*,
      m.firstname as requester_firstname,
      m.lastname as requester_lastname,
      m.middle_name as requester_middle_name,
      m.gender as requester_gender,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as requester_fullname,
      CONCAT(
        cd.child_firstname,
        IF(cd.child_middle_name IS NOT NULL AND cd.child_middle_name != '', CONCAT(' ', cd.child_middle_name), ''),
        ' ',
        cd.child_lastname
      ) as child_fullname,
      CONCAT(
        IFNULL(cd.father_firstname, ''),
        IF(cd.father_middle_name IS NOT NULL AND cd.father_middle_name != '', CONCAT(' ', cd.father_middle_name), ''),
        IF(cd.father_lastname IS NOT NULL AND cd.father_lastname != '', CONCAT(' ', cd.father_lastname), '')
      ) as father_fullname,
      CONCAT(
        IFNULL(cd.mother_firstname, ''),
        IF(cd.mother_middle_name IS NOT NULL AND cd.mother_middle_name != '', CONCAT(' ', cd.mother_middle_name), ''),
        IF(cd.mother_lastname IS NOT NULL AND cd.mother_lastname != '', CONCAT(' ', cd.mother_lastname), '')
      ) as mother_fullname
    FROM tbl_childdedications cd
    INNER JOIN tbl_members m ON cd.requested_by = m.member_id
    WHERE cd.child_id = ?`;
    const [rows] = await query(sql, [childId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Child dedication not found',
        data: null
      };
    }

    // Parse sponsors JSON string back to array
    const row = rows[0];
    try {
      if (row.sponsors) {
        row.sponsors = JSON.parse(row.sponsors);
      }
    } catch (e) {
      console.warn('Failed to parse sponsors JSON for child_id:', childId);
      row.sponsors = [];
    }

    return {
      success: true,
      message: 'Child dedication retrieved successfully',
      data: row
    };
  } catch (error) {
    console.error('Error fetching child dedication:', error);
    throw error;
  }
}

/**
 * READ ONE - Get child dedication requests by requester member_id
 * @param {String} memberId - Member ID of the requester
 * @returns {Promise<Object>} Child dedication records
 */
async function getChildDedicationsByRequester(memberId) {
  try {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    // Convert member_id to string for comparison (child dedication uses VARCHAR member_id)
    const memberIdStr = String(memberId).trim();

    const sql = `SELECT 
      cd.*,
      CONCAT(
        cd.child_firstname,
        IF(cd.child_middle_name IS NOT NULL AND cd.child_middle_name != '', CONCAT(' ', cd.child_middle_name), ''),
        ' ',
        cd.child_lastname
      ) as child_fullname
    FROM tbl_childdedications cd
    WHERE cd.requested_by = ?
    ORDER BY cd.date_created DESC`;
    const [rows] = await query(sql, [memberIdStr]);

    // Parse sponsors JSON string back to array for each record
    const parsedRows = rows.map(row => {
      try {
        if (row.sponsors) {
          row.sponsors = JSON.parse(row.sponsors);
        }
      } catch (e) {
        console.warn('Failed to parse sponsors JSON for child_id:', row.child_id);
        row.sponsors = [];
      }
      return row;
    });

    return {
      success: true,
      message: 'Child dedications retrieved successfully',
      data: parsedRows
    };
  } catch (error) {
    console.error('Error fetching child dedications by requester:', error);
    throw error;
  }
}

/**
 * UPDATE - Update an existing child dedication record
 * @param {String} childId - Child ID
 * @param {Object} dedicationData - Updated child dedication data
 * @returns {Promise<Object>} Result object
 */
async function updateChildDedication(childId, dedicationData) {
  try {
    if (!childId) {
      throw new Error('Child ID is required');
    }

    // Check if dedication exists
    const dedicationCheck = await getChildDedicationById(childId);
    if (!dedicationCheck.success) {
      return {
        success: false,
        message: 'Child dedication not found',
        data: null
      };
    }

    const {
      requested_by,
      requester_relationship,
      child_firstname,
      child_lastname,
      child_middle_name,
      date_of_birth,
      place_of_birth,
      gender,
      preferred_dedication_date,
      preferred_dedication_time,
      date_completed,
      contact_phone_number,
      contact_email,
      contact_address,
      father_firstname,
      father_lastname,
      father_middle_name,
      father_phone_number,
      father_email,
      father_address,
      mother_firstname,
      mother_lastname,
      mother_middle_name,
      mother_phone_number,
      mother_email,
      mother_address,
      sponsors,
      pastor,
      location,
      status,
      date_created
    } = dedicationData;

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (requested_by !== undefined) {
      fields.push('requested_by = ?');
      params.push(requested_by.trim());
    }

    if (requester_relationship !== undefined) {
      fields.push('requester_relationship = ?');
      params.push(requester_relationship ? requester_relationship.trim() : null);
    }

    if (child_firstname !== undefined) {
      fields.push('child_firstname = ?');
      params.push(child_firstname.trim());
    }

    if (child_lastname !== undefined) {
      fields.push('child_lastname = ?');
      params.push(child_lastname.trim());
    }

    if (child_middle_name !== undefined) {
      fields.push('child_middle_name = ?');
      params.push(child_middle_name ? child_middle_name.trim() : null);
    }

    if (date_of_birth !== undefined) {
      const formattedDateOfBirth = date_of_birth && moment(date_of_birth, 'YYYY-MM-DD', true).isValid()
        ? date_of_birth
        : moment(date_of_birth).format('YYYY-MM-DD');
      fields.push('date_of_birth = ?');
      params.push(formattedDateOfBirth);
    }

    if (place_of_birth !== undefined) {
      fields.push('place_of_birth = ?');
      params.push(place_of_birth.trim());
    }

    if (gender !== undefined) {
      if (!['M', 'F'].includes(gender.toUpperCase())) {
        return {
          success: false,
          message: 'Invalid gender value. Must be M or F',
          error: 'Invalid gender'
        };
      }
      fields.push('gender = ?');
      params.push(gender.toUpperCase());
    }

    if (pastor !== undefined) {
      if (pastor !== null && (!pastor || !pastor.trim())) {
        return {
          success: false,
          message: 'Missing required field: pastor',
          error: 'Pastor is required'
        };
      }
      if (pastor !== null && typeof pastor !== 'string') {
        return {
          success: false,
          message: 'Invalid field: pastor must be a string',
          error: 'Invalid pastor field'
        };
      }
      if (pastor !== null && pastor.length > 255) {
        return {
          success: false,
          message: 'Invalid field: pastor name exceeds maximum length of 255 characters',
          error: 'Pastor name too long'
        };
      }
      fields.push('pastor = ?');
      params.push(pastor !== null ? pastor.trim() : null);
    }

    if (location !== undefined) {
      if (location !== null && (!location || !location.trim())) {
        return {
          success: false,
          message: 'Missing required field: location',
          error: 'Location is required'
        };
      }
      if (location !== null && typeof location !== 'string') {
        return {
          success: false,
          message: 'Invalid field: location must be a string',
          error: 'Invalid location field'
        };
      }
      if (location !== null && location.length > 255) {
        return {
          success: false,
          message: 'Invalid field: location exceeds maximum length of 255 characters',
          error: 'Location too long'
        };
      }
      fields.push('location = ?');
      params.push(location !== null ? location.trim() : null);
    }

    if (preferred_dedication_date !== undefined) {
      // Check for time slot conflicts before updating
      const currentData = dedicationCheck.data;
      const finalPreferredDate = preferred_dedication_date;
      const finalPreferredTime = preferred_dedication_time !== undefined ? preferred_dedication_time : currentData.preferred_dedication_time;

      // Only check conflicts if preferred_dedication_date or preferred_dedication_time is being updated
      if (preferred_dedication_date !== undefined || preferred_dedication_time !== undefined) {
        const timeSlotCheck = await checkTimeSlotAvailability(
          finalPreferredDate,
          finalPreferredTime,
          childId // Exclude current child dedication for update
        );

        if (timeSlotCheck && timeSlotCheck.isBooked) {
          return {
            success: false,
            message: `Time slot conflict: ${finalPreferredDate} at ${finalPreferredTime} is already booked.`,
            error: 'Time slot conflict',
            conflict: timeSlotCheck.conflictingDedication
          };
        }
      }

      const formattedPreferredDate = moment(preferred_dedication_date).format('YYYY-MM-DD');
      fields.push('preferred_dedication_date = ?');
      params.push(formattedPreferredDate);
    }

    if (preferred_dedication_time !== undefined) {
      fields.push('preferred_dedication_time = ?');
      params.push(preferred_dedication_time);
    }

    if (date_completed !== undefined) {
      const formattedDateCompleted = date_completed ? moment(date_completed).format('YYYY-MM-DD') : null;
      fields.push('date_completed = ?');
      params.push(formattedDateCompleted);
    }

    if (contact_phone_number !== undefined) {
      // If only requester is being updated, still check for conflicts with current preferred date
      const currentData = dedicationCheck.data;
      // Check for preferred dedication date conflicts - DISABLED
      // Multiple child dedications are allowed on the same date
      // if (currentData.preferred_dedication_date) {
      //   const conflictCheck = await checkPreferredDedicationDateConflict(
      //     currentData.preferred_dedication_date,
      //     requested_by.trim(),
      //     childId // Exclude current child dedication for update
      //   );

      //   if (conflictCheck && conflictCheck.hasConflict) {
      //     return {
      //       success: false,
      //       message: conflictCheck.message,
      //       error: 'Preferred dedication date conflict',
      //       conflict: conflictCheck.conflictingDedication
      //     };
      //   }
      // }
    }

    if (contact_phone_number !== undefined) {
      fields.push('contact_phone_number = ?');
      params.push(contact_phone_number.trim());
    }

    if (contact_email !== undefined) {
      fields.push('contact_email = ?');
      params.push(contact_email ? contact_email.trim() : null);
    }

    if (contact_address !== undefined) {
      fields.push('contact_address = ?');
      params.push(contact_address.trim());
    }

    if (father_firstname !== undefined) {
      fields.push('father_firstname = ?');
      params.push(father_firstname ? father_firstname.trim() : null);
    }

    if (father_lastname !== undefined) {
      fields.push('father_lastname = ?');
      params.push(father_lastname ? father_lastname.trim() : null);
    }

    if (father_middle_name !== undefined) {
      fields.push('father_middle_name = ?');
      params.push(father_middle_name ? father_middle_name.trim() : null);
    }

    if (father_phone_number !== undefined) {
      fields.push('father_phone_number = ?');
      params.push(father_phone_number ? father_phone_number.trim() : null);
    }

    if (father_email !== undefined) {
      fields.push('father_email = ?');
      params.push(father_email ? father_email.trim() : null);
    }

    if (father_address !== undefined) {
      fields.push('father_address = ?');
      params.push(father_address ? father_address.trim() : null);
    }

    if (mother_firstname !== undefined) {
      fields.push('mother_firstname = ?');
      params.push(mother_firstname ? mother_firstname.trim() : null);
    }

    if (mother_lastname !== undefined) {
      fields.push('mother_lastname = ?');
      params.push(mother_lastname ? mother_lastname.trim() : null);
    }

    if (mother_middle_name !== undefined) {
      fields.push('mother_middle_name = ?');
      params.push(mother_middle_name ? mother_middle_name.trim() : null);
    }

    if (mother_phone_number !== undefined) {
      fields.push('mother_phone_number = ?');
      params.push(mother_phone_number ? mother_phone_number.trim() : null);
    }

    if (mother_email !== undefined) {
      fields.push('mother_email = ?');
      params.push(mother_email ? mother_email.trim() : null);
    }

    if (mother_address !== undefined) {
      fields.push('mother_address = ?');
      params.push(mother_address ? mother_address.trim() : null);
    }

    if (sponsors !== undefined) {
      // Convert sponsors array to JSON string
      let sponsorsJson = null;
      if (sponsors !== null) {
        if (Array.isArray(sponsors)) {
          sponsorsJson = JSON.stringify(sponsors);
        } else if (typeof sponsors === 'string') {
          // If it's already a string, try to parse and re-stringify to validate
          try {
            const parsed = JSON.parse(sponsors);
            sponsorsJson = JSON.stringify(parsed);
          } catch (e) {
            // If not valid JSON, treat as plain string and wrap in array
            sponsorsJson = JSON.stringify([sponsors]);
          }
        } else {
          sponsorsJson = JSON.stringify([sponsors]);
        }

        // Validate sponsors JSON length (max 1000 characters)
        if (sponsorsJson.length > 1000) {
          return {
            success: false,
            message: 'Sponsors data exceeds maximum length of 1000 characters',
            error: 'Sponsors data too long'
          };
        }
      }

      fields.push('sponsors = ?');
      params.push(sponsorsJson);
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

    // If updating child name or date of birth, check for duplicates
    if (child_firstname !== undefined || child_lastname !== undefined || date_of_birth !== undefined) {
      const currentData = dedicationCheck.data;
      const checkFirstname = child_firstname !== undefined ? child_firstname : currentData.child_firstname;
      const checkLastname = child_lastname !== undefined ? child_lastname : currentData.child_lastname;
      const checkDateOfBirth = date_of_birth !== undefined ? date_of_birth : currentData.date_of_birth;
      const checkRequestedBy = requested_by !== undefined ? requested_by : currentData.requested_by;

      const duplicateCheck = await checkDuplicateChildDedication(
        checkRequestedBy,
        checkFirstname,
        checkLastname,
        checkDateOfBirth && moment(checkDateOfBirth, 'YYYY-MM-DD', true).isValid()
          ? checkDateOfBirth
          : moment(checkDateOfBirth).format('YYYY-MM-DD'),
        childId
      );
      
      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          message: 'A child dedication request for this child already exists from this member',
          error: 'Duplicate child dedication request'
        };
      }
    }

    params.push(childId);

    const sql = `
      UPDATE tbl_childdedications
      SET ${fields.join(', ')}
      WHERE child_id = ?
    `;

    let result;
    try {
      [result] = await query(sql, params);
    } catch (dbError) {
      console.error('Database error updating child dedication:', dbError);
      throw new Error(`Failed to update child dedication record: ${dbError.message}`);
    }

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Child dedication not found or no changes made',
        data: null
      };
    }

    // Fetch updated dedication
    let updatedDedication;
    try {
      updatedDedication = await getChildDedicationById(childId);
      if (!updatedDedication.success) {
        console.warn('Warning: Updated dedication not found after update');
        updatedDedication = { data: null };
      }
    } catch (fetchError) {
      console.error('Error fetching updated dedication:', fetchError);
      updatedDedication = { data: null };
    }

    // Send email notifications to all relevant recipients (best-effort; do not fail update)
    try {
      const requesterId = requested_by !== undefined ? requested_by : (updatedDedication.data?.requested_by || null);
      if (!requesterId) {
        throw new Error('Requester ID is required for email notifications');
      }
      const [memberRows] = await query(
        `SELECT firstname, lastname, middle_name, email, phone_number
         FROM tbl_members
         WHERE member_id = ?`,
        [requesterId]
      );

      const childName = updatedDedication.data?.child_fullname || `${updatedDedication.data?.child_firstname || ''} ${updatedDedication.data?.child_middle_name ? updatedDedication.data.child_middle_name + ' ' : ''}${updatedDedication.data?.child_lastname || ''}`.trim();
      const dedicationDate = updatedDedication.data?.preferred_dedication_date
        ? moment(updatedDedication.data.preferred_dedication_date).format('YYYY-MM-DD')
        : 'To be determined';

      const dedicationStatus = updatedDedication.data?.status || 'pending';
      const dedicationLocation = updatedDedication.data?.location || 'Church';

      // Get the latest data (including father/mother emails from updated record)
      const contactEmail = contact_email !== undefined ? contact_email : updatedDedication.data?.contact_email;
      const fatherEmail = father_email !== undefined ? father_email : updatedDedication.data?.father_email;
      const motherEmail = mother_email !== undefined ? mother_email : updatedDedication.data?.mother_email;
      const fatherFirstname = father_firstname !== undefined ? father_firstname : updatedDedication.data?.father_firstname;
      const fatherLastname = father_lastname !== undefined ? father_lastname : updatedDedication.data?.father_lastname;
      const fatherMiddlename = father_middle_name !== undefined ? father_middle_name : updatedDedication.data?.father_middle_name;
      const motherFirstname = mother_firstname !== undefined ? mother_firstname : updatedDedication.data?.mother_firstname;
      const motherLastname = mother_lastname !== undefined ? mother_lastname : updatedDedication.data?.mother_lastname;
      const motherMiddlename = mother_middle_name !== undefined ? mother_middle_name : updatedDedication.data?.mother_middle_name;

      // Collect unique email addresses to send to
      const emailRecipients = new Set();

      // 1. Requester (member) email
      if (memberRows && memberRows.length > 0 && memberRows[0].email) {
        const member = memberRows[0];
        const recipientName = `${member.firstname || ''} ${member.middle_name ? member.middle_name + ' ' : ''}${member.lastname || ''}`.trim() || 'Valued Member';
        emailRecipients.add(member.email.toLowerCase());

        // Send email to requester
         await sendChildDedicationDetails({
           email: member.email,
           status: dedicationStatus,
           recipientName: recipientName,
           childName: childName,
           parentName: recipientName,
           dedicationDate: dedicationDate,
           dedicationTime: updatedDedication.data?.preferred_dedication_time || null,
           location: dedicationLocation,
           pastor: updatedDedication.data?.pastor || null
         });
      }

      // 2. Contact email (if different from requester)
      if (contactEmail && contactEmail.trim()) {
        const requesterEmail = memberRows && memberRows.length > 0 ? memberRows[0].email : null;
        if (contactEmail.trim().toLowerCase() !== requesterEmail?.toLowerCase() && !emailRecipients.has(contactEmail.trim().toLowerCase())) {
          emailRecipients.add(contactEmail.trim().toLowerCase());
          await sendChildDedicationDetails({
            email: contactEmail.trim(),
            status: dedicationStatus,
            recipientName: 'Valued Member',
            childName: childName,
            parentName: 'Valued Member',
            dedicationDate: dedicationDate,
            dedicationTime: updatedDedication.data?.preferred_dedication_time || null,
            location: dedicationLocation,
            pastor: updatedDedication.data?.pastor || null
          });
        }
      }

      // 3. Father's email (if provided)
      if (fatherEmail && fatherEmail.trim()) {
        if (!emailRecipients.has(fatherEmail.trim().toLowerCase())) {
          emailRecipients.add(fatherEmail.trim().toLowerCase());
          const fatherName = fatherFirstname || fatherLastname 
            ? `${fatherFirstname || ''} ${fatherMiddlename ? fatherMiddlename + ' ' : ''}${fatherLastname || ''}`.trim() 
            : 'Valued Member';
          await sendChildDedicationDetails({
            email: fatherEmail.trim(),
            status: dedicationStatus,
            recipientName: fatherName,
            childName: childName,
            parentName: fatherName,
            dedicationDate: dedicationDate,
            dedicationTime: updatedDedication.data?.preferred_dedication_time || null,
            location: dedicationLocation,
            pastor: updatedDedication.data?.pastor || null
          });
        }
      }

      // 4. Mother's email (if provided)
      if (motherEmail && motherEmail.trim()) {
        if (!emailRecipients.has(motherEmail.trim().toLowerCase())) {
          emailRecipients.add(motherEmail.trim().toLowerCase());
          const motherName = motherFirstname || motherLastname 
            ? `${motherFirstname || ''} ${motherMiddlename ? motherMiddlename + ' ' : ''}${motherLastname || ''}`.trim() 
            : 'Valued Member';
          await sendChildDedicationDetails({
            email: motherEmail.trim(),
            status: dedicationStatus,
            recipientName: motherName,
            childName: childName,
            parentName: motherName,
            dedicationDate: dedicationDate,
            dedicationTime: updatedDedication.data?.preferred_dedication_time || null,
            location: dedicationLocation,
            pastor: updatedDedication.data?.pastor || null
          });
        }
      }
    } catch (emailError) {
      // Do not block update flow on email failure, just log for diagnostics
      console.error('Error sending child dedication update email:', emailError);
    }

    return {
      success: true,
      message: 'Child dedication updated successfully',
      data: updatedDedication.data || dedicationCheck.data
    };
  } catch (error) {
    console.error('Error updating child dedication:', error);
    throw error;
  }
}

/**
 * DELETE - Delete a child dedication record (archives it first)
 * @param {String} childId - Child ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteChildDedication(childId, archivedBy = null) {
  try {
    if (!childId) {
      throw new Error('Child ID is required');
    }

    // Check if dedication exists
    const dedicationCheck = await getChildDedicationById(childId);
    if (!dedicationCheck.success) {
      return {
        success: false,
        message: 'Child dedication not found',
        data: null
      };
    }

    // Archive the record before deleting
    await archiveBeforeDelete(
      'tbl_childdedications',
      String(childId),
      dedicationCheck.data,
      archivedBy
    );

    // Delete from original table
    const sql = 'DELETE FROM tbl_childdedications WHERE child_id = ?';
    const [result] = await query(sql, [childId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Child dedication not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Child dedication archived and deleted successfully',
      data: { child_id: childId }
    };
  } catch (error) {
    console.error('Error deleting child dedication:', error);
    throw error;
  }
}

/**
 * EXPORT - Export child dedication records to Excel
 * @param {Object} options - Optional query parameters (same as getAllChildDedications: search, status, sortBy)
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportChildDedicationsToExcel(options = {}) {
  try {
    const exportOptions = { ...options };
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    const result = await getAllChildDedications(exportOptions);
    
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No child dedications found to export');
    }

    const dedications = result.data;

    const excelData = dedications.map((dedication, index) => {
      const childFullname = dedication.child_fullname || 
        `${dedication.child_firstname} ${dedication.child_middle_name ? dedication.child_middle_name + ' ' : ''}${dedication.child_lastname}`.trim();
      
      return {
        'No.': index + 1,
        'Child ID': dedication.child_id || '',
        'Child Full Name': childFullname,
        'Date of Birth': dedication.date_of_birth ? (moment(dedication.date_of_birth, 'YYYY-MM-DD', true).isValid()
          ? dedication.date_of_birth
          : moment(dedication.date_of_birth).format('YYYY-MM-DD')) : '',
        'Place of Birth': dedication.place_of_birth || '',
        'Gender': dedication.gender || '',
        'Preferred Dedication Date': dedication.preferred_dedication_date ? (moment(dedication.preferred_dedication_date, 'YYYY-MM-DD', true).isValid()
          ? dedication.preferred_dedication_date
          : moment(dedication.preferred_dedication_date).format('YYYY-MM-DD')) : '',
        'Contact Phone': dedication.contact_phone_number || '',
        'Contact Email': dedication.contact_email || '',
        'Contact Address': dedication.contact_address || '',
        'Requester': dedication.requester_fullname || '',
        'Status': dedication.status || '',
        'Date Created': dedication.date_created ? moment(dedication.date_created).format('YYYY-MM-DD HH:mm:ss') : ''
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 15 },  // Child ID
      { wch: 30 },  // Child Full Name
      { wch: 15 },  // Date of Birth
      { wch: 25 },  // Place of Birth
      { wch: 8 },   // Gender
      { wch: 25 },  // Preferred Dedication Date
      { wch: 18 },  // Contact Phone
      { wch: 30 },  // Contact Email
      { wch: 40 },  // Contact Address
      { wch: 30 },  // Requester
      { wch: 15 },  // Status
      { wch: 20 }   // Date Created
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Child Dedications');

    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });

    return excelBuffer;
  } catch (error) {
    console.error('Error exporting child dedications to Excel:', error);
    throw error;
  }
}

/**
 * Check if a time slot is available for child dedication
 * @param {String} preferredDedicationDate - Preferred dedication date to check
 * @param {String} preferredDedicationTime - Preferred dedication time to check
 * @param {String} excludeChildId - Optional child_id to exclude from check (for updates)
 * @returns {Promise<Object>} Object with isBooked flag and conflicting dedication details
 */
async function checkTimeSlotAvailability(preferredDedicationDate, preferredDedicationTime, excludeChildId = null) {
  try {
    const formattedDate = preferredDedicationDate && moment(preferredDedicationDate, 'YYYY-MM-DD', true).isValid()
      ? preferredDedicationDate
      : moment(preferredDedicationDate).format('YYYY-MM-DD');
    const formattedTime = preferredDedicationTime;
    
    let sql = `
      SELECT child_id, requested_by, preferred_dedication_date, preferred_dedication_time, status,
             child_firstname, child_lastname
      FROM tbl_childdedications
      WHERE preferred_dedication_date = ?
      AND preferred_dedication_time = ?
      AND status = 'approved'
    `;
    const params = [formattedDate, formattedTime];

    if (excludeChildId) {
      sql += ' AND child_id != ?';
      params.push(excludeChildId);
    }

    const [rows] = await query(sql, params);

    return {
      isBooked: rows.length > 0,
      conflictingDedication: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    // Don't throw - allow the operation to proceed if check fails
    return {
      isBooked: false,
      conflictingDedication: null
    };
  }
}

module.exports = {
  checkDuplicateChildDedication,
  checkPreferredDedicationDateConflict,
  checkTimeSlotAvailability,
  createChildDedication,
  getAllChildDedications,
  getChildDedicationById,
  getChildDedicationsByRequester,
  updateChildDedication,
  deleteChildDedication,
  exportChildDedicationsToExcel
};
