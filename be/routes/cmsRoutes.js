const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  saveCmsPage,
  getCmsPage,
  saveCmsImage,
  getCmsImage,
  getAllCmsImages,
  deleteCmsImage,
  base64ToBuffer,
  bufferToBase64
} = require('../dbHelpers/cmsRecords');

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST - Upload image to public folder
 * POST /api/cms/upload-image
 * MUST be before /:pageName routes to avoid being matched as a pageName
 */
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    
    const imageFile = req.file;
    const type = req.body.type || 'info';
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    const ext = path.extname(imageFile.originalname) || '.jpg';
    const filename = `cms_${type}_${timestamp}_${randomNum}${ext}`;
    
    // Save to frontend public/img folder (for Vite dev server and production)
    // Navigate from be/ to fe/public/img/
    const uploadDir = path.resolve(__dirname, '../../fe/public/img');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    
    // Write file from memory buffer
    fs.writeFileSync(filePath, imageFile.buffer);
    
    const imagePath = `/img/${filename}`;
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imagePath: imagePath
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to upload image' });
  }
});

/**
 * GET - Get CMS page data
 * GET /api/cms/:pageName
 */
router.get('/:pageName', async (req, res) => {
  try {
    const { pageName } = req.params;
    console.log(`[CMS] Loading page: ${pageName}`);
    
    const result = await getCmsPage(pageName);
    console.log(`[CMS] Load result for ${pageName}:`, result.success ? 'success' : result.message);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('[CMS] Error fetching CMS page:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch CMS page'
    });
  }
});

/**
 * POST/PUT - Save or update CMS page data
 * POST /api/cms/:pageName
 * PUT /api/cms/:pageName
 */
router.post('/:pageName', async (req, res) => {
  try {
    const { pageName } = req.params;
    const { content } = req.body;

    console.log(`[CMS] POST /cms/${pageName} - Saving page...`);
    console.log(`[CMS] Request body:`, JSON.stringify(req.body).substring(0, 500));

    if (!content) {
      console.error(`[CMS] No content provided for page: ${pageName}`);
      return res.status(400).json({
        success: false,
        error: 'Content data is required'
      });
    }

    console.log(`[CMS] Calling saveCmsPage for page: ${pageName}`);
    const startTime = Date.now();
    const result = await saveCmsPage(pageName, content);
    const duration = Date.now() - startTime;
    console.log(`[CMS] saveCmsPage completed in ${duration}ms`);
    console.log(`[CMS] saveCmsPage result:`, result);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('[CMS] Error saving CMS page:', error);
    console.error('[CMS] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save CMS page'
    });
  }
});

router.put('/:pageName', async (req, res) => {
  try {
    const { pageName } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content data is required'
      });
    }

    const result = await saveCmsPage(pageName, content);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error updating CMS page:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update CMS page'
    });
  }
});

/**
 * POST - Save CMS image (from base64)
 * POST /api/cms/:pageName/image/:fieldName
 */
router.post('/:pageName/image/:fieldName', async (req, res) => {
  try {
    const { pageName, fieldName } = req.params;
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Image base64 data is required'
      });
    }

    // Convert base64 to buffer
    const imageData = base64ToBuffer(imageBase64);
    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid base64 image data'
      });
    }

    const result = await saveCmsImage(
      pageName,
      fieldName,
      imageData.buffer,
      imageData.mimeType
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        imageId: result.imageId
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error saving CMS image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save CMS image'
    });
  }
});

/**
 * GET - Get CMS image (returns base64)
 * GET /api/cms/:pageName/image/:fieldName
 */
router.get('/:pageName/image/:fieldName', async (req, res) => {
  try {
    const { pageName, fieldName } = req.params;
    const result = await getCmsImage(pageName, fieldName);
    
    if (result.success && result.data) {
      // Convert buffer to base64
      const base64Data = bufferToBase64(
        result.data.imageBuffer,
        result.data.mimeType
      );
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          imageBase64: base64Data,
          mimeType: result.data.mimeType,
          imageId: result.data.imageId,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || 'Image not found',
        data: null
      });
    }
  } catch (error) {
    console.error('Error fetching CMS image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch CMS image'
    });
  }
});

/**
 * GET - Get all images for a page
 * GET /api/cms/:pageName/images
 */
router.get('/:pageName/images', async (req, res) => {
  try {
    const { pageName } = req.params;
    const result = await getAllCmsImages(pageName);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching CMS images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch CMS images'
    });
  }
});

/**
 * DELETE - Delete CMS image
 * DELETE /api/cms/:pageName/image/:fieldName
 */
