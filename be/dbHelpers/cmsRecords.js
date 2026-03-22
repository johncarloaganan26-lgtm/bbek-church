const { query } = require('../database/db');

/**
 * Get table name for a page
 * @param {String} pageName - Page name (e.g., 'home', 'about', 'header')
 * @returns {String} Table name
 */
function getTableName(pageName) {
  // Convert page name to table name format: tbl_cms_{pagename}
  const normalizedName = pageName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `tbl_cms_${normalizedName}`;
}

/**
 * CREATE/UPDATE - Save or update CMS page data
 * @param {String} pageName - Page name
 * @param {Object} contentData - Content data object
 * @returns {Promise<Object>} Result
 */
async function saveCmsPage(pageName, contentData) {
  try {
    if (!pageName) {
      return {
        success: false,
        message: 'Page name is required'
      };
    }

    const tableName = getTableName(pageName);
    
    // Check if record exists
    const checkSql = `SELECT id FROM ${tableName} WHERE page_name = ? LIMIT 1`;
    const [existingRows] = await query(checkSql, [pageName]);

    if (existingRows.length > 0) {
      // Update existing record
      const updateSql = `
        UPDATE ${tableName}
        SET content_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE page_name = ?
      `;
      await query(updateSql, [JSON.stringify(contentData), pageName]);
      
      return {
        success: true,
        message: 'CMS page updated successfully',
        data: contentData
      };
    } else {
      // Insert new record
      const insertSql = `
        INSERT INTO ${tableName} (page_name, content_json)
        VALUES (?, ?)
      `;
      await query(insertSql, [pageName, JSON.stringify(contentData)]);
      
      return {
        success: true,
        message: 'CMS page created successfully',
        data: contentData
      };
    }
  } catch (error) {
    console.error(`Error saving CMS page ${pageName}:`, error);
    throw error;
  }
}

/**
 * READ - Get CMS page data
 * @param {String} pageName - Page name
 * @returns {Promise<Object>} Page data
 */
