const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const {
    getAllBibleStudyRequests,
    updateBibleStudyRequest,
    createBibleStudyRequest,
    exportBibleStudyRequestsToExcel
} = require('../../dbHelpers/services/biblestudyRecords');
const { authenticateToken, checkAdminRole, checkPermission } = require('../../middleware/authMiddleware');
const auditTrailRecords = require('../../dbHelpers/auditTrailRecords');
const { sendBibleStudyDetails, sendWaterBaptismInvitation, sendSalvationRejectionWithReason } = require('../../dbHelpers/emailHelper');
const { query } = require('../../database/db');
const { validateSelectedSlot, generateCandidateSlotsForDate, BIBLE_STUDY_CAPACITY } = require('../../utils/scheduling');

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
router.get('/', authenticateToken, checkPermission('ServicesGroup'), async (req, res) => {
    try {
        const result = await getAllBibleStudyRequests(req.query);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Update Bible Study request
router.put('/:id', authenticateToken, checkPermission('ServicesGroup:Process'), async (req, res) => {
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

            // Support multiple bookings per slot based on capacity.
            const formattedSlot = slotValidation.slot.format('YYYY-MM-DD HH:mm:ss');
            const [rows] = await query(
                "SELECT COUNT(*) as bookedCount FROM tbl_biblestudy_requests WHERE request_id != ? AND status IN ('Pending','Scheduled') AND scheduled_date = ?",
                [id, formattedSlot]
            );
            if (rows[0].bookedCount >= BIBLE_STUDY_CAPACITY) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Selected time slot has reached its maximum capacity of ${BIBLE_STUDY_CAPACITY} parties. Please choose another slot.` 
                });
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
        const [rows] = await query(`
            SELECT b.*, 
                   COALESCE(
                     CONCAT(m_acc.firstname, ' ', m_acc.lastname),
                     CONCAT(m_direct.firstname, ' ', m_direct.lastname)
                   ) as pastor_name
            FROM tbl_biblestudy_requests b
            LEFT JOIN tbl_accounts a ON b.pastor_id = a.acc_id
            LEFT JOIN tbl_members m_acc ON a.email = m_acc.email COLLATE utf8mb4_unicode_ci
            LEFT JOIN tbl_members m_direct ON b.pastor_id = m_direct.member_id COLLATE utf8mb4_unicode_ci
            WHERE b.request_id = ?
        `, [id]);
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
router.post('/invite-baptism/:id', authenticateToken, checkPermission('ServicesGroup:Promote'), async (req, res) => {
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
router.post('/promote/:id', authenticateToken, checkPermission('ServicesGroup:Promote'), async (req, res) => {
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
router.post('/reject/:id', authenticateToken, checkPermission('ServicesGroup:Process'), async (req, res) => {
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
                `SELECT scheduled_date, COUNT(*) as count 
                 FROM tbl_biblestudy_requests 
                 WHERE status IN ('Pending', 'Scheduled') AND DATE(scheduled_date) = ?
                 GROUP BY scheduled_date`,
                [date]
            );
            const bookedCounts = booked.reduce((acc, r) => {
                const dt = moment(r.scheduled_date).format('YYYY-MM-DD HH:mm:ss');
                acc[dt] = r.count;
                return acc;
            }, {});
            
            // EXCLUDE the rejected slot so they don't pick it again
            const rejectedSlotStr = moment(request.scheduled_date).format('YYYY-MM-DD HH:mm:ss');
            const available = generated.data.filter(slot => {
                const count = bookedCounts[slot.datetime] || 0;
                const isFull = count >= BIBLE_STUDY_CAPACITY;
                const isRejectedSameSlot = slot.datetime === rejectedSlotStr;
                return !isFull && !isRejectedSameSlot;
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
                reason: reason,
                archived: true
            }),
            user_id: req.user?.acc_id || null,
            user_email: req.user?.email || null,
            user_name: req.user?.firstname || null,
            user_position: req.user?.position || null
        });

        // 6. Automatic Archive
        try {
            const { archiveBibleStudyRequest } = require('../../dbHelpers/services/biblestudyRecords');
            await archiveBibleStudyRequest(id, {
                archived_by: req.user?.firstname || 'system',
                archive_reason: `System Auto-Archive: Rejected - ${reason}`
            });
        } catch (archiveError) {
            console.error('Auto-archive failed for rejected bible study request:', archiveError);
            // We continue as the rejection itself succeeded
        }

        res.json({ success: true, message: 'Bible study request rejected, email sent, and moved to archive.' });

    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Bulk Complete Bible Study requests
router.post('/bulk-complete', authenticateToken, checkPermission('ServicesGroup:Process'), async (req, res) => {
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

// ADMIN: Bulk Archive Bible Study requests
router.post('/bulk-archive', authenticateToken, checkPermission('ServicesGroup:Delete'), async (req, res) => {
    try {
        const { requestIds, reason } = req.body;

        if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No requests selected'
            });
        }

        const { archiveBibleStudyRequest } = require('../../dbHelpers/services/biblestudyRecords');
        
        const archived = [];
        const failed = [];

        for (const requestId of requestIds) {
            try {
                // Fetch details for audit log before archiving
                const [rows] = await query('SELECT firstname, lastname FROM tbl_biblestudy_requests WHERE request_id = ?', [requestId]);
                if (rows.length === 0) {
                    failed.push({ requestId, reason: 'Not found' });
                    continue;
                }
                const requestData = rows[0];

                await archiveBibleStudyRequest(requestId, {
                    archived_by: req.user?.acc_id || 'admin',
                    archive_reason: reason || 'Archived by admin'
                });

                // Individual Audit Log
                await auditTrailRecords.createAuditLog({
                    action_type: 'BIBLESTUDY_ARCHIVED',
                    module: 'Bible Study',
                    description: JSON.stringify({
                        request_id: requestId,
                        firstname: requestData.firstname,
                        lastname: requestData.lastname,
                        archive_reason: reason || 'Archived by admin'
                    }),
                    user_id: req.user?.acc_id || null,
                    user_email: req.user?.email || null,
                    user_name: req.user?.firstname || null,
                    user_position: req.user?.position || null
                });

                archived.push(requestId);
            } catch (err) {
                console.error(`Error archiving Bible Study ${requestId}:`, err);
                failed.push({ requestId, error: err.message });
            }
        }

        // Bulk Audit Log
        if (archived.length > 0) {
            await auditTrailRecords.createAuditLog({
                action_type: 'BIBLESTUDY_BULK_ARCHIVED',
                module: 'Bible Study',
                description: JSON.stringify({
                    archived_count: archived.length,
                    failed_count: failed.length,
                    request_ids: archived,
                    archive_reason: reason
                }),
                user_id: req.user?.acc_id || null,
                user_email: req.user?.email || null,
                user_name: req.user?.firstname || null,
                user_position: req.user?.position || null
            });
        }

        res.json({
            success: true,
            message: `Successfully archived ${archived.length} request(s)`,
            data: { archived, failed }
        });
    } catch (error) {
        console.error('Bulk archive error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Export Bible Study Requests to Excel
router.get('/exportExcel', authenticateToken, checkPermission('ServicesGroup:Export'), async (req, res) => {
    try {
        const format = req.query.format || 'xlsx';
        const buffer = await exportBibleStudyRequestsToExcel(req.query);
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const filename = `biblestudy_export_${timestamp}.${format}`;
        
        const contentType = format === 'csv' 
            ? 'text/csv' 
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/exportExcel', authenticateToken, checkPermission('ServicesGroup:Export'), async (req, res) => {
    try {
        const format = req.body.format || 'xlsx';
        const buffer = await exportBibleStudyRequestsToExcel(req.body);
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const filename = `biblestudy_export_${timestamp}.${format}`;
        
        const contentType = format === 'csv' 
            ? 'text/csv' 
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Bulk Update Bible Study requests
router.post('/bulk-update', authenticateToken, checkPermission('ServicesGroup:Process'), async (req, res) => {
    try {
        const { requestIds, status, pastor_id, location, scheduled_date } = req.body;
        if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No requests selected' });
        }

        const { updateBibleStudyRequest } = require('../../dbHelpers/services/biblestudyRecords');
        const { sendBibleStudyDetails } = require('../../dbHelpers/emailHelper');
        
        let updatedCount = 0;
        let failedCount = 0;

        for (const id of requestIds) {
            try {
                // Perform update
                await updateBibleStudyRequest(id, { status, pastor_id, location, scheduled_date });

                // Send email if status or schedule changed (similar to individual update)
                if (status || scheduled_date) {
                    const [rows] = await query(`
                        SELECT b.*, 
                               COALESCE(
                                 CONCAT(m_acc.firstname, ' ', m_acc.lastname),
                                 CONCAT(m_direct.firstname, ' ', m_direct.lastname)
                               ) as pastor_name
                        FROM tbl_biblestudy_requests b
                        LEFT JOIN tbl_accounts a ON b.pastor_id = a.acc_id
                        LEFT JOIN tbl_members m_acc ON a.email = m_acc.email COLLATE utf8mb4_unicode_ci
                        LEFT JOIN tbl_members m_direct ON b.pastor_id = m_direct.member_id COLLATE utf8mb4_unicode_ci
                        WHERE b.request_id = ?
                    `, [id]);
                    if (rows.length > 0) {
                        try {
                            await sendBibleStudyDetails(rows[0]);
                        } catch (emailErr) {
                            console.warn(`Email failed for BS bulk update (${id}):`, emailErr.message);
                        }
                    }
                }

                updatedCount++;
            } catch (err) {
                console.error(`Failed to update BS ${id}:`, err.message);
                failedCount++;
            }
        }

        // Audit Log
        await auditTrailRecords.createAuditLog({
            action_type: 'BIBLESTUDY_BULK_UPDATED',
            module: 'Bible Study',
            description: JSON.stringify({ count: updatedCount, failed: failedCount, ...req.body }),
            user_id: req.user?.acc_id,
            user_name: req.user?.firstname,
            user_position: req.user?.position
        });

        res.json({ success: true, message: `Updated ${updatedCount} requests. ${failedCount} failed.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADMIN: Bulk Promote Bible Study (to Baptism)
router.post('/bulk-promote', authenticateToken, checkPermission('ServicesGroup:Promote'), async (req, res) => {
    try {
        const { requestIds, isDecided = false, overrides = {}, selectedCompanions = null } = req.body;
        if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No requests selected' });
        }

        const { promoteBibleStudyToBaptism } = require('../../dbHelpers/services/biblestudyRecords');
        const { sendWaterBaptismInvitation } = require('../../dbHelpers/emailHelper');
        
        let processedCount = 0;
        let failedCount = 0;
        const lastErrors = [];

        for (const id of requestIds) {
            try {
                const [rows] = await query('SELECT status, firstname, lastname, email FROM tbl_biblestudy_requests WHERE request_id = ?', [id]);
                if (rows.length === 0) {
                    failedCount++;
                    lastErrors.push(`Request ${id} not found`);
                    continue;
                }

                const candidate = rows[0];
                const currentStatus = (candidate.status || '').toLowerCase();
                
                // Allow 'completed', 'scheduled', and 'promoted' to be processed
                // This ensures flexibility if an admin wants to promote someone who is already scheduled in Phase 2
                if (currentStatus !== 'completed' && currentStatus !== 'promoted' && currentStatus !== 'scheduled') {
                    failedCount++;
                    lastErrors.push(`${candidate.firstname} is in ineligible status: ${candidate.status}`);
                    continue;
                }

                if (isDecided) {
                    // READY: Create record directly.
                    // Pass selectedCompanions so the dbHelper promotes only those specific members.
                    await promoteBibleStudyToBaptism(id, true, overrides, selectedCompanions);
                } else {
                    // HESITANT: Send invitation links.
                    // If selectedCompanions is provided, only send to those members;
                    // otherwise the helper handles the whole group via notes.
                    if (selectedCompanions && Array.isArray(selectedCompanions)) {
                        for (const comp of selectedCompanions) {
                            if (!comp.email) continue;
                            try {
                                await sendWaterBaptismInvitation({
                                    request_id: id,
                                    email: comp.email,
                                    firstname: comp.firstname,
                                    lastname: comp.lastname,
                                    isDecided: false
                                });
                            } catch (compEmailErr) {
                                console.warn(`Failed to send invitation to ${comp.firstname}:`, compEmailErr.message);
                            }
                        }
                    } else {
                        // No specific companions — invite the lead record only
                        await sendWaterBaptismInvitation({
                            request_id: id,
                            email: candidate.email,
                            firstname: candidate.firstname,
                            lastname: candidate.lastname,
                            isDecided: false
                        });
                    }
                }
                processedCount++;
            } catch (err) {
                console.error(`Failed to process BS promote ${id}:`, err.message);
                failedCount++;
                lastErrors.push(err.message);
            }
        }

        if (processedCount === 0) {
            return res.json({ 
                success: false, 
                message: lastErrors.length > 0 ? `Promotion failed: ${lastErrors[0]}` : `No eligible candidates found for promotion. Selected records must be in "Completed" or "Scheduled" status.`,
                failedCount
            });
        }

        res.json({ 
            success: true, 
            message: isDecided 
                ? `Successfully promoted ${processedCount} candidates to Water Baptism.` 
                : `Successfully sent invitation links to ${processedCount} candidates.`,
            failedCount,
            errors: lastErrors // Optional: send all errors
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
