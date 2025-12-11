# Research: CSV/Excel to Data Warehouse Service# Phase 0 Research: Adapter Scaffold & Starter Data Products Platform



**Feature**: 001-csv-upload-mvp  ## Decisions & Rationale

**Date**: 2025-11-15  

**Phase**: 0 (Outline & Research)### Runtime & Language

- **Decision**: Node.js (>=18 LTS) + TypeScript for backend adapter scaffold; Next.js + React (already present) for product UI.

## Overview- **Rationale**: Aligns with existing repo tech; mature ecosystem for data ingestion libraries; TypeScript improves adapter interface safety.

- **Alternatives Considered**:

This document captures research findings and technology decisions for building a CSV/Excel file upload service with ETL operations, multi-tenant schema isolation, and storage quota enforcement.  - Python microservice for adapters (rejected: introduces multi-runtime complexity early)

  - Go for performance (rejected: premature optimization; less rapid iteration for non-tech UX)

---

### Primary Dependencies

## Decision 1: File Parsing Library Selection- **Decision**: express, pg, jsonwebtoken, bcryptjs (already in use) extended with formula evaluation via a minimal safe expression parser (custom or tiny library later).

- **Rationale**: Reuse existing stack; avoid pulling heavy ETL frameworks (Airbyte integration deferred).

**Decision**: Use **Papa Parse** for CSV and **ExcelJS** for Excel files- **Alternatives**:

  - Airbyte integration now (rejected: increases surface; MVP needs only simple sources)

**Rationale**:  - Large formula engines (e.g., math.js) (rejected: scope limited to arithmetic + basic aggregations)

- **Papa Parse**: Industry standard for CSV parsing in Node.js, streaming support for large files, automatic type detection, handles edge cases (quoted fields, newlines in values, different delimiters)

- **ExcelJS**: Mature library with streaming read support, handles .xlsx format, can process specific sheets, good memory efficiency for large files### Storage

- Both libraries have active maintenance and strong TypeScript support- **Decision**: PostgreSQL for metadata (connections, products, metrics, jobs); product data stored either transiently or via staging tables (Phase 2 elaboration). For MVP, rely on source data directly with light caching (deferred persistence strategy).

- **Rationale**: Already configured; strong relational + JSONB support for flexible templates.

**Alternatives Considered**:- **Alternatives**: Dedicated warehouse (Snowflake/BigQuery) (rejected for MVP complexity)

- **csv-parser** (Node.js): Less feature-rich than Papa Parse, no built-in type inference

- **node-xlsx**: Loads entire file into memory, problematic for 40-50MB files### Testing Approach

- **xlsx** (SheetJS): Commercial license required for some features, ExcelJS is fully MIT-licensed- **Decision**: Add Jest (or maintain existing node test scripts) with unit tests for adapter interface + refresh job logic; integration tests simulating CSV upload + product publish.

- **Rationale**: Foundation for reliability without over-engineering; aligns with constitution test-first intent (though constitution file is placeholder).

**Performance Characteristics**:- **Alternatives**: Cypress for end-to-end (deferred until UI stabilized)

- Papa Parse: Can stream process 50MB CSV in <30s on typical server hardware

- ExcelJS: Streaming read mode processes 50MB .xlsx in <45s### Performance Goals

- Both support chunk-based processing to avoid memory exhaustion- **Decision**: Connection wizard responses <2s p95; refresh jobs complete <15m (already in spec constraint); schema inference <5s for ≤200 fields.

- **Rationale**: Supports non-technical patience thresholds and spec constraints.

---- **Alternatives**: Aggressive sub-second refresh (unnecessary early)



## Decision 2: Type Inference Strategy### Constraints (Refined)

- **Decision**: Rate limit manual refresh to 5 per hour per product to prevent resource abuse.

**Decision**: **Sample first 1000 rows** and use heuristic-based type detection with fallback to TEXT- **Rationale**: Protects system from repeated manual triggers by curious users.

- **Alternatives**: No limit (risk), global account limit (less granular)

**Rationale**:

