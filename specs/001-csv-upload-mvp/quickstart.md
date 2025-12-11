# Quickstart Guide: CSV/Excel Upload MVP (Phase 1)

**Feature ID**: 002-csv-upload-mvp  
**Phase**: MVP - Direct data upload and table management  
**Stack**: Node.js 18 LTS, TypeScript 5.0, PostgreSQL 14+, Express, Next.js 14, Redis (BullMQ)  
**Last Updated**: 2025-11-29

This guide gets the CSV/Excel upload MVP running locally in under 10 minutes.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18 LTS** ([Download](https://nodejs.org/))
- **Docker Desktop** (for PostgreSQL + Redis containers)
- **Git** (for cloning the repository)
- **PowerShell 5.1+** (Windows) or Bash (Linux/Mac)

> **Optional**: PostgreSQL client (`psql`) for manual database inspection

---

## Quick Start (5 Steps)

### 1. Clone Repository

```powershell
git clone https://github.com/eikal/pollen-web.git
cd pollen-web
git checkout 001-csv-upload-mvp
```

### 2. Install Dependencies

```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

cd ..
```

### 3. Start Docker Services

```powershell
cd backend
docker-compose up -d
```

This starts:
- **PostgreSQL 14** on port 5432 (database: `pollen_dev`, user: `postgres`, password: `postgres`)
- **Redis 6** on port 6379 (for background job queue)

Verify containers are running:
```powershell
docker ps
```

Expected output:
```
CONTAINER ID   IMAGE            STATUS         PORTS                    NAMES
abc123def456   postgres:15      Up 10 seconds  0.0.0.0:5432->5432/tcp   pollen-postgres
xyz789abc012   redis:6-alpine   Up 10 seconds  0.0.0.0:6379->6379/tcp   pollen-redis
```

### 4. Configure Environment

```powershell
# Backend environment
cd backend
cp .env.example .env
```

Default `.env` works out-of-the-box for local development. Key settings:
```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pollen_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
PORT=4000
```

> **Note**: Frontend doesn't need `.env` for MVP (API URL defaults to `http://localhost:4000`)

### 5. Run Database Migrations

```powershell
cd backend
.\run-migrations.ps1
```

This creates metadata tables, seeds demo data, and sets up test users.

---

## Running the Application

### Option A: Use Start Script (Recommended)

```powershell
# From repository root
.\start-dev.ps1
```

This starts all three services in parallel:
- **Backend API** at `http://localhost:4000`
- **Frontend** at `http://localhost:3000`
- **Worker** (background job processor)

Press **Ctrl+C** to stop all services.

### Option B: Manual Start (Separate Terminals)

**Terminal 1 - Backend API:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Worker:**
```powershell
cd backend
npm run dev:worker
```

**Terminal 3 - Frontend:**
```powershell
cd frontend
npm run dev
```

---

## Verify Installation

### 1. Check Backend Health

Open browser to `http://localhost:4000/health` (or use `curl`):

```powershell
curl http://localhost:4000/health
```

Expected response:
```json
{"status":"ok","database":"connected","redis":"connected"}
```

### 2. Access Frontend

Navigate to `http://localhost:3000`

You should see the Pollen homepage with:
- **Uploads** link in navigation (primary workflow)
- **My Data** link (table list)
- **Login** button

---

## Test Data & Users

### Test Users

All test users are pre-seeded during migrations. Default password: `test123`

| Email | Password | Purpose | Quota Status |
|-------|----------|---------|--------------|
| `demo@pollen.dev` | `demo123` | General demo | Fresh (0 MB / 1 GB) |
| `fresh-user@test.pollen.dev` | `test123` | First-time user | 0 tables, 0 MB |
| `active-user@test.pollen.dev` | `test123` | Has 5 tables | 103 MB / 1 GB |
| `table-limit@test.pollen.dev` | `test123` | Near limit | 18/20 tables |
| `storage-limit@test.pollen.dev` | `test123` | Near capacity | 950 MB / 1 GB (93%) |
| `admin@test.pollen.dev` | `test123` | Extended quota | 0 MB / 2 GB |

> **Note**: If password login doesn't work, run: `node scripts/set-test-passwords.js`

### Test Files

Sample CSV/Excel files in `test-data/` directory:

| File | Format | Rows | Use Case |
|------|--------|------|----------|
| `sales_data.csv` | CSV | 50 | Sales orders (key: `order_id`) |
| `inventory.csv` | CSV | 30 | Product inventory (key: `sku`) |
| `transactions.csv` | CSV | 100 | Financial transactions (key: `transaction_id`) |
| `employees.xlsx` | Excel | 25 | Employee directory (key: `employee_id`) |
| `customers.xlsx` | Excel | 40 | Customer contacts (key: `customer_id`) |

> **Generating Excel files**: If `.xlsx` files are missing, run:
> ```powershell
> cd backend
> node scripts/generate-test-excel.js
> ```

See `test-data/README.md` for detailed file descriptions.

---

## Quick Test Flow (5 Minutes)

### 1. Login as Demo User

1. Navigate to `http://localhost:3000`
2. Click **Login**
3. Enter:
   - Email: `demo@pollen.dev`
   - Password: `demo123`

### 2. Upload Sales Data

1. Click **Uploads** in navigation
2. Click **Choose File** → Select `test-data/sales_data.csv`
3. Click **Upload**
4. Wait for schema preview to appear
5. Review inferred column types (should show `order_id: TEXT`, `quantity: INTEGER`, `total_amount: DECIMAL`, etc.)
6. Enter table name: `sales_data`
7. Click **Create Table**

### 3. View Table Preview

1. Click **My Data** in navigation
2. Find `sales_data` in table list
3. Click **Preview** to see first 100 rows
4. Verify data loaded correctly

### 4. Test Upsert Operation

1. Modify `test-data/sales_data.csv` locally:
   - Change `quantity` for `order_id = ORD001` from `5` to `10`
   - Add a new row with `order_id = ORD051`
2. Return to **Uploads** page
3. Upload modified `sales_data.csv`
4. Select operation: **Upsert**
5. Choose key column: `order_id`
6. Click **Execute**
7. Verify in table preview:
   - `ORD001` quantity updated to `10`
   - `ORD051` added as new row

### 5. Check Storage Quota

1. In navigation header, look for quota widget: `X MB / 1 GB (Y%)`
2. Verify storage increased after upload

---

## Development Commands

### Backend

```powershell
cd backend

# Start API server (dev mode with auto-rebuild)
npm run dev

# Start worker (background jobs)
npm run dev:worker

# Run unit tests
npm test

# Run adapter tests (DWH integration)
npm run test:adapter

# Run ETL tests
npm run test:etl

# Seed demo passwords
npm run seed:demo-passwords

# Build TypeScript
npm run build

# Lint code
npm run lint
```

### Frontend

```powershell
cd frontend

# Start dev server (port 3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Database

```powershell
cd backend

# Run migrations
.\run-migrations.ps1

# Run migrations + seed data
.\run-migrations.ps1 -Seed

# Connect to database (requires psql)
psql -h localhost -U postgres -d pollen_dev
# Password: postgres

# Alternative: Connect via Docker
docker exec -it pollen-postgres psql -U postgres -d pollen_dev
```

---

## Checking Logs

### Backend Logs

Logs are written to console (stdout). If using `start-dev.ps1`, logs are captured by PowerShell jobs.

To view real-time logs in separate terminals:

**Backend API:**
```powershell
cd backend
npm run dev
```

**Worker:**
```powershell
cd backend
npm run dev:worker
```

### Database Query Logs

Connect to PostgreSQL and enable logging:
```sql
-- Enable query logging
ALTER DATABASE pollen_dev SET log_statement = 'all';

-- View recent queries (requires logging to table)
SELECT * FROM pg_stat_statements LIMIT 10;
```

### Redis Job Queue

Inspect job queue status:
```powershell
# Connect to Redis CLI
docker exec -it pollen-redis redis-cli

# List queues
KEYS *

# Check queue length
LLEN bull:upload-queue:wait
```

---

## Resetting Database

### Option 1: Drop and Recreate

```powershell
cd backend

# Drop database
docker exec -it pollen-postgres psql -U postgres -c "DROP DATABASE pollen_dev;"

# Recreate database
docker exec -it pollen-postgres psql -U postgres -c "CREATE DATABASE pollen_dev;"

# Re-run migrations
.\run-migrations.ps1
```

### Option 2: Restart Docker Containers

```powershell
cd backend

# Stop and remove containers (deletes data volumes)
docker-compose down -v

# Recreate containers
docker-compose up -d

# Wait for containers to be ready
Start-Sleep -Seconds 5

# Run migrations
.\run-migrations.ps1
```

---

## Troubleshooting

### Issue: Port 4000 Already in Use

**Symptoms**: Backend fails to start with `Error: listen EADDRINUSE: address already in use :::4000`

**Solution**:
```powershell
# Find process using port 4000
Get-NetTCPConnection -LocalPort 4000 | Select-Object -ExpandProperty OwningProcess

# Kill process (replace PID)
Stop-Process -Id <PID> -Force

# Or use start-dev.ps1 which auto-cleans ports
.\start-dev.ps1
```

### Issue: Port 3000 Already in Use

**Symptoms**: Frontend fails with `Port 3000 is already in use`

**Solution**:
```powershell
# Find and kill process
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Restart frontend
cd frontend
npm run dev
```

### Issue: Docker Containers Not Running

**Symptoms**: `docker ps` shows no `pollen-postgres` or `pollen-redis` containers

**Solution**:
```powershell
cd backend
docker-compose up -d

# Check logs if containers exit immediately
docker-compose logs
```

### Issue: Database Connection Error

**Symptoms**: Backend logs show `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Cause**: PostgreSQL container not ready or wrong credentials

**Solution**:
```powershell
# Check container health
docker ps

# Inspect PostgreSQL logs
docker logs pollen-postgres

# Verify connection manually
docker exec -it pollen-postgres psql -U postgres -d pollen_dev
```

If connection fails, ensure `DATABASE_URL` in `.env` matches Docker config:
```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pollen_dev
```

### Issue: Redis Connection Error

**Symptoms**: Worker logs show `Error connecting to Redis`

**Solution**:
```powershell
# Check Redis container
docker ps | Select-String redis

# Test Redis connection
docker exec -it pollen-redis redis-cli ping
# Expected: PONG

# Verify REDIS_URL in .env
# Should be: redis://localhost:6379
```

### Issue: Migrations Fail

**Symptoms**: `run-migrations.ps1` exits with errors

**Solution**:
```powershell
# Ensure containers are running
docker ps

# Check if psql is available
psql --version

# If psql not found, script will use Docker exec automatically
# Verify migrations folder exists
Get-ChildItem backend\migrations

# Run with verbose output
cd backend
.\run-migrations.ps1 -Verbose
```

### Issue: Login Fails (Wrong Password)

**Symptoms**: `demo@pollen.dev` login rejected

**Solution**:
```powershell
cd backend
node scripts/set-test-passwords.js
```

This resets all test user passwords to `test123` (except `demo@pollen.dev` which uses `demo123`).

### Issue: File Upload Fails

**Symptoms**: Upload completes but table not created

**Diagnostic Steps**:
1. Check backend logs for errors
2. Verify worker is running (`npm run dev:worker`)
3. Inspect Redis job queue:
   ```powershell
   docker exec -it pollen-redis redis-cli
   > KEYS *
   > LLEN bull:upload-queue:wait
   > LLEN bull:upload-queue:failed
   ```
4. Check database for user schema:
   ```sql
   SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'user%';
   ```

**Common Causes**:
- Worker not running → Start with `npm run dev:worker`
- File exceeds 50MB → Split file or compress
- Malformed CSV → Check for encoding issues (must be UTF-8 or Latin-1)

### Issue: Type Inference Errors

**Symptoms**: Dates detected as text, numbers as text

**Solution**:
- Ensure CSV has headers in first row
- Check date format (YYYY-MM-DD preferred)
- Remove special characters from numeric columns (e.g., `$`, `,`)
- Use consistent formats across all rows

**Workaround**: Manually edit inferred schema in preview before creating table (feature roadmap).

---

## Additional Resources

- **Feature Specification**: `specs/001-csv-upload-mvp/spec.md`
- **Use Cases & Test Scenarios**: `docs/mvp-use-cases.md`
- **Data Model**: `specs/001-csv-upload-mvp/data-model.md`
- **Business Glossary**: `docs/business-glossary.md`
- **Project Root README**: `README.md`

---

## Support

For issues not covered in this guide:

1. Check `docs/mvp-use-cases.md` for expected behavior
2. Review migration logs: `backend/migrations/README.md`
3. Inspect backend logs for stack traces
4. Verify test user setup: `node backend/scripts/check-user.js`

---

## Next Steps

After completing the quick test flow:

1. **Explore ETL Operations**:
   - Upload `test-data/inventory.csv`
   - Test DELETE operation (remove specific SKUs)
   - Test TRUNCATE operation (clear all rows)
   - Test DROP operation (remove entire table)

2. **Test Quota Limits**:
   - Login as `storage-limit@test.pollen.dev`
   - Attempt to upload large file (should be blocked)
   - Verify warning banner appears

3. **Inspect Database**:
   ```sql
   -- View user schemas
   SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'user%';
   
   -- View tables in a schema
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'user1';
   
   -- Preview table data
   SELECT * FROM user1.sales_data LIMIT 10;
   ```

4. **Run Automated Tests**:
   ```powershell
   cd backend
   npm test
   npm run test:etl
   ```

---

**Ready to build!** 🚀

If you encounter issues, see the [Troubleshooting](#troubleshooting) section above.
