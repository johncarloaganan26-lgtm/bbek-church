const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('../database/db');

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const [users] = await query('SELECT * FROM tbl_accounts WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check password (assuming passwords are hashed)
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get member info
    const [members] = await query('SELECT * FROM tbl_members WHERE member_id = ?', [user.member_id]);
    const memberInfo = members.length > 0 ? members[0] : {};

    // Generate JWT token
    const token = jwt.sign(
      {
        acc_id: user.acc_id,
        email: user.email,
        position: user.position,
        member: memberInfo
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        acc_id: user.acc_id,
        email: user.email,
        position: user.position,
        member: memberInfo
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  // For JWT, logout is handled client-side by removing the token
  // We can still log this action
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Verify token route (optional)
router.get('/verify', (req, res) => {
  // This would be handled by the authenticateToken middleware
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

module.exports = router;