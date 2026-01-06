/**
 * Column Mapping for Archive Restoration
 * Maps old/archived column names to current table schema column names
 * This ensures compatibility when restoring records that may have been archived
 * with different column names than the current schema
 */

const columnMappings = {
  // tbl_members column mappings
  'tbl_members': {
    // If archived data has old column names, map them to current names
    // Example: 'member_fullname' -> 'firstname' (but we'll handle this differently)
    // Most mappings are 1:1, but we handle special cases here
  },

  // tbl_accounts column mappings
  'tbl_accounts': {
    // tbl_accounts doesn't have firstname/lastname, so no mapping needed
  },

  // Add mappings for other tables as needed
};

/**
 * Get the actual column names for a table
 * This function queries the database to get the current schema
 */
async function getTableColumns(tableName) {
  const { query } = require('../database/db');
  try {
    // Escape table name with backticks to handle special characters
    const sql = `DESCRIBE \`${tableName}\``;
    const [rows] = await query(sql);
    return rows.map(row => row.Field);
  } catch (error) {
    console.error(`Error getting columns for ${tableName}:`, error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return [];
  }
}

/**
 * Get column types for a table
 * This function queries the database to get the current schema with types
 */
async function getTableColumnsWithTypes(tableName) {
  const { query } = require('../database/db');
  try {
    // First, check if table exists and get database name
    const dbNameSql = `SELECT DATABASE() as db_name`;
    const [dbResult] = await query(dbNameSql);
    const dbName = dbResult[0]?.db_name;
    
    console.log(`Checking for table ${tableName} in database ${dbName}`);
    
    // Check if table exists (case-insensitive check)
    const checkTableSql = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND LOWER(TABLE_NAME) = LOWER(?)
    `;
    const [tableCheck] = await query(checkTableSql, [dbName, tableName]);
    
    if (!tableCheck || tableCheck.length === 0) {
      // List all tables to help debug
      const allTablesSql = `
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME LIKE '%burial%'
        ORDER BY TABLE_NAME
      `;
      const [allTables] = await query(allTablesSql, [dbName]);
      console.error(`Table ${tableName} does not exist in database ${dbName}.`);
      console.error(`Found burial-related tables:`, allTables.map(t => t.TABLE_NAME));
      return [];
    }
    
    // Use the actual table name from INFORMATION_SCHEMA (case-sensitive)
    const actualTableName = tableCheck[0].TABLE_NAME;
    console.log(`Found table: ${actualTableName} (requested: ${tableName})`);
    
    // Escape table name with backticks to handle special characters
    const sql = `DESCRIBE \`${actualTableName}\``;
    const [rows] = await query(sql);
    
    if (!rows || rows.length === 0) {
      console.error(`No columns found for table ${actualTableName}.`);
      return [];
    }
    
    console.log(`Successfully retrieved ${rows.length} columns for table ${actualTableName}`);
    
    return rows.map(row => {
      const typeValue = row.Type;
      return {
        name: row.Field,
        type: typeValue ? String(typeValue).toUpperCase() : '',
        null: row.Null === 'YES',
        default: row.Default
      };
    });
  } catch (error) {
    console.error(`Error getting columns with types for ${tableName}:`, error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: `DESCRIBE \`${tableName}\``
    });
    return [];
  }
}

/**
 * Convert value to MySQL-compatible format based on column type
 * @param {*} value - The value to convert
 * @param {String} columnType - MySQL column type (e.g., 'DATETIME', 'DATE', 'TIMESTAMP')
 * @returns {*} Converted value
 */
function convertValueForMySQL(value, columnType) {
  if (value === null || value === undefined) {
    return null;
  }

  // Handle datetime/timestamp fields
  if (columnType.includes('DATETIME') || columnType.includes('TIMESTAMP')) {
    if (typeof value === 'string') {
      // Remove extra quotes if present (e.g., '"2026-01-05T12:10:34.000Z"' -> '2026-01-05T12:10:34.000Z')
      let cleanedValue = value.trim();
      if ((cleanedValue.startsWith('"') && cleanedValue.endsWith('"')) || 
          (cleanedValue.startsWith("'") && cleanedValue.endsWith("'"))) {
        cleanedValue = cleanedValue.slice(1, -1);
      }
      
      const moment = require('moment');
      const date = moment(cleanedValue);
      if (date.isValid()) {
        return date.format('YYYY-MM-DD HH:mm:ss');
      }
      // If it's already in MySQL format, return as is
      return cleanedValue;
    } else if (value instanceof Date) {
      // Convert Date object to MySQL format
      const moment = require('moment');
      return moment(value).format('YYYY-MM-DD HH:mm:ss');
    }
  }

  // Handle date fields
  if (columnType.includes('DATE') && !columnType.includes('DATETIME') && !columnType.includes('TIMESTAMP')) {
    if (typeof value === 'string') {
      // Remove extra quotes if present
      let cleanedValue = value.trim();
      if ((cleanedValue.startsWith('"') && cleanedValue.endsWith('"')) || 
          (cleanedValue.startsWith("'") && cleanedValue.endsWith("'"))) {
        cleanedValue = cleanedValue.slice(1, -1);
      }
      
      const moment = require('moment');
      const date = moment(cleanedValue);
      if (date.isValid()) {
        return date.format('YYYY-MM-DD');
      }
      return cleanedValue;
    } else if (value instanceof Date) {
      const moment = require('moment');
      return moment(value).format('YYYY-MM-DD');
    }
  }

  // Return value as is for other types
  return value;
}

