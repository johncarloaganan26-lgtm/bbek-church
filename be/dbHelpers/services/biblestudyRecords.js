const { query } = require('../../database/db');
const moment = require('moment-timezone');
const XLSX = require('xlsx');
const { sendBibleStudyDetails, sendWaterBaptismInvitation } = require('../emailHelper');
const { validateSelectedSlot } = require('../../utils/scheduling');

moment.tz.setDefault('Asia/Manila');

/**
 * Get next biblestudy_id
 */
async function getNextBibleStudyId() {
    try {
        const sql = 'SELECT MAX(request_id) AS max_id FROM tbl_biblestudy_requests';
        const [rows] = await query(sql);
        const maxId = rows[0]?.max_id || null;

        if (!maxId) return 'BSR000001';

        const numericMatch = maxId.match(/\d+$/);
        if (numericMatch) {
            const numericPart = parseInt(numericMatch[0]);
            return `BSR${String(numericPart + 1).padStart(6, '0')}`;
        }
        return 'BSR000001';
    } catch (error) {
        console.error('Error generating Bible Study ID:', error);
        throw error;
    }
}

/**
 * Create a new Bible Study request (usually via promotion from Salvation)
 */
async function createBibleStudyRequest(data) {
    try {
        const request_id = await getNextBibleStudyId();
        const {
            salvation_id = null,
            firstname,
            lastname,
            middle_name = null,
            email,
            phone_number,
            birthdate = null,
            age = null,
            gender = null,
            address = null,
            civil_status = null,
            profession = null,
            spouse_name = null,
            marriage_date = null,
            children = null,
            scheduled_date,
            pastor_id,
            location: inputLocation,
            notes,
            guardian_name = null,
            guardian_contact = null,
            guardian_relationship = null
        } = data;

        // Ensure location defaults to the home address for Bible Study if not provided
        const location = inputLocation || address || null;

        if (!firstname || !lastname || !email || !phone_number) {
            throw new Error('Missing required fields: firstname, lastname, email, phone_number');
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const { status: rawStatus = 'Pending' } = data;
        const status = String(rawStatus || 'Pending').trim();
        const allowedStatuses = new Set(['Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected', 'Promoted']);
        if (!allowedStatuses.has(status)) {
            throw new Error('Invalid status value');
        }

        if (scheduled_date) {
            const slotValidation = validateSelectedSlot({
                serviceType: 'bible_study',
                scheduledDateTimeStr: scheduled_date,
                timezone: 'Asia/Manila'
            });
            if (!slotValidation.valid) {
                throw new Error(slotValidation.message);
            }
        }

        // Prevent duplicate active requests by email (allow re-apply if cancelled/rejected)
        const [existing] = await query(
            "SELECT request_id FROM tbl_biblestudy_requests WHERE email = ? AND status IN ('Pending','Scheduled','Completed') LIMIT 1",
            [normalizedEmail]
        );
        if (existing.length > 0) {
            throw new Error('You already have an active Bible Study request. Please wait for our team to contact you.');
        }

        // Prevent double-booking of the selected slot (Pending/Scheduled blocks)
        if (scheduled_date) {
            const formattedSlot = moment.tz(scheduled_date, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601], 'Asia/Manila').format('YYYY-MM-DD HH:mm:ss');
            const [rows] = await query(
                "SELECT COUNT(*) as bookedCount FROM tbl_biblestudy_requests WHERE status IN ('Pending','Scheduled') AND scheduled_date = ?",
                [formattedSlot]
            );
            const { BIBLE_STUDY_CAPACITY } = require('../../utils/scheduling');
            if (rows[0].bookedCount >= BIBLE_STUDY_CAPACITY) {
                throw new Error(`Selected time slot has reached its maximum capacity of ${BIBLE_STUDY_CAPACITY} parties. Please choose a different slot.`);
            }
        }

        const formattedDate = scheduled_date ? moment(scheduled_date).format('YYYY-MM-DD HH:mm:ss') : null;

        const sql = `
            INSERT INTO tbl_biblestudy_requests (
                request_id, salvation_id, firstname, lastname, middle_name,
                email, phone_number, birthdate, age, gender,
                address, civil_status, profession, spouse_name, marriage_date,
                children, scheduled_date, pastor_id, location, notes, status,
                guardian_name, guardian_contact, guardian_relationship
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const formattedBirth = birthdate ? moment(birthdate).format('YYYY-MM-DD') : null;
        const formattedMarriage = marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null;
        const childrenStr = (children && typeof children === 'object') ? JSON.stringify(children) : (children || null);

        const params = [
            request_id, salvation_id, firstname, lastname, middle_name,
            normalizedEmail, phone_number, formattedBirth, age, gender,
            address, civil_status, profession, spouse_name, formattedMarriage,
            childrenStr, formattedDate, pastor_id, location, notes, status,
            guardian_name, guardian_contact, guardian_relationship
        ];

        await query(sql, params);

        // If this Bible Study request was created from a Salvation Talk (Phase 1),
        // mark that previous stage as "Promoted" to show it has moved to the next phase.
        if (salvation_id) {
            console.log('Marking salvation request as PROMOTED:', salvation_id);
            await query(
                'UPDATE tbl_discipleship_requests SET status = "Promoted" WHERE request_id = ? AND request_type = "Salvation"',
                [salvation_id]
            );
        }

        return {
            success: true,
            message: status === 'Scheduled' ? 'Bible Study scheduled successfully' : 'Bible Study request submitted successfully',
            data: { request_id }
        };
    } catch (error) {
        console.error('Error creating Bible Study request:', error);
        throw error;
    }
}

/**
 * Get all Bible Study requests
 */
async function getAllBibleStudyRequests(params = {}) {
    try {
        const { page = 1, pageSize = 10, search = '', status = '', sortBy, startDate, endDate } = params;
        const offset = (page - 1) * pageSize;

        let sql = `
            SELECT b.*, 
                   COALESCE(b.middle_name, s.middle_name) as middle_name,
                   COALESCE(b.birthdate, s.birthdate) as birthdate,
                   COALESCE(b.age, s.age) as age,
                   COALESCE(b.gender, s.gender) as gender,
                   COALESCE(b.civil_status, s.civil_status) as civil_status,
                   COALESCE(b.profession, s.profession) as profession,
                   COALESCE(b.spouse_name, s.spouse_name) as spouse_name,
                   COALESCE(b.marriage_date, s.marriage_date) as marriage_date,
                   COALESCE(b.children, s.children) as children,
                   COALESCE(b.guardian_name, s.guardian_name) as guardian_name,
                   COALESCE(b.guardian_contact, s.guardian_contact) as guardian_contact,
                   COALESCE(b.guardian_relationship, s.guardian_relationship) as guardian_relationship,
                   COALESCE(b.address, s.address) as address,
                   COALESCE(
                     CONCAT(m_acc.firstname, ' ', m_acc.lastname),
                     CONCAT(m_direct.firstname, ' ', m_direct.lastname)
                   ) as pastor_name_joined
            FROM tbl_biblestudy_requests b
            LEFT JOIN tbl_discipleship_requests s ON (
                (b.salvation_id IS NOT NULL AND b.salvation_id = s.request_id) OR
                (b.salvation_id IS NULL AND LOWER(b.email) = LOWER(s.email))
            )
            LEFT JOIN tbl_accounts a ON b.pastor_id = a.acc_id
            LEFT JOIN tbl_members m_acc ON a.email = m_acc.email COLLATE utf8mb4_unicode_ci
            LEFT JOIN tbl_members m_direct ON b.pastor_id = m_direct.member_id COLLATE utf8mb4_unicode_ci
            WHERE 1=1`;
        const queryParams = [];

        if (search) {
            sql += ' AND (b.firstname LIKE ? OR b.lastname LIKE ? OR b.email LIKE ? OR b.request_id LIKE ?)';
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const isAllStatus = !status || status === '' || status.toLowerCase() === 'all' || status.toLowerCase() === 'all status';
        if (!isAllStatus) {
            sql += ' AND b.status = ?';
            queryParams.push(status);
        }

        if (startDate && endDate) {
            sql += ' AND b.scheduled_date BETWEEN ? AND ?';
            queryParams.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
        }

        let orderBy = 'b.date_created DESC';
        if (sortBy) {
            switch (sortBy) {
                case 'date_created_asc': orderBy = 'b.date_created ASC'; break;
                case 'date_created_desc': orderBy = 'b.date_created DESC'; break;
                case 'name_asc': orderBy = 'b.firstname ASC, b.lastname ASC'; break;
                case 'name_desc': orderBy = 'b.firstname DESC, b.lastname DESC'; break;
                case 'scheduled_asc': orderBy = 'b.scheduled_date ASC'; break;
                case 'scheduled_desc': orderBy = 'b.scheduled_date DESC'; break;
            }
        }

        sql += ` ORDER BY ${orderBy}`;

        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM tbl_biblestudy_requests WHERE 1=1';
        const countParams = [];
        if (search) {
            countSql += ' AND (firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR request_id LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (!isAllStatus) {
            countSql += ' AND status = ?';
            countParams.push(status);
        }
        if (startDate && endDate) {
            countSql += ' AND scheduled_date BETWEEN ? AND ?';
            countParams.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
        }
        const [countRows] = await query(countSql, countParams);
        const totalCount = countRows[0].total;

        const noPagination = params.noPagination === true;
        if (noPagination) {
            const [rows] = await query(sql, queryParams);
            const formattedRows = rows.map(row => {
                const formatted = { ...row };
                if (row.address && typeof row.address !== 'string' && Buffer.isBuffer(row.address)) {
                    formatted.address = row.address.toString('utf8');
                }
                if (row.notes && typeof row.notes !== 'string' && Buffer.isBuffer(row.notes)) {
                    formatted.notes = row.notes.toString('utf8');
                }
                return formatted;
            });
            return {
                success: true,
                data: formattedRows,
                pagination: {
                    total: totalCount,
                    page: 1,
                    pageSize: totalCount,
                    totalPages: 1
                }
            };
        }

        sql += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(pageSize), parseInt(offset));

        const [rows] = await query(sql, queryParams);

        // Ensure text fields are returned as strings (handles potential Buffer issues from DB)
        const formattedRows = rows.map(row => {
            const formatted = { ...row };
            if (row.address && typeof row.address !== 'string' && Buffer.isBuffer(row.address)) {
                formatted.address = row.address.toString('utf8');
            }
            if (row.notes && typeof row.notes !== 'string' && Buffer.isBuffer(row.notes)) {
                formatted.notes = row.notes.toString('utf8');
            }
            return formatted;
        });

        return {
            success: true,
            data: formattedRows,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(totalCount / pageSize)
            }
        };
    } catch (error) {
        console.error('Error fetching Bible Study requests:', error);
        throw error;
    }
}

/**
 * Update Bible Study request
 */
async function updateBibleStudyRequest(id, data) {
    try {
        const { status, scheduled_date, pastor_id, location, notes,
                middle_name, birthdate, age, gender, address, civil_status,
                profession, spouse_name, marriage_date, children,
                guardian_name, guardian_contact, guardian_relationship } = data;
        
        const updates = [];
        const params = [];

        if (status) { updates.push('status = ?'); params.push(status); }
        if (scheduled_date) { 
            updates.push('scheduled_date = ?'); 
            params.push(moment(scheduled_date).format('YYYY-MM-DD HH:mm:ss')); 
        }
        if (pastor_id) { updates.push('pastor_id = ?'); params.push(pastor_id); }
        if (location) { updates.push('location = ?'); params.push(location); }
        if (notes !== undefined && notes !== null) { updates.push('notes = ?'); params.push(notes); }
        if (middle_name !== undefined) { updates.push('middle_name = ?'); params.push(middle_name); }
        if (birthdate !== undefined) { updates.push('birthdate = ?'); params.push(birthdate ? moment(birthdate).format('YYYY-MM-DD') : null); }
        if (age !== undefined) { updates.push('age = ?'); params.push(age); }
        if (gender !== undefined) { updates.push('gender = ?'); params.push(gender); }
        if (address !== undefined) { updates.push('address = ?'); params.push(address); }
        if (civil_status !== undefined) { updates.push('civil_status = ?'); params.push(civil_status); }
        if (profession !== undefined) { updates.push('profession = ?'); params.push(profession); }
        if (spouse_name !== undefined) { updates.push('spouse_name = ?'); params.push(spouse_name); }
        if (marriage_date !== undefined) { updates.push('marriage_date = ?'); params.push(marriage_date ? moment(marriage_date).format('YYYY-MM-DD') : null); }
        if (children !== undefined) { updates.push('children = ?'); params.push(typeof children === 'object' ? JSON.stringify(children) : children); }
        if (guardian_name !== undefined) { updates.push('guardian_name = ?'); params.push(guardian_name); }
        if (guardian_contact !== undefined) { updates.push('guardian_contact = ?'); params.push(guardian_contact); }
        if (guardian_relationship !== undefined) { updates.push('guardian_relationship = ?'); params.push(guardian_relationship); }

        if (updates.length === 0) return { success: true, message: 'No changes made' };

        params.push(id);
        const sql = `UPDATE tbl_biblestudy_requests SET ${updates.join(', ')}, date_updated = NOW() WHERE request_id = ?`;
        
        await query(sql, params);

        return { success: true, message: 'Bible Study updated successfully' };
    } catch (error) {
        console.error('Error updating Bible Study:', error);
        throw error;
    }
}

/**
 * Bulk complete Bible Study requests
 */
async function bulkCompleteBibleStudies(requestIds) {
    try {
        if (!Array.isArray(requestIds) || requestIds.length === 0) {
            return {
                success: false,
                message: 'requestIds array is required and cannot be empty'
            };
        }

        let completed = 0;
        let failed = 0;
        let skipped = 0;
        let skippedMessages = [];

        for (const id of requestIds) {
            try {
                const [rows] = await query('SELECT * FROM tbl_biblestudy_requests WHERE request_id = ?', [id]);
                if (rows.length === 0) {
                    failed++;
                    continue;
                }

                const request = rows[0];

                if (request.status === 'Completed') {
                    skipped++;
                    skippedMessages.push(`Bible Study for ${request.firstname} ${request.lastname} was skipped because it is already completed.`);
                    continue;
                }

                // Update status to Completed
                await query('UPDATE tbl_biblestudy_requests SET status = \'Completed\', date_updated = NOW() WHERE request_id = ?', [id]);

                // Send completion email
                try {
                    const [fullReqRows] = await query(`
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

                    if (fullReqRows.length > 0) {
                        await sendBibleStudyDetails({
                            ...fullReqRows[0],
                            status: 'Completed'
                        });
                    }
                } catch (emailError) {
                    console.warn(`Email notification failed for Bible Study completion (${id}):`, emailError.message);
                }

                completed++;
            } catch (err) {
                console.error(`Error completing Bible Study ${id}:`, err);
                failed++;
            }
        }

        return {
            success: true,
            message: `Processed ${requestIds.length} requests: ${completed} completed, ${skipped} skipped, ${failed} failed.`,
            data: { completed, skipped, failed, skippedMessages }
        };
    } catch (error) {
        console.error('Error in bulkCompleteBibleStudies:', error);
        throw error;
    }
}

