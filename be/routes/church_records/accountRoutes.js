const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  bulkDeleteAccounts,
  getSpecificMemberByEmailAndPassword,
  getSpecificMemberByEmailAndStatus,
  getSpecificWaterBaptismDataByMemberIdIfBaptized,
  getAllMembers,
  hashPassword,
  exportAccountsToExcel,
  getSpecificMemberByEmail,
  forgotPasswordByEmail,
  getAccountByEmail,
  createResetToken,
  verifyResetToken,
  resetPasswordWithToken,
  createResetTokensTable,
  updateAccountPassword
} = require('../../dbHelpers/church_records/accountRecords');
const auditTrailRecords = require('../../dbHelpers/auditTrailRecords');
const { getMemberById } = require('../../dbHelpers/church_records/memberRecords');
const { getAllAccountsByMemberId } = require('../../dbHelpers/church_records/accountRecords');

/**
 * GET - Get all accounts
 * GET /api/church-records/accounts/getAllAccounts
 */
router.get('/getAllAccounts', async (req, res) => {
  try {
    const {
      search,
      status,
      position,
      page = 1,
      pageSize = 10,
      sortBy = 'date_created',
      sortOrder = 'DESC',
      dateRange
    } = req.query;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    let sql = `
      SELECT 
        acc.acc_id,
        acc.email,
        acc.position,
        acc.status,
        acc.date_created,
        m.member_id as member_id,
        m.firstname,
        m.middle_name,
        m.lastname,
        m.civil_status,
        m.gender,
        m.birthdate,
        m.phone_number as contact_number,
        m.address,
        COALESCE(m.firstname, '') + ' ' + COALESCE(m.middle_name, '') + ' ' + COALESCE(m.lastname, '') as full_name
      FROM tbl_accounts acc
      LEFT JOIN tbl_members m ON acc.email = m.email
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      sql += ` AND (
        acc.email LIKE ? OR 
        m.firstname LIKE ? OR 
        m.lastname LIKE ? OR
        m.phone_number LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'All Statuses' && status !== 'All') {
      sql += ` AND acc.status = ?`;
      params.push(status);
    }

    if (position && position !== 'All Positions' && position !== 'All') {
      sql += ` AND acc.position = ?`;
      params.push(position);
    }

    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      sql += ` AND acc.date_created BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as countSubquery`;
    const [countResult] = await query(countSql, params);
    const totalCount = countResult[0]?.total || 0;

    // Add sorting
    const validSortColumns = ['date_created', 'email', 'position', 'status', 'full_name'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'date_created';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY acc.${sortColumn} ${order}`;

    // Add pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [results] = await query(sql, params);

    res.json({
      success: true,
      data: results,
      pagination: {
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        currentPage: parseInt(page),
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch accounts',
      message: 'Failed to fetch accounts'
    });
  }
});

/**
 * GET - Get account by ID
 * GET /api/church-records/accounts/getAccountById/:id
 */
router.get('/getAccountById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getAccountById(id);
    if (result && result.data) {
      req.auditDescription = `Viewed details of account for user: ${result.data.email} (${result.data.position})`;
    }
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch account',
      message: 'Failed to fetch account'
    });
  }
});

/**
 * POST - Create a new account
 * POST /api/church-records/accounts/createAccount
 */
router.post('/createAccount', async (req, res) => {
  try {
    const {
      email,
      password,
      position,
      status,
      member_id,
      send_password_via_email
    } = req.body;

    if (!email || !password || !position) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and position are required',
        error: 'Email, password, and position are required'
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Check if account with email already exists
    const existingAccount = await getAccountByEmail(email);
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
        error: 'An account with this email already exists'
      });
    }

    const result = await createAccount({
      email,
      password: hashedPassword,
      position,
      status: status || 'active',
      member_id: member_id || null
    });

    // Audit log
    try {
      await auditTrailRecords.createAuditLog({
        user_id: req.user?.acc_id || null,
        user_email: req.user?.email || 'system',
        user_name: (req.user?.member?.firstname && req.user?.member?.lastname) ? `${req.user.member.firstname} ${req.user.member.lastname}` : (req.user?.email || 'System'),
        user_position: req.user?.position || 'system',
        action_type: 'CREATE',
        module: 'Account Management',
        description: `Created new account for email: ${email}`,
        entity_type: 'account',
        entity_id: result.acc_id,
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent'] || null,
        status: 'success',
        error_message: null
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    res.status(201).json({
      success: true,
      data: result,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Error creating account:', error);

    // Audit log for failed creation
    try {
      await auditTrailRecords.createAuditLog({
        user_id: req.user?.acc_id || null,
        user_email: req.user?.email || 'unknown',
        user_name: (req.user?.member?.firstname && req.user?.member?.lastname) ? `${req.user.member.firstname} ${req.user.member.lastname}` : (req.user?.email || 'Unknown'),
        user_position: req.user?.position || 'unknown',
        action_type: 'CREATE',
        module: 'Account Management',
        description: `Failed to create account: ${error.message}`,
        entity_type: 'account',
        entity_id: null,
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent'] || null,
        status: 'failed',
        error_message: error.message
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create account',
      message: 'Failed to create account'
    });
  }
});

/**
 * PUT - Update an existing account
 * PUT /api/church-records/accounts/updateAccount/:id
 */
router.put('/updateAccount/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, position, status, member_id } = req.body;

    // Check if email is provided - if not, we'll get it from the database
    let emailToUse = email;
    if (!emailToUse) {
      // Fetch current account to get email
      const account = await getAccountById(id);
      if (account && account.data) {
        emailToUse = account.data.email;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Account not found',
          error: 'Account not found'
        });
      }
    }

    const result = await updateAccount(id, {
      email: emailToUse,
      password: password,
      position,
      status,
      member_id
    });

    // Audit log
    try {
      await auditTrailRecords.createAuditLog({
        user_id: req.user?.acc_id || null,
        user_email: req.user?.email || 'system',
        user_name: (req.user?.member?.firstname && req.user?.member?.lastname) ? `${req.user.member.firstname} ${req.user.member.lastname}` : (req.user?.email || 'System'),
        user_position: req.user?.position || 'system',
        action_type: 'UPDATE',
        module: 'Account Management',
        description: `Updated account for email: ${emailToUse} (ID: ${id})`,
        entity_type: 'account',
        entity_id: id,
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent'] || null,
        status: 'success',
        error_message: null
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    res.json({
      success: true,
      data: result,
      message: 'Account updated successfully'
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update account',
      message: 'Failed to update account'
    });
  }
});

/**
 * DELETE - Delete an account
 * DELETE /api/church-records/accounts/deleteAccount/:id
 */
router.delete('/deleteAccount/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteAccount(id);

    // Audit log
    try {
      await auditTrailRecords.createAuditLog({
        user_id: req.user?.acc_id || null,
        user_email: req.user?.email || 'system',
        user_name: (req.user?.member?.firstname && req.user?.member?.lastname) ? `${req.user.member.firstname} ${req.user.member.lastname}` : (req.user?.email || 'System'),
        user_position: req.user?.position || 'system',
        action_type: 'DELETE',
        module: 'Account Management',
        description: `Deleted account ID: ${id}`,
        entity_type: 'account',
        entity_id: id,
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent'] || null,
        status: 'success',
        error_message: null
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete account',
      message: 'Failed to delete account'
    });
  }
});

/**
 * POST - Bulk delete accounts
 * POST /api/church-records/accounts/bulkDeleteAccounts
 */
router.delete('/bulkDeleteAccounts', async (req, res) => {
  try {
    const { account_ids } = req.body;

    if (!account_ids || !Array.isArray(account_ids) || account_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Account IDs are required',
        error: 'Account IDs are required'
      });
    }

    const result = await bulkDeleteAccounts(account_ids);

    // Audit log
    try {
      await auditTrailRecords.createAuditLog({
        user_id: req.user?.acc_id || null,
        user_email: req.user?.email || 'system',
        user_name: (req.user?.member?.firstname && req.user?.member?.lastname) ? `${req.user.member.firstname} ${req.user.member.lastname}` : (req.user?.email || 'System'),
        user_position: req.user?.position || 'system',
        action_type: 'BULK_DELETE',
        module: 'Account Management',
        description: `Bulk deleted ${account_ids.length} accounts`,
        entity_type: 'account',
        entity_id: null,
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent'] || null,
        status: 'success',
        error_message: null
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    res.json({
      success: true,
      message: `${result.affectedRows} accounts deleted successfully`,
      data: result
    });
  } catch (error) {
    console.error('Error bulk deleting accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk delete accounts',
      message: 'Failed to bulk delete accounts'
    });
  }
});

/**
 * GET - Export accounts to Excel
 * GET /api/church-records/accounts/exportExcel
 */
router.get('/exportExcel', async (req, res) => {
  try {
    const { search, status, position } = req.query;

    let sql = `
      SELECT 
        acc.acc_id,
        acc.email,
        acc.position,
        acc.status,
        acc.date_created,
        m.firstname,
        m.middle_name,
        m.lastname,
        m.civil_status,
        m.gender,
        m.birthdate,
        m.phone_number as contact_number,
        m.address
      FROM tbl_accounts acc
      LEFT JOIN tbl_members m ON acc.email = m.email
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      sql += ` AND (acc.email LIKE ? OR m.firstname LIKE ? OR m.lastname LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'All Statuses') {
      sql += ` AND acc.status = ?`;
      params.push(status);
    }

    if (position && position !== 'All Positions') {
      sql += ` AND acc.position = ?`;
      params.push(position);
    }

    sql += ` ORDER BY acc.date_created DESC`;

    const [results] = await query(sql, params);

    // Create Excel file
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Accounts');

    // Add headers
    worksheet.columns = [
      { header: 'Account ID', key: 'acc_id', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Position', key: 'position', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date Created', key: 'date_created', width: 20 },
      { header: 'First Name', key: 'firstname', width: 15 },
      { header: 'Middle Name', key: 'middle_name', width: 15 },
      { header: 'Last Name', key: 'lastname', width: 15 },
      { header: 'Civil Status', key: 'civil_status', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Birthdate', key: 'birthdate', width: 15 },
      { header: 'Contact Number', key: 'contact_number', width: 20 },
      { header: 'Address', key: 'address', width: 40 }
    ];

    // Add data
    results.forEach(row => {
      worksheet.add(row);
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=accounts_export.xlsx');

    // Send file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export accounts',
      message: 'Failed to export accounts'
    });
  }
});

/**
 * GET - Get all members for dropdown/select
 * GET /api/church-records/accounts/getAllMembersForSelect
 */
router.get('/getAllMembersForSelect', async (req, res) => {
  try {
    const members = await getAllMembers();
    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch members',
      message: 'Failed to fetch members'
    });
  }
});

/**
 * GET - Get member by ID
 * GET /api/church-records/accounts/getMemberById/:id
 */
router.get('/getMemberById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const member = await getMemberById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
        error: 'Member not found'
      });
    }

    res.json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch member',
      message: 'Failed to fetch member'
    });
  }
});

/**
 * GET - Get all pastors for dropdown/select
 * GET /api/church-records/accounts/getAllPastorsForSelect
 */
router.get('/getAllPastorsForSelect', async (req, res) => {
  try {
    const [pastors] = await query(`
      SELECT 
        m.member_id,
        m.firstname,
        m.middle_name,
        m.lastname,
        m.email,
        m.phone_number,
        acc.position,
        acc.status as account_status
      FROM tbl_members m
      INNER JOIN tbl_accounts acc ON m.email = acc.email
      WHERE acc.position IN ('Pastor', 'Assistant Pastor', 'Youth Pastor') 
        AND acc.status = 'active'
      ORDER BY acc.position, m.firstname
    `);

    res.json({
      success: true,
      data: pastors.map(pastor => ({
        ...pastor,
        name: `${pastor.firstname} ${pastor.middle_name ? pastor.middle_name + ' ' : ''}${pastor.lastname}`
      }))
    });
  } catch (error) {
    console.error('Error fetching pastors:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pastors',
      message: 'Failed to fetch pastors'
    });
  }
});

/**
 * GET - Get all members without pastors for dropdown/select
 * GET /api/church-records/accounts/getAllMembersWithoutPastorsForSelect
 */
router.get('/getAllMembersWithoutPastorsForSelect', async (req, res) => {
  try {
    const [members] = await query(`
      SELECT 
        m.member_id as member_id,
        m.firstname,
        m.middle_name,
        m.lastname,
        m.email,
        m.phone_number as contact_number
      FROM tbl_members m
      WHERE m.member_id NOT IN (
        SELECT DISTINCT m2.member_id
        FROM tbl_members m2
        INNER JOIN tbl_accounts acc ON m2.email = acc.email
        WHERE acc.position IN ('Pastor', 'Assistant Pastor', 'Youth Pastor')
      )
      ORDER BY m.firstname, m.lastname
    `);

    res.json({
      success: true,
      data: members.map(member => ({
        ...member,
        name: `${member.firstname} ${member.middle_name ? member.middle_name + ' ' : ''}${member.lastname}`
      }))
    });
  } catch (error) {
    console.error('Error fetching members without pastors:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch members',
      message: 'Failed to fetch members'
    });
  }
});

/**
 * VERIFY - Verify account credentials (login)
 * POST /api/church-records/accounts/verifyCredentials
 * Body: { email, password }
 */
router.post('/verifyCredentials', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'Email and password are required'
      });
    }

    const result = await getSpecificMemberByEmailAndPassword(email, password);

    if (!result) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'Invalid email or password'
      });
    }

    res.json({
      success: true,
      data: result,
      message: 'Credentials verified successfully'
    });
  } catch (error) {
    console.error('Error verifying credentials:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify credentials',
      message: 'Failed to verify credentials'
    });
  }
});

/**
 *  Login - Login to the system
 *  POST /api/church-records/accounts/login
 *  Body: { email, password } return access token
 */
router.post('/login', async (req, res) => {
  try {
    let { email, password, passwordEncoded } = req.body;

    // If password is base64 encoded, decode it
    if (passwordEncoded && password) {
      try {
        password = Buffer.from(password, 'base64').toString('utf8');
      } catch (decodeError) {
        console.error('Error decoding password:', decodeError);
      }
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'Email and password are required'
      });
    }

    const result = await getSpecificMemberByEmailAndPassword(email, password);

    // Check if result is null (invalid credentials)
    if (!result) {
      // Log failed login attempt (but don't fail the request if audit log fails)
      if (typeof auditTrailRecords?.createAuditLog === 'function') {
        try {
          await auditTrailRecords.createAuditLog({
            user_id: null,
            user_email: email,
            user_name: 'Unknown User',
            user_position: 'unknown',
            action_type: 'LOGIN_FAILED',
            module: 'Authentication',
            description: `Failed login attempt for email: ${email}`,
            entity_type: null,
            entity_id: null,
            ip_address: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
            user_agent: null,
            status: 'failed',
            error_message: 'Invalid credentials'
          });
        } catch (auditError) {
          console.error('Error logging failed login:', auditError);
        }
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'Invalid email or password'
      });
    }

    if (result.success === false) {
      // Log failed login attempt
      try {
        await auditTrailRecords.createAuditLog({
          user_id: null,
          user_email: email,
          user_name: 'Unknown User',
          user_position: 'unknown',
          action_type: 'LOGIN_FAILED',
          module: 'Authentication',
          description: `Failed login attempt for email: ${email} - ${result.message}`,
          entity_type: null,
          entity_id: null,
          ip_address: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
          user_agent: null,
          status: 'failed',
          error_message: result.message
        });
      } catch (auditError) {
        console.error('Error logging failed login:', auditError);
      }

      return res.status(401).json({
        success: false,
        message: result.message || 'Login failed',
        error: result.message || 'Login failed'
      });
    }

    if (result.success) {
      // Log successful login
      try {
        const userId = result.data?.account?.acc_id;
        if (!userId) {
          console.warn('No valid user_id found for login logging, skipping audit log');
        } else if (auditTrailRecords && auditTrailRecords.createAuditLog) {
          await auditTrailRecords.createAuditLog({
            user_id: userId,
            user_email: email,
            user_name: `${result.data.member?.firstname || ''} ${result.data.member?.lastname || ''}`,
            user_position: result.data.account?.position || 'unknown',
            action_type: 'LOGIN',
            module: 'Authentication',
            description: `Successful login for user: ${email}`,
            entity_type: null,
            entity_id: null,
            ip_address: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
            user_agent: req.headers['user-agent'] || null,
            status: 'success',
            error_message: null
          });
        }
      } catch (auditError) {
        console.error('Error logging successful login:', auditError.message);
      }

      return res.status(200).json({
        success: true,
        data: {
          account: result.data.account,
          member: result.data.member
        },
        message: 'Login successful'
      });
    } else {
      // Log failed login attempt
      try {
        await auditTrailRecords.createAuditLog({
          user_id: null,
          user_email: email,
          user_name: 'Unknown User',
          user_position: 'unknown',
          action_type: 'LOGIN_FAILED',
          module: 'Authentication',
          description: `Failed login attempt for email: ${email} - ${result.message || 'Unknown error'}`,
          entity_type: null,
          entity_id: null,
          ip_address: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
          user_agent: req.headers['user-agent'] || null,
          status: 'failed',
          error_message: result.message || 'Unknown error'
        });
      } catch (auditError) {
        console.error('Error logging failed login:', auditError);
      }

      return res.status(401).json({
        success: false,
        message: result.message || 'Login failed',
        error: result.message || 'Login failed'
      });
    }
  } catch (error) {
    // Log system error during login
    try {
      await auditTrailRecords.createAuditLog({
        user_id: null,
        user_email: email || 'unknown',
        user_name: 'Unknown User',
        user_position: 'unknown',
        action_type: 'LOGIN_ERROR',
        module: 'Authentication',
        description: `System error during login attempt for email: ${email || 'unknown'}`,
        entity_type: null,
        entity_id: null,
        ip_address: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || null,
        status: 'error',
        error_message: error.message || 'Unknown error'
      });
    } catch (auditError) {
      console.error('Error logging login system error:', auditError);
    }

    console.error('Error logging in:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to login'
    });
  }
});

/**
 * POST - Forgot password
 * POST /api/church-records/accounts/forgotPassword
 * Body: { email }
 */
router.post('/forgotPassword', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        error: 'Email is required'
      });
    }

    console.log('🔐 Processing forgot password for:', email);

    const result = await forgotPasswordByEmail(email);

    console.log('🔐 Forgot password result:', result);

    if (result && result.success) {
      return res.status(200).json({
        success: true,
        data: result,
        message: result.message || 'Password reset email sent successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result?.message || 'Account not found',
        error: result?.message || 'Account not found'
      });
    }
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process forgot password request'
    });
  }
});

/**
 * POST - Create reset tokens table
 * POST /api/church-records/accounts/createResetTokensTable
 */
router.post('/createResetTokensTable', async (req, res) => {
  try {
    const result = await createResetTokensTable();
    res.json({
      success: true,
      message: 'Reset tokens table created or already exists'
    });
  } catch (error) {
    console.error('Error creating reset tokens table:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create reset tokens table'
    });
  }
});

/**
 * POST - Verify reset token
 * POST /api/church-records/accounts/verifyResetToken
 * Body: { token }
 */
router.post('/verifyResetToken', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
        error: 'Token is required'
      });
    }

    const result = await verifyResetToken(token);

    if (result) {
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Token is valid'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Token is invalid or has expired',
        error: 'Token is invalid or has expired'
      });
    }
  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify reset token'
    });
  }
});

/**
 * POST - Reset password with token
 * POST /api/church-records/accounts/resetPasswordWithToken
 * Body: { token, newPassword }
 */
router.post('/resetPasswordWithToken', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
        error: 'Token and new password are required'
      });
    }

    const result = await resetPasswordWithToken(token, newPassword);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to reset password',
        error: result.message || 'Failed to reset password'
      });
    }
  } catch (error) {
    console.error('Error resetting password with token:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reset password'
    });
  }
});

/**
 * GET - Get all accounts by member ID
 * GET /api/church-records/accounts/getAllAccountsByMemberId/:memberId
 */
router.get('/getAllAccountsByMemberId/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const accounts = await getAllAccountsByMemberId(memberId);
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Error fetching accounts by member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch accounts',
      message: 'Failed to fetch accounts'
    });
  }
});

module.exports = router;
