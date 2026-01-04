const fs = require('fs');
const csv = require('csv-parser');
const { Transform } = require('stream');

/**
 * CSV Parser Utility - Handles CSV parsing, validation, and processing
 * Provides streaming support for large files and batch processing capabilities
 */

/**
 * Parse CSV file with streaming support
 * @param {String} filePath - Path to CSV file
 * @param {Object} options - Options object
 * @param {Array} options.requiredFields - Required field names
 * @param {Function} options.validationFn - Custom validation function
 * @param {Function} options.transformFn - Optional transform function for each row
 * @param {Number} options.batchSize - Batch size for processing (default: 100)
 * @returns {Promise<Object>} Result object with rows and statistics
 */
async function parseCSVFile(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      requiredFields = [],
      validationFn = null,
      transformFn = null,
      batchSize = 100
    } = options;

    const rows = [];
    const errors = [];
    const stats = {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      headersParsed: false,
      parsedHeaders: []
    };

    let rowNumber = 1; // Start from 1 (header is row 0)
    let csvHeaders = null;

    // Create read stream
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' })
      .pipe(csv())
      .on('headers', (headers) => {
        csvHeaders = headers;
        stats.headersParsed = true;
        stats.parsedHeaders = headers;
      })
      .on('data', (data) => {
        rowNumber++;
        stats.totalRows++;

        // Check for required fields
        const requiredFieldErrors = [];
        for (const field of requiredFields) {
          if (!data[field] || data[field].trim() === '') {
            requiredFieldErrors.push(`Missing required field: ${field}`);
          }
        }

        // Run custom validation if provided
        let validationErrors = requiredFieldErrors;
        if (validationFn && typeof validationFn === 'function') {
          const customErrors = validationFn(data, rowNumber);
          validationErrors = [...validationErrors, ...customErrors];
        }

        // Transform data if function provided
        let transformedData = data;
        if (transformFn && typeof transformFn === 'function') {
          try {
            transformedData = transformFn(data, rowNumber);
          } catch (error) {
            validationErrors.push(`Transform error: ${error.message}`);
          }
        }

        // Add to rows or errors
        if (validationErrors.length === 0) {
          rows.push({
            rowNumber,
            data: transformedData,
            valid: true
          });
          stats.validRows++;
        } else {
          rows.push({
            rowNumber,
            data: transformedData,
            valid: false,
            errors: validationErrors
          });
          stats.invalidRows++;
          errors.push({
            rowNumber,
            errors: validationErrors,
            data: transformedData
          });
        }
      })
      .on('error', (error) => {
        reject({
          success: false,
          message: `CSV parsing error: ${error.message}`,
          error
        });
      })
      .on('end', () => {
        resolve({
          success: true,
          rows,
          errors,
          stats,
          headers: csvHeaders
        });
      });

    // Handle stream errors
    stream.on('error', (error) => {
      reject({
        success: false,
        message: `File stream error: ${error.message}`,
        error
      });
    });
  });
}

/**
 * Process rows in batches
 * @param {Array} rows - Array of rows to process
 * @param {Function} processFn - Function to process each batch
 * @param {Number} batchSize - Batch size (default: 100)
 * @returns {Promise<Object>} Result with processed batches and summary
 */
async function processBatches(rows, processFn, batchSize = 100) {
  if (!Array.isArray(rows)) {
    throw new Error('Rows must be an array');
  }

  if (typeof processFn !== 'function') {
    throw new Error('processFn must be a function');
  }

  const results = {
    processed: [],
    failed: [],
    summary: {
      total: rows.length,
      successCount: 0,
      failureCount: 0,
      batchCount: Math.ceil(rows.length / batchSize)
    }
  };

  // Process rows in batches
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    try {
      const batchResults = await processFn(batch);

      // Handle batch results
      if (Array.isArray(batchResults)) {
        batchResults.forEach((result) => {
          if (result.success) {
            results.processed.push(result);
            results.summary.successCount++;
          } else {
            results.failed.push(result);
            results.summary.failureCount++;
          }
        });
      }
    } catch (error) {
      // If entire batch fails, mark all rows as failed
      batch.forEach((row) => {
        results.failed.push({
          rowNumber: row.rowNumber,
          data: row.data,
          error: error.message,
          success: false
        });
        results.summary.failureCount++;
      });
    }
  }

  return results;
}

/**
 * Validate CSV headers against required headers
 * @param {Array} csvHeaders - Headers from CSV file
 * @param {Array} requiredHeaders - Required header names
 * @returns {Object} Validation result
 */
function validateHeaders(csvHeaders, requiredHeaders) {
  const result = {
    valid: true,
    missingHeaders: [],
    extraHeaders: []
  };

  // Check for required headers
  const csvHeadersLower = csvHeaders.map(h => h.toLowerCase());
  const requiredHeadersLower = requiredHeaders.map(h => h.toLowerCase());

  requiredHeadersLower.forEach((header) => {
    if (!csvHeadersLower.includes(header)) {
      result.valid = false;
      result.missingHeaders.push(header);
    }
  });

  // Optionally report extra headers
  csvHeadersLower.forEach((header) => {
    if (!requiredHeadersLower.includes(header)) {
      result.extraHeaders.push(header);
    }
  });

  return result;
}

