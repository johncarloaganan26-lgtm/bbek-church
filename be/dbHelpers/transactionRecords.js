const { query } = require('../database/db');
const moment = require('moment');
const crypto = require('crypto');
const { sendTransactionCompletionNotification } = require('./emailHelper');
const { archiveBeforeDelete } = require('./archiveHelper');

/**
 * Transaction Records CRUD Operations
 * Based on tbl_transactions schema:
 * - transaction_id (VARCHAR(45), PK, NN) - UUID v4
 * - type_of_service (VARCHAR(45), NN) - ['marriage', 'burial', 'child_dedication', 'water_baptism']
 * - service_id (VARCHAR(45), NN) - ID from service table
 * - total (DOUBLE, NN) - Total amount
 * - date_created (DATETIME, NN) - Auto-generated
 */

// Valid service types
const VALID_SERVICE_TYPES = ['marriage', 'burial', 'child_dedication', 'water_baptism'];

// Map service types to their table names and ID column names
const SERVICE_TABLE_MAP = {
  'marriage': { table: 'tbl_marriageservice', idColumn: 'marriage_id' },
  'burial': { table: 'tbl_burialservice', idColumn: 'burial_id' },
  'child_dedication': { table: 'tbl_childdedications', idColumn: 'child_id' },
  'water_baptism': { table: 'tbl_waterbaptism', idColumn: 'baptism_id' }
};

/**
 * Validate service type
 * @param {String} serviceType - Service type to validate
 * @returns {Boolean} True if valid
 */
function isValidServiceType(serviceType) {
  return VALID_SERVICE_TYPES.includes(serviceType);
}

/**
 * Check if service exists in the appropriate table
 * @param {String} serviceType - Type of service
 * @param {String} serviceId - Service ID to check
 * @returns {Promise<Object>} Object with exists flag
 */
