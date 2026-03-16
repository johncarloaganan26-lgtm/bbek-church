const express = require('express');
const router = express.Router();
const {
    getAllBibleStudyRequests,
    updateBibleStudyRequest,
    createBibleStudyRequest
} = require('../../dbHelpers/services/biblestudyRecords');
const { authenticateToken } = require('../../middleware/authMiddleware');
const auditTrailRecords = require('../../dbHelpers/auditTrailRecords');
const { sendBibleStudyDetails, sendWaterBaptismInvitation } = require('../../dbHelpers/emailHelper');
const { query } = require('../../database/db');
const { validateSelectedSlot } = require('../../utils/scheduling');

// PUBLIC: Submit Bible Study interest (from form link)
router.post('/submit', async (req, res) => {
    try {
        const {
            salvation_id = null,
            firstname,
            lastname,
            email,
            phone_number,
            address,
            scheduled_date
        } = req.body || {};

        if (!firstname || !lastname || !email || !phone_number || !address || !scheduled_date) {
            return res.status(400).json({
                success: false,
                message: 'Please complete all required fields (name, email, phone number, address, schedule).'
            });
        }

        const slotValidation = validateSelectedSlot({
            serviceType: 'bible_study',
            scheduledDateTimeStr: scheduled_date,
            timezone: 'Asia/Manila'
        });
        if (!slotValidation.valid) {
            return res.status(400).json({ success: false, message: slotValidation.message });
        }

        // If salvation_id is provided, ensure it exists (optional linkage)
        if (salvation_id) {
            const [rows] = await query('SELECT request_id FROM tbl_discipleship_requests WHERE request_id = ? LIMIT 1', [salvation_id]);
            if (rows.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid reference ID. Please use the link from your email.' });
            }
        }

        const result = await createBibleStudyRequest({
            salvation_id,
            firstname,
            lastname,
            email,
            phone_number,
            address,
            scheduled_date,
            status: 'Pending'
        });

        // Audit log (public)
        try {
            await auditTrailRecords.createAuditLog({
                action_type: 'BIBLESTUDY_SUBMITTED',
                module: 'Bible Study',
                description: JSON.stringify({ request_id: result.data?.request_id, firstname, lastname, email }),
                user_id: null,
                user_email: null,
                user_name: 'Public User',
                user_position: 'public'
            });
        } catch (e) {
            console.warn('Audit log failed for Bible Study submission:', e.message);
        }

        return res.status(201).json(result);
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});

// ADMIN: Get all Bible Study requests
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await getAllBibleStudyRequests(req.query);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Update Bible Study request
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Validate schedule rules when a schedule is provided/updated.
        if (req.body?.scheduled_date) {
            const slotValidation = validateSelectedSlot({
                serviceType: 'bible_study',
                scheduledDateTimeStr: req.body.scheduled_date,
                timezone: 'Asia/Manila'
            });
            if (!slotValidation.valid) {
                return res.status(400).json({ success: false, message: slotValidation.message });
            }

            // Prevent double-booking on schedule changes.
            const formattedSlot = slotValidation.slot.format('YYYY-MM-DD HH:mm:ss');
            const [conflicts] = await query(
                "SELECT request_id FROM tbl_biblestudy_requests WHERE request_id != ? AND status IN ('Pending','Scheduled') AND scheduled_date = ? LIMIT 1",
                [id, formattedSlot]
            );
            if (conflicts.length > 0) {
                return res.status(400).json({ success: false, message: 'Selected time slot is already booked. Please choose another slot.' });
            }

            // Normalize to consistent formatting for DB.
            req.body.scheduled_date = formattedSlot;
        }

        // If admin sets Scheduled, require pastor + location + scheduled date.
        if (req.body?.status === 'Scheduled') {
            if (!req.body.scheduled_date) {
                return res.status(400).json({ success: false, message: 'Scheduled date and time is required.' });
            }
            if (!req.body.pastor_id) {
                return res.status(400).json({ success: false, message: 'Pastor is required before scheduling.' });
            }
            if (!req.body.location) {
                return res.status(400).json({ success: false, message: 'Location is required before scheduling.' });
            }
        }

        const result = await updateBibleStudyRequest(id, req.body);

        // Fetch details for email
        const [rows] = await query('SELECT * FROM tbl_biblestudy_requests WHERE request_id = ?', [id]);
        if (rows.length > 0 && req.body.status) {
            await sendBibleStudyDetails(rows[0]);
        }

        // Audit Log
        await auditTrailRecords.createAuditLog({
            action_type: 'BIBLESTUDY_UPDATED',
            module: 'Bible Study',
            description: JSON.stringify({ request_id: id, ...req.body }),
            user_id: req.user?.acc_id,
            user_name: req.user?.firstname,
            user_position: req.user?.position
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Send Baptism Invitation (From Bible Study)
router.post('/invite-baptism/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [currentRows] = await query('SELECT firstname, lastname, email, status FROM tbl_biblestudy_requests WHERE request_id = ?', [id]);
        if (currentRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Bible study request not found' });
        }
        
        const candidate = currentRows[0];

        // Actually send the email using the provided helper
        const result = await sendWaterBaptismInvitation({
            request_id: id,
            email: candidate.email,
            firstname: candidate.firstname,
            isDecided: false // Promotion from bible study (undecided choice)
        });

        if (result.success) {
            res.json({ success: true, message: 'Baptism invitation email sent successfully' });
        } else {
            res.status(500).json({ success: false, message: result.message || 'Failed to send invitation email' });
        }
    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
