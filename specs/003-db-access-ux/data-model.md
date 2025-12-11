# Data Model: Database Access & UX Polishing

## Entities

### User
- id (uuid)
- email (string)
- schema_name (string, format: `user_<uuid>`)
- db_username (string)
- db_password_hash (string)
- quota_storage_bytes (int)
- quota_table_count (int)

### UploadSession
- id (uuid)
- user_id (uuid)
- file_name (string)
- file_type (enum: csv|excel)
- selected_sheet (string|null)
- operation (enum: insert|upsert|delete|truncate|drop)
- key_column (string|null)
- created_at (timestamp)

### Table
- id (uuid)
- user_id (uuid)
- schema_name (string)
- table_name (string)
- row_count (int)
- created_at (timestamp)

### StorageQuota
- user_id (uuid)
- used_bytes (int)
- limit_bytes (int)
- updated_at (timestamp)

## Relationships
- User 1..* UploadSession
- User 1..* Table
- User 1..1 StorageQuota

## Validation Rules
- UploadSession.selected_sheet required when file_type = excel
- UploadSession.key_column required when operation = upsert or delete
- Table.table_name unique per (user_id, schema_name)
- StorageQuota.used_bytes <= limit_bytes

## State Transitions
- UploadSession: created → previewed → finalized (table created/updated)
- Table: created → updated (upsert/delete) → truncated/drop (terminal)