/**
 * Calculate string similarity using Levenshtein distance
 * @param {String} str1 - First string
 * @param {String} str2 - Second string
 * @returns {Number} Similarity score (0-1, where 1 is identical)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  // Simple substring matching for common variations
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Check for common abbreviations
  const abbreviations = {
    'first': ['fname', 'first_name', '1st'],
    'last': ['lname', 'last_name', 'surname'],
    'birthdate': ['dob', 'birth_date', 'date_of_birth', 'birth'],
    'phone_number': ['phone', 'mobile', 'contact', 'tel'],
    'email': ['email_address', 'e-mail', 'mail'],
    'address': ['addr', 'location'],
    'gender': ['sex'],
    'age': ['age']
  };

  // Check if either string matches any abbreviation of the other
  for (const [full, abbrs] of Object.entries(abbreviations)) {
    if ((s1 === full && abbrs.some(abbr => s2.includes(abbr))) ||
        (s2 === full && abbrs.some(abbr => s1.includes(abbr)))) {
      return 0.9;
    }
  }

  // Levenshtein distance calculation
  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

/**
 * Auto-map CSV headers to database fields
 * @param {Array} csvHeaders - Array of CSV header names
 * @param {Object} fieldMappings - Object mapping database fields to possible variations
 * @returns {Object} Mapping object with suggested mappings and confidence scores
 */
function autoMapHeaders(csvHeaders, fieldMappings) {
  const mapping = {};
  const usedHeaders = new Set();

  // For each database field, find the best matching CSV header
  for (const [dbField, variations] of Object.entries(fieldMappings)) {
    let bestMatch = null;
    let bestScore = 0;

    for (const csvHeader of csvHeaders) {
      if (usedHeaders.has(csvHeader)) continue;

      // Check against all variations of this field
      for (const variation of variations) {
        const score = calculateSimilarity(csvHeader, variation);
        if (score > bestScore && score > 0.6) { // Minimum threshold
          bestMatch = csvHeader;
          bestScore = score;
        }
      }
    }

    if (bestMatch) {
      mapping[dbField] = {
        csvHeader: bestMatch,
        confidence: bestScore,
        autoMapped: true
      };
      usedHeaders.add(bestMatch);
    } else {
      mapping[dbField] = {
        csvHeader: null,
        confidence: 0,
        autoMapped: false
      };
    }
  }

  return {
    mapping,
    unmappedHeaders: csvHeaders.filter(header => !usedHeaders.has(header))
  };
}

/**
 * Get CSV headers only (for mapping preview)
 * @param {String} filePath - Path to CSV file
 * @returns {Promise<Object>} Result with headers and sample data
 */
async function getCSVHeaders(filePath) {
  return new Promise((resolve, reject) => {
    let headers = null;
    let sampleRows = [];
    let rowCount = 0;

    const stream = fs.createReadStream(filePath, { encoding: 'utf8' })
      .pipe(csv())
      .on('headers', (parsedHeaders) => {
        headers = parsedHeaders;
      })
      .on('data', (data) => {
        rowCount++;
        // Collect up to 3 sample rows for preview
        if (sampleRows.length < 3) {
          sampleRows.push(data);
        }
      })
      .on('error', (error) => {
        reject({
          success: false,
          message: `CSV parsing error: ${error.message}`,
          error
        });
      })
      .on('end', () => {
        resolve({
          success: true,
          headers,
          sampleRows,
          totalRows: rowCount
        });
      });

    stream.on('error', (error) => {
      reject({
        success: false,
        message: `File stream error: ${error.message}`,
        error
      });
    });
  });
}

/**
 * Get field mappings for member import
 * @returns {Object} Field mappings for member database fields
 */
function getMemberFieldMappings() {
  return {
    firstname: ['firstname', 'first_name', 'first name', 'fname', 'first', 'given name', 'given_name'],
    lastname: ['lastname', 'last_name', 'last name', 'lname', 'surname', 'family name', 'family_name'],
    middle_name: ['middle_name', 'middle name', 'middlename', 'mname', 'mi'],
    birthdate: ['birthdate', 'birth_date', 'birth date', 'dob', 'date of birth', 'date_of_birth', 'birthday'],
    age: ['age'],
    gender: ['gender', 'sex'],
    address: ['address', 'addr', 'location', 'home address', 'home_address'],
    email: ['email', 'email_address', 'email address', 'e-mail', 'mail'],
    phone_number: ['phone_number', 'phone number', 'phone', 'mobile', 'contact', 'telephone', 'tel'],
    civil_status: ['civil_status', 'civil status', 'marital status', 'marital_status', 'status'],
    guardian_name: ['guardian_name', 'guardian name', 'guardian', 'parent name', 'parent_name'],
    guardian_contact: ['guardian_contact', 'guardian contact', 'parent contact', 'parent_contact'],
    guardian_relationship: ['guardian_relationship', 'guardian relationship', 'relationship', 'relation']
  };
}

/**
 * Auto-map CSV headers for member import
 * @param {Array} csvHeaders - Array of CSV header names
 * @returns {Object} Mapping result with suggested mappings
 */
function autoMapMemberHeaders(csvHeaders) {
  const fieldMappings = getMemberFieldMappings();
  return autoMapHeaders(csvHeaders, fieldMappings);
}

/**
 * Sanitize and normalize CSV row data
 * @param {Object} row - Row data
 * @returns {Object} Sanitized row
 */
function sanitizeRow(row) {
  const sanitized = {};

  for (const [key, value] of Object.entries(row)) {
    // Trim string values
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  parseCSVFile,
  processBatches,
  validateHeaders,
  sanitizeRow,
  calculateSimilarity,
  autoMapHeaders,
  getCSVHeaders,
  getMemberFieldMappings,
  autoMapMemberHeaders
};
