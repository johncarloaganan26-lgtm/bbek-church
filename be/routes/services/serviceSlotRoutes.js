const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticateToken, checkAdminRole } = require('../../middleware/authMiddleware');

/**
 * GET all slots for a specific service (Admin)
 */
router.get('/:serviceType', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { serviceType } = req.params;
        const [rows] = await query(
            'SELECT * FROM tbl_service_slots WHERE service_type = ? ORDER BY available_date DESC, available_time DESC',
            [serviceType]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST create a slot for a specific service
 */
router.post('/:serviceType', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { serviceType } = req.params;
        const { available_date, available_time, max_slots = 1 } = req.body;
        
        await query(
            'INSERT INTO tbl_service_slots (service_type, available_date, available_time, max_slots, status, date_created) VALUES (?, ?, ?, ?, \'Available\', NOW())',
            [serviceType, available_date, available_time, max_slots]
        );

        res.json({ success: true, message: 'Slot created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE a slot
 */
router.delete('/:serviceType/:id', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { serviceType, id } = req.params;
        await query('DELETE FROM tbl_service_slots WHERE slot_id = ? AND service_type = ?', [id, serviceType]);
        res.json({ success: true, message: 'Slot deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
