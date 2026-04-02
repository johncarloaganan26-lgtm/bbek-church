const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticateToken, checkAdminRole } = require('../../middleware/authMiddleware');

/**
 * Helper to shorten service type if it exceeds 15 chars (database limit)
 */
const getDBServiceType = (type) => {
    if (type === 'child_dedication') return 'dedication';
    return type;
};

/**
 * GET all availability slots (Admin)
 */
router.get('/salvation-slots', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const serviceTypeRaw = req.query.service_type || 'salvation';
        const serviceType = getDBServiceType(serviceTypeRaw);
        
        // AUTOMATIC CLEANUP: Remove past manual slots for this service before returning results
        // This ensures that any slot whose date and time have already passed is purged.
        const moment = require('moment-timezone');
        const nowInManila = moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');
        
        await query(
            'DELETE FROM tbl_service_slots WHERE service_type = ? AND CONCAT(available_date, " ", available_time) < ?',
            [serviceType, nowInManila]
        );
        
        // Define the booking table and column names for each service type
        const serviceMap = {
            'dedication': { table: 'tbl_childdedications', dateCol: 'preferred_dedication_date', timeCol: 'preferred_dedication_time' },
            'water_baptism': { table: 'tbl_waterbaptism', dateCol: 'baptism_date', timeCol: 'preferred_baptism_time' },
            'salvation': { table: 'tbl_discipleship_requests', dateCol: 'scheduled_date', timeCol: 'scheduled_time', typeFilter: 'Salvation' },
            'bible_study': { table: 'tbl_discipleship_requests', dateCol: 'scheduled_date', timeCol: 'scheduled_time', typeFilter: 'Bible Study' },
            'burial': { table: 'tbl_burialservice', dateCol: 'service_date', timeCol: null }
        };

        const config = serviceMap[serviceType];
        
        let queryStr = 'SELECT * FROM tbl_service_slots WHERE service_type = ? ORDER BY available_date DESC, available_time DESC';
        
        if (config) {
            const typeFilterSql = config.typeFilter ? `AND b.request_type = '${config.typeFilter}'` : '';
            const timeCompareSql = config.timeCol 
                ? `DATE_FORMAT(COALESCE(b.${config.timeCol}, '00:00:00'), '%H:%i')`
                : `DATE_FORMAT(b.${config.dateCol}, '%H:%i')`;

            // Include booking counts in the query
            queryStr = `
                SELECT s.*, 
                (
                    SELECT COUNT(*) 
                    FROM ${config.table} b 
                    WHERE LOWER(b.status) NOT IN ('completed', 'cancelled', 'rejected')
                    AND DATE_FORMAT(b.${config.dateCol}, '%Y-%m-%d') = DATE_FORMAT(s.available_date, '%Y-%m-%d')
                    AND ${timeCompareSql} = DATE_FORMAT(s.available_time, '%H:%i')
                    ${typeFilterSql}
                ) as bookedCount
                FROM tbl_service_slots s
                WHERE s.service_type = ? 
                ORDER BY s.available_date DESC, s.available_time DESC
            `;
        }

        const [rows] = await query(queryStr, [serviceType]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST create availability slot (Single or Bulk)
 * Includes check for duplicates to prevent same date/time for same service
 */
router.post('/salvation-slots', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { available_date, available_time, max_slots, isBulk, dates, times, service_type } = req.body;
        const targetService = getDBServiceType(service_type || 'salvation');
        
        if (isBulk && Array.isArray(dates) && Array.isArray(times)) {
            // Bulk insert: Every combination of date and time
            let createdCount = 0;
            let skippedCount = 0;

            for (const date of dates) {
                for (const time of times) {
                    // Check duplication
                    const [existing] = await query(
                        'SELECT slot_id FROM tbl_service_slots WHERE service_type = ? AND available_date = ? AND available_time = ?',
                        [targetService, date, time]
                    );

                    if (existing.length === 0) {
                        await query(
                            'INSERT INTO tbl_service_slots (service_type, available_date, available_time, max_slots, status, date_created) VALUES (?, ?, ?, ?, \'Available\', NOW())',
                            [targetService, date, time, max_slots || 1]
                        );
                        createdCount++;
                    } else {
                        skippedCount++;
                    }
                }
            }

            return res.json({ 
                success: true, 
                message: `Processed. Created: ${createdCount}, Skipped duplicates: ${skippedCount}` 
            });
        }

        // Single insert duplicate check
        const [existing] = await query(
            'SELECT slot_id FROM tbl_service_slots WHERE service_type = ? AND available_date = ? AND available_time = ?',
            [targetService, available_date, available_time]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'This time slot already exists' });
        }

        // Single insert
        await query(
            'INSERT INTO tbl_service_slots (service_type, available_date, available_time, max_slots, status, date_created) VALUES (?, ?, ?, ?, \'Available\', NOW())',
            [targetService, available_date, available_time, max_slots || 1]
        );

        res.json({ success: true, message: 'Slot created' });
    } catch (error) {
        console.error('Error in Slot creation:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PUT update availability slot
 */
router.put('/salvation-slots/:id', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { available_date, available_time, max_slots, status, service_type } = req.body;
        const targetService = getDBServiceType(service_type || 'salvation');
        
        await query(
            'UPDATE tbl_service_slots SET available_date = ?, available_time = ?, max_slots = ?, status = ? WHERE slot_id = ? AND service_type = ?',
            [available_date, available_time, max_slots, status || 'Available', id, targetService]
        );
        res.json({ success: true, message: 'Slot updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST bulk delete availability slots
 */
router.post('/bulk-delete', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { slotIds, service_type } = req.body;
        const targetService = getDBServiceType(service_type || 'salvation');

        if (!Array.isArray(slotIds) || slotIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No slot IDs provided' });
        }
        
        await query('DELETE FROM tbl_service_slots WHERE slot_id IN (?) AND service_type = ?', [slotIds, targetService]);
        res.json({ success: true, message: `Successfully deleted ${slotIds.length} slots` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE availability slot
 */
router.delete('/salvation-slots/:id', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        const serviceType = getDBServiceType(req.query.service_type || 'salvation');
        await query('DELETE FROM tbl_service_slots WHERE slot_id = ? AND service_type = ?', [id, serviceType]);
        res.json({ success: true, message: 'Slot deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
