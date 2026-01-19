const { query } = require('../../database/db');
const moment = require('moment');
const XLSX = require('xlsx');
const { sendBurialDetails } = require('../emailHelper');
const { archiveBeforeDelete } = require('../archiveHelper');

async function getNextBurialId() {
  try {
    const sql = 'SELECT MAX(burial_id) AS max_burial_id FROM tbl_burialservice';
    const [rows] = await query(sql);
    const maxId = rows[0]?.max_burial_id || null;
    if (!maxId) {
      return '0000000001';
    }
    const numericMatch = maxId.match(/\d+$/);
    if (numericMatch) {
      const numericPart = parseInt(numericMatch[0]);
      const newNumericId = numericPart + 1;
      return newNumericId.toString().padStart(9, '0');
    }
    return '0000000001';
  } catch (error) {
    console.error('Error getting next burial ID:', error);
    throw error;
  }
}

/**
 * Check if a time slot is available for burial service
 * @param {String} serviceDate - Service date to check
 * @param {String} excludeBurialId - Optional burial_id to exclude from check (for updates)
 * @returns {Promise<Object>} Object with isBooked flag and conflicting burial
 */
async function checkTimeSlotAvailability(serviceDate, excludeBurialId = null) {
  try {
    const formattedDate = serviceDate && moment(serviceDate, 'YYYY-MM-DD HH:mm:ss', true).isValid()
      ? moment(serviceDate).format('YYYY-MM-DD')
      : moment(serviceDate).format('YYYY-MM-DD');
    const formattedTime = serviceDate && moment(serviceDate, 'YYYY-MM-DD HH:mm:ss', true).isValid()
      ? moment(serviceDate).format('HH:mm:ss')
      : moment(serviceDate).format('HH:mm:ss');

    // Extract minutes from the formatted time
    const minutes = formattedTime ? formattedTime.split(':')[1] : null;

    if (!minutes) {
      console.warn('Could not extract minutes from time:', formattedTime);
      return {
        isBooked: false,
        conflictingBurial: null
      };
    }

    let sql = `
      SELECT burial_id, deceased_name, service_date, status
      FROM tbl_burialservice
      WHERE DATE(service_date) = ?
      AND TIME(service_date) LIKE CONCAT('%:', ?, ':%')
      AND status = 'approved'
    `;
    const params = [formattedDate, minutes];

    if (excludeBurialId) {
      sql += ' AND burial_id != ?';
      params.push(excludeBurialId);
    }

    const [rows] = await query(sql, params);

    return {
      isBooked: rows.length > 0,
      conflictingBurial: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    // Don't throw - allow the operation to proceed if check fails
    return {
      isBooked: false,
      conflictingBurial: null
    };
  }
}

/**
 * Check if a member has a pending approval for burial service
 * @param {String} memberId - Member ID to check
 * @param {String} requesterEmail - Email address of requester (for non-members)
 * @returns {Promise<Object>} Object with hasPendingApproval flag and approval details
 */
async function checkPendingBurialServiceApproval(memberId, requesterEmail = null) {
  try {
    let sql = `SELECT approval_id, type, status, date_created 
                 FROM tbl_approval 
                 WHERE type = 'burial_service' 
                 AND status = 'pending'
                 AND (`;
    const params = [];

    if (memberId) {
      sql += `email IN (SELECT email FROM tbl_members WHERE member_id = ?)`;
      params.push(memberId);
    }

    if (requesterEmail) {
      if (memberId) {
        sql += ` OR email = ?`;
      } else {
        sql += `email = ?`;
      }
      params.push(requesterEmail);
    }

    sql += `) LIMIT 1`;

    const [rows] = await query(sql, params);

    return {
      hasPendingApproval: rows.length > 0,
      approval: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Error checking for pending burial service approval:', error);
    throw error;
  }
}

async function createBurialService(burialData) {
  try {
    const new_burial_id = await getNextBurialId();
    console.log('New burial ID:', new_burial_id);
    
    const {
      id, // Ignore id field if sent by frontend
      burial_id = new_burial_id,
      member_id,
      requester_name,
      requester_email,
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

    // Member ID is now optional for non-member requests
    if (!requester_name && !member_id) {
      throw new Error('Either member_id or requester_name is required');
    }
    if (!requester_email && !member_id) {
      throw new Error('Either member_id or requester_email is required');
    }
    if (!relationship) {
      throw new Error('Missing required field: relationship');
    }
    if (!location) {
      throw new Error('Missing required field: location');
    }

    // For non-member requests, check by requester_email instead of member_id
    const duplicateCheckSql = `
      SELECT burial_id
      FROM tbl_burialservice
      WHERE ${member_id ? 'member_id = ?' : 'requester_email = ?'}
        AND (${deceased_name ? 'deceased_name = ?' : '1=1'})
        AND (${deceased_birthdate ? 'deceased_birthdate = ?' : '1=1'})
      LIMIT 1
    `;
    const duplicateParams = [member_id ? String(member_id).trim() : String(requester_email).trim()];
    if (deceased_name) duplicateParams.push(deceased_name.trim());
    if (deceased_birthdate) duplicateParams.push(moment(deceased_birthdate).format('YYYY-MM-DD'));

    const [duplicateRows] = await query(duplicateCheckSql, duplicateParams);
    if (duplicateRows && duplicateRows.length > 0) {
      return {
        success: false,
        message: 'A burial service record already exists for this member with the same deceased name and birthdate.'
      };
    }

    // Check if member has a pending burial service approval
    const pendingApprovalCheck = await checkPendingBurialServiceApproval(
      member_id ? String(member_id).trim() : null,
      requester_email ? String(requester_email).trim() : null
    );
    if (pendingApprovalCheck.hasPendingApproval) {
      return {
        success: false,
        message: 'You have a pending burial service request. Please wait for approval or contact the administrator to reject it first.',
        error: 'Pending approval exists'
      };
    }

    // Check for time slot conflicts - Only check time, not date
    // Multiple burial services are allowed on the same date, but not at the same time
    let timeSlotWarning = null;
    if (service_date) {
      const timeSlotCheck = await checkTimeSlotAvailability(
        service_date,
        null // No exclusion for new records
      );

      if (timeSlotCheck.isBooked) {
        timeSlotWarning = `Time slot conflict: ${service_date} is already booked.`;
      }
    }

    const final_burial_id = String(burial_id || new_burial_id).trim();
    const final_member_id = member_id ? String(member_id).trim() : null;
    const final_requester_name = requester_name ? String(requester_name).trim() : null;
    const final_requester_email = requester_email ? String(requester_email).trim() : null;
    const final_pastor_name = pastor_name ? String(pastor_name).trim() : null;

    const formattedServiceDate = (service_date === null || service_date === '' || !service_date)
      ? null
      : moment(service_date).format('YYYY-MM-DD HH:mm:ss');
    const formattedDateCreated = moment.utc(date_created).format('YYYY-MM-DD HH:mm:ss');
    const formattedBirthdate = deceased_birthdate ? (moment(deceased_birthdate, 'YYYY-MM-DD', true).isValid()
      ? deceased_birthdate
      : moment(deceased_birthdate).format('YYYY-MM-DD')) : null;
    const formattedDateDeath = date_death ? moment(date_death).format('YYYY-MM-DD HH:mm:ss') : null;

    const sql = `
      INSERT INTO tbl_burialservice
        (burial_id, member_id, requester_name, requester_email, relationship, location, pastor_name, service_date, status, date_created, deceased_name, deceased_birthdate, date_death)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      final_burial_id,
      final_member_id,
      final_requester_name,
      final_requester_email,
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

    console.log('Executing burial service INSERT with params:', {
      burial_id: final_burial_id,
      member_id: final_member_id,
      requester_name: final_requester_name,
      requester_email: final_requester_email,
      relationship: relationship.trim(),
      location: location.trim(),
      pastor_name: final_pastor_name,
      service_date: formattedServiceDate,
      status: status,
      date_created: formattedDateCreated,
      deceased_name: deceased_name ? deceased_name.trim() : null,
      deceased_birthdate: formattedBirthdate,
      date_death: formattedDateDeath
    });

    const [result] = await query(sql, params);
    const createdBurialService = await getBurialServiceById(final_burial_id);

    try {
      // Send email to member if member_id exists, otherwise send to requester_email
      if (final_member_id) {
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
            recipientName,
            pastorName: createdBurialService.data.pastor_name,
            isMember: true
          });
        }
      } else if (final_requester_email) {
        // Send email to non-member requester
        await sendBurialDetails({
          email: final_requester_email,
          status: createdBurialService.data.status,
          deceasedName: createdBurialService.data.deceased_name,
          familyContact: final_requester_name || 'N/A',
          burialDate: createdBurialService.data.service_date
            ? moment(createdBurialService.data.service_date).format('YYYY-MM-DD HH:mm:ss')
            : 'To be determined',
          location: createdBurialService.data.location,
          recipientName: final_requester_name || 'Requester',
          pastorName: createdBurialService.data.pastor_name,
          isMember: false
        });
      }
    } catch (emailError) {
      console.error('Error sending burial creation email:', emailError);
    }

    return {
      success: true,
      message: 'Burial service created successfully',
      data: createdBurialService.data,
      timeSlotWarning: timeSlotWarning
    };
  } catch (error) {
    console.error('Error creating burial service:', error);
    throw error;
  }
}

async function getAllBurialServices(options = {}) {
  try {
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const status = options.status || null;
    const sortBy = options.sortBy || null;
    const useFulltext = options.useFulltext === true;
    let dateRange = options.dateRange || null;
    // Parse dateRange if it's a JSON string (from query parameters)
    if (dateRange && typeof dateRange === 'string') {
      try {
        dateRange = JSON.parse(dateRange);
      } catch (e) {
        console.warn('Failed to parse dateRange JSON:', dateRange);
        dateRange = null;
      }
    }

    let countSql = 'SELECT COUNT(*) as total FROM tbl_burialservice bs INNER JOIN tbl_members m ON bs.member_id = m.member_id';
    let countParams = [];

    let sql = `SELECT bs.burial_id, bs.member_id, bs.requester_name, bs.requester_email, bs.relationship, bs.location, bs.pastor_name, bs.service_date, bs.status, bs.date_created, bs.deceased_name, bs.deceased_birthdate, bs.date_death, m.firstname, m.lastname, m.middle_name, m.email as member_email, CONCAT(m.firstname, IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''), ' ', m.lastname) as fullname FROM tbl_burialservice bs LEFT JOIN tbl_members m ON bs.member_id = m.member_id`;
    const params = [];

    const whereConditions = [];
    let hasWhere = false;

    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      if (useFulltext) {
        const fulltextCondition = `MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name, bs.requester_name, bs.requester_email) AGAINST(? IN NATURAL LANGUAGE MODE)`;
        const memberFulltextCondition = `MATCH(m.firstname, m.lastname, m.middle_name) AGAINST(? IN NATURAL LANGUAGE MODE)`;
        const searchCondition = `(${fulltextCondition} OR ${memberFulltextCondition})`;
        whereConditions.push(searchCondition);
        countParams.push(searchValue, searchValue);
        params.push(searchValue, searchValue);
      } else {
        const searchCondition = `(bs.burial_id LIKE ? OR bs.deceased_name LIKE ? OR bs.location LIKE ? OR bs.pastor_name LIKE ? OR bs.requester_name LIKE ? OR bs.requester_email LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ? OR m.middle_name LIKE ? OR CONCAT(m.firstname, ' ', IFNULL(m.middle_name, ''), ' ', m.lastname) LIKE ?)`;
        const searchPattern = `%${searchValue}%`;
        whereConditions.push(searchCondition);
        countParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }
      hasWhere = true;
    }

    if (status && status !== 'All Statuses') {
      whereConditions.push('status = ?');
      countParams.push(status);
      params.push(status);
      hasWhere = true;
    }

    // Add date range filter (filter by date_created)
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      whereConditions.push('DATE(bs.date_created) BETWEEN ? AND ?');
      countParams.push(dateRange[0], dateRange[1]);
      params.push(dateRange[0], dateRange[1]);
      hasWhere = true;
    }

    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (sortByValue && monthNames.includes(sortByValue)) {
      const monthIndex = monthNames.indexOf(sortByValue) + 1;
      whereConditions.push('MONTH(bs.service_date) = ? AND YEAR(bs.service_date) = YEAR(CURDATE())');
      countParams.push(monthIndex);
      params.push(monthIndex);
      hasWhere = true;
    } else if (sortByValue === 'This Month') {
      whereConditions.push('MONTH(bs.service_date) = MONTH(CURDATE()) AND YEAR(bs.service_date) = YEAR(CURDATE())');
      hasWhere = true;
    } else if (sortByValue === 'Last Month') {
      whereConditions.push('MONTH(bs.service_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(bs.service_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))');
      hasWhere = true;
    }

    if (hasWhere) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      countSql += whereClause;
      sql += whereClause;
    }

    let orderByClause = ' ORDER BY ';
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
      case 'Status (Pending First)':
        orderByClause += `CASE bs.status WHEN 'Pending' THEN 1 WHEN 'Approved' THEN 2 WHEN 'Disapproved' THEN 3 WHEN 'Completed' THEN 4 WHEN 'Cancelled' THEN 5 ELSE 6 END, bs.date_created DESC`;
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
        if (useFulltext && searchValue) {
          orderByClause += 'MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name, bs.requester_name, bs.requester_email) AGAINST(? IN NATURAL LANGUAGE MODE) DESC, ';
          params.push(searchValue);
        }
        orderByClause += 'bs.date_created DESC';
       break;
     case 'Date Range (Newest)':
       orderByClause += 'bs.service_date DESC';
       break;
     case 'Date Range (Oldest)':
       orderByClause += 'bs.service_date ASC';
       break;
     default:
       orderByClause += 'bs.date_created DESC';
    }
    sql += orderByClause;

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

    const [countResult] = await query(countSql, countParams);
    const totalCount = countResult[0]?.total || 0;

    const [allStatusCountsResult] = await query('SELECT status, COUNT(*) as count FROM tbl_burialservice GROUP BY status');
    const summaryStats = {
      total: 0,
      completed: 0,
      pending: 0,
      approved: 0,
      disapproved: 0,
      cancelled: 0,
      scheduled: 0,
      ongoing: 0
    };
    
    const [allTotalResult] = await query('SELECT COUNT(*) as total FROM tbl_burialservice');
    summaryStats.total = allTotalResult[0]?.total || 0;
    
    allStatusCountsResult.forEach(row => {
      if (summaryStats.hasOwnProperty(row.status)) {
        summaryStats[row.status] = row.count;
      }
    });

    if (finalLimit !== null) {
      const limitValue = Math.max(1, parseInt(finalLimit) || 10);
      const offsetValue = Math.max(0, parseInt(finalOffset) || 0);

      if (offsetValue > 0) {
        sql += ` LIMIT ${limitValue} OFFSET ${offsetValue}`;
      } else {
        sql += ` LIMIT ${limitValue}`;
      }
    }

    const [rows] = await query(sql, params);

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

async function getBurialServicesByMemberId(memberId) {
  try {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    const memberIdStr = String(memberId).trim();

    // First get the member's email
    const memberSql = 'SELECT email FROM tbl_members WHERE member_id = ?';
    const [memberRows] = await query(memberSql, [memberIdStr]);

    if (!memberRows || memberRows.length === 0) {
      return {
        success: false,
        message: 'Member not found',
        data: []
      };
    }

    const memberEmail = memberRows[0].email;

    const sql = `SELECT
      bs.*,
      m.firstname,
      m.lastname,
      m.middle_name,
      CONCAT(
        COALESCE(m.firstname, ''),
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        IF(m.firstname IS NOT NULL OR m.middle_name IS NOT NULL, ' ', ''),
        COALESCE(m.lastname, '')
      ) as fullname
    FROM tbl_burialservice bs
    LEFT JOIN tbl_members m ON bs.member_id = m.member_id
    WHERE bs.member_id = ? OR bs.requester_email = ?
    ORDER BY bs.date_created DESC`;
    const [rows] = await query(sql, [memberIdStr, memberEmail]);

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

async function getBurialServiceById(burialId) {
  try {
    if (!burialId) {
      throw new Error('Burial ID is required');
    }

    const sql = `SELECT
      bs.*,
      m.firstname,
      m.lastname,
      m.middle_name,
      m.email as member_email,
      m.birthdate as member_birthdate,
      m.age as member_age,
      bs.deceased_birthdate,
      CONCAT(
        m.firstname,
        IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
        ' ',
        m.lastname
      ) as fullname
    FROM tbl_burialservice bs
    LEFT JOIN tbl_members m ON bs.member_id = m.member_id
    WHERE bs.burial_id = ?`;
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

async function updateBurialService(burialId, burialData, isAdmin = false) {
  try {
    if (!burialId) {
      throw new Error('Burial ID is required');
    }

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
      requester_name,
      requester_email,
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

    // Check current status and block updates if pending (except for admins or status changes)
    const currentData = burialCheck.data;
    
    // Only block updates if user is NOT an admin and status is pending
    if (!isAdmin && currentData.status === 'pending' && status === undefined) {
      return {
        success: false,
        message: 'Cannot update burial service while pending approval. Only admins can modify pending requests.',
        error: 'Cannot update pending request'
      };
    }

    // If admin tries to change requester info for a member record, don't allow it
    // The requester info should be preserved from original request
    if (isAdmin && currentData.member_id && (requester_name !== undefined || requester_email !== undefined)) {
      // Silently ignore attempts to change requester info for member records
      // This preserves the original requester information
    }
    const finalServiceDate = service_date !== undefined ? service_date : currentData.service_date;

    // Only check conflicts if service_date is being updated
    if (service_date !== undefined && finalServiceDate) {
      const timeSlotCheck = await checkTimeSlotAvailability(
        finalServiceDate,
        burialId
      );

      if (timeSlotCheck.isBooked) {
        return {
          success: false,
          message: `Time slot conflict: ${finalServiceDate} is already booked.`,
          error: 'Time slot conflict'
        };
      }
    }

    const fields = [];
    const params = [];

    if (member_id !== undefined && member_id !== null && member_id !== '') {
      fields.push('member_id = ?');
      params.push(String(member_id).trim());
    } else if (member_id === null || member_id === '') {
      fields.push('member_id = NULL');
    }

    // For member records, don't allow changing requester_name/requester_email
    // These should always come from the member record, not be overwritten
    if (currentData.member_id) {
      // Don't update requester fields for member records
    } else {
      // Only allow updating requester fields for non-member records
      if (requester_name !== undefined && requester_name !== null && requester_name !== '') {
        fields.push('requester_name = ?');
        params.push(String(requester_name).trim());
      } else if (requester_name === null || requester_name === '') {
        fields.push('requester_name = NULL');
      }

      if (requester_email !== undefined && requester_email !== null && requester_email !== '') {
        fields.push('requester_email = ?');
        params.push(String(requester_email).trim());
      } else if (requester_email === null || requester_email === '') {
        fields.push('requester_email = NULL');
      }
    }

    if (relationship !== undefined && relationship !== null && relationship !== '') {
      fields.push('relationship = ?');
      params.push(relationship.trim());
    }

    if (location !== undefined && location !== null && location !== '') {
      fields.push('location = ?');
      params.push(location.trim());
    }

    if (pastor_name !== undefined && pastor_name !== null && pastor_name !== '') {
      fields.push('pastor_name = ?');
      params.push(String(pastor_name).trim());
    }

    if (service_date !== undefined) {
      if (service_date === null || service_date === '' || !service_date) {
        fields.push('service_date = ?');
        params.push(null);
      } else {
        const formattedServiceDate = moment(service_date).format('YYYY-MM-DD HH:mm:ss');
        fields.push('service_date = ?');
        params.push(formattedServiceDate);
      }
    }

    if (status !== undefined && status !== null && status !== '') {
      fields.push('status = ?');
      params.push(status);
    }

    if (date_created !== undefined && date_created !== null && date_created !== '') {
      const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');
      fields.push('date_created = ?');
      params.push(formattedDateCreated);
    }

    if (deceased_name !== undefined && deceased_name !== null && deceased_name !== '') {
      fields.push('deceased_name = ?');
      params.push(deceased_name.trim());
    } else if (deceased_name === null || deceased_name === '') {
      fields.push('deceased_name = NULL');
    }

    if (deceased_birthdate !== undefined && deceased_birthdate !== null && deceased_birthdate !== '') {
      const formattedBirthdate = moment(deceased_birthdate, 'YYYY-MM-DD', true).isValid()
        ? deceased_birthdate
        : moment(deceased_birthdate).format('YYYY-MM-DD');
      fields.push('deceased_birthdate = ?');
      params.push(formattedBirthdate);
    } else if (deceased_birthdate === null || deceased_birthdate === '') {
      fields.push('deceased_birthdate = NULL');
    }

    if (date_death !== undefined && date_death !== null && date_death !== '') {
      const formattedDateDeath = moment(date_death).format('YYYY-MM-DD HH:mm:ss');
      fields.push('date_death = ?');
      params.push(formattedDateDeath);
    } else if (date_death === null || date_death === '') {
      fields.push('date_death = NULL');
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

    const updatedBurialService = await getBurialServiceById(burialId);

    try {
      // Send email to member if member_id exists, otherwise send to requester_email
      if (updatedBurialService.data.member_id) {
        const [memberRows] = await query(
          `SELECT firstname, lastname, middle_name, email, phone_number
           FROM tbl_members
           WHERE member_id = ?`,
          [updatedBurialService.data.member_id]
        );

        if (memberRows && memberRows.length > 0 && memberRows[0].email) {
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
            recipientName,
            pastorName: updatedBurialService.data.pastor_name,
            isMember: true
          });
        }
      } else if (updatedBurialService.data.requester_email) {
        // Send email to non-member requester
        await sendBurialDetails({
          email: updatedBurialService.data.requester_email,
          status: updatedBurialService.data.status,
          deceasedName: updatedBurialService.data.deceased_name,
          familyContact: updatedBurialService.data.requester_name || 'N/A',
          burialDate: updatedBurialService.data.service_date
            ? moment(updatedBurialService.data.service_date).format('YYYY-MM-DD HH:mm:ss')
            : 'To be determined',
          location: updatedBurialService.data.location,
          recipientName: updatedBurialService.data.requester_name || 'Requester',
          pastorName: updatedBurialService.data.pastor_name,
          isMember: false
        });
      }
    } catch (emailError) {
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

async function deleteBurialService(burialId, archivedBy = null) {
  try {
    if (!burialId) {
      throw new Error('Burial ID is required');
    }

    const burialCheck = await getBurialServiceById(burialId);
    if (!burialCheck.success) {
      return {
        success: false,
        message: 'Burial service not found',
        data: null
      };
    }

    await archiveBeforeDelete(
      'tbl_burialservice',
      String(burialId),
      burialCheck.data,
      archivedBy
    );

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

async function searchBurialServicesFulltext(options = {}) {
  try {
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : 10;
    const offset = options.offset !== undefined ? parseInt(options.offset) : 0;
    const minRelevance = options.minRelevance !== undefined ? parseFloat(options.minRelevance) : 0.1;

    if (!search || search.trim() === '') {
      throw new Error('Search term is required for fulltext search');
    }

    const searchValue = search.trim();

    const countSql = `
      SELECT COUNT(*) as total
      FROM tbl_burialservice bs
      INNER JOIN tbl_members m ON bs.member_id = m.member_id
      WHERE (
        MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name, bs.requester_email) AGAINST(? IN NATURAL LANGUAGE MODE) > ?
        OR MATCH(m.firstname, m.lastname, m.middle_name, m.email) AGAINST(? IN NATURAL LANGUAGE MODE) > ?
      )
    `;

    const sql = `
      SELECT 
        bs.burial_id, bs.member_id, bs.relationship, bs.location, bs.pastor_name, 
        bs.service_date, bs.status, bs.date_created, bs.deceased_name, 
        bs.deceased_birthdate, bs.date_death,
        m.firstname, m.lastname, m.middle_name, m.email,
        CONCAT(m.firstname, IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''), ' ', m.lastname) as fullname,
        GREATEST(
          MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name, bs.requester_email) AGAINST(? IN NATURAL LANGUAGE MODE),
          MATCH(m.firstname, m.lastname, m.middle_name, m.email) AGAINST(? IN NATURAL LANGUAGE MODE)
        ) as relevance_score
      FROM tbl_burialservice bs 
      INNER JOIN tbl_members m ON bs.member_id = m.member_id
      WHERE (
        MATCH(bs.burial_id, bs.location, bs.deceased_name, bs.relationship, bs.status, bs.pastor_name, bs.requester_email) AGAINST(? IN NATURAL LANGUAGE MODE) > ?
        OR MATCH(m.firstname, m.lastname, m.middle_name, m.email) AGAINST(? IN NATURAL LANGUAGE MODE) > ?
      )
      ORDER BY relevance_score DESC
      LIMIT ? OFFSET ?
    `;

    const countParams = [searchValue, minRelevance, searchValue, minRelevance];
    const params = [searchValue, searchValue, searchValue, minRelevance, searchValue, minRelevance, limit, offset];

    const [countResult] = await query(countSql, countParams);
    const totalCount = countResult[0]?.total || 0;

    const [rows] = await query(sql, params);

    return {
      success: true,
      message: 'Fulltext search completed successfully',
      data: rows,
      count: rows.length,
      totalCount: totalCount,
      searchTerm: searchValue,
      relevanceThreshold: minRelevance
    };
  } catch (error) {
    console.error('Error in fulltext search:', error);
    throw error;
  }
}

async function analyzeBurialServiceAvailability(options = {}) {
  try {
    const {
      startDate,
      endDate,
      location = null,
      serviceDurationHours = 2,
      businessHours = { start: 8, end: 18 }
    } = options;

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    const start = moment(startDate).format('YYYY-MM-DD');
    const end = moment(endDate).format('YYYY-MM-DD');

    let sql = `
      SELECT 
        DATE(service_date) as service_day,
        TIME(service_date) as service_time,
        location,
        COUNT(*) as service_count
      FROM tbl_burialservice 
      WHERE service_date BETWEEN ? AND ?
        AND status NOT IN ('Cancelled', 'Disapproved')
    `;
    
    const params = [start + ' 00:00:00', end + ' 23:59:59'];

    if (location) {
      sql += ' AND location = ?';
      params.push(location);
    }

    sql += ' GROUP BY DATE(service_date), TIME(service_date), location ORDER BY service_date';

    const [existingServices] = await query(sql, params);

    const availabilityAnalysis = {
      dateRange: { start, end },
      location: location || 'All locations',
      serviceDurationHours,
      businessHours,
      existingServices: existingServices.length,
      busyDays: [],
      availableDays: [],
      recommendations: []
    };

    const current = moment(startDate);
    const endMoment = moment(endDate);

    while (current.isSameOrBefore(endMoment)) {
      const dayServices = existingServices.filter(service => 
        moment(service.service_day).isSame(current, 'day')
      );

      const dayAnalysis = {
        date: current.format('YYYY-MM-DD'),
        dayOfWeek: current.format('dddd'),
        servicesScheduled: dayServices.length,
        availableSlots: Math.floor((businessHours.end - businessHours.start) / serviceDurationHours) - dayServices.length,
        services: dayServices
      };

      if (dayAnalysis.servicesScheduled >= 3) {
        availabilityAnalysis.busyDays.push(dayAnalysis);
      } else {
        availabilityAnalysis.availableDays.push(dayAnalysis);
      }

      current.add(1, 'day');
    }

    if (availabilityAnalysis.availableDays.length > 0) {
      availabilityAnalysis.recommendations.push('Consider scheduling on available days with fewer conflicts');
    }
    if (availabilityAnalysis.busyDays.length > availabilityAnalysis.availableDays.length) {
      availabilityAnalysis.recommendations.push('Consider extending the date range for better availability');
    }

    return {
      success: true,
      message: 'Availability analysis completed successfully',
      data: availabilityAnalysis
    };
  } catch (error) {
    console.error('Error analyzing burial service availability:', error);
    throw error;
  }
}

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
        'Requester Name': service.requester_name || '',
        'Requester Email': service.member_email || service.requester_email || '',
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
      { wch: 5 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 30 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 }
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

module.exports = {
  createBurialService,
  getAllBurialServices,
  getBurialServiceById,
  getBurialServicesByMemberId,
  updateBurialService,
  deleteBurialService,
  exportBurialServicesToExcel,
  searchBurialServicesFulltext,
  analyzeBurialServiceAvailability,
  checkTimeSlotAvailability,
  checkPendingBurialServiceApproval
};