router.delete('/:pageName/image/:fieldName', async (req, res) => {
  try {
    const { pageName, fieldName } = req.params;
    const result = await deleteCmsImage(pageName, fieldName);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error deleting CMS image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete CMS image'
    });
  }
});

/**
 * POST - Save CMS page with images (batch operation)
 * POST /api/cms/:pageName/save
 * This endpoint accepts content and images in one request
 */
router.post('/:pageName/save', async (req, res) => {
  try {
    // Log request size for debugging
    const contentLength = req.get('content-length');
    if (contentLength) {
      const sizeInMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2);
      console.log(`CMS Save Request Size: ${sizeInMB}MB (${contentLength} bytes)`);
      
      // Warn if approaching limit
      if (parseInt(contentLength) > 400 * 1024 * 1024) { // 400MB
        console.warn(`⚠️ Large CMS request detected: ${sizeInMB}MB - approaching 500MB limit`);
      }
    }
    
    const { pageName } = req.params;
    const { content, images } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content data is required'
      });
    }

    // Save page content
    const pageResult = await saveCmsPage(pageName, content);
    
    if (!pageResult.success) {
      return res.status(400).json({
        success: false,
        message: pageResult.message,
        error: pageResult.message
      });
    }

    // Save images if provided
    const imageResults = [];
    if (images && typeof images === 'object') {
      for (const [fieldName, imageBase64] of Object.entries(images)) {
        // Handle deletion: if imageBase64 is null, delete the image
        if (imageBase64 === null) {
          console.log(`Deleting ${fieldName} for page ${pageName}`);
          try {
            const deleteResult = await deleteCmsImage(pageName, fieldName);
            imageResults.push({
              fieldName,
              success: deleteResult.success,
              message: deleteResult.message || 'Image deleted successfully'
            });
            console.log(`Successfully deleted ${fieldName}:`, deleteResult.message);
            continue;
          } catch (deleteError) {
            console.error(`Error deleting ${fieldName}:`, deleteError);
            imageResults.push({
              fieldName,
              success: false,
              message: deleteError.message || 'Failed to delete image'
            });
            continue;
          }
        }
        
        if (imageBase64) {
          const isVideo = typeof imageBase64 === 'string' && imageBase64.startsWith('data:video/');
          console.log(`Processing ${isVideo ? 'video' : 'image'} ${fieldName} for page ${pageName}`, {
            dataLength: imageBase64.length,
            mimeType: imageBase64.substring(0, 50),
            isString: typeof imageBase64 === 'string',
            startsWithData: imageBase64.startsWith('data:')
          });
          
          const imageData = base64ToBuffer(imageBase64);
          if (!imageData) {
            console.error(`Failed to convert ${fieldName} to buffer - base64ToBuffer returned null`);
            imageResults.push({
              fieldName,
              success: false,
              message: 'Failed to convert to buffer'
            });
            continue;
          }
          
          if (imageData && imageData.buffer) {
            console.log(`Converted ${fieldName} to buffer:`, {
              bufferLength: imageData.buffer.length,
              mimeType: imageData.mimeType,
              isBuffer: Buffer.isBuffer(imageData.buffer)
            });
            try {
              console.log(`Calling saveCmsImage for ${fieldName} with buffer length: ${imageData.buffer.length}`);
              const imgResult = await saveCmsImage(
                pageName,
                fieldName,
                imageData.buffer,
                imageData.mimeType
              );
              
              console.log(`saveCmsImage result for ${fieldName}:`, {
                success: imgResult.success,
                message: imgResult.message,
                imageId: imgResult.imageId
              });
              
              // Verify the save by immediately retrieving it
              if (imgResult.success) {
                // Small delay to ensure database commit
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const verifyResult = await getCmsImage(pageName, fieldName);
                if (verifyResult.success && verifyResult.data) {
                  const savedSize = verifyResult.data.blobSize || (verifyResult.data.imageBuffer ? verifyResult.data.imageBuffer.length : 0);
                  const expectedSize = imageData.buffer.length;
                  const sizeMatch = savedSize === expectedSize;
                  
                  console.log(`Verification for ${fieldName}:`, {
                    expectedSize,
                    savedSize,
                    sizeMatch,
                    imageId: imgResult.imageId
                  });
                  
                  if (!sizeMatch) {
                    console.error(`WARNING: Size mismatch for ${fieldName}! Expected ${expectedSize} bytes, got ${savedSize} bytes`);
                    imageResults.push({
                      fieldName,
                      success: false,
                      message: `Size mismatch: expected ${expectedSize} bytes, got ${savedSize} bytes`
                    });
                    continue;
                  }
                }
              }
              
              imageResults.push({
                fieldName,
                success: imgResult.success,
                message: imgResult.message
              });
              console.log(`Successfully saved ${isVideo ? 'video' : 'image'} ${fieldName}:`, imgResult.message);
            } catch (imgError) {
              console.error(`Error saving ${isVideo ? 'video' : 'image'} ${fieldName}:`, imgError);
              imageResults.push({
                fieldName,
                success: false,
                message: imgError.message || `Failed to save ${isVideo ? 'video' : 'image'}`
              });
            }
          } else {
            console.error(`Failed to convert ${isVideo ? 'video' : 'image'} ${fieldName} to buffer`, {
              hasImageData: !!imageData,
              hasBuffer: imageData?.buffer ? true : false
            });
            imageResults.push({
              fieldName,
              success: false,
              message: `Failed to convert ${isVideo ? 'video' : 'image'} to buffer`
            });
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'CMS page and images saved successfully',
      data: {
        page: pageResult.data,
        images: imageResults
      }
    });
  } catch (error) {
    console.error('Error saving CMS page with images:', error);
    
    // Check if it's a payload too large error
    if (error.type === 'entity.too.large' || error.status === 413 || error.message?.includes('too large') || error.message?.includes('413')) {
      return res.status(413).json({
        success: false,
        error: 'Payload too large',
        message: 'The request payload is too large. Maximum size is 500MB. Please reduce the size of images/videos or split them into multiple requests.',
        suggestion: 'Try uploading images/videos one at a time, or compress them before uploading.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save CMS page'
    });
  }
});

