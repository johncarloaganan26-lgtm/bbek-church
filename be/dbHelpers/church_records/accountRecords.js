const { query } = require('../../database/db');
const bcrypt = require('bcrypt');
const moment = require('moment');
const XLSX = require('xlsx');
const jwt = require('jsonwebtoken');
const { archiveBeforeDelete } = require('../archiveHelper');
const  {getSpecificWaterBaptismDataByMemberIdIfBaptized} = require('../services/waterBaptismRecords');
const { getSpecificMemberByEmailAndStatus } = require('../church_records/memberRecords');
const { sendAccountDetails } = require('../emailHelper');

/**
 * Account Records CRUD Operations
 * Based on tbl_accounts schema:
 * - acc_id (INT, PK, NN, AI)
 * - email (VARCHAR(45), NN)
 * - password (VARCHAR(45), NN) - hashed
 * - position (VARCHAR(45), NN, default: 'member')
 * - status (VARCHAR(45), NN, default: 'active')
 * - date_created (DATETIME, NN)
 */

const DEFAULT_PASSWORD = 'TestPassword123!';
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param {String} password - Plain text password
 * @returns {Promise<String>} Hashed password
 */
async function hashPassword(password) {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param {String} plainPassword - Plain text password
 * @param {String} hashedPassword - Hashed password from database
 * @returns {Promise<Boolean>} True if passwords match
 */
async function comparePassword(plainPassword, hashedPassword) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
}
const decryptPassword = async (password) => {
  try {
    return await bcrypt.compare(password, DEFAULT_PASSWORD);
  } catch (error) {
    console.error('Error decrypting password:', error);
    throw new Error('Failed to decrypt password');
  }
}

/** 
 * Get specific member by email and password 
 * @param {String} email - Email to check
 * @param {String} password - Password to check
 * @returns {Promise<Object>} Object with account data
 */
