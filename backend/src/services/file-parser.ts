/**
 * File parser service for CSV and Excel files.
 * Supports type inference from 1000-row sampling and streaming.
 */

import * as fs from 'fs';
import * as Papa from 'papaparse';
import * as ExcelJS from 'exceljs';
import * as log from './log';

export type ColumnType = 'TEXT' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'BOOLEAN';

export interface Column {
  name: string;
  type: ColumnType;
  nullable: boolean;
}

export interface ParsedRow {
  [columnName: string]: any;
}

export interface ParseOptions {
  onRow: (row: ParsedRow, rowIndex: number) => void | Promise<void>;
  onComplete: (totalRows: number) => void;
  onError: (error: Error) => void;
  sampleSize?: number; // Number of rows to sample for type inference
  sheet?: string; // Excel sheet name to parse (defaults to first)
}

/**
 * Infer PostgreSQL type from sample values.
 */
function inferType(values: any[]): ColumnType {
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
export function inferTypes(sampleRows: ParsedRow[]): Column[] {
  if (sampleRows.length === 0) {
    return [];
  }

  const columnNames = Object.keys(sampleRows[0]);
  const columns: Column[] = [];

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
export async function parseCSV(filePath: string, options: ParseOptions): Promise<Column[]> {
  const { onRow, onComplete, onError, sampleSize = 1000 } = options;

  return new Promise((resolve, reject) => {
    const sampleRows: ParsedRow[] = [];
    let rowIndex = 0;
    let columns: Column[] = [];

    const stream = fs.createReadStream(filePath);

    Papa.parse(stream, {
      header: true, // First row is column names
      skipEmptyLines: true,
      dynamicTyping: false, // Keep all values as strings for type inference
      step: async (result) => {
        try {
          const row = result.data as ParsedRow;

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
        } catch (error) {
          onError(error as Error);
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
export async function parseExcel(filePath: string, options: ParseOptions): Promise<Column[]> {
  const { onRow, onComplete, onError, sampleSize = 1000, sheet } = options;

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // Get worksheet by name or first
    let worksheet = workbook.worksheets[0];
    if (sheet) {
      const found = workbook.worksheets.find((ws) => ws.name === sheet);
      if (found) worksheet = found;
    }

    if (!worksheet) {
      throw new Error('Excel file has no worksheets');
    }

    // Get column names from first row
    const headerRow = worksheet.getRow(1);
    const columnNames: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      columnNames[colNumber - 1] = String(cell.value || `Column${colNumber}`);
    });

    const sampleRows: ParsedRow[] = [];
    let rowIndex = 0;

    // Iterate through data rows
    worksheet.eachRow(async (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      const parsedRow: ParsedRow = {};
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
      } catch (error) {
        onError(error as Error);
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
  } catch (error) {
    log.error('Failed to parse Excel file', {
      filePath,
      error: (error as Error).message,
    });
    onError(error as Error);
    throw error;
  }
}

/**
 * Parse a file (auto-detect CSV or Excel based on extension).
 */
export async function parseFile(filePath: string, options: ParseOptions): Promise<Column[]> {
  const extension = filePath.toLowerCase().split('.').pop();

  if (extension === 'csv') {
    return parseCSV(filePath, options);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(filePath, options);
  } else {
    throw new Error(`Unsupported file extension: ${extension}`);
  }
}

/**
 * Generate PostgreSQL column definition from Column.
 */
export function generateColumnDefinition(column: Column): string {
  const nullConstraint = column.nullable ? '' : ' NOT NULL';
  return `"${column.name}" ${column.type}${nullConstraint}`;
}

/**
 * Generate CREATE TABLE statement from columns.
 */
export function generateCreateTableSQL(tableName: string, columns: Column[]): string {
  const columnDefs = columns.map(generateColumnDefinition).join(',\n  ');
  return `CREATE TABLE "${tableName}" (\n  ${columnDefs}\n)`;
}