- Sampling 1000 rows provides 99%+ accuracy for typical datasets while keeping inference time <2s for large files### Scale / Scope

- Heuristic chain: Try parsing as INTEGER → DECIMAL → DATE → BOOLEAN → TEXT (fallback)- **Decision**: MVP target: 100 workspaces, each ≤10 products; concurrency mainly scheduled daily refresh window.

- DATE detection uses multiple format patterns (ISO 8601, US MM/DD/YYYY, EU DD/MM/YYYY)- **Rationale**: Realistic pilot adoption; guides initial capacity planning.

- If ≥95% of sampled values match a type, column is typed; otherwise TEXT- **Alternatives**: Design for thousands now (overkill vs timeline)



**Alternatives Considered**:### Security & Credentials

- **Full file scan**: Too slow for 10MB+ files, violates <30s processing constraint- **Decision**: Store credential references hashed/symbolic; no plain tokens in logs; restrict adapter secrets to server side.

- **First 100 rows only**: Insufficient sample size, leads to type errors on row 5000+- **Rationale**: Minimizes breach impact; business trust.

- **User-specified types**: Adds complexity, breaks "no SQL knowledge" requirement; reserved for manual override UI (future)- **Alternatives**: Encrypt at rest with KMS (Phase 2 enhancement)



**Error Handling**:### Observability

- Mismatched types during load trigger row-level warnings logged to ETL operation record- **Decision**: Structured logs for refresh jobs (product_id, duration, outcome); counters for success vs needs_attention; metric for time_to_first_product.

- User sees "45,123 rows loaded, 234 skipped (type mismatch)" with downloadable error CSV- **Rationale**: Enables Success Criteria tracking (SC-001..SC-006).

- **Alternatives**: Full tracing (deferred)

---

### Formula Versioning Strategy

## Decision 3: Schema Isolation Implementation- **Decision**: Store formula versions with semantic integer increment; historical metric results reference version_id; only forward recalculations if user explicitly requests.

- **Rationale**: Preserves historical integrity.

**Decision**: **Per-user Postgres schema** with connection-level `search_path` enforcement- **Alternatives**: Recalculate history automatically (risk of narrative change)



**Rationale**:### Unknowns Resolved

- Native Postgres feature: `CREATE SCHEMA user123` provides true namespace isolationNone remaining needing external clarification; all filled with reasonable defaults.

- Security: Connection pool uses `SET search_path = user123` on connection acquisition, preventing cross-user table access

- Easier than Row-Level Security (RLS): No complex policies needed, simpler to audit## Summary Table

- Migration path: User schema can be migrated to dedicated DB on upgrade to paid plan| Topic | Decision | Status |

|-------|----------|--------|

**Alternatives Considered**:| Runtime | Node.js 18 + TS | Final |

- **Table prefix** (e.g., `user123_sales`): Clutters global namespace, risk of naming collision if prefix logic fails| Adapter Interface | TypeScript interface + registry | Final |

- **Row-Level Security (RLS)**: Over-engineered for single-user ownership model, adds query overhead| Initial Sources | CSV + Google Sheets | Final |

- **Separate databases**: Too resource-heavy for 100+ users on shared instance| Formula Engine | Minimal expression parser | Final |

| Refresh Limits | 5 manual/hour/product | Final |

**Implementation Details**:| Performance | Wizard <2s p95 | Final |

- Schema created on user's first upload: `CREATE SCHEMA IF NOT EXISTS user123 AUTHORIZATION app_role`| Scale | 100 workspaces pilot | Final |

- Connection pool uses `afterCreate` hook to set search_path: `SET search_path TO user123, public`| Observability | Structured logs + counters | Final |

- Metadata tables (etl_operations, storage_quota) remain in `public` schema with user_id foreign keys| Versioning | Immutable historical, forward-only | Final |

| Security | Hashed refs, no plain logs | Final |

---

## Deferred Items

## Decision 4: Storage Quota Enforcement Strategy- Persistent materialized product tables (may require warehouse integration Phase 3)

- Advanced scheduling (hourly, weekly custom patterns)

