# Data Model: CSV/Excel Upload to PostgreSQL (Phase 1 MVP)

**Feature ID**: 002-csv-upload-mvp  
**Phase**: MVP - Direct data upload and table management  
**Created**: 2025-11-28  
**Last Updated**: 2025-11-29  
**Status**: Active Development

---

## Overview

This document defines the data model for the MVP CSV/Excel file upload service. The system provides multi-tenant data storage using PostgreSQL schema isolation, where each user gets a dedicated schema (e.g., `user123`) within a shared database instance. All user-created tables reside in their isolated schema, while metadata tables (tracking, quotas, audit logs) reside in the `public` schema.

**Core Capabilities**:
- File upload (CSV/Excel) with automatic table creation
- ETL operations: INSERT, UPSERT, DELETE, DROP, TRUNCATE
- Storage quota enforcement (1GB limit, 20 table max for free plan)
- Operation audit logging
- Upload session tracking

---

## Architecture Principles

### Multi-Tenancy Strategy
- **Per-user schema isolation**: Each user gets a Postgres schema (namespace) created on first upload
- **Metadata in public schema**: All tracking tables remain in `public` with `user_id` foreign keys
- **Connection-level enforcement**: `SET search_path TO user123, public` prevents cross-user access
- **No shared tables**: Zero risk of data leakage between users

### Storage Management
- **Pessimistic locking**: Advisory locks prevent quota race conditions during concurrent uploads
- **Lazy recalculation**: Quota updated after successful operations + background reconciliation every 5 minutes
- **Pre-flight checks**: Upload blocked before processing if quota exceeded

### Data Flow
```
User Upload → Temp Storage → Type Inference (1000 rows) → Schema Creation (if new user) 
  → Table Creation → Data Load (batched) → Metadata Update → Temp File Cleanup
```

---

## Entity Definitions

### 1. User Schema
**Type**: PostgreSQL schema (namespace)  
**Naming**: `user{user_id}` (e.g., `user123abc...` truncated to 63 chars max)  
**Lifecycle**: Created on first upload, persists indefinitely (soft-delete future)

**Purpose**: Isolate all tables owned by a single user from other users in shared database.

**Creation Logic**:
```sql
CREATE SCHEMA IF NOT EXISTS user123 AUTHORIZATION app_role;
GRANT USAGE ON SCHEMA user123 TO app_role;
```

**Access Control**: Application role has ownership; users never get direct database credentials.

---

### 2. User Table Metadata
**Table**: `public.user_tables`  
**Purpose**: Track metadata for all user-created tables (row counts, sizes, timestamps)

**Schema**:
```sql
CREATE TABLE user_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schema_name VARCHAR(63) NOT NULL,
    table_name VARCHAR(63) NOT NULL,
    row_count BIGINT DEFAULT 0,
    size_mb DECIMAL(10,2) DEFAULT 0.0,
    last_updated_at TIMESTAMP DEFAULT now(),
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(schema_name, table_name)
);
```

**Field Descriptions**:
- `id`: Unique identifier for metadata record
- `user_id`: Foreign key to `users.id` (owner of table)
- `schema_name`: User's schema (e.g., `user123`)
- `table_name`: Name of table within schema (e.g., `sales_data`)
- `row_count`: Cached row count (updated on insert/upsert/delete/truncate)
- `size_mb`: Table size in MB via `pg_total_relation_size()` (updated post-operation)
- `last_updated_at`: Auto-updated on any metadata change
- `created_at`: Table creation timestamp

**Indexes**:
```sql
CREATE INDEX idx_user_tables_user_id ON user_tables(user_id);
CREATE INDEX idx_user_tables_last_updated ON user_tables(last_updated_at DESC);
```

**Lifecycle**:
- Created on first INSERT operation
- Updated on UPSERT/DELETE/TRUNCATE operations
- Deleted on DROP TABLE operation

---

### 3. ETL Operation Audit Log
**Table**: `public.etl_operations`  
**Purpose**: Comprehensive audit trail for all data operations (90-day retention)

**Schema**:
```sql
CREATE TABLE etl_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN 
        ('insert', 'upsert', 'delete', 'drop', 'truncate')),
    table_name VARCHAR(63) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
    rows_affected INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT now()
);
```