/**
 * GET - Get CMS page with all images (combined)
 * GET /api/cms/:pageName/full
 */
router.get('/:pageName/full', async (req, res) => {
  try {
    const { pageName } = req.params;
    const { _t } = req.query; // Cache busting parameter

    // Get page content
    let pageResult;
    try {
      pageResult = await getCmsPage(pageName);
    } catch (dbError) {
      console.error(`Database error getting page ${pageName}:`, dbError.message);
      // Return default/empty data instead of crashing
      pageResult = {
        success: true,
        message: 'Page not found or database unavailable',
        data: null
      };
    }

    // Get all images
    let imagesResult;
    try {
      imagesResult = await getAllCmsImages(pageName);
    } catch (dbError) {
      console.error(`Database error getting images for ${pageName}:`, dbError.message);
      // Return empty images array instead of crashing
      imagesResult = {
        success: true,
        message: 'Images not available',
        data: []
      };
    }
    
    // Convert images to base64
    const imagesData = {};
    if (imagesResult.success && imagesResult.data && imagesResult.data.length > 0) {
      console.log(`Found ${imagesResult.data.length} image(s) for page ${pageName}:`, 
        imagesResult.data.map(img => img.fieldName));
      
      for (const imgInfo of imagesResult.data) {
        const imgResult = await getCmsImage(pageName, imgInfo.fieldName);
        if (imgResult.success && imgResult.data && imgResult.data.imageBuffer && imgResult.data.imageBuffer.length > 0) {
          const base64Data = bufferToBase64(
            imgResult.data.imageBuffer,
            imgResult.data.mimeType
          );
          imagesData[imgInfo.fieldName] = base64Data;
          
          // Log size for debugging
          if (imgInfo.fieldName === 'homeVideo') {
            console.log(`Retrieved ${imgInfo.fieldName} from database:`, {
              blobSize: imgResult.data.blobSize,
              bufferLength: imgResult.data.imageBuffer ? imgResult.data.imageBuffer.length : 0,
              base64Length: base64Data ? base64Data.length : 0,
              mimeType: imgResult.data.mimeType,
              updatedAt: imgResult.data.updatedAt
            });
          }
        } else {
          // Image was deleted or doesn't exist - explicitly exclude it
          console.log(`Image ${imgInfo.fieldName} not found, deleted, or empty for page ${pageName}`, {
            success: imgResult.success,
            hasData: !!imgResult.data,
            hasBuffer: !!(imgResult.data && imgResult.data.imageBuffer),
            bufferLength: imgResult.data && imgResult.data.imageBuffer ? imgResult.data.imageBuffer.length : 0
          });
          // DO NOT add to imagesData - this ensures deleted images are not returned
        }
      }
    } else {
      console.log(`No images found for page ${pageName}`, {
        success: imagesResult.success,
        dataLength: imagesResult.data ? imagesResult.data.length : 0
      });
    }
    
    // Log final images that will be returned
    console.log(`Returning ${Object.keys(imagesData).length} image(s) for page ${pageName}:`, Object.keys(imagesData));

    res.status(200).json({
      success: true,
      message: 'CMS page with images retrieved successfully',
      data: {
        page: pageResult.data,
        images: imagesData
      }
    });
  } catch (error) {
    console.error('Error fetching CMS page with images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch CMS page'
    });
  }
});

module.exports = router;
