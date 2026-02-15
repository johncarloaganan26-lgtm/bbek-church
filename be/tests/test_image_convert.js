// Debug script for convertImageToBlob function - FIXED VERSION
const fs = require('fs');

// Copy the FIXED convertImageToBlob function
function convertImageToBlob(imageInput) {
  try {
    console.log('=== convertImageToBlob called ===');
    console.log('imageInput type:', typeof imageInput);
    console.log('imageInput value:', imageInput ? imageInput.substring(0, 100) + '...' : 'null');
    
    // If null or undefined, return null
    if (!imageInput) {
      console.log('Step 1: imageInput is falsy, returning null');
      return null;
    }

    // If already a Buffer, return it
    if (Buffer.isBuffer(imageInput)) {
      console.log('Step 2: imageInput is Buffer, returning it');
      return imageInput;
    }

    // If it's a file object from multer (has buffer property)
    if (imageInput.buffer && Buffer.isBuffer(imageInput.buffer)) {
      console.log('Step 3: imageInput has buffer property, returning buffer');
      return imageInput.buffer;
    }

    // If it's a base64 DATA URL (starts with 'data:') - check this BEFORE file path check
    if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
      console.log('Step 4: Detected data URL');
      // Extract the base64 part from data URL
      const hasPrefix = imageInput.includes(',');
      console.log('Step 4a: hasPrefix:', hasPrefix);
      
      const base64Data = hasPrefix 
        ? imageInput.split(',')[1] 
        : imageInput;
      
      console.log('Step 4b: base64Data length:', base64Data.length);
      console.log('Step 4c: base64Data first 50 chars:', base64Data.substring(0, 50));
      
      // Check if base64Data is valid
      const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(base64Data.trim());
      console.log('Step 4d: isValidBase64:', isValidBase64);
      
      try {
        // Convert base64 to Buffer
        const buffer = Buffer.from(base64Data, 'base64');
        console.log('Step 4e: buffer created, length:', buffer.length);
        return buffer;
      } catch (error) {
        console.error('Step 4f: Buffer.from error:', error.message);
        throw new Error('Failed to convert base64 to buffer: ' + error.message);
      }
    }

    // If it's a file path (string starting with / or containing path separators)
    const isFilePath = typeof imageInput === 'string' && (imageInput.startsWith('/') || imageInput.includes('\\') || imageInput.includes('/'));
    console.log('Step 5: isFilePath:', isFilePath);
    if (isFilePath) {
      console.log('Step 5a: Checking if file exists');
      if (fs.existsSync(imageInput)) {
        console.log('Step 5b: File exists, reading file');
        return fs.readFileSync(imageInput);
      }
      console.log('Step 5c: File does not exist, returning null');
      return null;
    }

    // If it's a plain base64 string (no data URL prefix, no path separators)
    if (typeof imageInput === 'string') {
      console.log('Step 6: Processing as plain base64');
      // Remove any data URL prefix if present
      const hasPrefix = imageInput.includes(',');
      const base64Data = hasPrefix 
        ? imageInput.split(',')[1] 
        : imageInput;
      
      console.log('Step 6a: base64Data length:', base64Data.length);
      console.log('Step 6b: base64Data first 50 chars:', base64Data.substring(0, 50));
      
      // Check if base64Data is valid
      const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(base64Data.trim());
      console.log('Step 6c: isValidBase64:', isValidBase64);
      
      try {
        // Convert base64 to Buffer
        const buffer = Buffer.from(base64Data, 'base64');
        console.log('Step 6d: buffer created, length:', buffer.length);
        return buffer;
      } catch (error) {
        console.error('Step 6e: Buffer.from error:', error.message);
        throw new Error('Failed to convert base64 to buffer: ' + error.message);
      }
    }

    console.log('Step 7: Reached end, returning null');
    return null;
  } catch (error) {
    console.error('=== convertImageToBlob error ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Test with a sample base64 string (a small 1x1 red pixel PNG)
const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

console.log('\n\n=== TEST 1: Valid base64 with data URL prefix ===');
const result1 = convertImageToBlob(sampleBase64);
console.log('Result:', result1 ? `${result1.length} bytes ✓ SUCCESS` : 'null ✗ FAILED');

console.log('\n\n=== TEST 2: Raw base64 (no prefix) ===');
const rawBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const result2 = convertImageToBlob(rawBase64);
console.log('Result:', result2 ? `${result2.length} bytes ✓ SUCCESS` : 'null ✗ FAILED');

console.log('\n\n=== TEST 3: Invalid base64 ===');
const invalidBase64 = 'not-valid-base64!!!';
const result3 = convertImageToBlob(invalidBase64);
console.log('Result:', result3 ? `${result3.length} bytes (converted but invalid)` : 'null');

console.log('\n\n=== TEST 4: null value ===');
const result4 = convertImageToBlob(null);
console.log('Result:', result4 === null ? 'null ✓ SUCCESS' : 'unexpected');

console.log('\n\n=== TEST 5: Empty string ===');
const result5 = convertImageToBlob('');
console.log('Result:', result5 === null ? 'null ✓ SUCCESS' : 'unexpected');
