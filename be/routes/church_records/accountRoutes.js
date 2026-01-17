const express = require('express');
const moment = require('moment');
const bcrypt = require('bcrypt');
const { query } = require('../../database/db');
const auditTrailRecords = require('../../dbHelpers/auditTrailRecords');
const {
  createAccount,
  getAllAccounts,
  getAccountById,
  getAccountByEmail,
  updateAccount,
  deleteAccount,
  verifyAccountCredentials,
  exportAccountsToExcel,
  getSpecificMemberByEmailAndPassword,
  forgotPasswordByEmail
} = require('../../dbHelpers/church_records/accountRecords');

const router = express.Router();

/**
 * CREATE - Insert a new account record
 * POST /api/church-records/accounts/createAccount
 */
router.post('/createAccount', async (req, res) => {
  try {
    const result = await createAccount(req.body);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error || result.message
      });
    }
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create account'
    });
  }
});

/**
 * READ ALL - Get all account records with pagination and filters
 * GET /api/church-records/accounts/getAllAccounts (query params)
 * POST /api/church-records/accounts/getAllAccounts (body payload)
 * Parameters: search, limit, offset, page, pageSize, position, status, sortBy
 */
router.get('/getAllAccounts', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const result = await getAllAccounts(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch accounts'
    });
  }
});

router.post('/getAllAccounts', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const result = await getAllAccounts(options);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count, // Number of records in current page
        totalCount: result.totalCount, // Total number of records
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch accounts'
    });
  }
});

/**
 * READ ONE - Get a single account by ID
 * GET /api/church-records/accounts/getAccountById/:id
 */
router.get('/getAccountById/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const accId = parseInt(id);

    if (isNaN(accId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const result = await getAccountById(accId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch account'
    });
  }
});

/**
 * READ ONE - Get a single account by email
 * GET /api/church-records/accounts/getAccountByEmail/:email
 */
router.get('/getAccountByEmail/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await getAccountByEmail(email);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching account by email:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch account'
    });
  }
});

/**
 * UPDATE - Update an existing account record
 * PUT /api/church-records/accounts/updateAccount/:id
 */
router.put('/updateAccount/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const accId = parseInt(id);

    if (isNaN(accId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const result = await updateAccount(accId, req.body);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error || result.message
      });
    }
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update account'
    });
  }
});

/**
 * DELETE - Delete an account record
 * DELETE /api/church-records/accounts/deleteAccount/:id
 */
router.delete('/deleteAccount/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const accId = parseInt(id);
    const archivedBy = req.user?.acc_id || null;

    if (isNaN(accId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const result = await deleteAccount(accId, archivedBy);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete account'
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
        error: 'Email and password are required'
      });
    }

    const result = await verifyAccountCredentials(email, password);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error verifying credentials:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify credentials'
    });
  }
});

/**
 * EXPORT - Export account records to Excel
 * GET /api/church-records/accounts/exportExcel (query params)
 * POST /api/church-records/accounts/exportExcel (body payload)
 * Parameters: search, position, status, sortBy (same as getAllAccounts, but no pagination)
 */
