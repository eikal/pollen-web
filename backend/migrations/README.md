# Pollen Database Migrations

Location: `backend/migrations/`

## MVP Scope (001-csv-upload-mvp)

The MVP focuses on **CSV/Excel file upload** with table preview. Only these tables are actively used:

| Table | MVP Usage |
|-------|-----------|
| `organizations` | ✅ User's org (required for auth) |
| `users` | ✅ User accounts with password auth |
| `upload_sessions` | ✅ Track file upload progress |
| `user_tables` | ✅ Metadata for user's tables |
| `etl_operations` | ✅ Audit log for insert/upsert/delete/drop/truncate |
| `storage_quota` | ✅ Track 1GB / 20 table limits |

**Out of MVP scope** (tables exist but not used):
- `provisioned_instances` - DWH instance provisioning
- `etl_templates`, `etl_jobs` - ETL pipeline management
- `data_products`, `kpi_metrics`, `refresh_jobs` - Data products
- `data_source_connections` - External data sources
- `adapter_configs` - Cloud provider configs

## Migration Files

| File | Description | MVP? |
|------|-------------|------|
| `001_create_metadata.sql` | Core tables (orgs, users, provisioning) | ✅ Partial |
| `002_seed_sample_data.sql` | Old demo data | ❌ Skip |
| `003_add_user_password_hash.sql` | Password auth support | ✅ Yes |
| `004_create_data_products.sql` | Data products tables | ❌ Future |
| `005_create_etl_metadata_tables.sql` | Upload/ETL tables | ✅ Yes |
| `006_add_etl_indexes.sql` | Performance indexes | ✅ Yes |
| `007_mvp_seed_data.sql` | MVP-focused seed data | ✅ Yes |
| `008_test_scenarios_seed.sql` | Test users for different scenarios | ✅ Testing |

## Test Scenarios (008_test_scenarios_seed.sql)

Creates test users to verify different system states:

| User | Scenario | State |
|------|----------|-------|
| `fresh-user@test.pollen.dev` | New user | No tables, empty quota |
| `active-user@test.pollen.dev` | Normal usage | 5 tables, 100MB, healthy |
| `table-limit@test.pollen.dev` | Near table limit | 18/20 tables |
| `storage-limit@test.pollen.dev` | Near storage limit | 950MB/1GB (93%) |
| `error-user@test.pollen.dev` | Error history | Has failed ETL operations |
| `admin@test.pollen.dev` | Admin role | 2GB quota |

## Running Migrations (MVP)

Use the helper script which applies all migrations in order:

```powershell
cd backend
.\run-migrations.ps1

# With MVP seed data:
.\run-migrations.ps1 -Seed
```

Or manually:

```powershell
$env:PGHOST='localhost'
$env:PGUSER='postgres'
$env:PGDATABASE='pollen_dev'
$env:PGPASSWORD='postgres'

# Core tables
psql -f migrations/001_create_metadata.sql
psql -f migrations/003_add_user_password_hash.sql
psql -f migrations/005_create_etl_metadata_tables.sql
psql -f migrations/006_add_etl_indexes.sql

# MVP seed (cleans non-MVP data, adds demo user)
psql -f migrations/007_mvp_seed_data.sql
```

## Notes

- Migrations use `gen_random_uuid()` which requires `pgcrypto` extension (auto-created).
- User schemas (e.g., `user_abc123`) are created dynamically on first upload, not via migrations.
- The MVP demo user credentials: `demo@pollen.dev` / `demo123`