async function checkServiceExists(serviceType, serviceId) {
  try {
    if (!isValidServiceType(serviceType)) {
      return { exists: false, error: 'Invalid service type' };
    }

    const { table, idColumn } = SERVICE_TABLE_MAP[serviceType];
    const sql = `SELECT ${idColumn}, status FROM ${table} WHERE ${idColumn} = ?`;
    const [rows] = await query(sql, [serviceId]);

    return {
      exists: rows.length > 0,
      service: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Error checking service existence:', error);
    throw error;
  }
}

/**
 * Send transaction completion emails to affected members
 * @param {String} serviceType - Type of service
 * @param {String} serviceId - Service ID
 * @param {Object} transactionData - Transaction data (transaction_id, service_id, total, type_of_service)
 * @returns {Promise<void>}
 */
async function sendTransactionEmails(serviceType, serviceId, transactionData) {
  try {
    const emails = [];
    
    switch (serviceType) {
      case 'marriage': {
        // Get groom and bride emails
        const sql = `SELECT 
          ms.groom_member_id,
          ms.groom_name,
          groom.email as groom_email,
          groom.firstname as groom_firstname,
          groom.lastname as groom_lastname,
          groom.middle_name as groom_middle_name,
          ms.bride_member_id,
          ms.bride_name,
          bride.email as bride_email,
          bride.firstname as bride_firstname,
          bride.lastname as bride_lastname,
          bride.middle_name as bride_middle_name
        FROM tbl_marriageservice ms
        LEFT JOIN tbl_members groom ON ms.groom_member_id = groom.member_id
        LEFT JOIN tbl_members bride ON ms.bride_member_id = bride.member_id
        WHERE ms.marriage_id = ?`;
        
        const [rows] = await query(sql, [serviceId]);
        if (rows.length > 0) {
          const row = rows[0];
          // Add groom email (only if groom_member_id exists and has email)
          if (row.groom_member_id && row.groom_email) {
            const groomName = `${row.groom_firstname || ''} ${row.groom_middle_name || ''} ${row.groom_lastname || ''}`.trim();
            emails.push({
              email: row.groom_email,
              name: groomName || row.groom_name || 'Groom',
              serviceName: 'Marriage Service'
            });
          }
          // Add bride email (only if bride_member_id exists and has email)
          if (row.bride_member_id && row.bride_email) {
            const brideName = `${row.bride_firstname || ''} ${row.bride_middle_name || ''} ${row.bride_lastname || ''}`.trim();
            emails.push({
              email: row.bride_email,
              name: brideName || row.bride_name || 'Bride',
              serviceName: 'Marriage Service'
            });
          }
        }
        break;
      }
      case 'burial': {
        // Get member (requestor) email
        const sql = `SELECT 
          m.email,
          m.firstname,
          m.lastname,
          m.middle_name
        FROM tbl_burialservice bs
        LEFT JOIN tbl_members m ON bs.member_id = m.member_id
        WHERE bs.burial_id = ?`;
        
        const [rows] = await query(sql, [serviceId]);
        if (rows.length > 0 && rows[0].email) {
          const row = rows[0];
          const memberName = `${row.firstname || ''} ${row.middle_name || ''} ${row.lastname || ''}`.trim();
          emails.push({
            email: row.email,
            name: memberName || 'Valued Member',
            serviceName: 'Burial Service'
          });
        }
        break;
      }
      case 'child_dedication': {
        // Get requester (member) email
        const sql = `SELECT 
          m.email,
          m.firstname,
          m.lastname,
          m.middle_name
        FROM tbl_childdedications cd
        LEFT JOIN tbl_members m ON cd.requested_by = m.member_id
        WHERE cd.child_id = ?`;
        
        const [rows] = await query(sql, [serviceId]);
        if (rows.length > 0 && rows[0].email) {
          const row = rows[0];
          const memberName = `${row.firstname || ''} ${row.middle_name ? row.middle_name + ' ' : ''}${row.lastname || ''}`.trim();
          emails.push({
            email: row.email,
            name: memberName || 'Valued Member',
            serviceName: 'Child Dedication Service'
          });
        }
        break;
      }
      case 'water_baptism': {
        // Get member email
        const sql = `SELECT 
          m.email,
          m.firstname,
          m.lastname,
          m.middle_name
        FROM tbl_waterbaptism wb
        LEFT JOIN tbl_members m ON wb.member_id = m.member_id
        WHERE wb.baptism_id = ?`;
        
        const [rows] = await query(sql, [serviceId]);
        if (rows.length > 0 && rows[0].email) {
          const row = rows[0];
          const memberName = `${row.firstname || ''} ${row.middle_name || ''} ${row.lastname || ''}`.trim();
          emails.push({
            email: row.email,
            name: memberName || 'Valued Member',
            serviceName: 'Water Baptism Service'
          });
        }
        break;
      }
    }
    
    // Send emails to all affected members
    const emailPromises = emails.map(emailData => 
      sendTransactionCompletionNotification({
        email: emailData.email,
        recipientName: emailData.name,
        serviceName: emailData.serviceName,
        ...transactionData
      })
    );
    
    await Promise.all(emailPromises);
  } catch (error) {
    console.error('Error in sendTransactionEmails:', error);
    throw error;
  }
}

/**
 * Update civil status of groom and bride to 'married' when marriage is completed
 * @param {String} marriageId - Marriage ID
 * @returns {Promise<void>}
 */
async function updateMarriageMembersCivilStatus(marriageId) {
  try {
    // Get groom and bride member IDs
    const sql = 'SELECT groom_member_id, bride_member_id FROM tbl_marriageservice WHERE marriage_id = ?';
    const [rows] = await query(sql, [marriageId]);
    
    if (rows.length === 0) {
      console.warn(`Marriage service ${marriageId} not found for civil status update`);
      return;
    }
    
    const { groom_member_id, bride_member_id } = rows[0];
    
    // Update civil status for both groom and bride
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
 * Update service status to 'completed'
 * @param {String} serviceType - Type of service
 * @param {String} serviceId - Service ID to update
 * @returns {Promise<Object>} Result object
 */
async function updateServiceStatusToCompleted(serviceType, serviceId) {
  try {
    if (!isValidServiceType(serviceType)) {
      return {
        success: false,
        message: 'Invalid service type'
      };
    }

    const { table, idColumn } = SERVICE_TABLE_MAP[serviceType];
    const sql = `UPDATE ${table} SET status = 'completed' WHERE ${idColumn} = ?`;
    const [result] = await query(sql, [serviceId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Service not found or status update failed'
      };
    }

    // If it's a marriage service, update civil status of groom and bride
    if (serviceType === 'marriage') {
      try {
        await updateMarriageMembersCivilStatus(serviceId);
      } catch (civilStatusError) {
        // Log but don't block the status update
        console.error('Error updating civil status for marriage service:', civilStatusError);
      }
    }

    return {
      success: true,
      message: 'Service status updated to completed'
    };
  } catch (error) {
    console.error('Error updating service status:', error);
    throw error;
  }
}

/**
 * CREATE - Insert a new transaction record
 * @param {Object} transactionData - Transaction data object
 * @returns {Promise<Object>} Result object
 */
async function createTransaction(transactionData) {
  try {
    const {
      type_of_service,
      service_id,
      total,
      date_created = new Date()
    } = transactionData;

    // Validate required fields
    if (!type_of_service) {
      throw new Error('Missing required field: type_of_service');
    }
    if (!service_id) {
      throw new Error('Missing required field: service_id');
    }
    if (total === undefined || total === null) {
      throw new Error('Missing required field: total');
    }

    // Validate service type
    if (!isValidServiceType(type_of_service)) {
      return {
        success: false,
        message: `Invalid service type. Must be one of: ${VALID_SERVICE_TYPES.join(', ')}`,
        error: 'Invalid service type'
      };
    }

    // Validate total is a number
    const totalAmount = parseFloat(total);
    if (isNaN(totalAmount) || totalAmount < 0) {
      return {
        success: false,
        message: 'Total must be a valid positive number',
        error: 'Invalid total amount'
      };
    }

    // Check if service exists
    const serviceCheck = await checkServiceExists(type_of_service, service_id);
    if (!serviceCheck.exists) {
      return {
        success: false,
        message: `Service with ID ${service_id} not found in ${SERVICE_TABLE_MAP[type_of_service].table}`,
        error: 'Service not found'
      };
    }

    // Generate UUID v4 for transaction_id using Node.js built-in crypto
    const transactionId = crypto.randomUUID();

    // Format date_created
    const formattedDateCreated = moment(date_created).format('YYYY-MM-DD HH:mm:ss');

    // Insert transaction
    const sql = `
      INSERT INTO tbl_transactions 
        (transaction_id, type_of_service, service_id, total, date_created)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      transactionId,
      type_of_service,
      service_id.trim(),
      totalAmount,
      formattedDateCreated
    ];

    const [result] = await query(sql, params);

    // Update service status to 'completed'
    const statusUpdateResult = await updateServiceStatusToCompleted(type_of_service, service_id);
    if (!statusUpdateResult.success) {
      console.warn(`Warning: Failed to update service status for ${type_of_service} ${service_id}:`, statusUpdateResult.message);
      // Transaction is still created, but status update failed
    }

    // Fetch the created transaction
    const createdTransaction = await getTransactionById(transactionId);

    // Send email notification to affected member(s) (best-effort; do not fail transaction creation)
    try {
      await sendTransactionEmails(type_of_service, service_id, {
        transaction_id: transactionId,
        service_id: service_id,
        total: totalAmount,
        type_of_service: type_of_service
      });
    } catch (emailError) {
      // Log but don't block transaction creation if email fails
      console.error('Error sending transaction completion emails:', emailError);
    }

    return {
      success: true,
      message: 'Transaction created successfully',
      data: createdTransaction.data
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all transaction records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, type_of_service, sortBy)
 * @returns {Promise<Object>} Object with paginated transaction records and metadata
 */
async function getAllTransactions(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const type_of_service = options.type_of_service || null;
    const sortBy = options.sortBy || null;

    // Build base query for counting total records
    let countSql = 'SELECT COUNT(*) as total FROM tbl_transactions';
    let countParams = [];

    // Build query for fetching records
    let sql = 'SELECT * FROM tbl_transactions';
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality (search by transaction_id, service_id)
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(transaction_id LIKE ? OR service_id LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern);
      params.push(searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add type_of_service filter
    if (type_of_service && type_of_service !== 'All Services') {
      if (isValidServiceType(type_of_service)) {
        whereConditions.push('type_of_service = ?');
        countParams.push(type_of_service);
        params.push(type_of_service);
        hasWhere = true;
      }
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
      case 'Date Created (Newest)':
        orderByClause += 'date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'date_created ASC';
        break;
      case 'Total (High to Low)':
        orderByClause += 'total DESC';
        break;
      case 'Total (Low to High)':
        orderByClause += 'total ASC';
        break;
      case 'Service Type (A-Z)':
        orderByClause += 'type_of_service ASC';
        break;
      default:
        orderByClause += 'date_created DESC'; // Default sorting
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
      message: 'Transactions retrieved successfully',
      data: rows,
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
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

/**
 * GET TOTALS BY SERVICE TYPE - Get total amount per service type (without pagination)
 * @returns {Promise<Object>} Object with totals per service type
 */
async function getTotalsByServiceType() {
  try {
    const sql = `
      SELECT 
        type_of_service,
        COUNT(*) as transaction_count,
        SUM(total) as total_amount
      FROM tbl_transactions
      GROUP BY type_of_service
      ORDER BY type_of_service ASC
    `;
    
    const [rows] = await query(sql);
    
    // Calculate grand total
    const grandTotal = rows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);
    const totalTransactions = rows.reduce((sum, row) => sum + parseInt(row.transaction_count || 0), 0);
    
    // Format the data
    const totals = rows.map(row => ({
      type_of_service: row.type_of_service,
      transaction_count: parseInt(row.transaction_count || 0),
      total_amount: parseFloat(row.total_amount || 0)
    }));
    
    return {
      success: true,
      message: 'Totals by service type retrieved successfully',
      data: totals,
      summary: {
        grand_total: grandTotal,
        total_transactions: totalTransactions
      }
    };
  } catch (error) {
    console.error('Error fetching totals by service type:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single transaction by ID
 * @param {String} transactionId - Transaction ID
 * @returns {Promise<Object>} Transaction record
 */
async function getTransactionById(transactionId) {
  try {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    const sql = 'SELECT * FROM tbl_transactions WHERE transaction_id = ?';
    const [rows] = await query(sql, [transactionId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Transaction not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Transaction retrieved successfully',
      data: rows[0]
    };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
}

/**
 * UPDATE - Update an existing transaction record
 * Note: Updating a transaction does NOT change the service status
 * @param {String} transactionId - Transaction ID
 * @param {Object} transactionData - Updated transaction data
 * @returns {Promise<Object>} Result object
 */
async function updateTransaction(transactionId, transactionData) {
  try {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    // Check if transaction exists
    const transactionCheck = await getTransactionById(transactionId);
    if (!transactionCheck.success) {
      return {
        success: false,
        message: 'Transaction not found',
        data: null
      };
    }

    const {
      type_of_service,
      service_id,
      total,
      date_created
    } = transactionData;

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (type_of_service !== undefined) {
      if (!isValidServiceType(type_of_service)) {
        return {
          success: false,
          message: `Invalid service type. Must be one of: ${VALID_SERVICE_TYPES.join(', ')}`,
          error: 'Invalid service type'
        };
      }
      fields.push('type_of_service = ?');
      params.push(type_of_service);
    }

    if (service_id !== undefined) {
      // Validate service exists if type_of_service is also provided
      if (type_of_service !== undefined) {
        const serviceCheck = await checkServiceExists(type_of_service, service_id);
        if (!serviceCheck.exists) {
          return {
            success: false,
            message: `Service with ID ${service_id} not found in ${SERVICE_TABLE_MAP[type_of_service].table}`,
            error: 'Service not found'
          };
        }
      }
      fields.push('service_id = ?');
      params.push(service_id.trim());
    }

    if (total !== undefined) {
      const totalAmount = parseFloat(total);
      if (isNaN(totalAmount) || totalAmount < 0) {
        return {
          success: false,
          message: 'Total must be a valid positive number',
          error: 'Invalid total amount'
        };
      }
      fields.push('total = ?');
      params.push(totalAmount);
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

    params.push(transactionId);

    const sql = `
      UPDATE tbl_transactions
      SET ${fields.join(', ')}
      WHERE transaction_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Transaction not found or no changes made',
        data: null
      };
    }

    // Fetch updated transaction
    const updatedTransaction = await getTransactionById(transactionId);

    return {
      success: true,
      message: 'Transaction updated successfully',
      data: updatedTransaction.data
    };
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

/**
 * DELETE - Delete a transaction record (archives it first)
 * @param {String} transactionId - Transaction ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteTransaction(transactionId, archivedBy = null) {
  try {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    // Check if transaction exists
    const transactionCheck = await getTransactionById(transactionId);
    if (!transactionCheck.success) {
      return {
        success: false,
        message: 'Transaction not found',
        data: null
      };
    }

    // Archive the record before deleting
    await archiveBeforeDelete(
      'tbl_transactions',
      String(transactionId),
      transactionCheck.data,
      archivedBy
    );

    // Delete from original table
    const sql = 'DELETE FROM tbl_transactions WHERE transaction_id = ?';
    const [result] = await query(sql, [transactionId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Transaction not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Transaction archived and deleted successfully',
      data: { transaction_id: transactionId }
    };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

/**
 * GET TRANSACTIONS BY MEMBER ID - Get all transactions for a specific member
 * @param {String} memberId - Member ID
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, type_of_service, sortBy)
 * @returns {Promise<Object>} Object with paginated transaction records and metadata
 */
async function getTransactionsByMemberId(memberId, options = {}) {
  try {
    if (!memberId) {
      throw new Error('Member ID is required');
    }

    // Normalize memberId - convert to string for VARCHAR fields
    // Most service tables use VARCHAR(45) for member_id fields:
    // - tbl_marriageservice: groom_member_id, bride_member_id are VARCHAR(45)
    // - tbl_burialservice: member_id is VARCHAR(45)
    // - tbl_childdedications: requested_by is VARCHAR(45)
    // - tbl_waterbaptism: member_id is VARCHAR(45) (but joins with INT in tbl_members)
    // We'll use string comparison for all service tables and cast when needed
    const memberIdStr = String(memberId).trim();
    const memberIdInt = parseInt(memberId);
    
    // Log for debugging
    console.log('getTransactionsByMemberId - memberId:', memberId, 'memberIdStr:', memberIdStr);

    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const type_of_service = options.type_of_service || null;
    const sortBy = options.sortBy || null;

    // Build base query for counting total records
    // Use INNER JOIN on all service tables to ensure member_id matches
    // Only count transactions where the service exists AND member_id matches
    let countSql = `
      SELECT COUNT(DISTINCT t.transaction_id) as total
      FROM tbl_transactions t
      INNER JOIN tbl_marriageservice ms ON t.type_of_service = 'marriage' AND t.service_id = ms.marriage_id 
        AND (CAST(ms.groom_member_id AS CHAR) = ? OR CAST(ms.bride_member_id AS CHAR) = ?)
      UNION ALL
      SELECT COUNT(DISTINCT t.transaction_id) as total
      FROM tbl_transactions t
      INNER JOIN tbl_burialservice bs ON t.type_of_service = 'burial' AND t.service_id = bs.burial_id 
        AND CAST(bs.member_id AS CHAR) = ?
      UNION ALL
      SELECT COUNT(DISTINCT t.transaction_id) as total
      FROM tbl_transactions t
      INNER JOIN tbl_childdedications cd ON t.type_of_service = 'child_dedication' AND t.service_id = cd.child_id 
        AND CAST(cd.requested_by AS CHAR) = ?
      UNION ALL
      SELECT COUNT(DISTINCT t.transaction_id) as total
      FROM tbl_transactions t
      INNER JOIN tbl_waterbaptism wb ON t.type_of_service = 'water_baptism' AND t.service_id = wb.baptism_id 
        AND CAST(wb.member_id AS CHAR) = ?
    `;
    // Wrap in subquery to sum the counts
    countSql = `SELECT SUM(total) as total FROM (${countSql}) as counts`;
    // Use string for all service tables (all use VARCHAR member_id fields)
    // Parameters: marriage (2 params), burial (1), child_dedication (1), water_baptism (1)
    let countParams = [memberIdStr, memberIdStr, memberIdStr, memberIdStr, memberIdStr];

    // Build query for fetching records using UNION ALL with INNER JOINs
    // INNER JOIN ensures only transactions with matching member_id are returned
    // Note: All service tables use VARCHAR(45) for member_id fields, so we use string comparison with CAST
    let sql = `
      SELECT DISTINCT t.*
      FROM tbl_transactions t
      INNER JOIN tbl_marriageservice ms ON t.type_of_service = 'marriage' AND t.service_id = ms.marriage_id 
        AND (CAST(ms.groom_member_id AS CHAR) = ? OR CAST(ms.bride_member_id AS CHAR) = ?)
      UNION ALL
      SELECT DISTINCT t.*
      FROM tbl_transactions t
      INNER JOIN tbl_burialservice bs ON t.type_of_service = 'burial' AND t.service_id = bs.burial_id 
        AND CAST(bs.member_id AS CHAR) = ?
      UNION ALL
      SELECT DISTINCT t.*
      FROM tbl_transactions t
      INNER JOIN tbl_childdedications cd ON t.type_of_service = 'child_dedication' AND t.service_id = cd.child_id 
        AND CAST(cd.requested_by AS CHAR) = ?
      UNION ALL
      SELECT DISTINCT t.*
      FROM tbl_transactions t
      INNER JOIN tbl_waterbaptism wb ON t.type_of_service = 'water_baptism' AND t.service_id = wb.baptism_id 
        AND CAST(wb.member_id AS CHAR) = ?
    `;
    // Use string for all service tables (all use VARCHAR member_id fields)
    // Parameters: marriage (2 params), burial (1), child_dedication (1), water_baptism (1)
    const params = [memberIdStr, memberIdStr, memberIdStr, memberIdStr, memberIdStr];

    // Wrap the UNION ALL in a subquery to apply search and type filters
    let sqlBase = sql;
    let countSqlBase = countSql;
    let countParamsBase = [...countParams];

    // Add search functionality (search by transaction_id, service_id)
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchPattern = `%${searchValue}%`;
      sql = `SELECT * FROM (${sqlBase}) as t WHERE (t.transaction_id LIKE ? OR t.service_id LIKE ?)`;
      params.push(searchPattern, searchPattern);
    }

    // Add type_of_service filter (always filter by service type for member transactions)
    if (type_of_service) {
      if (isValidServiceType(type_of_service)) {
        // Rebuild queries for the specific service type only
        const typeCondition = searchValue ? ` AND t.type_of_service = ?` : ` WHERE t.type_of_service = ?`;
        sql += typeCondition;
        params.push(type_of_service);
        
        // Rebuild count query for specific service type
        let countWhereClause = '';
        if (searchValue) {
          countWhereClause = ` AND (t.transaction_id LIKE ? OR t.service_id LIKE ?)`;
        }
        
        if (type_of_service === 'marriage') {
          countSql = `SELECT COUNT(DISTINCT t.transaction_id) as total FROM tbl_transactions t INNER JOIN tbl_marriageservice ms ON t.type_of_service = 'marriage' AND t.service_id = ms.marriage_id AND (CAST(ms.groom_member_id AS CHAR) = ? OR CAST(ms.bride_member_id AS CHAR) = ?)${countWhereClause}`;
          countParams = [memberIdStr, memberIdStr];
          if (searchValue) {
            countParams.push(`%${searchValue}%`, `%${searchValue}%`);
          }
        } else if (type_of_service === 'burial') {
          countSql = `SELECT COUNT(DISTINCT t.transaction_id) as total FROM tbl_transactions t INNER JOIN tbl_burialservice bs ON t.type_of_service = 'burial' AND t.service_id = bs.burial_id AND CAST(bs.member_id AS CHAR) = ?${countWhereClause}`;
          countParams = [memberIdStr];
          if (searchValue) {
            countParams.push(`%${searchValue}%`, `%${searchValue}%`);
          }
        } else if (type_of_service === 'child_dedication') {
          countSql = `SELECT COUNT(DISTINCT t.transaction_id) as total FROM tbl_transactions t INNER JOIN tbl_childdedications cd ON t.type_of_service = 'child_dedication' AND t.service_id = cd.child_id AND CAST(cd.requested_by AS CHAR) = ?${countWhereClause}`;
          countParams = [memberIdStr];
          if (searchValue) {
            countParams.push(`%${searchValue}%`, `%${searchValue}%`);
          }
        } else if (type_of_service === 'water_baptism') {
          countSql = `SELECT COUNT(DISTINCT t.transaction_id) as total FROM tbl_transactions t INNER JOIN tbl_waterbaptism wb ON t.type_of_service = 'water_baptism' AND t.service_id = wb.baptism_id AND CAST(wb.member_id AS CHAR) = ?${countWhereClause}`;
          countParams = [memberIdStr];
          if (searchValue) {
            countParams.push(`%${searchValue}%`, `%${searchValue}%`);
          }
        }
      }
    } else if (searchValue) {
      // If no type filter but has search, need to apply search to count query
      // The count query already sums all types, so we need to filter the UNION ALL results
      // Actually, for count with search but no type filter, we can count from the filtered sql result
      // But that's inefficient. Let's keep the current approach and filter after.
      // Actually, let's rebuild count query to include search in each UNION ALL part
      const searchPattern = `%${searchValue}%`;
      countSql = `
        SELECT SUM(total) as total FROM (
          SELECT COUNT(DISTINCT t.transaction_id) as total
          FROM tbl_transactions t
          INNER JOIN tbl_marriageservice ms ON t.type_of_service = 'marriage' AND t.service_id = ms.marriage_id 
            AND (CAST(ms.groom_member_id AS CHAR) = ? OR CAST(ms.bride_member_id AS CHAR) = ?)
            AND (t.transaction_id LIKE ? OR t.service_id LIKE ?)
          UNION ALL
          SELECT COUNT(DISTINCT t.transaction_id) as total
          FROM tbl_transactions t
          INNER JOIN tbl_burialservice bs ON t.type_of_service = 'burial' AND t.service_id = bs.burial_id 
            AND CAST(bs.member_id AS CHAR) = ?
            AND (t.transaction_id LIKE ? OR t.service_id LIKE ?)
          UNION ALL
          SELECT COUNT(DISTINCT t.transaction_id) as total
          FROM tbl_transactions t
          INNER JOIN tbl_childdedications cd ON t.type_of_service = 'child_dedication' AND t.service_id = cd.child_id 
            AND CAST(cd.requested_by AS CHAR) = ?
            AND (t.transaction_id LIKE ? OR t.service_id LIKE ?)
          UNION ALL
          SELECT COUNT(DISTINCT t.transaction_id) as total
          FROM tbl_transactions t
          INNER JOIN tbl_waterbaptism wb ON t.type_of_service = 'water_baptism' AND t.service_id = wb.baptism_id 
            AND CAST(wb.member_id AS CHAR) = ?
            AND (t.transaction_id LIKE ? OR t.service_id LIKE ?)
        ) as counts
      `;
      countParams = [
        memberIdStr, memberIdStr, searchPattern, searchPattern,
        memberIdStr, searchPattern, searchPattern,
        memberIdStr, searchPattern, searchPattern,
        memberIdStr, searchPattern, searchPattern
      ];
    }

    // Add sorting (apply to outer query if we wrapped in subquery, otherwise directly)
    let orderByClause = ' ORDER BY ';
    const sortByValue = sortBy && sortBy.trim() !== '' ? sortBy.trim() : null;
    switch (sortByValue) {
      case 'Date Created (Newest)':
        orderByClause += 'date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'date_created ASC';
        break;
      case 'Total (High to Low)':
        orderByClause += 'total DESC';
        break;
      case 'Total (Low to High)':
        orderByClause += 'total ASC';
        break;
      case 'Service Type (A-Z)':
        orderByClause += 'type_of_service ASC';
        break;
      default:
        orderByClause += 'date_created DESC'; // Default sorting
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
    console.log('getTransactionsByMemberId - Final SQL:', sql);
    console.log('getTransactionsByMemberId - Final Params:', params);
    console.log('getTransactionsByMemberId - Count SQL:', countSql);
    console.log('getTransactionsByMemberId - Count Params:', countParams);
    const [rows] = await query(sql, params);
    console.log('getTransactionsByMemberId - Rows returned:', rows.length, 'for memberId:', memberIdStr);

    // Calculate pagination metadata
    const currentPage = page !== undefined ? parseInt(page) : (finalOffset !== null ? Math.floor(finalOffset / finalLimit) + 1 : 1);
    const currentPageSize = finalLimit || rows.length;
    const totalPages = finalLimit ? Math.ceil(totalCount / finalLimit) : 1;

    return {
      success: true,
      message: 'Member transactions retrieved successfully',
      data: rows,
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
    console.error('Error fetching transactions by member ID:', error);
    throw error;
  }
}

/**
 * GET CERTIFICATE DATA - Get service data for certificate based on transaction
 * @param {String} transactionId - Transaction ID
 * @returns {Promise<Object>} Service data formatted for certificate
 */
async function getCertificateDataByTransactionId(transactionId) {
  try {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    // Get transaction details
    const transaction = await getTransactionById(transactionId);
    if (!transaction.success || !transaction.data) {
      return {
        success: false,
        message: 'Transaction not found',
        data: null
      };
    }

    const { type_of_service, service_id } = transaction.data;

    if (!isValidServiceType(type_of_service)) {
      return {
        success: false,
        message: 'Invalid service type',
        data: null
      };
    }

    let serviceData = null;

    // Fetch service data with member details using JOINs
    switch (type_of_service) {
      case 'marriage': {
        const sql = `SELECT 
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
          ) as bride_fullname,
          pastor.firstname as pastor_firstname,
          pastor.lastname as pastor_lastname,
          pastor.middle_name as pastor_middle_name,
          CONCAT(
            pastor.firstname,
            IF(pastor.middle_name IS NOT NULL AND pastor.middle_name != '', CONCAT(' ', pastor.middle_name), ''),
            ' ',
            pastor.lastname
          ) as pastor_fullname
        FROM tbl_marriageservice ms
        LEFT JOIN tbl_members groom ON ms.groom_member_id = groom.member_id
        LEFT JOIN tbl_members bride ON ms.bride_member_id = bride.member_id
        LEFT JOIN tbl_members pastor ON ms.pastor_id = pastor.member_id
        WHERE ms.marriage_id = ?`;
        
        const [rows] = await query(sql, [service_id]);
        if (rows.length === 0) {
          return {
            success: false,
            message: 'Marriage service not found',
            data: null
          };
        }
        serviceData = rows[0];
        
        // Populate groom_name and bride_name if they are null but member IDs exist
        // This ensures certificates can always use groom_name/bride_name fields
        if (!serviceData.groom_name && serviceData.groom_fullname) {
          serviceData.groom_name = serviceData.groom_fullname;
        }
        if (!serviceData.bride_name && serviceData.bride_fullname) {
          serviceData.bride_name = serviceData.bride_fullname;
        }
        
        // Parse guardians if available and ensure it's an array of strings
        if (serviceData.guardians) {
          try {
            let parsed = typeof serviceData.guardians === 'string' 
              ? JSON.parse(serviceData.guardians) 
              : serviceData.guardians;
            
            // Ensure it's an array
            if (!Array.isArray(parsed)) {
              parsed = [parsed];
            }
            
            // Convert all items to strings (in case they're objects)
            serviceData.guardians = parsed.map(item => {
              if (typeof item === 'string') {
                return item;
              } else if (typeof item === 'object' && item !== null) {
                // If it's an object, try to extract name or stringify
                return item.name || item.fullname || item.firstname || JSON.stringify(item);
              } else {
                return String(item);
              }
            }).filter(item => item && item.trim() !== ''); // Remove empty strings
          } catch (e) {
            console.error('Error parsing guardians for marriage:', e);
            serviceData.guardians = [];
          }
        } else {
          serviceData.guardians = [];
        }
        break;
      }
      case 'burial': {
        const sql = `SELECT 
          bs.*,
          m.firstname,
          m.lastname,
          m.middle_name,
          m.address as member_address,
          CONCAT(
            m.firstname,
            IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
            ' ',
            m.lastname
          ) as member_fullname,
          pastor.firstname as pastor_firstname,
          pastor.lastname as pastor_lastname,
          pastor.middle_name as pastor_middle_name,
          CONCAT(
            pastor.firstname,
            IF(pastor.middle_name IS NOT NULL AND pastor.middle_name != '', CONCAT(' ', pastor.middle_name), ''),
            ' ',
            pastor.lastname
          ) as pastor_fullname
        FROM tbl_burialservice bs
        LEFT JOIN tbl_members m ON bs.member_id = m.member_id
        LEFT JOIN tbl_members pastor ON bs.pastor_id = pastor.member_id
        WHERE bs.burial_id = ?`;
        
        const [rows] = await query(sql, [service_id]);
        if (rows.length === 0) {
          return {
            success: false,
            message: 'Burial service not found',
            data: null
          };
        }
        serviceData = rows[0];
        break;
      }
      case 'child_dedication': {
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
        LEFT JOIN tbl_members m ON cd.requested_by = m.member_id
        WHERE cd.child_id = ?`;
        
        const [rows] = await query(sql, [service_id]);
        if (rows.length === 0) {
          return {
            success: false,
            message: 'Child dedication not found',
            data: null
          };
        }
        serviceData = rows[0];
        // Map old field names for backward compatibility with certificate/UI components
        serviceData.member_fullname = serviceData.requester_fullname;
        serviceData.dedication_date = serviceData.preferred_dedication_date;
        
        // Parse sponsors if available and ensure it's an array
        if (serviceData.sponsors) {
          try {
            let parsed = typeof serviceData.sponsors === 'string' 
              ? JSON.parse(serviceData.sponsors) 
              : serviceData.sponsors;
            
            // Ensure it's an array
            if (!Array.isArray(parsed)) {
              parsed = [parsed];
            }
            
            // Convert sponsor objects to full name strings for certificate display
            serviceData.sponsors = parsed.map(sponsor => {
              if (typeof sponsor === 'string') {
                return sponsor;
              } else if (typeof sponsor === 'object' && sponsor !== null) {
                // Build full name from sponsor object
                const parts = [];
                if (sponsor.firstname) parts.push(sponsor.firstname);
                if (sponsor.middle_name) parts.push(sponsor.middle_name);
                if (sponsor.lastname) parts.push(sponsor.lastname);
                return parts.join(' ').trim() || JSON.stringify(sponsor);
              } else {
                return String(sponsor);
              }
            }).filter(sponsor => sponsor && sponsor.trim() !== ''); // Remove empty strings
          } catch (e) {
            console.error('Error parsing sponsors for child dedication:', e);
            serviceData.sponsors = [];
          }
        } else {
          serviceData.sponsors = [];
        }
        // Ensure father_fullname and mother_fullname are set if not already computed
        if (!serviceData.father_fullname && (serviceData.father_firstname || serviceData.father_lastname)) {
          const parts = []
          if (serviceData.father_firstname) parts.push(serviceData.father_firstname)
          if (serviceData.father_middle_name) parts.push(serviceData.father_middle_name)
          if (serviceData.father_lastname) parts.push(serviceData.father_lastname)
          serviceData.father_fullname = parts.join(' ').trim()
        }
        if (!serviceData.mother_fullname && (serviceData.mother_firstname || serviceData.mother_lastname)) {
          const parts = []
          if (serviceData.mother_firstname) parts.push(serviceData.mother_firstname)
          if (serviceData.mother_middle_name) parts.push(serviceData.mother_middle_name)
          if (serviceData.mother_lastname) parts.push(serviceData.mother_lastname)
          serviceData.mother_fullname = parts.join(' ').trim()
        }
        break;
      }
      case 'water_baptism': {
        const sql = `SELECT 
          wb.*,
          m.firstname,
          m.lastname,
          m.middle_name,
          m.birthdate,
          m.address,
          m.date_created as member_date_created,
          CONCAT(
            m.firstname,
            IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
            ' ',
            m.lastname
          ) as member_fullname
        FROM tbl_waterbaptism wb
        LEFT JOIN tbl_members m ON wb.member_id = m.member_id
        WHERE wb.baptism_id = ?`;
        
        const [rows] = await query(sql, [service_id]);
        if (rows.length === 0) {
          return {
            success: false,
            message: 'Water baptism not found',
            data: null
          };
        }
        serviceData = rows[0];
        break;
      }
    }

    return {
      success: true,
      message: 'Certificate data retrieved successfully',
      data: {
        transaction: transaction.data,
        service: serviceData,
        type: type_of_service
      }
    };
  } catch (error) {
    console.error('Error fetching certificate data:', error);
    throw error;
  }
}

/**
 * GET CERTIFICATE DATA BY SERVICE - Get service data for certificate based on service ID and type
 * @param {String} serviceId - Service ID
 * @param {String} typeOfService - Type of service (marriage, burial, child_dedication, water_baptism)
 * @returns {Promise<Object>} Service data formatted for certificate
 */
async function getCertificateDataByServiceId(serviceId, typeOfService) {
  try {
    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    if (!isValidServiceType(typeOfService)) {
      return {
        success: false,
        message: 'Invalid service type',
        data: null
      };
    }

    let serviceData = null;

    // Fetch service data with member details using JOINs
    switch (typeOfService) {
      case 'marriage': {
        const sql = `SELECT 
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
          ) as bride_fullname,
          pastor.firstname as pastor_firstname,
          pastor.lastname as pastor_lastname,
          pastor.middle_name as pastor_middle_name,
          CONCAT(
            pastor.firstname,
            IF(pastor.middle_name IS NOT NULL AND pastor.middle_name != '', CONCAT(' ', pastor.middle_name), ''),
            ' ',
            pastor.lastname
          ) as pastor_fullname
        FROM tbl_marriageservice ms
        LEFT JOIN tbl_members groom ON ms.groom_member_id = groom.member_id
        LEFT JOIN tbl_members bride ON ms.bride_member_id = bride.member_id
        LEFT JOIN tbl_members pastor ON ms.pastor_id = pastor.member_id
        WHERE ms.marriage_id = ?`;
        
        const [rows] = await query(sql, [serviceId]);
        if (rows.length === 0) {
          return {
            success: false,
            message: 'Marriage service not found',
            data: null
          };
        }
        serviceData = rows[0];
        
        // Populate groom_name and bride_name if they are null but member IDs exist
        if (!serviceData.groom_name && serviceData.groom_fullname) {
          serviceData.groom_name = serviceData.groom_fullname;
        }
        if (!serviceData.bride_name && serviceData.bride_fullname) {
          serviceData.bride_name = serviceData.bride_fullname;
        }
        
        // Parse guardians if available and ensure it's an array of strings
        if (serviceData.guardians) {
          try {
            let parsed = typeof serviceData.guardians === 'string' 
              ? JSON.parse(serviceData.guardians) 
              : serviceData.guardians;
            
            if (!Array.isArray(parsed)) {
              parsed = [parsed];
            }
            
            serviceData.guardians = parsed.map(item => {
              if (typeof item === 'string') {
                return item;
              } else if (typeof item === 'object' && item !== null) {
                return item.name || item.fullname || item.firstname || JSON.stringify(item);
              } else {
                return String(item);
              }
            }).filter(item => item && item.trim() !== '');
          } catch (e) {
            console.error('Error parsing guardians for marriage:', e);
            serviceData.guardians = [];
          }
        } else {
          serviceData.guardians = [];
        }
        break;
      }
      case 'burial': {
        const sql = `SELECT 
          bs.*,
          m.firstname,
          m.lastname,
          m.middle_name,
          m.address as member_address,
          CONCAT(
            m.firstname,
            IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
            ' ',
            m.lastname
          ) as member_fullname,
          pastor.firstname as pastor_firstname,
          pastor.lastname as pastor_lastname,
          pastor.middle_name as pastor_middle_name,
          CONCAT(
            pastor.firstname,
            IF(pastor.middle_name IS NOT NULL AND pastor.middle_name != '', CONCAT(' ', pastor.middle_name), ''),
            ' ',
            pastor.lastname
          ) as pastor_fullname
        FROM tbl_burialservice bs
        LEFT JOIN tbl_members m ON bs.member_id = m.member_id
        LEFT JOIN tbl_members pastor ON bs.pastor_id = pastor.member_id
        WHERE bs.burial_id = ?`;
        
        const [rows] = await query(sql, [serviceId]);
        if (rows.length === 0) {
          return {
            success: false,
            message: 'Burial service not found',
            data: null
          };
        }
        serviceData = rows[0];
        break;
      }
      case 'child_dedication': {
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
        LEFT JOIN tbl_members m ON cd.requested_by = m.member_id
        WHERE cd.child_id = ?`;
        
        const [rows] = await query(sql, [serviceId]);
        if (rows.length === 0) {
          return {
            success: false,
            message: 'Child dedication not found',
            data: null
          };
        }
        serviceData = rows[0];
        serviceData.member_fullname = serviceData.requester_fullname;
        serviceData.dedication_date = serviceData.preferred_dedication_date;
        
        // Parse sponsors if available and ensure it's an array
        if (serviceData.sponsors) {
          try {
            let parsed = typeof serviceData.sponsors === 'string' 
              ? JSON.parse(serviceData.sponsors) 
              : serviceData.sponsors;
            
            if (!Array.isArray(parsed)) {
              parsed = [parsed];
            }
            
            serviceData.sponsors = parsed.map(sponsor => {
              if (typeof sponsor === 'string') {
                return sponsor;
              } else if (typeof sponsor === 'object' && sponsor !== null) {
                const parts = [];
                if (sponsor.firstname) parts.push(sponsor.firstname);
                if (sponsor.middle_name) parts.push(sponsor.middle_name);
                if (sponsor.lastname) parts.push(sponsor.lastname);
                return parts.join(' ').trim() || JSON.stringify(sponsor);
              } else {
                return String(sponsor);
              }
            }).filter(sponsor => sponsor && sponsor.trim() !== '');
          } catch (e) {
            console.error('Error parsing sponsors for child dedication:', e);
            serviceData.sponsors = [];
          }
        } else {
          serviceData.sponsors = [];
        }
        
        if (!serviceData.father_fullname && (serviceData.father_firstname || serviceData.father_lastname)) {
          const parts = []
          if (serviceData.father_firstname) parts.push(serviceData.father_firstname)
          if (serviceData.father_middle_name) parts.push(serviceData.father_middle_name)
          if (serviceData.father_lastname) parts.push(serviceData.father_lastname)
          serviceData.father_fullname = parts.join(' ').trim()
        }
        if (!serviceData.mother_fullname && (serviceData.mother_firstname || serviceData.mother_lastname)) {
          const parts = []
          if (serviceData.mother_firstname) parts.push(serviceData.mother_firstname)
          if (serviceData.mother_middle_name) parts.push(serviceData.mother_middle_name)
          if (serviceData.mother_lastname) parts.push(serviceData.mother_lastname)
          serviceData.mother_fullname = parts.join(' ').trim()
        }
        break;
      }
      case 'water_baptism': {
        const sql = `SELECT 
          wb.*,
          m.firstname,
          m.lastname,
          m.middle_name,
          m.birthdate,
          m.address,
          m.date_created as member_date_created,
          CONCAT(
            m.firstname,
            IF(m.middle_name IS NOT NULL AND m.middle_name != '', CONCAT(' ', m.middle_name), ''),
            ' ',
            m.lastname
          ) as member_fullname
        FROM tbl_waterbaptism wb
        LEFT JOIN tbl_members m ON wb.member_id = m.member_id
        WHERE wb.baptism_id = ?`;
        
        const [rows] = await query(sql, [serviceId]);
        if (rows.length === 0) {
          return {
            success: false,
            message: 'Water baptism not found',
            data: null
          };
        }
        serviceData = rows[0];
        break;
      }
    }

    return {
      success: true,
      message: 'Certificate data retrieved successfully',
      data: {
        service: serviceData,
        type: typeOfService
      }
    };
  } catch (error) {
    console.error('Error fetching certificate data by service:', error);
    throw error;
  }
}

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getCertificateDataByTransactionId,
  getCertificateDataByServiceId,
  getTotalsByServiceType,
  getTransactionsByMemberId
};