router.get('/exportExcel', async (req, res) => {
  try {
    // Get parameters from query string
    const options = req.query;
    const excelBuffer = await exportAccountsToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `accounts_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting accounts to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export accounts to Excel'
    });
  }
});

router.post('/exportExcel', async (req, res) => {
  try {
    // Get parameters from request body (payload)
    const options = req.body;
    const excelBuffer = await exportAccountsToExcel(options);
    
    // Generate filename with timestamp
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `accounts_export_${timestamp}.xlsx`;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    
    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting accounts to Excel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export accounts to Excel'
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
    const { email, password } = req.body;

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
      // Log failed login attempt
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
          user_agent: null, // Hidden for privacy
          status: 'failed',
          error_message: 'Invalid credentials'
        });
      } catch (auditError) {
        console.error('Error logging failed login:', auditError);
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'Invalid email or password'
      });
    }

    // Check if result has success property
    if (result.success) {
      // Log successful login
      try {
        const userData = result.data?.user || result.data;
        // Ensure we have a valid user_id, fallback to a temporary ID if needed
        const userId = userData?.acc_id || userData?.id || userData?.account?.acc_id;
        if (!userId) {
          console.warn('No valid user_id found for login logging, skipping audit log');
        } else {
          await auditTrailRecords.createAuditLog({
            user_id: userId,
            user_email: userData?.email || email,
            user_name: userData?.name || userData?.firstname ? `${userData.firstname} ${userData.lastname || ''}`.trim() : email,
            user_position: userData?.position || userData?.account?.position || 'member',
            action_type: 'LOGIN_SUCCESS',
            module: 'Authentication',
            description: `Successful login for user: ${email}`,
            entity_type: null,
            entity_id: null,
            ip_address: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
            user_agent: null, // Hidden for privacy
            status: 'success'
          });
        }
      } catch (auditError) {
        console.error('Error logging successful login:', auditError);
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
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
          user_agent: null, // Hidden for privacy
          status: 'failed',
          error_message: result.message || 'Login failed'
        });
      } catch (auditError) {
        console.error('Error logging failed login:', auditError);
      }

      res.status(401).json({
        success: false,
        message: result.message || 'Login failed',
        error: result.message || 'Login failed'
      });
    }
  } catch (error) {
    console.error('Error logging in:', error);

    // Log system error during login
    try {
      const { email } = req.body;
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
        user_agent: null, // Hidden for privacy
        status: 'failed',
        error_message: error.message || 'System error'
      });
    } catch (auditError) {
      console.error('Error logging login system error:', auditError);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to login'
    });
  }
 });

/**
 * FORGOT PASSWORD - Send password reset email
 * POST /api/church-records/accounts/forgotPassword
 * Body: { email }
 */
router.post('/forgotPassword', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await forgotPasswordByEmail(email);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        error: result.error || result.message
      });
    }
  } catch (error) {
    console.error('Error processing forgot password request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process forgot password request'
    });
  }
});

/**
  * LOGOUT - Log user out and record audit trail
  * POST /api/church-records/accounts/logout
  * Body: { logout_reason? }
  */
 router.post('/logout', async (req, res) => {
   try {
     // Get user info from token
     const userEmail = req.user?.email || null;
     const userId = req.user?.acc_id || null;
     const logoutReason = req.body?.logout_reason || 'User initiated logout';

     res.status(200).json({
       success: true,
       message: 'Logged out successfully',
       data: {
         email: userEmail,
         acc_id: userId,
         logout_reason: logoutReason
       }
     });
   } catch (error) {
     console.error('Error during logout:', error);
     res.status(500).json({
       success: false,
       error: error.message || 'Failed to logout'
     });
   }
 });

/**
 * CREATE PASSWORD RESET TOKENS TABLE - Temporary endpoint to create the table
 * POST /api/church-records/accounts/createResetTokensTable
 */
router.post('/createResetTokensTable', async (req, res) => {
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`tbl_password_reset_tokens\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`acc_id\` VARCHAR(45) NOT NULL COMMENT 'Account ID from tbl_accounts',
        \`token\` VARCHAR(255) NOT NULL COMMENT 'Reset token',
        \`expires_at\` DATETIME NOT NULL COMMENT 'Token expiration time',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Token creation time',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`unique_token\` (\`token\`),
        UNIQUE KEY \`unique_account\` (\`acc_id\`),
        INDEX \`idx_expires_at\` (\`expires_at\`),
        INDEX \`idx_acc_id\` (\`acc_id\`),
        CONSTRAINT \`fk_reset_token_account\` FOREIGN KEY (\`acc_id\`) REFERENCES \`tbl_accounts\` (\`acc_id\`)
          ON DELETE CASCADE
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Password reset tokens for secure password recovery';
    `;

    await query(createTableSQL);
    res.status(200).json({
      success: true,
      message: 'Password reset tokens table created successfully'
    });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create table'
    });
  }
});

/**
 * VERIFY PASSWORD RESET TOKEN - Verify if a password reset token is valid
 * POST /api/church-records/accounts/verifyResetToken
 * Body: { token }
 */
router.post('/verifyResetToken', async (req, res) => {
  try {
    const { token } = req.body;

    console.log('🔍 Verifying token:', token ? token.substring(0, 10) + '...' : 'null');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // Get all valid tokens (not expired, not used) and account info
    const sql = `
      SELECT t.*, a.email, a.position, a.status
      FROM tbl_password_reset_tokens t
      JOIN tbl_accounts a ON t.acc_id = a.acc_id
      WHERE t.expires_at > CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00') AND a.status = 'active' AND t.used_at IS NULL
    `;
    const [rows] = await query(sql, []);

    console.log('🔍 Valid tokens found:', rows.length);

    // Compare provided token against hashed tokens
    let matchedTokenData = null;
    for (const row of rows) {
      try {
        const isMatch = await bcrypt.compare(token, row.token);
        if (isMatch) {
          matchedTokenData = row;
          break;
        }
      } catch (compareError) {
        console.log('Token comparison error for account:', row.acc_id);
      }
    }

    if (!matchedTokenData) {
      console.log('❌ Token not found or invalid');
      return res.status(400).json({
        success: false,
        message: 'Invalid, expired, or already used token',
        error: 'Token not found, expired, or already used'
      });
    }

    const tokenData = matchedTokenData;
    console.log('✅ Token is valid for account:', tokenData.email);

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        acc_id: tokenData.acc_id,
        email: tokenData.email,
        position: tokenData.position,
        status: tokenData.status,
        expires_at: tokenData.expires_at
      }
    });
  } catch (error) {
    console.error('❌ Error verifying reset token:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify token'
    });
  }
});