**Field Descriptions**:
- `id`: Unique operation identifier
- `user_id`: User who initiated operation
- `operation_type`: One of: `insert`, `upsert`, `delete`, `drop`, `truncate`
- `table_name`: Target table (schema-qualified in logs, e.g., `user123.sales`)
- `status`: `success` or `failed`
- `rows_affected`: Number of rows inserted/updated/deleted (0 for drop/truncate)
- `error_message`: User-friendly error message if `status = failed`
- `created_at`: Operation timestamp

**Indexes**:
```sql
CREATE INDEX idx_etl_operations_user_id ON etl_operations(user_id, created_at DESC);
CREATE INDEX idx_etl_operations_table_name ON etl_operations(table_name);
CREATE INDEX idx_etl_operations_status ON etl_operations(status) WHERE status = 'failed';
```

**Retention Policy**: 90 days (background job deletes rows older than 90 days)

---

### 4. Storage Quota
**Table**: `public.storage_quota`  
**Purpose**: Per-user storage consumption tracking (enforces 1GB/20 table limits)

**Schema**:
```sql
CREATE TABLE storage_quota (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_tables INTEGER DEFAULT 0,
    total_size_mb DECIMAL(10,2) DEFAULT 0.0,
    limit_mb INTEGER DEFAULT 1024,  -- Free plan: 1GB
    last_calculated_at TIMESTAMP DEFAULT now()
);
```

**Field Descriptions**:
- `user_id`: Foreign key to `users.id` (one row per user)
- `total_tables`: Current table count (max 20 for free plan)
- `total_size_mb`: Sum of all table sizes in user's schema
- `limit_mb`: Storage limit in MB (1024 = 1GB for free plan)
- `last_calculated_at`: Timestamp of last quota recalculation

**Calculation Logic**:
```sql
SELECT 
    user_id,
    COUNT(*) AS total_tables,
    SUM(size_mb) AS total_size_mb
FROM user_tables
WHERE user_id = $1
GROUP BY user_id;
```

**Update Triggers**:
- After successful INSERT/UPSERT/DELETE/TRUNCATE → recalculate via `pg_total_relation_size()`
- After DROP TABLE → decrement `total_tables`, subtract `size_mb`
- Background job (every 5 min) → reconcile all users to catch drift

**Enforcement Points**:
1. **Pre-upload check**: Acquire advisory lock, verify quota + estimated file size
2. **Post-operation update**: Recalculate actual size consumed
3. **Warning threshold**: Display warning at 80% capacity (800MB)
4. **Hard block**: Reject new uploads at 100% (1024MB)

---

### 5. Upload Session
**Table**: `public.upload_sessions`  
**Purpose**: Track temporary state during file upload and processing (1-hour TTL)

**Schema**:
```sql
CREATE TABLE upload_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN 
        ('uploading', 'processing', 'completed', 'failed')),
    progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

**Field Descriptions**:
- `session_id`: Unique session identifier (returned to frontend for polling)
- `user_id`: User uploading file
- `filename`: Original uploaded filename (e.g., `sales_data.csv`)
- `file_size_bytes`: File size in bytes (for quota pre-check)
- `status`: Current state (see state machine below)
- `progress_pct`: Completion percentage (0-100)
- `error_message`: User-friendly error if `status = failed`
- `created_at`: Upload start timestamp
- `updated_at`: Auto-updated on status/progress change

**State Machine**:
```
uploading → processing → completed
                       ↘ failed
