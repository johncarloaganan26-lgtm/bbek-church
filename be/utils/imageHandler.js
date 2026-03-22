/**
 * Process image data from database
 * Handles both base64 strings and binary Buffers
 * @param {any} image - Image data from DB
 * @returns {String|null} Base64 data URL or null
 */
function processImage(image) {
  if (!image) return null;
  
  if (Buffer.isBuffer(image)) {
    // Check if the buffer contains a UTF-8 string that looks like a data URL
    const str = image.toString('utf8');
    if (str.startsWith('data:image/') || str.startsWith('data:video/')) {
      return str;
    }
    
    // Otherwise treat as raw binary data
    const base64 = image.toString('base64');
    let mimeType = 'image/jpeg';
    
    // Simple magic byte identification
    if (image.length > 4) {
      const hex = image.slice(0, 4).toString('hex').toLowerCase();
      if (hex.startsWith('89504e47')) mimeType = 'image/png';
      else if (hex.startsWith('47494638')) mimeType = 'image/gif';
      else if (hex.startsWith('ffd8ff')) mimeType = 'image/jpeg';
    }
    
    return `data:${mimeType};base64,${base64}`;
  }
  
  return image; // Already a string
}

module.exports = {
  processImage
};
