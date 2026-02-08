const { archiveRecord } = require('./archiveRecords');

/**
 * Archive Helper Utility
 * This helper function can be used in delete functions to archive records before deletion
 * 
 * @param {String} tableName - Name of the table (e.g., 'tbl_members')
 * @param {String} recordId - ID of the record to archive
 * @param {Object} recordData - Complete data of the record
 * @param {String} archivedBy - User ID who is archiving (optional)
 * @returns {Promise<Object>} Archive result
 */
async function archiveBeforeDelete(tableName, recordId, recordData, archivedBy = null) {
  try {
    if (!tableName || !recordId || !recordData) {
      console.warn('Archive helper: Missing required parameters', {
        tableName: !!tableName,
        recordId: !!recordId,
        recordData: !!recordData
      });
      return { success: false, message: 'Missing required parameters for archiving' };
    }

    // Log what's being archived for debugging
    console.log(`Archiving ${tableName} record ${recordId}`, {
      tableName,
      recordId,
      dataKeys: Object.keys(recordData || {}),
      archivedBy: archivedBy || 'system'
    });

    const result = await archiveRecord(
      tableName,
      String(recordId),
      recordData,
      archivedBy
    );

    if (result.success) {
      console.log(`Successfully archived ${tableName} record ${recordId}`);
    } else {
      console.warn(`Failed to archive ${tableName} record ${recordId}:`, result.message);
    }

    return result;
  } catch (error) {
    // Don't throw error - archiving should not block deletion
    console.error(`Error archiving ${tableName} record ${recordId}:`, error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno
    });
    return { success: false, message: error.message };
  }
}

/**
 * Bulk Archive Helper Utility
 *
 * @param {String} tableName - Name of the table
 * @param {Array<Object>} recordsToArchive - Array of { id, data } objects
 * @param {String} archivedBy - User ID who is archiving (optional)
 * @returns {Promise<Object>} Archive result
 */
async function bulkArchiveBeforeDelete(tableName, recordsToArchive, archivedBy = null) {
  try {
    if (!tableName || !Array.isArray(recordsToArchive) || recordsToArchive.length === 0) {
      return { success: false, message: 'Missing required parameters for bulk archiving' };
    }

    const { bulkArchiveRecords } = require('./archiveRecords');
    const result = await bulkArchiveRecords(tableName, recordsToArchive, archivedBy);

    return result;
  } catch (error) {
    console.error(`Error bulk archiving ${tableName} records:`, error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  archiveBeforeDelete,
  bulkArchiveBeforeDelete
};