```

**State Transitions**:
- `uploading`: File being transferred to temp storage
- `processing`: Parsing CSV/Excel, inferring types, loading data
- `completed`: Success, data loaded, metadata updated
- `failed`: Error occurred (type inference failed, quota exceeded, etc.)

**Cleanup**: Background job deletes sessions older than 1 hour

---

## Entity Relationships

### ER Diagram (Mermaid)
```mermaid
erDiagram
    users ||--o{ user_tables : owns
    users ||--o{ etl_operations : performs
    users ||--|| storage_quota : has
    users ||--o{ upload_sessions : initiates
    
    users {
        uuid id PK
        uuid org_id FK
        text email
        text schema_name UK
    }
    
    user_tables {
        uuid id PK
        uuid user_id FK
        varchar schema_name
        varchar table_name
        bigint row_count
        decimal size_mb
        timestamp last_updated_at
        timestamp created_at
    }
    
    etl_operations {
        uuid id PK
        uuid user_id FK
        varchar operation_type
        varchar table_name
        varchar status
        integer rows_affected
        text error_message
        timestamp created_at
    }
    
    storage_quota {
        uuid user_id PK_FK
        integer total_tables
        decimal total_size_mb
        integer limit_mb
        timestamp last_calculated_at
    }
    
    upload_sessions {
        uuid session_id PK
        uuid user_id FK
        varchar filename
        bigint file_size_bytes
        varchar status
        integer progress_pct
        text error_message
        timestamp created_at
        timestamp updated_at
    }
```

### Cardinality
- **User → User Tables**: One-to-Many (1 user owns N tables, max 20 for free plan)
- **User → ETL Operations**: One-to-Many (1 user performs N operations, unbounded)
- **User → Storage Quota**: One-to-One (1 user has 1 quota record)
- **User → Upload Sessions**: One-to-Many (1 user can have N concurrent sessions)

---

## State Machines

### Upload Session States
```
┌──────────────────────────────────────────────────────────┐
│ Initial State: UPLOADING                                  │
│ - File transfer in progress (multipart upload)           │
│ - Progress: 0-30%                                         │
└──────────────────────────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────┐
│ State: PROCESSING                                         │
│ - Parsing CSV/Excel (Papa Parse / ExcelJS)               │
│ - Type inference (sample 1000 rows)                      │
│ - Schema creation (if new user)                          │
│ - Table creation + data load (batched)                   │
│ - Progress: 30-100%                                       │
└──────────────────────────────────────────────────────────┘
                    │            │
           Success  │            │  Error
                    ↓            ↓
         ┌───────────────┐  ┌──────────┐
         │  COMPLETED    │  │  FAILED  │
         │  - Data live  │  │  - Error │
         │  - Quota OK   │  │  - msg   │
         └───────────────┘  └──────────┘
```

### ETL Operation Workflow
```
┌─────────────────────────────────────────────────────┐
│ 1. Acquire advisory lock (user_id)                  │
│ 2. Pre-flight quota check                           │
│ 3. Enqueue BullMQ job (table-specific FIFO)         │
└─────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────┐
│ Job Processing                                       │
│ - INSERT: CREATE TABLE + COPY                       │
│ - UPSERT: CREATE INDEX + INSERT ON CONFLICT         │
│ - DELETE: DELETE WHERE id IN (...)                  │
│ - DROP: DROP TABLE + metadata cleanup               │
│ - TRUNCATE: TRUNCATE TABLE + reset row_count        │
└─────────────────────────────────────────────────────┘
                    │            │
           Success  │            │  Error
                    ↓            ↓
         ┌───────────────┐  ┌──────────────────┐
         │  Update:      │  │  Rollback:       │
         │  - Metadata   │  │  - Log error     │
         │  - Quota      │  │  - User message  │
         │  - Audit log  │  │  - Retry (3x)    │
         └───────────────┘  └──────────────────┘
                         │
                         ↓
              Release advisory lock
```

---

## Data Validation Rules

### Business Rules (from FR requirements)
1. **Table Limit**: Max 20 tables per user (free plan) → Enforced pre-upload
2. **Storage Limit**: Max 1GB total across all tables → Enforced with pessimistic locking
3. **File Size**: Max 50MB per upload → Enforced at upload endpoint (Multer config)
4. **Table Names**: Must be valid Postgres identifiers (63 chars, alphanumeric + underscore)
5. **NULL Key Rejection**: UPSERT operations reject rows with NULL in key column
6. **Type Inference**: Sample first 1000 rows; fallback to TEXT if <95% type match
7. **Concurrent Operations**: Same table operations queued sequentially (BullMQ)
8. **Retention**: ETL audit logs kept 90 days, upload sessions 1 hour

### Database Constraints
```sql
-- Table name uniqueness per user
ALTER TABLE user_tables ADD CONSTRAINT unique_schema_table 
    UNIQUE(schema_name, table_name);

-- Operation type validation
ALTER TABLE etl_operations ADD CONSTRAINT valid_operation_type 
    CHECK (operation_type IN ('insert', 'upsert', 'delete', 'drop', 'truncate'));

-- Status validation
ALTER TABLE etl_operations ADD CONSTRAINT valid_status 
    CHECK (status IN ('success', 'failed'));

-- Upload session status validation
ALTER TABLE upload_sessions ADD CONSTRAINT valid_upload_status 
    CHECK (status IN ('uploading', 'processing', 'completed', 'failed'));

-- Progress bounds
ALTER TABLE upload_sessions ADD CONSTRAINT valid_progress 
    CHECK (progress_pct >= 0 AND progress_pct <= 100);

-- Positive storage values
ALTER TABLE storage_quota ADD CONSTRAINT positive_storage 
    CHECK (total_size_mb >= 0 AND total_tables >= 0);
```

### Application-Level Validations
```typescript
// Pre-upload checks
if (storageQuota.total_tables >= 20) {
  throw new QuotaExceededError("Table limit reached (20 max)");
}
if (storageQuota.total_size_mb + estimatedSizeMB > 1024) {
  throw new QuotaExceededError("Storage limit exceeded (1GB max)");
}

// Table name validation
if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(tableName)) {
  throw new ValidationError("Invalid table name");
}

// Upsert key validation
if (keyColumn && uploadData.some(row => row[keyColumn] === null)) {
  const nullCount = uploadData.filter(row => row[keyColumn] === null).length;
  throw new ValidationError(`${nullCount} rows have NULL key values`);
}
```

---

## Sample Queries

### Check Storage Quota
```sql
-- Get user's current quota status
SELECT 
    total_tables,
    total_size_mb,
    limit_mb,
    ROUND((total_size_mb / limit_mb) * 100, 1) AS usage_pct,
    CASE 
        WHEN total_size_mb >= limit_mb THEN 'BLOCKED'
        WHEN total_size_mb >= limit_mb * 0.8 THEN 'WARNING'
        ELSE 'OK'
    END AS quota_status
FROM storage_quota
WHERE user_id = 'user-uuid-here';
```

### List User Tables
```sql
-- Get all tables owned by user with sizes
SELECT 
    table_name,
    row_count,
    size_mb,
    last_updated_at,
    EXTRACT(EPOCH FROM (now() - last_updated_at)) / 3600 AS hours_since_update
FROM user_tables
WHERE user_id = 'user-uuid-here'
ORDER BY last_updated_at DESC;
```

### Fetch Operation History
```sql
-- Get recent ETL operations with success rate
SELECT 
    operation_type,
    table_name,
    status,
    rows_affected,
    error_message,
    created_at
FROM etl_operations
WHERE user_id = 'user-uuid-here'
    AND created_at > now() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 50;
```

### Recalculate Storage Quota
```sql
-- Background job: recalculate actual quota from disk
WITH current_usage AS (
    SELECT 
        user_id,
        COUNT(*) AS table_count,
        SUM(
            pg_total_relation_size(quote_ident(schema_name) || '.' || quote_ident(table_name))
        ) / (1024.0 * 1024.0) AS actual_size_mb
    FROM user_tables
    WHERE user_id = 'user-uuid-here'
    GROUP BY user_id
)
UPDATE storage_quota sq
SET 
    total_tables = cu.table_count,
    total_size_mb = cu.actual_size_mb,
    last_calculated_at = now()
FROM current_usage cu
WHERE sq.user_id = cu.user_id;
```

### Get Upload Session Progress
```sql
-- Poll upload session status (frontend query)
SELECT 
    session_id,
    status,
    progress_pct,
    error_message,
    EXTRACT(EPOCH FROM (now() - created_at)) AS seconds_elapsed
FROM upload_sessions
WHERE session_id = 'session-uuid-here';
```

### Audit Failed Operations
```sql
-- Dashboard: failed operations by type (last 24h)
SELECT 
    operation_type,
    COUNT(*) AS failure_count,
    ARRAY_AGG(DISTINCT error_message) AS unique_errors
FROM etl_operations
WHERE status = 'failed'
    AND created_at > now() - INTERVAL '24 hours'
GROUP BY operation_type
ORDER BY failure_count DESC;
```

---

## Indexes Summary

### Performance-Critical Indexes
```sql
-- user_tables
CREATE INDEX idx_user_tables_user_id ON user_tables(user_id);
CREATE INDEX idx_user_tables_last_updated ON user_tables(last_updated_at DESC);

-- etl_operations (audit queries)
CREATE INDEX idx_etl_operations_user_created ON etl_operations(user_id, created_at DESC);
CREATE INDEX idx_etl_operations_table ON etl_operations(table_name);
CREATE INDEX idx_etl_operations_failed ON etl_operations(status) WHERE status = 'failed';

-- upload_sessions (polling)
CREATE INDEX idx_upload_sessions_user_created ON upload_sessions(user_id, created_at DESC);
CREATE INDEX idx_upload_sessions_status ON upload_sessions(status) WHERE status IN ('uploading', 'processing');

-- storage_quota (no additional index needed - primary key user_id)
```

---

## Migration Strategy

### Initial Setup (005_create_etl_metadata_tables.sql)
1. Add `schema_name` column to existing `users` table
2. Create `user_tables`, `etl_operations`, `storage_quota`, `upload_sessions`
3. Add triggers for `updated_at` auto-update
4. Create indexes for performance

### Future Migrations
- **006_add_soft_delete.sql**: Add `deleted_at` to `user_tables` for 7-day recovery
- **007_add_quota_tiers.sql**: Support paid plan limits (100 tables, 10GB)
- **008_add_column_metadata.sql**: Store inferred column types for schema evolution

---

## Data Retention Policies

| Entity | Retention Period | Cleanup Method |
|--------|-----------------|----------------|
| `user_tables` | Indefinite (user-owned) | Manual drop or soft-delete (future) |
| `etl_operations` | 90 days | Daily cron job deletes old rows |
| `upload_sessions` | 1 hour | Hourly cron job deletes old sessions |
| `storage_quota` | Indefinite (1 row per user) | Deleted on user account deletion |
| Temp files (`os.tmpdir()`) | 5 minutes | Cron job every 5 min deletes orphaned files |

---

## Security Considerations

### Schema Isolation Enforcement
```typescript
// Connection pool middleware
async function withUserSchema(userId: string, callback: Function) {
  const client = await pool.connect();
  try {
    const schemaName = `user${userId.replace(/-/g, '').substring(0, 10)}`;
    await client.query(`SET search_path TO ${schemaName}, public`);
    return await callback(client);
  } finally {
    client.release();
  }
}
```

### SQL Injection Prevention
```typescript
// Always use parameterized queries
await client.query(
  'INSERT INTO user_tables (user_id, schema_name, table_name) VALUES ($1, $2, $3)',
  [userId, schemaName, tableName]
);

// Use quote_ident for dynamic identifiers
await client.query(`
  SELECT * FROM ${quote_ident(schemaName)}.${quote_ident(tableName)} LIMIT 100
`);
```

### Advisory Lock Pattern
```sql
-- Acquire lock before quota check
SELECT pg_advisory_xact_lock(hashtext($1::text));  -- $1 = user_id

-- Lock released automatically at transaction end
COMMIT;
```

---

## Performance Benchmarks (Target)

| Operation | Target Performance | Measurement |
|-----------|-------------------|-------------|
| File upload (10MB CSV) | <30s p95 | Time from upload start to `status=completed` |
| Type inference | <2s for 1000 rows | Sampling + heuristic evaluation |
| UPSERT | >1000 rows/sec | Throughput on shared Postgres |
| Quota check | <100ms | Advisory lock acquisition + SELECT |
| Table preview | <500ms | SELECT first 100 rows |
| Metadata update | <200ms | UPDATE user_tables + storage_quota |

---

## Glossary

- **Schema Isolation**: Postgres feature where each user's tables reside in a separate namespace
- **Advisory Lock**: Application-level lock in Postgres (pg_advisory_xact_lock) to prevent race conditions
- **Type Inference**: Automatic detection of column data types from sample rows
- **Upsert**: Merge operation (INSERT ON CONFLICT DO UPDATE) that updates existing rows or inserts new
- **Quota Recalculation**: Background process to sync cached quota with actual disk usage
- **BullMQ**: Redis-backed job queue for ETL operation orchestration
- **Search Path**: Postgres setting that determines schema resolution order for unqualified table names

---

## References

- **Specification**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Migrations**: [backend/migrations/005_create_etl_metadata_tables.sql](../../backend/migrations/005_create_etl_metadata_tables.sql)
- **PostgreSQL Schema Docs**: https://www.postgresql.org/docs/14/ddl-schemas.html
- **pg (node-postgres)**: https://node-postgres.com/