/**
 * RESET PASSWORD WITH TOKEN - Reset password using a valid token
 * POST /api/church-records/accounts/resetPasswordWithToken
 * Body: { token, newPassword }
 */
router.post('/resetPasswordWithToken', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Get all valid tokens and compare
    const sql = `
      SELECT t.*, a.email, a.position, a.status
      FROM tbl_password_reset_tokens t
      JOIN tbl_accounts a ON t.acc_id = a.acc_id
      WHERE t.expires_at > CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00') AND a.status = 'active'
    `;
    const [rows] = await query(sql, []);

    // Compare provided token against hashed tokens
    let matchedTokenData = null;
    for (const row of rows) {
      try {
        const isMatch = await bcrypt.compare(token, row.token);
        if (isMatch) {
          matchedTokenData = row;
          break;
        }
      } catch (compareError) {
        console.log('Token comparison error for account:', row.acc_id);
      }
    }

    if (!matchedTokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'Token not found or expired'
      });
    }

    const tokenData = matchedTokenData;

    // Update password
    const updateResult = await updateAccount(tokenData.acc_id, { password: newPassword });

    if (!updateResult.success) {
      return res.status(400).json({
        success: false,
        message: updateResult.message,
        error: updateResult.error
      });
    }

    // Mark token as used instead of deleting (for audit trail and preventing reuse)
    // Use UTC_TIMESTAMP() to match the timezone used for token creation
    const markUsedSql = 'UPDATE tbl_password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE acc_id = ?';
    await query(markUsedSql, [tokenData.acc_id]);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        email: tokenData.email
      }
    });
  } catch (error) {
    console.error('Error resetting password with token:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reset password'
    });
  }
});

/**
 * SAMPLE ROUTE - Get current user profile (requires authentication)
 * GET /api/church-records/accounts/me
 * This route demonstrates accessing req.user from the JWT token
 */
router.get('/me', (req, res) => {
  try {
    // req.user is automatically populated by authenticateToken middleware
    // Contains: { email, position, acc_id, iat, exp }
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        email: req.user.email,
        position: req.user.position,
        acc_id: req.user.acc_id
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user profile'
    });
  }
});

/**
 * MIGRATION - Add used_at column to password reset tokens table
 * POST /api/church-records/accounts/migratePasswordResetTokens
 * This endpoint adds the used_at column if it doesn't exist
 */
router.post('/migratePasswordResetTokens', async (req, res) => {
  try {
    console.log('🔄 Starting password reset token migration...');

    // Check if used_at column already exists
    const [columns] = await query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tbl_password_reset_tokens' AND COLUMN_NAME = 'used_at'"
    );

    if (columns.length > 0) {
      console.log('ℹ️  used_at column already exists');
      return res.status(200).json({
        success: true,
        message: 'Migration already applied - used_at column exists'
      });
    }

    // Add the column
    console.log('📝 Adding used_at column...');
    await query(`
      ALTER TABLE \`tbl_password_reset_tokens\` 
      ADD COLUMN \`used_at\` DATETIME NULL COMMENT 'Timestamp when token was successfully used for password reset' AFTER \`expires_at\`
    `);
    console.log('✅ Column added');

    // Create index for performance
    console.log('📝 Creating index...');
    await query(`
      CREATE INDEX \`idx_used_at\` ON \`tbl_password_reset_tokens\` (\`used_at\`)
    `);
    console.log('✅ Index created');

    // Cleanup old tokens
    console.log('🧹 Cleaning up old tokens...');
    const [result] = await query(`
      DELETE FROM tbl_password_reset_tokens
      WHERE expires_at <= UTC_TIMESTAMP()
    `);
    console.log(`✅ Cleaned up ${result.affectedRows} expired tokens`);

    res.status(200).json({
      success: true,
      message: 'Migration completed successfully',
      data: {
        tokensDeleted: result.affectedRows
      }
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Migration failed'
    });
  }
});

module.exports = router;