/**
 * Promote Bible Study Candidate to Water Baptism
 */
async function promoteBibleStudyToBaptism(id, isDecided = false, overrides = {}) {
    try {
        const [rows] = await query('SELECT * FROM tbl_biblestudy_requests WHERE request_id = ?', [id]);
        if (rows.length === 0) throw new Error('Bible study request not found');
        const req = rows[0];

        let pastorNameStr = overrides.pastor_name || overrides.pastor_id || req.pastor_id || null;
        if (pastorNameStr) {
            const [pRows] = await query(`
                SELECT CONCAT(m.firstname, ' ', m.lastname) as resolved_name
                FROM tbl_members m
                JOIN tbl_accounts a ON m.email = a.email COLLATE utf8mb4_unicode_ci
                WHERE a.acc_id = ?
                UNION
                SELECT CONCAT(firstname, ' ', lastname) as resolved_name
                FROM tbl_members
                WHERE member_id = ?
                LIMIT 1
            `, [pastorNameStr, pastorNameStr]);
            
            if (pRows.length > 0) {
                pastorNameStr = pRows[0].resolved_name;
            }
        }

        const { createWaterBaptism } = require('./waterBaptismRecords');
        const baptismData = {
            request_id: id,
            firstname: req.firstname,
            lastname: req.lastname,
            middle_name: req.middle_name,
            email: req.email,
            phone_number: req.phone_number,
            birthdate: req.birthdate,
            age: req.age,
            gender: req.gender,
            address: req.address,
            civil_status: req.civil_status,
            profession: req.profession,
            spouse_name: req.spouse_name,
            marriage_date: req.marriage_date,
            children: req.children,
            is_member: false,
            status: overrides.status || (isDecided ? 'approved' : 'pending'),
            pastor_name: pastorNameStr,
            location: overrides.location || req.location || null,
            baptism_date: overrides.baptism_date || null,
            baptism_time: overrides.baptism_time || null,
            guardian_name: req.guardian_name,
            guardian_contact: req.guardian_contact,
            guardian_relationship: req.guardian_relationship,
            notes: overrides.notes || req.notes || ''
        };

        const result = await createWaterBaptism(baptismData);
        if (result.success) {
            await query('UPDATE tbl_biblestudy_requests SET status = "Promoted" WHERE request_id = ?', [id]);
        }
        return result;
    } catch (error) {
        console.error('Error promoting BS to Baptism:', error);
        throw error;
    }
}