/**
 * Map archived data columns to current table schema
 * @param {String} tableName - Name of the table
 * @param {Object} archivedData - The archived data object
 * @returns {Object} Mapped data object with only valid columns
 */
async function mapArchivedDataToCurrentSchema(tableName, archivedData) {
  try {
    // Get current table columns with types
    const columnsWithTypes = await getTableColumnsWithTypes(tableName);
    
    if (columnsWithTypes.length === 0) {
      // Try alternative: use INFORMATION_SCHEMA as fallback
      console.warn(`DESCRIBE failed for ${tableName}, trying INFORMATION_SCHEMA...`);
      const { query } = require('../database/db');
      try {
        const infoSchemaSql = `
          SELECT COLUMN_NAME as Field, COLUMN_TYPE as Type, IS_NULLABLE as \`Null\`, COLUMN_DEFAULT as \`Default\`
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `;
        const [infoRows] = await query(infoSchemaSql, [tableName]);
        
        if (infoRows && infoRows.length > 0) {
          const mappedColumns = infoRows.map(row => {
            const typeValue = row.Type;
            return {
              name: row.Field,
              type: typeValue ? String(typeValue).toUpperCase() : '',
              null: row.Null === 'YES',
              default: row.Default
            };
          });
          console.log(`Successfully retrieved ${mappedColumns.length} columns for ${tableName} via INFORMATION_SCHEMA`);
          
          // Continue with mapped columns
          const validColumns = new Set(mappedColumns.map(col => col.name));
          const columnTypeMap = new Map(mappedColumns.map(col => [col.name, col.type]));
          
          const mappedData = {};
          for (const [key, value] of Object.entries(archivedData)) {
            if (validColumns.has(key)) {
              const columnType = columnTypeMap.get(key);
              mappedData[key] = convertValueForMySQL(value, columnType);
            } else {
              const mapping = columnMappings[tableName]?.[key];
              if (mapping && validColumns.has(mapping)) {
                const columnType = columnTypeMap.get(mapping);
                mappedData[mapping] = convertValueForMySQL(value, columnType);
              } else {
                console.warn(`Skipping column ${key} for table ${tableName} - not in current schema`);
              }
            }
          }
          return mappedData;
        }
      } catch (infoSchemaError) {
        console.error(`INFORMATION_SCHEMA query also failed for ${tableName}:`, infoSchemaError);
      }
      
      throw new Error(`Could not retrieve columns for table ${tableName}. Table may not exist or you may not have permission to access it.`);
    }

    // Create maps for fast lookup
    const validColumns = new Set(columnsWithTypes.map(col => col.name));
    const columnTypeMap = new Map(columnsWithTypes.map(col => [col.name, col.type]));
    
    // Filter and map the archived data
    const mappedData = {};
    
    for (const [key, value] of Object.entries(archivedData)) {
      // Check if the column exists in current schema
      if (validColumns.has(key)) {
        // Get column type and convert value if needed
        const columnType = columnTypeMap.get(key);
        mappedData[key] = convertValueForMySQL(value, columnType);
      } else {
        // Try to find a mapping
        const mapping = columnMappings[tableName]?.[key];
        if (mapping && validColumns.has(mapping)) {
          const columnType = columnTypeMap.get(mapping);
          mappedData[mapping] = convertValueForMySQL(value, columnType);
        } else {
          // Column doesn't exist and no mapping found - skip it
          console.warn(`Skipping column ${key} for table ${tableName} - not in current schema`);
        }
      }
    }

    return mappedData;
  } catch (error) {
    console.error(`Error mapping archived data for ${tableName}:`, error);
    throw error;
  }
}

module.exports = {
  getTableColumns,
  mapArchivedDataToCurrentSchema,
  columnMappings
};

