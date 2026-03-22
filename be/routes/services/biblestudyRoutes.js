const express = require('express');
const router = express.Router();
const {
    getAllBibleStudyRequests,
    updateBibleStudyRequest,
    createBibleStudyRequest
} = require('../../dbHelpers/services/biblestudyRecords');
const { authenticateToken } = require('../../middleware/authMiddleware');
const auditTrailRecords = require('../../dbHelpers/auditTrailRecords');
const { sendBibleStudyDetails, sendWaterBaptismInvitation, sendSalvationRejectionWithReason } = require('../../dbHelpers/emailHelper');
const { query } = require('../../database/db');
const { validateSelectedSlot, generateCandidateSlotsForDate } = require('../../utils/scheduling');
const moment = require('moment-timezone');

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
            scheduled_date,
            middle_name,
            birthdate,
            age,
            gender,
            civil_status,
            profession,
            spouse_name,
            marriage_date,
            children,
            guardian_name,
            guardian_contact,
            guardian_relationship
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

        // Handle different reference prefixes (REQ = Salvation Talk, BSR = Bible Study Reschedule)
        let isReschedule = false;

        if (salvation_id) {
            if (salvation_id.startsWith('REQ')) {
                const [rows] = await query('SELECT request_id, status FROM tbl_discipleship_requests WHERE request_id = ? LIMIT 1', [salvation_id]);
                if (rows.length === 0) {
                    return res.status(400).json({ success: false, message: 'Invalid Salvation reference ID. Please use the link from your email.' });
                }
                
                // Auto-promote if Undecided status: mark Salvation Talk as Promoted
                if (rows[0].status === 'Undecided') {
                    try {
                        await query(
                            'UPDATE tbl_discipleship_requests SET status = ?, date_updated = NOW() WHERE request_id = ?',
                            ['Promoted', salvation_id]
                        );
                    } catch (promoteError) {
                        console.warn(`Failed to auto-promote Salvation Talk ${salvation_id}:`, promoteError.message);
                    }
                }
            } else if (salvation_id.startsWith('BSR')) {
                const [rows] = await query('SELECT request_id, status FROM tbl_biblestudy_requests WHERE request_id = ? LIMIT 1', [salvation_id]);
                if (rows.length === 0) {
                    return res.status(400).json({ success: false, message: 'Invalid Bible Study reference ID. Please use the link from your email.' });
                }
                isReschedule = true;
            } else {
                return res.status(400).json({ success: false, message: 'Unrecognized reference ID format.' });
            }
        }

        let result;
        if (isReschedule) {
            // Update the existing rejected Bible Study request back to Pending with new schedule
            const formattedDate = moment.tz(scheduled_date, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601], 'Asia/Manila').format('YYYY-MM-DD HH:mm:ss');
            
            await query(
                `UPDATE tbl_biblestudy_requests 
                 SET scheduled_date = ?, status = 'Pending', notes = 'Rescheduled by user', date_updated = NOW() 
                 WHERE request_id = ?`,
                [formattedDate, salvation_id]
            );
            
            result = { success: true, data: { request_id: salvation_id } };
        } else {
            // Create a completely new request
            result = await createBibleStudyRequest({
                salvation_id,  // This will be REQ... or null
                firstname,
                lastname,
                email,
                phone_number,
                address,
                scheduled_date,
                status: 'Pending',
                middle_name,
                birthdate,
                age,
                gender,
                civil_status,
                profession,
                spouse_name,
                marriage_date,
                children,
                guardian_name,
                guardian_contact,
                guardian_relationship
            });
        }

        // Send confirmation email to public user
        if (email) {
            try {
                await sendBibleStudyDetails({
                    email,
                    firstname,
                    lastname,
                    status: 'Pending',
                    scheduled_date,
                    location: 'To be determined (Pastor will contact you)'
                });
            } catch (e) {
                console.warn('Email notification failed for public Bible Study submission:', e.message);
            }
        }

        // Audit log (public)
        try {
            await auditTrailRecords.createAuditLog({
                action_type: isReschedule ? 'BIBLESTUDY_RESCHEDULED' : 'BIBLESTUDY_SUBMITTED',
                module: 'Bible Study',
                description: JSON.stringify({ request_id: result.data?.request_id, firstname, lastname, email, reference_id: salvation_id }),
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
            const requestData = rows[0];
            await sendBibleStudyDetails(requestData);
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
        
        // Check if an active baptism record already exists
        const [existingBaptisms] = await query(
            'SELECT baptism_id, status FROM tbl_waterbaptism WHERE LOWER(email) = LOWER(?) AND status NOT IN ("Completed", "Cancelled") LIMIT 1',
            [candidate.email]
        );

        if (existingBaptisms.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Individual already has an active ${existingBaptisms[0].status} Water Baptism record. No new invitation sent.` 
            });
        }

        // Just send the invitation email. 
        // A record in tbl_waterbaptism is NOT created until they submit the form.
        try {
            const result = await sendWaterBaptismInvitation({
                request_id: id,
                email: candidate.email,
                firstname: candidate.firstname,
                lastname: candidate.lastname,
                isDecided: false
            });

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Water baptism invitation email sent successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to send invitation email'
                });
            }
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
            res.status(500).json({
                success: false,
                message: 'Failed to send invitation email: ' + emailError.message
            });
        }
    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Promote Bible Study to Baptism (Direct)
router.post('/promote/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [candidateRows] = await query('SELECT status, firstname, lastname, email FROM tbl_biblestudy_requests WHERE request_id = ?', [id]);
        if (candidateRows.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });

        const candidate = candidateRows[0];
        if (candidate.status !== 'Completed') {
            return res.status(400).json({ success: false, message: 'Only "Completed" Bible Study requests can be promoted.' });
        }

        const { promoteBibleStudyToBaptism } = require('../../dbHelpers/services/biblestudyRecords');
        const result = await promoteBibleStudyToBaptism(id, false); // Default to undecided (pending)

        // Log promotion
        const auditTrailRecords = require('../../dbHelpers/auditTrailRecords');
        await auditTrailRecords.createAuditLog({
            action_type: 'BIBLE_STUDY_PROMOTED',
            module: 'Bible Study',
            description: JSON.stringify({
                request_id: id,
                firstname: candidate.firstname,
                lastname: candidate.lastname,
                email: candidate.email,
                new_status: 'Promoted'
            }),
            user_id: req.user?.acc_id || null,
            user_email: req.user?.email || null
        });

        res.json(result);
    } catch (error) {
        console.error('Promotion error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Reject Bible Study with Reason and Suggestions
router.post('/reject/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }

        // 1. Get request details
        const [rows] = await query('SELECT * FROM tbl_biblestudy_requests WHERE request_id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        const request = rows[0];

        // 2. Fetch next 3 available slots from church availability
        const timezone = 'Asia/Manila';
        const start = moment().tz(timezone).add(1, 'day').startOf('day');
        const availableDates = [];
        
        // Scan next 14 days for up to 3 days with slots
        for (let i = 0; i < 14 && availableDates.length < 3; i++) {
            const date = start.clone().add(i, 'days').format('YYYY-MM-DD');
            const generated = generateCandidateSlotsForDate({ serviceType: 'bible_study', dateStr: date, timezone });
            if (!generated.success) continue;

            const [booked] = await query(
                `SELECT DATE_FORMAT(scheduled_date, '%Y-%m-%d %H:%i:%s') AS slot_datetime 
                 FROM tbl_biblestudy_requests 
                 WHERE status IN ('Pending', 'Scheduled') AND DATE(scheduled_date) = ?`,
                [date]
            );
            const bookedSet = new Set(booked.map(r => r.slot_datetime));
            
            // EXCLUDE the rejected slot so they don't pick it again
            const rejectedSlotStr = moment(request.scheduled_date).format('YYYY-MM-DD HH:mm:ss');
            const available = generated.data.filter(slot => {
                const isBooked = bookedSet.has(slot.datetime);
                const isRejectedSameSlot = slot.datetime === rejectedSlotStr;
                return !isBooked && !isRejectedSameSlot;
            });

            if (available.length > 0) {
                availableDates.push({
                    date: date,
                    timeSlots: available
                });
            }
        }

        // 3. Update status to Rejected
        await query(
            'UPDATE tbl_biblestudy_requests SET status = \'Rejected\', notes = ?, date_updated = NOW() WHERE request_id = ?',
            [`Rejected: ${reason}`, id]
        );

        // 4. Send Email
        if (request.email) {
            const frontendUrl = process.env.FRONTEND_URL1 || 'http://localhost:5173';
            const rescheduleLink = `${frontendUrl}/beoneofus/bible-study?ref=${id}`;

            await sendSalvationRejectionWithReason({
                email: request.email,
                firstname: request.firstname,
                lastname: request.lastname,
                reason: reason,
                availableSlots: availableDates,
                formLink: rescheduleLink,
                isBibleStudy: true
            });
        }

        // 5. Audit Log
        await auditTrailRecords.createAuditLog({
            action_type: 'BIBLE_STUDY_REJECTED',
            module: 'Bible Study',
            description: JSON.stringify({
                request_id: id,
                firstname: request.firstname,
                lastname: request.lastname,
                reason: reason
            }),
            user_id: req.user?.acc_id || null,
            user_email: req.user?.email || null,
            user_name: req.user?.firstname || null,
            user_position: req.user?.position || null
        });

        res.json({ success: true, message: 'Request rejected and email sent with suggested dates.' });

    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Bulk Complete Bible Study requests
router.post('/bulk-complete', authenticateToken, async (req, res) => {
    try {
        const { requestIds } = req.body;

        if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No requests selected'
            });
        }

        // Fetch the global toggle setting
        const { getCmsPage } = require('../../dbHelpers/cmsRecords');
        const settingsResult = await getCmsPage('system_settings');
        const allowWithoutSchedule = settingsResult.success && settingsResult.data && settingsResult.data.content 
            ? settingsResult.data.content.allow_complete_without_schedule 
            : false;

        if (!allowWithoutSchedule) {
            // If restriction is ON, validate each request's status and date
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const filteredIds = [];
            const errors = [];

            for (const id of requestIds) {
                const [rows] = await query('SELECT status, scheduled_date FROM tbl_biblestudy_requests WHERE request_id = ?', [id]);
                if (rows.length === 0) {
                    errors.push({ id, reason: 'Not found' });
                    continue;
                }

                const request = rows[0];
                if (request.status !== 'Scheduled') {
                    errors.push({ id, reason: 'Status must be Scheduled' });
                    continue;
                }

                if (request.scheduled_date) {
                    const scheduledDate = new Date(request.scheduled_date);
                    scheduledDate.setHours(0, 0, 0, 0);
                    if (scheduledDate > today) {
                        errors.push({ id, reason: 'Future scheduled date' });
                        continue;
                    }
                }
                filteredIds.push(id);
            }

            if (filteredIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No eligible requests found for completion',
                    errors
                });
            }

            const result = await require('../../dbHelpers/services/biblestudyRecords').bulkCompleteBibleStudies(filteredIds);
            return res.json({ ...result, errors });
        } else {
            // If toggle is OFF (allow_complete_without_schedule is true), just do it
            const result = await require('../../dbHelpers/services/biblestudyRecords').bulkCompleteBibleStudies(requestIds);
            return res.json(result);
        }
    } catch (error) {
        console.error('Bulk complete error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
