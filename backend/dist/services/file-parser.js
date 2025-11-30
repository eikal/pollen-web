"use strict";
/**
 * File parser service for CSV and Excel files.
 * Supports type inference from 1000-row sampling and streaming.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferTypes = inferTypes;
exports.parseCSV = parseCSV;
exports.parseExcel = parseExcel;
exports.parseFile = parseFile;
exports.generateColumnDefinition = generateColumnDefinition;
exports.generateCreateTableSQL = generateCreateTableSQL;
const fs = __importStar(require("fs"));
const Papa = __importStar(require("papaparse"));
const ExcelJS = __importStar(require("exceljs"));
const log = __importStar(require("./log"));
/**
 * Infer PostgreSQL type from sample values.
 */
function inferType(values) {
    // Filter out null/undefined/empty values for type inference
    const nonEmptyValues = values.filter((v) => v !== null && v !== undefined && v !== '');
    if (nonEmptyValues.length === 0) {
        return 'TEXT'; // Default to TEXT if all values are empty
    }
    // Check if all values are booleans
    const booleanPattern = /^(true|false|yes|no|1|0)$/i;
    const allBoolean = nonEmptyValues.every((v) => booleanPattern.test(String(v)));
    if (allBoolean) {
        return 'BOOLEAN';
    }
    // Check if all values are integers
    const integerPattern = /^-?\d+$/;
    const allInteger = nonEmptyValues.every((v) => integerPattern.test(String(v)));
    if (allInteger) {
        return 'INTEGER';
    }
    // Check if all values are decimals
    const decimalPattern = /^-?\d+\.?\d*$/;
    const allDecimal = nonEmptyValues.every((v) => decimalPattern.test(String(v)));
    if (allDecimal) {
        return 'DECIMAL';
    }
    // Check if all values are dates (ISO format or common patterns)
    const datePattern = /^\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}/;
    const allDate = nonEmptyValues.every((v) => {
        const str = String(v);
        return datePattern.test(str) && !isNaN(Date.parse(str));
    });
    if (allDate) {
        return 'DATE';
    }
    // Default to TEXT
    return 'TEXT';
}
/**
 * Infer column types from sample rows.
 */
function inferTypes(sampleRows) {
    if (sampleRows.length === 0) {
        return [];
    }
    const columnNames = Object.keys(sampleRows[0]);
    const columns = [];
    for (const name of columnNames) {
        const values = sampleRows.map((row) => row[name]);
        const type = inferType(values);
        // Check if column has any null/empty values
        const hasNulls = values.some((v) => v === null || v === undefined || v === '');
        columns.push({
            name,
            type,
            nullable: hasNulls,
        });
    }
    return columns;
}
/**
 * Parse CSV file with streaming and type inference.
 */
async function parseCSV(filePath, options) {
    const { onRow, onComplete, onError, sampleSize = 1000 } = options;
    return new Promise((resolve, reject) => {
        const sampleRows = [];
        let rowIndex = 0;
        let columns = [];
        const stream = fs.createReadStream(filePath);
        Papa.parse(stream, {
            header: true, // First row is column names
            skipEmptyLines: true,
            dynamicTyping: false, // Keep all values as strings for type inference
            step: async (result) => {
                try {
                    const row = result.data;
                    // Collect sample rows for type inference
                    if (rowIndex < sampleSize) {
                        sampleRows.push(row);
                        // Infer types after collecting sample
                        if (rowIndex === sampleSize - 1) {
                            columns = inferTypes(sampleRows);
                            log.info('Inferred column types from CSV', {
                                filePath,
                                sampleSize,
                                columns: columns.map((c) => `${c.name}:${c.type}`),
                            });
                        }
                    }
                    // Call row handler
                    await onRow(row, rowIndex);
                    rowIndex++;
                }
                catch (error) {
                    onError(error);
                    stream.destroy();
                }
            },
            complete: () => {
                // Final type inference if we have fewer rows than sample size
                if (sampleRows.length > 0 && columns.length === 0) {
                    columns = inferTypes(sampleRows);
                    log.info('Inferred column types from CSV', {
                        filePath,
                        sampleSize: sampleRows.length,
                        columns: columns.map((c) => `${c.name}:${c.type}`),
                    });
                }
                onComplete(rowIndex);
                resolve(columns);
            },
            error: (error) => {
                onError(error);
                reject(error);
            },
        });
    });
}
/**
 * Parse Excel file (first sheet only) with type inference.
 * Note: Excel parsing is not streaming due to library limitations.
 */
async function parseExcel(filePath, options) {
    const { onRow, onComplete, onError, sampleSize = 1000, sheet } = options;
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        // Get worksheet by name or first
        let worksheet = workbook.worksheets[0];
        if (sheet) {
            const found = workbook.worksheets.find((ws) => ws.name === sheet);
            if (found)
                worksheet = found;
        }
        if (!worksheet) {
            throw new Error('Excel file has no worksheets');
        }
        // Get column names from first row
        const headerRow = worksheet.getRow(1);
        const columnNames = [];
        headerRow.eachCell((cell, colNumber) => {
            columnNames[colNumber - 1] = String(cell.value || `Column${colNumber}`);
        });
        const sampleRows = [];
        let rowIndex = 0;
        // Iterate through data rows
        worksheet.eachRow(async (row, rowNumber) => {
            if (rowNumber === 1)
                return; // Skip header row
            const parsedRow = {};
            row.eachCell((cell, colNumber) => {
                const columnName = columnNames[colNumber - 1];
                parsedRow[columnName] = cell.value;
            });
            // Collect sample rows
            if (rowIndex < sampleSize) {
                sampleRows.push(parsedRow);
            }
            // Call row handler
            try {
                await onRow(parsedRow, rowIndex);
                rowIndex++;
            }
            catch (error) {
                onError(error);
                throw error;
            }
        });
        // Infer types from sample
        const columns = inferTypes(sampleRows);
        log.info('Inferred column types from Excel', {
            filePath,
            sampleSize: sampleRows.length,
            columns: columns.map((c) => `${c.name}:${c.type}`),
        });
        onComplete(rowIndex);
        return columns;
    }
    catch (error) {
        log.error('Failed to parse Excel file', {
            filePath,
            error: error.message,
        });
        onError(error);
        throw error;
    }
}
/**
 * Parse a file (auto-detect CSV or Excel based on extension).
 */
async function parseFile(filePath, options) {
    const extension = filePath.toLowerCase().split('.').pop();
    if (extension === 'csv') {
        return parseCSV(filePath, options);
    }
    else if (extension === 'xlsx' || extension === 'xls') {
        return parseExcel(filePath, options);
    }
    else {
        throw new Error(`Unsupported file extension: ${extension}`);
    }
}
/**
 * Generate PostgreSQL column definition from Column.
 */
function generateColumnDefinition(column) {
    const nullConstraint = column.nullable ? '' : ' NOT NULL';
    return `"${column.name}" ${column.type}${nullConstraint}`;
}
/**
 * Generate CREATE TABLE statement from columns.
 */
function generateCreateTableSQL(tableName, columns) {
    const columnDefs = columns.map(generateColumnDefinition).join(',\n  ');
    return `CREATE TABLE "${tableName}" (\n  ${columnDefs}\n)`;
}
