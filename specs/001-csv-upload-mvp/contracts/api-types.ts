/**
 * TypeScript type definitions for Pollen CSV/Excel Upload API
 * Generated from OpenAPI 3.0 specification
 * 
 * @see api-spec.yaml for complete API documentation
 */

// ==================== Common Types ====================

export type UploadStatus = 'uploading' | 'processing' | 'completed' | 'failed';
export type OperationType = 'insert' | 'upsert' | 'delete' | 'drop' | 'truncate';
export type OperationStatus = 'success' | 'failed';
export type ColumnType = 'TEXT' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'BOOLEAN';

// ==================== Upload Flow Types ====================

export interface StartUploadRequest {
  filename: string;
  fileSizeBytes: number;
}

export interface StartUploadResponse {
  sessionId: string;
  status: 'uploading';
  uploadUrl: string;
}

export interface ChunkUploadResponse {
  sessionId: string;
  chunkIndex: number;
  totalChunks: number;
  progressPct: number;
}

export interface CompleteUploadResponse {
  sessionId: string;
  status: 'processing';
  message: string;
}

export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  nullable: boolean;
}

export interface SchemaPreview {
  sessionId: string;
  status: 'completed';
  filename: string;
  rowCount: number;
  columns: ColumnDefinition[];
  sampleRows: Record<string, any>[];
}

export interface PreviewProcessing {
  sessionId: string;
  status: 'processing';
  progressPct: number;
  message: string;
}

export interface CreateTableRequest {
  tableName: string;
  columnTypeOverrides?: Record<string, ColumnType>;
}

export interface CreateTableResponse {
  tableId: number;
  tableName: string;
  rowsInserted: number;
  sizeMb: number;
  message: string;
}

// ==================== Table Operations Types ====================

export interface TableMetadata {
  id: number;
  tableName: string;
  rowCount: number;
  sizeMb: number;
  lastUpdatedAt: string;
  createdAt: string;
}

export interface QuotaSummary {
  tablesUsed: number;
  tablesLimit: number;
  storageUsedMb: number;
  storageLimitMb: number;
  storageUsedPct: number;
}

export interface TableListResponse {
  tables: TableMetadata[];
  totalTables: number;
  totalSizeMb: number;
  quota: QuotaSummary;
}

export interface TablePreviewResponse {
  tableName: string;
  rowCount: number;
  columns: string[];
  rows: Record<string, any>[];
  previewLimit: number;
}

export interface ConfirmationRequest {
  confirmTableName: string;
}

export interface TruncateTableResponse {
  tableName: string;
  rowsDeleted: number;
  message: string;
}

export interface DropTableResponse {
  tableName: string;
  message: string;
}

// ==================== ETL Operations Types ====================

export interface InsertRequest {
  tableName: string;
  rows: Record<string, any>[];
}

export interface InsertResponse {
  operationId: number;
  tableName: string;
  rowsInserted: number;
  message: string;
}

export interface UpsertRequest {
  tableName: string;
  keyColumn: string;
  rows: Record<string, any>[];
}

export interface UpsertResponse {
  operationId: number;
  tableName: string;
  rowsUpdated: number;
  rowsInserted: number;
  rowsSkipped: number;
  message: string;
}

export interface DeleteRequest {
  tableName: string;
  idColumn: string;
  ids: string[];
}

export interface DeleteResponse {
  operationId: number;
  tableName: string;
  rowsDeleted: number;
  rowsNotFound: number;
  message: string;
}

export interface ETLOperationRecord {
  id: number;
  operationType: OperationType;
  tableName: string;
  status: OperationStatus;
  rowsAffected: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface ETLHistoryResponse {
  operations: ETLOperationRecord[];
  totalOperations: number;
}

// ==================== Storage Quota Types ====================

export interface QuotaResponse {
  userId: string;
  totalTables: number;
  totalSizeMb: number;
  limitMb: number;
  usedPct: number;
  tablesLimit: number;
  warning: string | null;
  lastCalculatedAt: string;
}

// ==================== Error Types ====================

export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, any>;
}

export type ErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'INVALID_TABLE_NAME'
  | 'KEY_COLUMN_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'TABLE_LIMIT_EXCEEDED'
  | 'SESSION_NOT_FOUND'
  | 'TABLE_NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'INTERNAL_SERVER_ERROR';

// ==================== API Client Types ====================

export interface APIClientConfig {
  baseUrl: string;
  authToken?: string;
}

export interface ChunkUploadParams {
  chunk: Blob;
  chunkIndex: number;
  totalChunks: number;
}

// ==================== Helper Types ====================

/**
 * Generic API response wrapper
 */
export type APIResponse<T> = Promise<T>;

/**
 * Generic error handler
 */
export type APIError = ErrorResponse;

/**
 * File upload progress callback
 */
export type UploadProgressCallback = (progressPct: number) => void;

/**
 * Polling interval for preview status (milliseconds)
 */
export const PREVIEW_POLL_INTERVAL_MS = 2000;

/**
 * Maximum file size (bytes)
 */
export const MAX_FILE_SIZE_BYTES = 52428800; // 50MB

/**
 * Free plan limits
 */
export const FREE_PLAN_LIMITS = {
  maxTables: 20,
  maxStorageMb: 1024,
  storageWarningThresholdPct: 80,
} as const;
