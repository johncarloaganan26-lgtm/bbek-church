const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticateToken, checkAdminRole } = require('../../middleware/authMiddleware');

/**
 * GET all salvation availability slots (Admin)
 */
router.get('/salvation-slots', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const [rows] = await query('SELECT * FROM tbl_salvation_availability ORDER BY available_date DESC, available_time DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST create salvation availability slot
 */
router.post('/salvation-slots', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { available_date, available_time, max_slots = 1 } = req.body;
        
        await query(
            'INSERT INTO tbl_salvation_availability (available_date, available_time, max_slots, status, date_created) VALUES (?, ?, ?, \'Available\', NOW())',
            [available_date, available_time, max_slots]
        );

        res.json({ success: true, message: 'Slot created' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE salvation availability slot
 */
router.delete('/salvation-slots/:id', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM tbl_salvation_availability WHERE availability_id = ?', [id]);
        res.json({ success: true, message: 'Slot deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