/**
 * Archive Bible Study request
 */
async function archiveBibleStudyRequest(id, archiveData) {
    try {
        const { query } = require('../../database/db');
        const { archiveRecord } = require('../archiveRecords');

        // 1. Get the current record data
        const [rows] = await query('SELECT * FROM tbl_biblestudy_requests WHERE request_id = ?', [id]);
        if (rows.length === 0) {
            throw new Error('Bible study request not found');
        }

        const recordData = rows[0];

        // 2. Archive the record
        await archiveRecord(
            'tbl_biblestudy_requests',
            id,
            recordData,
            archiveData.archived_by,
            archiveData.archive_reason
        );

        // 3. Delete the original record
        await query('DELETE FROM tbl_biblestudy_requests WHERE request_id = ?', [id]);

        return { success: true, message: 'Bible Study request archived successfully' };
    } catch (error) {
        console.error('Error archiving Bible Study:', error);
        throw error;
    }
}

async function exportBibleStudyRequestsToExcel(options = {}) {
    const format = options.format || 'xlsx';
    try {
        const exportOptions = { ...options, noPagination: true };
        // Remove ALL pagination parameters to export the full result set
        delete exportOptions.page;
        delete exportOptions.pageSize;
        delete exportOptions.limit;
        delete exportOptions.offset;
        delete exportOptions.format;
        
        const result = await getAllBibleStudyRequests(exportOptions);
        if (!result.success || !result.data || result.data.length === 0) {
            throw new Error('No records found to export');
        }

        const excelData = result.data.map((row, index) => ({
            'No.': index + 1,
            'Request ID': row.request_id,
            'First Name': row.firstname,
            'Last Name': row.lastname,
            'Email': row.email,
            'Phone Number': row.phone_number || '-',
            'Status': row.status,
            'Scheduled Date': row.scheduled_date ? moment(row.scheduled_date).format('YYYY-MM-DD HH:mm:ss') : 'Not Scheduled',
            'Location': row.location || '-',
            'Notes': row.notes || '-',
            'Date Created': moment(row.date_created).format('YYYY-MM-DD HH:mm:ss')
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();

        if (format === 'xlsx') {
            const columnWidths = [
                { wch: 5 },
                { wch: 15 },
                { wch: 25 },
                { wch: 25 },
                { wch: 30 },
                { wch: 20 },
                { wch: 15 },
                { wch: 25 },
                { wch: 30 },
                { wch: 30 },
                { wch: 25 }
            ];
            worksheet['!cols'] = columnWidths;
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Bible Study Requests');
        
        return XLSX.write(workbook, { 
            type: 'buffer', 
            bookType: format === 'csv' ? 'csv' : 'xlsx',
            compression: format === 'xlsx'
        });
    } catch (error) {
        console.error('Export error:', error);
        throw error;
    }
}

module.exports = {
    createBibleStudyRequest,
    getAllBibleStudyRequests,
    updateBibleStudyRequest,
    bulkCompleteBibleStudies,
    promoteBibleStudyToBaptism,
    archiveBibleStudyRequest,
    exportBibleStudyRequestsToExcel
};