async function getCmsPage(pageName) {
  try {
    if (!pageName) {
      return {
        success: false,
        message: 'Page name is required',
        data: null
      };
    }

    const tableName = getTableName(pageName);
    const sql = `SELECT * FROM ${tableName} WHERE page_name = ? LIMIT 1`;
    const [rows] = await query(sql, [pageName]);

    if (rows.length === 0) {
      return {
        success: true,
        message: 'CMS page not found',
        data: null
      };
    }

    const row = rows[0];
    let contentData = null;
    
    if (row.content_json) {
      try {
        contentData = typeof row.content_json === 'string' 
          ? JSON.parse(row.content_json) 
          : row.content_json;
      } catch (parseError) {
        console.error('Error parsing JSON content:', parseError);
        contentData = {};
      }
    }

    return {
      success: true,
      message: 'CMS page retrieved successfully',
      data: {
        id: row.id,
        page_name: row.page_name,
        content: contentData,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    };
  } catch (error) {
    console.error(`Error fetching CMS page ${pageName}:`, error);
    throw error;
  }
}

/**
 * Save image as BLOB
 * @param {String} pageName - Page name
 * @param {String} fieldName - Field name (e.g., 'logo', 'heroImage', 'visionImage')
 * @param {Buffer} imageBuffer - Image buffer
 * @param {String} mimeType - MIME type (e.g., 'image/jpeg', 'image/png')
 * @returns {Promise<Object>} Result
 */
async function saveCmsImage(pageName, fieldName, imageBuffer, mimeType = 'image/jpeg') {
  try {
    if (!pageName || !fieldName) {
      return {
        success: false,
        message: 'Page name and field name are required'
      };
    }

    // Validate imageBuffer
    if (!imageBuffer) {
      return {
        success: false,
        message: 'Image buffer is required'
      };
    }

    // Ensure imageBuffer is a Buffer
    let buffer = imageBuffer;
    if (!Buffer.isBuffer(imageBuffer)) {
      console.error(`saveCmsImage: imageBuffer is not a Buffer. Type: ${typeof imageBuffer}`);
      return {
        success: false,
        message: 'Image buffer must be a valid Buffer object'
      };
    }

    // Validate buffer has content
    if (buffer.length === 0) {
      console.error(`saveCmsImage: Buffer is empty`);
      return {
        success: false,
        message: 'Image buffer is empty'
      };
    }

    console.log(`saveCmsImage: Saving image for ${pageName}/${fieldName} - ${buffer.length} bytes, MIME: ${mimeType}`);

    // Check if image exists
    const checkSql = `
      SELECT image_id FROM tbl_cms_images 
      WHERE page_name = ? AND field_name = ? 
      LIMIT 1
    `;
    const [existingRows] = await query(checkSql, [pageName, fieldName]);

    if (existingRows.length > 0) {
      // For large files (>10MB), always use delete-and-re-insert for reliability
      // MySQL can have issues updating large LONGBLOB values
      const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB
      const isLargeFile = buffer.length > LARGE_FILE_THRESHOLD;
      const imageId = existingRows[0].image_id;
      
      if (isLargeFile) {
        // For large files, always delete and re-insert
        console.log(`saveCmsImage: Large file detected (${buffer.length} bytes), using delete-and-re-insert for ${pageName}/${fieldName}`);
        
        // Delete the existing record
        const deleteSql = `
          DELETE FROM tbl_cms_images
          WHERE page_name = ? AND field_name = ?
        `;
        await query(deleteSql, [pageName, fieldName]);
        
        // Insert new record
        const insertSql = `
          INSERT INTO tbl_cms_images (page_name, field_name, image_blob, mime_type)
          VALUES (?, ?, ?, ?)
        `;
        const [result] = await query(insertSql, [pageName, fieldName, buffer, mimeType]);
        
        console.log(`saveCmsImage: Re-inserted large file ${result.insertId} for ${pageName}/${fieldName}`);
        
        return {
          success: true,
          message: 'Image updated successfully (re-inserted)',
          imageId: result.insertId
        };
      } else {
        // For smaller files, try UPDATE first
        try {
          const updateSql = `
            UPDATE tbl_cms_images
            SET image_blob = ?, mime_type = ?, updated_at = CURRENT_TIMESTAMP
            WHERE page_name = ? AND field_name = ?
          `;
          const [updateResult] = await query(updateSql, [buffer, mimeType, pageName, fieldName]);
          
          // Verify the update was successful
          if (updateResult.affectedRows === 0) {
            throw new Error('UPDATE affected 0 rows');
          }
          
          // Verify the update by checking the blob size
          const verifySql = `
            SELECT LENGTH(image_blob) as blob_size, mime_type, updated_at
            FROM tbl_cms_images
            WHERE image_id = ?
          `;
          const [verifyRows] = await query(verifySql, [imageId]);
          
          if (verifyRows.length > 0) {
            const verifiedSize = verifyRows[0].blob_size;
            const sizesMatch = verifiedSize === buffer.length;
            
            console.log(`saveCmsImage: Updated image ${imageId} for ${pageName}/${fieldName}`, {
              expectedSize: buffer.length,
              actualSize: verifiedSize,
              mimeType: verifyRows[0].mime_type,
              updatedAt: verifyRows[0].updated_at,
              sizesMatch: sizesMatch
            });
            
            // If sizes don't match, delete and re-insert
            if (!sizesMatch) {
              console.warn(`saveCmsImage: Size mismatch detected! Expected ${buffer.length} bytes, got ${verifiedSize} bytes. Deleting and re-inserting...`);
              throw new Error('Size mismatch - will delete and re-insert');
            }
          }
          
          return {
            success: true,
            message: 'Image updated successfully',
            imageId: imageId
          };
        } catch (updateError) {
          // If update failed or size mismatch, delete and re-insert
          console.log(`saveCmsImage: Update failed or size mismatch, deleting and re-inserting for ${pageName}/${fieldName}`);
          
          // Delete the existing record
          const deleteSql = `
            DELETE FROM tbl_cms_images
            WHERE page_name = ? AND field_name = ?
          `;
          await query(deleteSql, [pageName, fieldName]);
          
          // Insert new record
          const insertSql = `
            INSERT INTO tbl_cms_images (page_name, field_name, image_blob, mime_type)
            VALUES (?, ?, ?, ?)
          `;
          const [result] = await query(insertSql, [pageName, fieldName, buffer, mimeType]);
          
          console.log(`saveCmsImage: Re-inserted image ${result.insertId} for ${pageName}/${fieldName} after update failure`);
          
          return {
            success: true,
            message: 'Image updated successfully (re-inserted)',
            imageId: result.insertId
          };
        }
      }
    } else {
      // Insert new image
      const insertSql = `
        INSERT INTO tbl_cms_images (page_name, field_name, image_blob, mime_type)
        VALUES (?, ?, ?, ?)
      `;
      const [result] = await query(insertSql, [pageName, fieldName, buffer, mimeType]);
      
      console.log(`saveCmsImage: Inserted new image ${result.insertId} for ${pageName}/${fieldName}`);
      
      return {
        success: true,
        message: 'Image saved successfully',
        imageId: result.insertId
      };
    }
  } catch (error) {
    console.error(`Error saving CMS image for ${pageName}/${fieldName}:`, error);
    console.error('Error details:', {
      pageName,
      fieldName,
      bufferType: typeof imageBuffer,
      isBuffer: Buffer.isBuffer(imageBuffer),
      bufferLength: Buffer.isBuffer(imageBuffer) ? imageBuffer.length : 'N/A',
      mimeType
    });
    throw error;
  }
}

/**
 * Get image as BLOB
 * @param {String} pageName - Page name
 * @param {String} fieldName - Field name
 * @returns {Promise<Object>} Image data
 */
async function getCmsImage(pageName, fieldName) {
  try {
    if (!pageName || !fieldName) {
      return {
        success: false,
        message: 'Page name and field name are required',
        data: null
      };
    }

    const sql = `
      SELECT image_id, image_blob, mime_type, created_at, updated_at,
             LENGTH(image_blob) as blob_size
      FROM tbl_cms_images
      WHERE page_name = ? AND field_name = ?
      LIMIT 1
    `;
    const [rows] = await query(sql, [pageName, fieldName]);

    if (rows.length === 0) {
      return {
        success: true,
        message: 'Image not found',
        data: null
      };
    }

    const row = rows[0];
    
    // Verify the blob is actually a Buffer
    let imageBuffer = row.image_blob;
    if (!Buffer.isBuffer(imageBuffer) && imageBuffer) {
      // If it's not a buffer, try to convert it
      if (typeof imageBuffer === 'string') {
        imageBuffer = Buffer.from(imageBuffer, 'binary');
      } else if (imageBuffer instanceof Array) {
        imageBuffer = Buffer.from(imageBuffer);
      }
    }

    console.log(`getCmsImage: Retrieved image for ${pageName}/${fieldName} - ${imageBuffer ? imageBuffer.length : 0} bytes, DB size: ${row.blob_size}`);

    return {
      success: true,
      message: 'Image retrieved successfully',
      data: {
        imageId: row.image_id,
        imageBuffer: imageBuffer,
        mimeType: row.mime_type,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        blobSize: row.blob_size
      }
    };
  } catch (error) {
    console.error(`Error fetching CMS image for ${pageName}/${fieldName}:`, error);
    throw error;
  }
}

/**
 * Get all images for a page
 * @param {String} pageName - Page name
 * @returns {Promise<Object>} All images for the page
 */
async function getAllCmsImages(pageName) {
  try {
    if (!pageName) {
      return {
        success: false,
        message: 'Page name is required',
        data: []
      };
    }

    const sql = `
      SELECT image_id, field_name, mime_type, image_blob, created_at, updated_at
      FROM tbl_cms_images
      WHERE page_name = ?
      ORDER BY field_name
    `;
    const [rows] = await query(sql, [pageName]);

    return {
      success: true,
      message: 'Images retrieved successfully',
      data: rows.map(row => ({
        imageId: row.image_id,
        fieldName: row.field_name,
        mimeType: row.mime_type,
        imageBuffer: row.image_blob,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    };
  } catch (error) {
    console.error(`Error fetching all CMS images for ${pageName}:`, error);
    throw error;
  }
}

/**
 * Delete image
 * @param {String} pageName - Page name
 * @param {String} fieldName - Field name
 * @returns {Promise<Object>} Result
 */
async function deleteCmsImage(pageName, fieldName) {
  try {
    if (!pageName || !fieldName) {
      return {
        success: false,
        message: 'Page name and field name are required'
      };
    }

    const sql = `
      DELETE FROM tbl_cms_images
      WHERE page_name = ? AND field_name = ?
    `;
    await query(sql, [pageName, fieldName]);

    return {
      success: true,
      message: 'Image deleted successfully'
    };
  } catch (error) {
    console.error(`Error deleting CMS image for ${pageName}/${fieldName}:`, error);
    throw error;
  }
}

/**
 * Convert base64 image to buffer
 * Supports: base64 string with or without data URL prefix
 * @param {String} base64String - Base64 encoded image string
 * @returns {Object} Buffer and MIME type, or null if conversion fails
 */
function base64ToBuffer(base64String) {
  try {
    if (!base64String || typeof base64String !== 'string') {
      console.error('base64ToBuffer: Invalid input - not a string or empty');
      return null;
    }

    // Extract MIME type from data URL if present
    let mimeType = 'image/jpeg'; // default
    let base64Data = base64String;

    // Check if it's a data URL (e.g., "data:image/jpeg;base64,/9j/4AAQ..." or "data:video/mp4;base64,...")
    if (base64String.includes(',')) {
      const parts = base64String.split(',');
      const prefix = parts[0];
      base64Data = parts[1];

      // Extract MIME type from prefix (supports both image and video)
      const imageMatch = prefix.match(/data:image\/([^;]+)/);
      const videoMatch = prefix.match(/data:video\/([^;]+)/);
      
      if (imageMatch) {
        mimeType = `image/${imageMatch[1]}`;
      } else if (videoMatch) {
        mimeType = `video/${videoMatch[1]}`;
      }
    } else {
      // If no data URL prefix, try to detect from base64 content or default to jpeg
      // For now, we'll default to jpeg
      mimeType = 'image/jpeg';
    }

    // Validate base64 string (remove whitespace)
    base64Data = base64Data.trim().replace(/\s/g, '');

    if (!base64Data || base64Data.length === 0) {
      console.error('base64ToBuffer: Empty base64 data after processing');
      return null;
    }

    // Convert to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate buffer was created successfully
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      console.error('base64ToBuffer: Failed to create valid buffer');
      return null;
    }

    console.log(`base64ToBuffer: Successfully converted to buffer - ${buffer.length} bytes, MIME: ${mimeType}`);
    return { buffer, mimeType };
  } catch (error) {
    console.error('Error converting base64 to buffer:', error);
    console.error('Input length:', base64String ? base64String.length : 0);
    return null;
  }
}

/**
 * Convert buffer to base64 data URL
 * @param {Buffer} buffer - Image buffer
 * @param {String} mimeType - MIME type
 * @returns {String} Base64 data URL
 */
function bufferToBase64(buffer, mimeType = 'image/jpeg') {
  if (!buffer) {
    return null;
  }
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

module.exports = {
  saveCmsPage,
  getCmsPage,
  saveCmsImage,
  getCmsImage,
  getAllCmsImages,
  deleteCmsImage,
  base64ToBuffer,
  bufferToBase64,
  getTableName
};

