const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticateToken } = require('../../middleware/authMiddleware');
const auditTrailRecords = require('../../dbHelpers/auditTrailRecords');
const emailHelper = require('../../dbHelpers/emailHelper');
const moment = require('moment-timezone');

/**
 * PROMOTION VISIT ROUTES
 * These follow-up visits happen after a Salvation Talk is completed.
 */

// ADMIN: Schedule Promotion Visit
router.post('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { visit_date, visit_time, location } = req.body;

        if (!visit_date || !visit_time || !location) {
            return res.status(400).json({ success: false, message: 'Missing required fields: visit_date, visit_time, location' });
        }

        // Get request data to ensure it exists
        const [rows] = await query('SELECT firstname, lastname, email, status FROM tbl_discipleship_requests WHERE request_id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        const sql = `
            INSERT INTO tbl_promotion_visits (request_id, visit_date, visit_time, location)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE visit_date = VALUES(visit_date), visit_time = VALUES(visit_time), location = VALUES(location), status = 'Pending'
        `;
        await query(sql, [id, visit_date, visit_time, location]);

        // Log scheduling
        await auditTrailRecords.createAuditLog({
            action_type: 'PROMOTION_VISIT_SCHEDULED',
            module: 'Discipleship',
            description: JSON.stringify({ request_id: id, visit_date, visit_time, location }),
            user_id: req.user?.acc_id,
            user_name: req.user?.firstname
        });

        // Send Email Notification
        try {
            await emailHelper.sendPromotionVisitDetails({
                email: rows[0].email,
                status: 'Scheduled',
                firstname: rows[0].firstname,
                lastname: rows[0].lastname,
                visit_date,
                visit_time,
                location
            });
            
            // If undecided, also send the Bible Study form link
            if (req.body.isUndecided) {
                await emailHelper.sendBibleStudyFormLinkEmail({
                    email: rows[0].email,
                    firstname: rows[0].firstname,
                    lastname: rows[0].lastname,
                    request_id: id
                });
            }
        } catch (emailError) {
            console.error('Promotion visit email failed:', emailError);
        }

        res.json({ success: true, message: 'Promotion visit scheduled successfully' });
    } catch (error) {
        console.error('Promotion visit error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Get Promotion Visit Details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await query('SELECT * FROM tbl_promotion_visits WHERE request_id = ?', [id]);
        
        if (rows.length === 0) {
            return res.json({ success: false, message: 'No promotion visit scheduled' });
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Get promotion visit error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Update Promotion Visit Status
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        await query('UPDATE tbl_promotion_visits SET status = ? WHERE request_id = ?', [status, id]);

        // Log status update
        await auditTrailRecords.createAuditLog({
            action_type: 'PROMOTION_VISIT_STATUS_UPDATED',
            module: 'Discipleship',
            description: JSON.stringify({ request_id: id, new_status: status }),
            user_id: req.user?.acc_id,
            user_name: req.user?.firstname
        });

        // Send Status Update Email
        try {
            const [reqRows] = await query('SELECT firstname, lastname, email FROM tbl_discipleship_requests WHERE request_id = ?', [id]);
            const [visitRows] = await query('SELECT * FROM tbl_promotion_visits WHERE request_id = ?', [id]);
            if (reqRows.length > 0 && visitRows.length > 0) {
                await emailHelper.sendPromotionVisitDetails({
                    email: reqRows[0].email,
                    status: status,
                    firstname: reqRows[0].firstname,
                    lastname: reqRows[0].lastname,
                    visit_date: visitRows[0].visit_date,
                    visit_time: visitRows[0].visit_time,
                    location: visitRows[0].location
                });
            }
        } catch (emailError) {
            console.error('Promotion visit status email wrap failed:', emailError);
        }

        res.json({ success: true, message: 'Promotion visit status updated' });
    } catch (error) {
        console.error('Update promotion visit status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