async function getSpecificMemberByEmailAndPassword(email, password) {
  try {
    // First, get the account by email only (don't check password in SQL)
    const sql = 'SELECT * FROM tbl_accounts WHERE email = ? AND status = "active"';
    const [rows] = await query(sql, [email]);
    
    // If no account found, return null
    if(rows.length === 0) {
      return null;
    }
    
    let account = rows[0];
    
    // Verify account is active (double check)
    if(account.status !== 'active') {
      return {
        success: false,
        message: 'Account is not active',
        data: null
      };
    }
    
    // Now compare the provided password with the stored hashed password
    const isPasswordValid = await comparePassword(password, account.password);
    
    // If password doesn't match, return null
    if (!isPasswordValid) {
      return null;
    }
    
    // Password is valid, proceed with authentication
    // Insert access token to the account
    account.accessToken = jwt.sign({ email: account.email, position: account.position, acc_id: account.acc_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    if(account.position === 'member') {
      // Find the member by email
      let member = await getSpecificMemberByEmailAndStatus(account.email);
      if(member) {
        let waterBaptism = await getSpecificWaterBaptismDataByMemberIdIfBaptized(member.member_id);
        if(waterBaptism) {
          return {
            success: true,
            message: 'Account retrieved successfully',
            data: {
              account: account,
              member: member,
            }
          };
        } else {
          return {
            success: false,
            message: 'Member not baptized yet',
            data: null
          };
        }
      } else {
        return {
          success: false,
          message: 'Member not found or inactive',
          data: null
        };
      }
    } else {
      let member = await getSpecificMemberByEmailAndStatus(account.email);
      return {
        success: true,
        message: 'Account retrieved successfully',
        data: {
          account: account,
          member: member
        }
      };
    }
    
  } catch (error) {
    console.error('Error getting specific member by email and password:', error);
    throw error;
  }
}

/**
 * Check if an account with the same email already exists
 * @param {String} email - Email to check
 * @param {Number} excludeAccId - Optional acc_id to exclude from check (for updates)
 * @returns {Promise<Object>} Object with isDuplicate flag
 */
async function checkDuplicateAccount(email, excludeAccId = null) {
  try {
    let sql = 'SELECT acc_id, email FROM tbl_accounts WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))';
    const params = [email];

    if (excludeAccId) {
      sql += ' AND acc_id != ?';
      params.push(excludeAccId);
    }

    const [rows] = await query(sql, params);

    return {
      isDuplicate: rows.length > 0,
      account: rows.length > 0 ? rows[0] : null
    };
  } catch (error) {
    console.error('Error checking for duplicate account:', error);
    throw error;
  }
}

/**
 * CREATE - Insert a new account record
 * @param {Object} accountData - Account data object
 * @returns {Promise<Object>} Result object
 */
async function createAccount(accountData) {
  try {
    const {
      email,
      password = DEFAULT_PASSWORD,
      position = 'member',
      status = 'active',
      date_created = new Date()
    } = accountData;

    // Validate required fields
    if (!email) {
      throw new Error('Missing required field: email');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Invalid email format');
    }

    // Check for duplicate email
    const duplicateCheck = await checkDuplicateAccount(email);
    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        message: 'An account with this email already exists',
        error: 'Duplicate email address'
      };
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    const sql = `
      INSERT INTO tbl_accounts 
        (email, password, position, status, date_created)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      email.trim().toLowerCase(),
      hashedPassword,
      position,
      status,
      date_created
    ];

    const [result] = await query(sql, params);
    
    // Fetch the created account (without password)
    const createdAccount = await getAccountById(result.insertId);

    // Send email notification to set password (best-effort; do not fail creation)
    try {
      // Try to get member information for personalized email
      let recipientName = 'User';
      try {
        const member = await getSpecificMemberByEmailAndStatus(email.trim().toLowerCase());
        if (member && member.firstname) {
          recipientName = member.firstname;
          if (member.lastname) {
            recipientName = `${member.firstname} ${member.lastname}`;
          }
        }
      } catch (error) {
        // If member lookup fails, continue with default name
        console.log('Could not retrieve member name for email:', error.message);
      }

      // Prepare account details for email
      const accountDetails = {
        acc_id: result.insertId,
        email: email.trim().toLowerCase(),
        name: recipientName,
        type: 'new_account',
        temporaryPassword: password !== DEFAULT_PASSWORD ? password : undefined // Include temporary password if custom one was provided
      };

      // Send account creation email with password setup link
      await sendAccountDetails(accountDetails);
    } catch (emailError) {
      // Log but don't block account creation if email fails
      console.error('Error sending account creation email:', emailError);
    }

    return {
      success: true,
      message: 'Account created successfully',
      data: createdAccount.data
    };
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}

/**
 * READ ALL - Get all account records with pagination and filters
 * @param {Object} options - Optional query parameters (search, limit, offset, page, pageSize, position, status, sortBy)
 * @returns {Promise<Object>} Object with paginated account records and metadata
 */
async function getAllAccounts(options = {}) {
  try {
    // Extract and normalize parameters from options
    const search = options.search || options.q || null;
    const limit = options.limit !== undefined ? parseInt(options.limit) : undefined;
    const offset = options.offset !== undefined ? parseInt(options.offset) : undefined;
    const page = options.page !== undefined ? parseInt(options.page) : undefined;
    const pageSize = options.pageSize !== undefined ? parseInt(options.pageSize) : undefined;
    const position = options.position || null;
    const status = options.status || null;
    const sortBy = options.sortBy || null;

    // Build base query for counting total records
    let countSql = 'SELECT COUNT(*) as total FROM tbl_accounts';
    let countParams = [];

    // Build query for fetching records (exclude password field)
    let sql = 'SELECT acc_id, email, position, status, date_created FROM tbl_accounts';
    const params = [];

    // Build WHERE conditions array
    const whereConditions = [];
    let hasWhere = false;

    // Add search functionality
    const searchValue = search && search.trim() !== '' ? search.trim() : null;
    if (searchValue) {
      const searchCondition = `(email LIKE ? OR position LIKE ?)`;
      const searchPattern = `%${searchValue}%`;

      whereConditions.push(searchCondition);
      countParams.push(searchPattern, searchPattern);
      params.push(searchPattern, searchPattern);
      hasWhere = true;
    }

    // Add position filter
    if (position && position !== 'All Positions') {
      whereConditions.push('position = ?');
      countParams.push(position);
      params.push(position);
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
      case 'Email (A-Z)':
        orderByClause += 'email ASC';
        break;
      case 'Email (Z-A)':
        orderByClause += 'email DESC';
        break;
      case 'Date Created (Newest)':
        orderByClause += 'date_created DESC';
        break;
      case 'Date Created (Oldest)':
        orderByClause += 'date_created ASC';
        break;
      case 'Position (A-Z)':
        orderByClause += 'position ASC';
        break;
      case 'Status (A-Z)':
        orderByClause += 'status ASC';
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
      message: 'Accounts retrieved successfully',
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
    console.error('Error fetching accounts:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single account by ID
 * @param {Number} accId - Account ID
 * @param {Boolean} includePassword - Whether to include password in response (default: false)
 * @returns {Promise<Object>} Account record
 */
async function getAccountById(accId, includePassword = false) {
  try {
    if (!accId) {
      throw new Error('Account ID is required');
    }

    const fields = includePassword 
      ? 'acc_id, email, password, position, status, date_created'
      : 'acc_id, email, position, status, date_created';
    
    const sql = `SELECT ${fields} FROM tbl_accounts WHERE acc_id = ?`;
    const [rows] = await query(sql, [accId]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Account not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Account retrieved successfully',
      data: rows[0]
    };
  } catch (error) {
    console.error('Error fetching account:', error);
    throw error;
  }
}

/**
 * READ ONE - Get a single account by email
 * @param {String} email - Email address
 * @param {Boolean} includePassword - Whether to include password in response (default: false)
 * @returns {Promise<Object>} Account record
 */
async function getAccountByEmail(email, includePassword = false) {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const fields = includePassword 
      ? 'acc_id, email, password, position, status, date_created'
      : 'acc_id, email, position, status, date_created';
    
    const sql = `SELECT ${fields} FROM tbl_accounts WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))`;
    const [rows] = await query(sql, [email]);

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Account not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Account retrieved successfully',
      data: rows[0]
    };
  } catch (error) {
    console.error('Error fetching account by email:', error);
    throw error;
  }
}

/**
 * UPDATE - Update an existing account record
 * @param {Number} accId - Account ID
 * @param {Object} accountData - Updated account data
 * @returns {Promise<Object>} Result object
 */
async function updateAccount(accId, accountData) {
  try {
    if (!accId) {
      throw new Error('Account ID is required');
    }

    // Check if account exists
    const accountCheck = await getAccountById(accId);
    if (!accountCheck.success) {
      return {
        success: false,
        message: 'Account not found',
        data: null
      };
    }

    const {
      email,
      password,
      position,
      status
    } = accountData;

    // Build dynamic update query based on provided fields
    const fields = [];
    const params = [];

    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return {
          success: false,
          message: 'Invalid email format',
          data: null
        };
      }

      // Check for duplicate email (excluding current account)
      const duplicateCheck = await checkDuplicateAccount(email.trim(), accId);
      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          message: 'An account with this email already exists',
          error: 'Duplicate email address'
        };
      }

      fields.push('email = ?');
      params.push(email.trim().toLowerCase());
    }

    if (password !== undefined) {
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      fields.push('password = ?');
      params.push(hashedPassword);
    }

    if (position !== undefined) {
      fields.push('position = ?');
      params.push(position);
    }

    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }

    if (fields.length === 0) {
      return {
        success: false,
        message: 'No fields to update',
        data: null
      };
    }

    params.push(accId);

    const sql = `
      UPDATE tbl_accounts
      SET ${fields.join(', ')}
      WHERE acc_id = ?
    `;

    const [result] = await query(sql, params);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Account not found or no changes made',
        data: null
      };
    }

    // Fetch updated account (without password)
    const updatedAccount = await getAccountById(accId);

    return {
      success: true,
      message: 'Account updated successfully',
      data: updatedAccount.data
    };
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
}

/**
 * DELETE - Delete an account record (archives it first)
 * @param {Number} accId - Account ID
 * @param {String} archivedBy - User ID who is deleting/archiving the record (optional)
 * @returns {Promise<Object>} Result object
 */
async function deleteAccount(accId, archivedBy = null) {
  try {
    if (!accId) {
      throw new Error('Account ID is required');
    }

    // Check if account exists
    const accountCheck = await getAccountById(accId);
    if (!accountCheck.success) {
      return {
        success: false,
        message: 'Account not found',
        data: null
      };
    }

    // Archive the record before deleting
    await archiveBeforeDelete(
      'tbl_accounts',
      String(accId),
      accountCheck.data,
      archivedBy
    );

    // Delete from original table
    const sql = 'DELETE FROM tbl_accounts WHERE acc_id = ?';
    const [result] = await query(sql, [accId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Account not found',
        data: null
      };
    }

    return {
      success: true,
      message: 'Account archived and deleted successfully',
      data: { acc_id: accId }
    };
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}

/**
 * Verify account credentials (email and password)
 * @param {String} email - Email address
 * @param {String} password - Plain text password
 * @returns {Promise<Object>} Result object with account data if credentials are valid
 */
async function verifyAccountCredentials(email, password) {
  try {
    if (!email || !password) {
      return {
        success: false,
        message: 'Email and password are required',
        data: null
      };
    }

    // Get account with password
    const accountResult = await getAccountByEmail(email, true);
    
    if (!accountResult.success) {
      return {
        success: false,
        message: 'Invalid email or password',
        data: null
      };
    }

    const account = accountResult.data;

    // Check if account is active
    if (account.status !== 'active') {
      return {
        success: false,
        message: 'Account is not active',
        data: null
      };
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(password, account.password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password',
        data: null
      };
    }

    // Return account without password
    const { password: _, ...accountWithoutPassword } = account;

    return {
      success: true,
      message: 'Credentials verified successfully',
      data: accountWithoutPassword
    };
  } catch (error) {
    console.error('Error verifying account credentials:', error);
    throw error;
  }
}

/**
 * EXPORT - Export account records to Excel
 * @param {Object} options - Optional query parameters (same as getAllAccounts: search, position, status, sortBy)
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportAccountsToExcel(options = {}) {
  try {
    // Get all accounts matching the filters (without pagination for export)
    const exportOptions = { ...options };
    // Remove pagination to get all records
    delete exportOptions.limit;
    delete exportOptions.offset;
    delete exportOptions.page;
    delete exportOptions.pageSize;

    const result = await getAllAccounts(exportOptions);
    
    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('No accounts found to export');
    }

    const accounts = result.data;

    // Prepare data for Excel export
    const excelData = accounts.map((account, index) => {
      return {
        'No.': index + 1,
        'Account ID': account.acc_id || '',
        'Email': account.email || '',
        'Position': account.position || '',
        'Status': account.status === 'active' ? 'Active' : account.status === 'inactive' ? 'Inactive' : account.status || '',
        'Date Created': account.date_created ? moment(account.date_created).format('YYYY-MM-DD HH:mm:ss') : '',
        'Created Date': account.date_created ? moment(account.date_created).format('YYYY-MM-DD') : ''
      };
    });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 12 },  // Account ID
      { wch: 30 },  // Email
      { wch: 15 },  // Position
      { wch: 12 },  // Status
      { wch: 20 },  // Date Created
      { wch: 12 }   // Created Date
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true
    });

    return excelBuffer;
  } catch (error) {
    console.error('Error exporting accounts to Excel:', error);
    throw error;
  }
}

/**
 * FORGOT PASSWORD - Send a password reset link to the email address
 * @param {String} email - Email address
 * @returns {Promise<Object>} Result object
 */

async function forgotPasswordByEmail(email) {
  try {
    // Get account by email
    const account = await getAccountByEmail(email);
    if (!account.success) {
      return {
        success: false,
        message: 'Account not found',
        data: null
      };
    }

    const accountData = account.data;

    // Try to get member information for personalized email
    let recipientName = 'User';
    try {
      const member = await getSpecificMemberByEmailAndStatus(email);
      if (member && member.firstname) {
        recipientName = member.firstname;
        if (member.lastname) {
          recipientName = `${member.firstname} ${member.lastname}`;
        }
      }
    } catch (error) {
      // If member lookup fails, continue with default name
      console.log('Could not retrieve member name for email:', error.message);
    }

    // Prepare account details for email
    const accountDetails = {
      acc_id: accountData.acc_id,
      email: accountData.email,
      name: recipientName,
      type: 'forgot_password'
    };

    // Send password reset email
    const emailResult = await sendAccountDetails(accountDetails);

    if (emailResult.success) {
      return {
        success: true,
        message: 'Password reset email sent successfully',
        data: {
          email: accountData.email,
          messageId: emailResult.messageId
        }
      };
    } else {
      return {
        success: false,
        message: emailResult.message || 'Failed to send password reset email',
        error: emailResult.error || emailResult.message,
        data: null
      };
    }
  } catch (error) {
    console.error('Error in forgotPasswordByEmail:', error);
    return {
      success: false,
      message: 'An error occurred while processing password reset request',
      error: error.message,
      data: null
    };
  }
}

module.exports = {
  createAccount,
  getAllAccounts,
  getAccountById,
  getAccountByEmail,
  updateAccount,
  deleteAccount,
  verifyAccountCredentials,
  hashPassword,
  comparePassword,
  checkDuplicateAccount,
  exportAccountsToExcel,
  getSpecificMemberByEmailAndPassword,
  forgotPasswordByEmail
};