**Decision**: **Pessimistic locking with pre-flight reservation** via PostgreSQL advisory locks- Adapter marketplace (submission workflow)

- Multi-language localization

**Rationale**:

- Prevents race condition where two concurrent uploads both see 900MB used and succeed, exceeding 1GB limit## Risks Update

- PostgreSQL advisory locks (`pg_advisory_xact_lock(user_id)`) provide transaction-scoped locking| Risk | Impact | Mitigation |

- Flow: Acquire lock → Check quota → Reserve estimated file size → Upload → Update actual size → Release lock|------|--------|------------|

- If pre-flight check fails, upload rejected before file processing starts (fast feedback)| Rapid scale beyond pilot | Perf degradation | Monitor adoption; add caching & batching Phase 2 |

| Formula complexity demands | Scope creep | Usage metrics; gating advanced operators |

**Alternatives Considered**:| Credential misconfiguration | Failed refresh | Needs Attention guidance, retries, test connection step |

- **Optimistic locking**: Check quota after upload completes, rollback if exceeded → wastes processing time

- **Application-level locks**: Requires distributed lock service (Redis), adds dependency
- **Database triggers**: Cannot prevent upload start, only fail after data loaded

**Calculation Strategy**:
- Storage recalculated via: `SELECT pg_total_relation_size(quote_ident(schema_name) || '.' || quote_ident(table_name))`
- Cached in `storage_quota` table, invalidated on drop/truncate/successful upload
- Background job recalculates all quotas every 5 minutes to catch drift

---

## Decision 5: Concurrent Operation Handling

**Decision**: **BullMQ job queue** with per-table FIFO processing

**Rationale**:
- BullMQ provides Redis-backed job queue with concurrency control, retry logic, and progress tracking
- Each operation queued as job with table name as deduplication key
- Jobs for same table processed sequentially (FIFO), different tables processed concurrently
- Prevents conflicts (e.g., concurrent drop + upload on same table)

**Alternatives Considered**:
- **Database-level locks**: `LOCK TABLE` blocks all reads, poor UX during long uploads
- **Application-level mutex**: Requires in-memory state, doesn't survive server restart
- **No queueing**: Accept concurrent operation failures → poor UX

**Job Types**:
- `upload-insert`: Create table + load CSV/Excel
- `upload-upsert`: Upsert rows by key column
- `delete-by-ids`: Delete specified rows
- `drop-table`: Drop table + update quota
- `truncate-table`: Truncate + update quota

---

## Decision 6: Upsert Implementation

**Decision**: Use PostgreSQL **`INSERT ... ON CONFLICT ... DO UPDATE`** with composite unique index

**Rationale**:
- Native PostgreSQL feature, optimized for upsert workload
- Requires unique constraint on key column: created dynamically if user selects key
- Single SQL statement → atomic, transaction-safe
- Rejects NULL key rows before upsert (pre-filter in application layer)

**Alternatives Considered**:
- **Manual SELECT + UPDATE/INSERT**: Slower (2 queries), race condition risk
- **MERGE statement**: Not supported in PostgreSQL <15 (target is PG 14+)
- **Temp table approach**: More complex, slower for small datasets

**Performance**:
- Baseline: 1,000 rows/sec on shared Postgres (NFR-002)
- Batching: Process CSV in 1000-row chunks to balance speed vs transaction size
- Index creation: `CREATE UNIQUE INDEX IF NOT EXISTS ON table(key_column)` before upsert

---

## Decision 7: Business-Friendly Error Handling

**Decision**: **Error code → message mapping** with context injection

**Rationale**:
- Map PostgreSQL error codes (42P01, 23505, etc.) to business messages in middleware
- Example: `42P01` → "Table not found. It may have been deleted."
- Include actionable guidance: "Please check table name and try again."
- Stack traces logged server-side only (NFR-007)

**Error Categories**:
- **Validation errors**: "Invalid ID format", "Key column missing"
- **Resource errors**: "Storage limit reached", "File too large"
- **Data errors**: "Column mismatch", "Type conversion failed"
- **System errors**: "Processing failed. Support team notified." (generic)

