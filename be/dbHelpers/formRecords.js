const { query } = require('../database/db');
const moment = require('moment');
const { sendFormSubmissionNotification, sendFormStatusUpdate } = require('./emailHelper');

/**
 * CREATE - Create a new form submission
 * @param {Object} formData - Form submission data
 * @returns {Promise<Object>} Created form submission
 */
async function createForm(formData) {
  try {
    const {
      form_type,
      submitted_by = null,
      status = 'pending',
      name = null,
      email = null,
      phone = null,
      form_data,                    
      admin_notes = null,
      reviewed_by = null,
      submitted_at = null,
      reviewed_at = null,
    } = formData;

    // Validate required fields
    if (!form_type) {
      return {
        success: false,
        message: 'Form type is required'
      };
    }

    if (!form_data || typeof form_data !== 'object') {
      return {
        success: false,
        message: 'Form data is required and must be an object'
      };
    }

    // Validate form_type
    const validFormTypes = ['schedule_change', 'prayer_request', 'message'];
    if (!validFormTypes.includes(form_type)) {
      return {
        success: false,
        message: `Invalid form type. Must be one of: ${validFormTypes.join(', ')}`
      };
    }

    // Validate form-specific data based on form_type
    if (form_type === 'schedule_change') {
      if (!form_data.serviceType || !form_data.originalDate || !form_data.requestedDate || !form_data.reason) {
        return {
          success: false,
          message: 'Schedule change form requires: serviceType, originalDate, requestedDate, and reason'
        };
      }
      // For schedule change, require either submitted_by (authenticated user) or name/email
      if (!submitted_by && !name && !email) {
        return {
          success: false,
          message: 'Schedule change form requires either authenticated user (submitted_by) or name and email'
        };
      }
    } else if (form_type === 'prayer_request') {
      if (!form_data.request) {
        return {
          success: false,
          message: 'Prayer request form requires: request field'
        };
      }
      // For prayer requests, if anonymous, we don't require name/email
      // Otherwise, require either name/email or authenticated user
      if (!form_data.anonymous && !name && !email && !submitted_by) {
        return {
          success: false,
          message: 'Prayer request requires either name/email or authenticated user (unless anonymous)'
        };
      }
    } else if (form_type === 'message') {
      if (!form_data.subject || !form_data.message) {
        return {
          success: false,
          message: 'Message form requires: subject and message fields'
        };
      }
      // For message form, require either name/email or authenticated user
      if (!name && !email && !submitted_by) {
        return {
          success: false,
          message: 'Message form requires either name/email or authenticated user'
        };
      }
    }

    const sql = `
      INSERT INTO tbl_forms 
      (form_type, submitted_by, status, name, email, phone, form_data, admin_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      form_type,
      submitted_by,
      status,
      name,
      email,
      phone,
      JSON.stringify(form_data),
      admin_notes
    ];

    const [result] = await query(sql, params);

    if (!result || !result.insertId) {
      throw new Error('Failed to insert form into database');
    }

    // Fetch the created form
    const createdForm = await getFormById(result.insertId);

    // Send email notification if email is provided
    if (email && createdForm.data) {
      try {
        // Get user name if available
        let recipientName = name || 'Valued Member';
        if (submitted_by) {
          // Try to get name from member table via account
          const nameSql = `
            SELECT CONCAT(
              COALESCE(m.firstname, ''),
              IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
              IF(m.lastname IS NOT NULL AND m.lastname != '', CONCAT(' ', m.lastname), '')
            ) as full_name
            FROM tbl_accounts acc
            LEFT JOIN tbl_members m ON acc.email = m.email
            WHERE acc.acc_id = ?
          `;
          const [nameRows] = await query(nameSql, [submitted_by]);
          if (nameRows.length > 0 && nameRows[0].full_name) {
            recipientName = nameRows[0].full_name;
          }
        }

        await sendFormSubmissionNotification({
          email: email,
          formType: form_type,
          recipientName: recipientName,
          formId: result.insertId,
          formData: form_data
        });
      } catch (emailError) {
        // Log error but don't fail the form creation
        console.error('Error sending form submission notification email:', emailError);
      }
    }

    return {
      success: true,
      message: 'Form submitted successfully',
      data: createdForm.data
    };
  } catch (error) {
    console.error('Error creating form:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all forms with pagination and filters
 * @param {Object} options - Optional query parameters
 * @returns {Promise<Object>} Paginated forms
 */
async function getAllForms(options = {}) {
  try {
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const form_type = options.form_type || null;
    const status = options.status || null;
    const submitted_by = options.submitted_by || null;
    const sortBy = options.sortBy || null;

    // Build base query for counting total records
    let countSql = 'SELECT COUNT(*) as total FROM tbl_forms f';
    let countParams = [];

    // Build query for fetching records
    let sql = `
      SELECT 
        f.*,
        CONCAT(
          COALESCE(m.firstname, ''),
          IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
          IF(m.lastname IS NOT NULL AND m.lastname != '', CONCAT(' ', m.lastname), '')
        ) as submitted_by_name,
        acc.email as submitted_by_email,
        CONCAT(
          COALESCE(rm.firstname, ''),
          IF(rm.middle_name IS NOT NULL AND rm.middle_name != '', CONCAT(' ', rm.middle_name), ''),
          IF(rm.lastname IS NOT NULL AND rm.lastname != '', CONCAT(' ', rm.lastname), '')
        ) as reviewed_by_name
      FROM tbl_forms f
      LEFT JOIN tbl_accounts acc ON f.submitted_by = acc.acc_id
      LEFT JOIN tbl_members m ON acc.email = m.email
      LEFT JOIN tbl_accounts racc ON f.reviewed_by = racc.acc_id
      LEFT JOIN tbl_members rm ON racc.email = rm.email
    `;
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(f.name LIKE ? OR f.email LIKE ? OR f.phone LIKE ? OR JSON_EXTRACT(f.form_data, '$') LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add form_type filter
    if (form_type) {
      whereConditions.push('f.form_type = ?');
      countParams.push(form_type);
      params.push(form_type);
      hasWhere = true;
    }

    // Add status filter
    if (status) {
      whereConditions.push('f.status = ?');
      countParams.push(status);
      params.push(status);
      hasWhere = true;
    }

    // Add submitted_by filter
    if (submitted_by) {
      whereConditions.push('f.submitted_by = ?');
      countParams.push(submitted_by);
      params.push(submitted_by);
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
      case 'Date (Newest)':
        orderByClause += 'f.created_at DESC';
        break;
      case 'Date (Oldest)':
        orderByClause += 'f.created_at ASC';
        break;
      case 'Status':
        orderByClause += 'f.status ASC';
        break;
      default:
        orderByClause += 'f.created_at DESC'; // Default sorting
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

    // Parse JSON form_data for each row
    const parsedRows = rows.map(row => ({
      ...row,
      form_data: typeof row.form_data === 'string' ? JSON.parse(row.form_data) : row.form_data
    }));

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || parsedRows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Forms retrieved successfully',
      data: parsedRows,
      count: parsedRows.length,
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
    console.error('Error fetching forms:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single form by ID
 * @param {Number} formId - Form ID
 * @returns {Promise<Object>} Form data
 */
async function getFormById(formId) {
  try {
    const sql = `
      SELECT 
        f.*,
        CONCAT(
          COALESCE(m.firstname, ''),
          IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
          IF(m.lastname IS NOT NULL AND m.lastname != '', CONCAT(' ', m.lastname), '')
        ) as submitted_by_name,
        acc.email as submitted_by_email,
        CONCAT(
          COALESCE(rm.firstname, ''),
          IF(rm.middle_name IS NOT NULL AND rm.middle_name != '', CONCAT(' ', rm.middle_name), ''),
          IF(rm.lastname IS NOT NULL AND rm.lastname != '', CONCAT(' ', rm.lastname), '')
        ) as reviewed_by_name
      FROM tbl_forms f
      LEFT JOIN tbl_accounts acc ON f.submitted_by = acc.acc_id
      LEFT JOIN tbl_members m ON acc.email = m.email
      LEFT JOIN tbl_accounts racc ON f.reviewed_by = racc.acc_id
      LEFT JOIN tbl_members rm ON racc.email = rm.email
      WHERE f.form_id = ?
    `;

    const [rows] = await query(sql, [formId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Form not found',
        data: null
      };
    }

    // Parse JSON form_data
    const form = {
      ...rows[0],
      form_data: typeof rows[0].form_data === 'string' ? JSON.parse(rows[0].form_data) : rows[0].form_data
    };

    return {
      success: true,
      message: 'Form retrieved successfully',
      data: form
    };
  } catch (error) {
    console.error('Error fetching form:', error);
    throw error;
  }
}

/**
 * Get forms by user ID (for authenticated users to see their own submissions)
 * @param {String} userId - User ID
 * @param {String} formType - Optional form type filter
 * @returns {Promise<Object>} User's forms
 */
async function getFormsByUser(userId, formType = null) {
  try {
    let sql = `
      SELECT 
        f.*,
        CONCAT(
          COALESCE(m.firstname, ''),
          IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
          IF(m.lastname IS NOT NULL AND m.lastname != '', CONCAT(' ', m.lastname), '')
        ) as submitted_by_name
      FROM tbl_forms f
      LEFT JOIN tbl_accounts acc ON f.submitted_by = acc.acc_id
      LEFT JOIN tbl_members m ON acc.email = m.email
      WHERE f.submitted_by = ?
    `;
    const params = [userId];

    if (formType) {
      sql += ' AND f.form_type = ?';
      params.push(formType);
    }

    // Sort by created_at in descending order (newest first)
    sql += ' ORDER BY f.created_at DESC';
    console.log(sql);
    const [rows] = await query(sql, params);

    // Parse JSON form_data for each row
    const parsedRows = rows.map(row => ({
      ...row,
      form_data: typeof row.form_data === 'string' ? JSON.parse(row.form_data) : row.form_data
    }));

    return {
      success: true,
      message: 'Forms retrieved successfully',
      data: parsedRows
    };
  } catch (error) {
    console.error('Error fetching user forms:', error);
    throw error;
  }
}

/**
 * Get all non-completed services for a member
 * @param {String} memberId - Member ID
 * @returns {Promise<Object>} All services for the member
 */
async function getMemberServices(memberId) {
  try {
    if (!memberId) {
      return {
        success: false,
        message: 'Member ID is required',
        data: []
      };
    }

    const services = {
      'water-baptism': [],
      'marriage': [],
      'burial': [],
      'child-dedication': []
    };

    // Get water baptisms (status != 'completed' and != 'cancelled') - case-insensitive and include NULL
    const waterBaptismSql = `
      SELECT baptism_id as service_id, baptism_date as service_date, status, 'water-baptism' as service_type
      FROM tbl_waterbaptism
      WHERE member_id = ? AND (status IS NULL OR LOWER(COALESCE(status, '')) NOT IN ('completed', 'cancelled'))
      ORDER BY baptism_date DESC
    `;
    const [wbRows] = await query(waterBaptismSql, [memberId]);
    console.log(`[getMemberServices] Found ${wbRows.length} water baptism services for member ${memberId}`);
    services['water-baptism'] = wbRows.map(row => {
      const formattedDate = row.service_date 
        ? moment(row.service_date).format('YYYY-MM-DD') 
        : null;
      console.log(`[getMemberServices] Water baptism ${row.service_id}: service_date=${row.service_date}, formatted=${formattedDate}`);
      return {
        ...row,
        service_id: String(row.service_id),
        service_date: formattedDate
      };
    });

    // Get marriages (status != 'completed') - check both groom and bride, case-insensitive and include NULL
    const marriageSql = `
      SELECT marriage_id as service_id, marriage_date as service_date, status, 'marriage' as service_type,
             groom_member_id, bride_member_id
      FROM tbl_marriageservice
      WHERE (groom_member_id = ? OR bride_member_id = ?) 
        AND (status IS NULL OR LOWER(COALESCE(status, '')) != 'completed')
      ORDER BY marriage_date DESC
    `;
    const [marriageRows] = await query(marriageSql, [memberId, memberId]);
    console.log(`[getMemberServices] Found ${marriageRows.length} marriage services for member ${memberId}`);
    services['marriage'] = marriageRows.map(row => {
      const formattedDate = row.service_date 
        ? moment(row.service_date).format('YYYY-MM-DD') 
        : null;
      console.log(`[getMemberServices] Marriage service ${row.service_id}: service_date=${row.service_date}, formatted=${formattedDate}`);
      return {
        ...row,
        service_id: String(row.service_id),
        service_date: formattedDate
      };
    });

    // Get burial services (status != 'completed') - case-insensitive and include NULL
    const burialSql = `
      SELECT burial_id as service_id, service_date, status, 'burial' as service_type
      FROM tbl_burialservice
      WHERE member_id = ? AND (status IS NULL OR LOWER(COALESCE(status, '')) != 'completed')
      ORDER BY service_date DESC
    `;
    const [burialRows] = await query(burialSql, [memberId]);
    console.log(`[getMemberServices] Found ${burialRows.length} burial services for member ${memberId}`);
    services['burial'] = burialRows.map(row => {
      const formattedDate = row.service_date 
        ? moment(row.service_date).format('YYYY-MM-DD') 
        : null;
      console.log(`[getMemberServices] Burial service ${row.service_id}: service_date=${row.service_date}, formatted=${formattedDate}`);
      return {
        ...row,
        service_id: String(row.service_id),
        service_date: formattedDate
      };
    });

    // Get child dedications (status != 'completed') - case-insensitive and include NULL
    // Note: tbl_childdedications uses 'requested_by' for member ID and 'preferred_dedication_date' for the date
    const childDedicationSql = `
      SELECT child_id as service_id, preferred_dedication_date as service_date, status, 'child-dedication' as service_type
      FROM tbl_childdedications
      WHERE requested_by = ? AND (status IS NULL OR LOWER(COALESCE(status, '')) != 'completed')
      ORDER BY preferred_dedication_date DESC
    `;
    const [cdRows] = await query(childDedicationSql, [memberId]);
    console.log(`[getMemberServices] Found ${cdRows.length} child dedication services for member ${memberId}`);
    services['child-dedication'] = cdRows.map(row => {
      const formattedDate = row.service_date 
        ? moment(row.service_date).format('YYYY-MM-DD') 
        : null;
      console.log(`[getMemberServices] Child dedication ${row.service_id}: service_date=${row.service_date}, formatted=${formattedDate}`);
      return {
        ...row,
        service_id: String(row.service_id),
        service_date: formattedDate
      };
    });

    // Log final services summary
    console.log('[getMemberServices] Final services summary:', {
      'water-baptism': services['water-baptism'].length,
      'marriage': services['marriage'].length,
      'burial': services['burial'].length,
      'child-dedication': services['child-dedication'].length
    });
    if (services['burial'].length > 0) {
      console.log('[getMemberServices] Sample burial service data:', JSON.stringify(services['burial'][0], null, 2));
    }

    return {
      success: true,
      message: 'Services retrieved successfully',
      data: services
    };
  } catch (error) {
    console.error('Error fetching member services:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch member services',
      data: {}
    };
  }
}

/**
 * Update service date when schedule change is approved
 * @param {Object} formData - Form data containing schedule change information
 * @returns {Promise<Object>} Update result
 */
async function updateServiceDateForScheduleChange(formData) {
  try {
    const { form_type, form_data } = formData;
    
    if (form_type !== 'schedule_change') {
      return { success: false, message: 'Not a schedule change form' };
    }

    const { serviceType, serviceId, requestedDate } = form_data;
    
    // Use serviceId if provided, otherwise fall back to original date search
    if (!serviceType || !requestedDate) {
      return { success: false, message: 'Missing required schedule change data' };
    }

    if (!serviceId && !form_data.originalDate) {
      return { success: false, message: 'Service ID or original date is required' };
    }

    // Map service types to table names and date column names
    const serviceMap = {
      'water-baptism': {
        table: 'tbl_waterbaptism',
        idColumn: 'baptism_id',
        dateColumn: 'baptism_date',
        updateFunction: require('./services/waterBaptismRecords').updateWaterBaptism
      },
      'marriage': {
        table: 'tbl_marriageservice',
        idColumn: 'marriage_id',
        dateColumn: 'marriage_date',
        updateFunction: require('./services/marriageServiceRecords').updateMarriageService
      },
      'burial': {
        table: 'tbl_burialservice',
        idColumn: 'burial_id',
        dateColumn: 'service_date',
        updateFunction: require('./services/burialServiceRecords').updateBurialService
      },
      'child-dedication': {
        table: 'tbl_childdedications',
        idColumn: 'child_id',
        dateColumn: 'dedication_date',
        updateFunction: require('./services/childDedicationRecords').updateChildDedication
      }
    };

    const serviceConfig = serviceMap[serviceType];
    if (!serviceConfig) {
      return { success: false, message: `Unknown service type: ${serviceType}` };
    }

    let finalServiceId = serviceId;

    // If serviceId is not provided, try to find by original date (backward compatibility)
    if (!finalServiceId && form_data.originalDate) {
      const originalDateFormatted = moment(form_data.originalDate).format('YYYY-MM-DD');
      const findSql = `
        SELECT ${serviceConfig.idColumn}
        FROM ${serviceConfig.table}
        WHERE DATE(${serviceConfig.dateColumn}) = ?
        ORDER BY ${serviceConfig.idColumn} DESC
        LIMIT 1
      `;
      const [rows] = await query(findSql, [originalDateFormatted]);
      if (rows.length > 0) {
        finalServiceId = rows[0][serviceConfig.idColumn];
      } else {
        return {
          success: false,
          message: `No ${serviceType} service found with original date ${originalDateFormatted}`
        };
      }
    }

    if (!finalServiceId) {
      return {
        success: false,
        message: 'Service ID is required'
      };
    }

    const requestedDateFormatted = moment(requestedDate).format('YYYY-MM-DD HH:mm:ss');

    // Update the service date - map date column names to function parameter names
    const updateData = {};
    if (serviceType === 'water-baptism') {
      updateData.baptism_date = requestedDateFormatted;
    } else if (serviceType === 'marriage') {
      updateData.marriage_date = requestedDateFormatted;
    } else if (serviceType === 'burial') {
      updateData.service_date = requestedDateFormatted;
    } else if (serviceType === 'child-dedication') {
      updateData.dedication_date = requestedDateFormatted;
    }

    const updateResult = await serviceConfig.updateFunction(finalServiceId, updateData);

    if (updateResult.success) {
      return {
        success: true,
        message: `Service date updated successfully for ${serviceType}`,
        serviceId: finalServiceId
      };
    } else {
      return {
        success: false,
        message: updateResult.message || 'Failed to update service date'
      };
    }
  } catch (error) {
    console.error('Error updating service date:', error);
    return {
      success: false,
      message: error.message || 'Failed to update service date'
    };
  }
}

/**
 * UPDATE - Update a form (typically for status changes and admin notes)
 * @param {Number} formId - Form ID
 * @param {Object} formData - Updated form data
 * @returns {Promise<Object>} Updated form
 */
async function updateForm(formId, formData) {
  try {
    const {
      status,
      admin_notes,
      reviewed_by
    } = formData;

    // Get current form to check if status is changing to 'approved'
    const currentForm = await getFormById(formId);
    if (!currentForm.success) {
      return {
        success: false,
        message: 'Form not found'
      };
    }

    const wasApproved = currentForm.data.status === 'approved';
    const willBeApproved = status === 'approved';

    const updateFields = [];
    const params = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (admin_notes !== undefined) {
      updateFields.push('admin_notes = ?');
      params.push(admin_notes);
    }

    if (reviewed_by !== undefined) {
      updateFields.push('reviewed_by = ?');
      params.push(reviewed_by);
      updateFields.push('reviewed_at = CURRENT_TIMESTAMP');
    }

    if (updateFields.length === 0) {
      return {
        success: false,
        message: 'No fields to update'
      };
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(formId);

    const sql = `
      UPDATE tbl_forms 
      SET ${updateFields.join(', ')}
      WHERE form_id = ?
    `;

    await query(sql, params);

    // If status is changing to 'approved' and it's a schedule_change form, update the service date
    if (!wasApproved && willBeApproved && currentForm.data.form_type === 'schedule_change') {
      const serviceUpdateResult = await updateServiceDateForScheduleChange(currentForm.data);
      if (!serviceUpdateResult.success) {
        console.warn('Failed to update service date:', serviceUpdateResult.message);
        // Don't fail the form update, just log the warning
      }
    }

    // Fetch the updated form
    const updatedForm = await getFormById(formId);

    // Send email notification if status changed and email is available
    if (updatedForm.data && updatedForm.data.email && status !== undefined) {
      try {
        // Get user name if available
        let recipientName = updatedForm.data.name || 'Valued Member';
        if (updatedForm.data.submitted_by) {
          // Try to get name from member table via account
          const nameSql = `
            SELECT CONCAT(
              COALESCE(m.firstname, ''),
              IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
              IF(m.lastname IS NOT NULL AND m.lastname != '', CONCAT(' ', m.lastname), '')
            ) as full_name
            FROM tbl_accounts acc
            LEFT JOIN tbl_members m ON acc.email = m.email
            WHERE acc.acc_id = ?
          `;
          const [nameRows] = await query(nameSql, [updatedForm.data.submitted_by]);
          if (nameRows.length > 0 && nameRows[0].full_name) {
            recipientName = nameRows[0].full_name;
          }
        }

        await sendFormStatusUpdate({
          email: updatedForm.data.email,
          formType: updatedForm.data.form_type,
          status: status,
          recipientName: recipientName,
          formId: formId,
          formData: updatedForm.data.form_data,
          adminNotes: admin_notes
        });
      } catch (emailError) {
        // Log error but don't fail the form update
        console.error('Error sending form status update notification email:', emailError);
      }
    }

    return {
      success: true,
      message: 'Form updated successfully',
      data: updatedForm.data
    };
  } catch (error) {
    console.error('Error updating form:', error);
    throw error;
  }
}

/**
 * DELETE - Delete a form
 * @param {Number} formId - Form ID
 * @param {String} archivedBy - User ID who archived the record
 * @returns {Promise<Object>} Deletion result
 */
async function deleteForm(formId, archivedBy = null) {
  try {
    // Archive before delete
    const { archiveBeforeDelete } = require('./archiveHelper');
    const form = await getFormById(formId);
    
    if (form.success && form.data) {
      await archiveBeforeDelete('tbl_forms', formId, form.data, archivedBy);
    }

    const sql = 'DELETE FROM tbl_forms WHERE form_id = ?';
    await query(sql, [formId]);

    return {
      success: true,
      message: 'Form deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting form:', error);
    throw error;
  }
}

module.exports = {
  createForm,
  getAllForms,
  getFormById,
  getFormsByUser,
  updateForm,
  deleteForm,
  getMemberServices
};

