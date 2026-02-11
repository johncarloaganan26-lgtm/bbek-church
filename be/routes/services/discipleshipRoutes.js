const express = require('express');
const router = express.Router();
const {
    createDiscipleshipRequest,
    getAllDiscipleshipRequests,
    updateDiscipleshipRequest,
    promoteToBaptism,
    inviteToBaptism,
    deleteDiscipleshipRequest
} = require('../../dbHelpers/services/discipleshipRecords');
const { authenticateToken } = require('../../middleware/authMiddleware'); // For admin routes

// Use authentication middleware for admin routes? Or check role?
// For now, I'll protect admin routes with verifyToken. Public route is open.

// PUBLIC: Submit Interest
router.post('/submit', async (req, res) => {
    try {
        const result = await createDiscipleshipRequest(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Submit error:', error);
        // If it's a duplication error (logic error), 400 is better than 500
        res.status(400).json({ success: false, message: error.message });
    }
});

// ADMIN: Get All Requests
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page, pageSize, search, status } = req.query;
        const result = await getAllDiscipleshipRequests({ page, pageSize, search, status });
        res.json(result);
    } catch (error) {
        console.error('Get All error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Update Request (Schedule/Status)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await updateDiscipleshipRequest(id, req.body);
        res.json(result);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Promote to Baptism (Direct)
router.post('/promote/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await promoteToBaptism(id);
        res.json(result);
    } catch (error) {
        console.error('Promote error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Send Baptism Invitation (Undecided or Decided)
router.post('/invite-baptism/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { isDecided } = req.body;
        const result = await inviteToBaptism(id, isDecided);
        res.json(result);
    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUBLIC: Get Registration Data by ID (For Registration Form)
router.get('/registration-data/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { query } = require('../../database/db');
        const [rows] = await query('SELECT firstname, lastname, email, phone_number, age, gender, address FROM tbl_discipleship_requests WHERE request_id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Get Registration Data error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Delete Request
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteDiscipleshipRequest(id);
        res.json(result);
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