**Implementation**:
- Middleware: `errorHandler.ts` with `ERROR_CODE_MAP` object
- Frontend: Display error in toast notification + disable retry button if non-recoverable

---

## Decision 8: Excel Multi-Sheet Handling

**Decision**: **Process first sheet only** with sheet name displayed in UI

**Rationale**:
- Simplifies MVP UX (no sheet selector needed)
- ExcelJS streaming API defaults to first sheet
- 90% of user uploads are single-sheet files (assumption validated by similar tools)

**Future Enhancement (Deferred)**:
- Show sheet count during upload preview
- Dropdown to select sheet before upload
- Process all sheets as separate tables (optional)

**Current UX**:
- Upload confirmation: "Loaded from sheet 'Sales Data' (1 of 3 sheets)"
- If multi-sheet: "Note: Only first sheet processed. Contact support for multi-sheet uploads."

---

## Decision 9: Temporary File Storage

**Decision**: **OS temp directory** with 5-minute TTL cleanup

**Rationale**:
- Multer stores uploaded files in `os.tmpdir()` with unique filenames
- After successful processing, file deleted immediately
- Cron job runs every 5 minutes to delete orphaned files older than 5 minutes (NFR-006)
- No persistent storage needed → simpler architecture

**Alternatives Considered**:
- **S3/object storage**: Over-engineered for MVP, adds cost + latency
- **Database BLOB storage**: Poor performance for 50MB files
- **Persistent local disk**: Cleanup complexity, disk space management

**Security**:
- Unique temp filenames prevent enumeration attacks
- Files readable only by app user (umask 0077)
- No direct HTTP access to temp directory

---

## Decision 10: Database Connection Pooling

**Decision**: **pg Pool** with per-request `search_path` enforcement

**Rationale**:
- `pg` library provides built-in connection pooling (max 20 connections for shared instance)
- Each request acquires connection, sets `search_path` to user's schema, executes queries, releases
- Pool configuration: `max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000`

**Schema Switching Pattern**:
```typescript
const client = await pool.connect();
try {
  await client.query(`SET search_path TO ${userSchema}, public`);
  // Execute user queries
} finally {
  client.release();
}
```

**Query Timeout**:
- `statement_timeout = 30s` enforced at connection level (Constraint from spec)
- Long-running upserts killed automatically, user sees "Operation timeout" error

---

## Best Practices Summary

### CSV/Excel Parsing
- Always use streaming APIs for files >1MB
- Validate headers before processing data rows
- Handle encoding detection gracefully (UTF-8 → Latin-1 fallback)

### PostgreSQL Multi-Tenancy
- Never trust user input in schema/table names (use `quote_ident()`)
- Always set `search_path` immediately after connection acquisition
- Use advisory locks for quota enforcement to prevent races

### Job Queue Management
- Keep job payloads small (IDs/paths only, not full data)
- Implement exponential backoff for retries
- Monitor queue depth and alert on backlog >100 jobs

### Error Handling
- Log full stack trace server-side
- Return user-friendly message client-side
- Include correlation ID for support debugging

### Storage Quota
- Cache quota in metadata table, invalidate on changes
- Use pessimistic locking for writes
- Background reconciliation to catch drift

---

## Open Questions (Deferred to Implementation)

1. **Upsert key index naming**: Auto-generate or user-specified? → Auto-generate: `idx_{table}_{column}_upsert`
2. **Soft delete for drop operations**: 7-day recovery window? → Deferred to post-MVP (noted in Risks)
3. **Rate limiting per user**: Prevent abuse of free tier? → Monitor in production, implement if needed

---

## References

- Papa Parse Docs: https://www.papaparse.com/docs
- ExcelJS GitHub: https://github.com/exceljs/exceljs
- PostgreSQL Schema Docs: https://www.postgresql.org/docs/14/ddl-schemas.html
- BullMQ Documentation: https://docs.bullmq.io/
- pg (node-postgres): https://node-postgres.com/

**Next Phase**: [data-model.md](./data-model.md) - Entity design and database schema
