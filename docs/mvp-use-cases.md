# MVP Use Cases & Test Scenarios

**Feature**: 001-csv-upload-mvp (MVP)  
**Date**: 2025-11-28  
**Scope**: CSV/Excel upload → Table preview → Basic ETL operations

---

## MVP Scope Clarification

This MVP phase (001-csv-upload-mvp) focuses on **CSV/Excel file upload** to a shared PostgreSQL warehouse with basic ETL operations. 

### What's Included in This MVP ✅
- CSV/Excel file upload (up to 50MB)
- Automatic column type inference
- Table creation in user-isolated schemas
- Basic ETL operations: INSERT, UPSERT, DELETE, DROP, TRUNCATE
- Table list and data preview (first 100 rows)
- Storage quota enforcement (1GB / 20 tables for free plan)
- Operation history/audit log

### What's NOT in This MVP ❌
- **OnboardingWizard**: First-time user guided setup (deferred)
- **ConnectionWizard**: External data source connections (future phase)
- **Data Products**: Dashboards, reports, calculators (out of scope)
- **Scheduled Refreshes**: Automated ETL jobs (manual only)
- **AI Assistant**: Conversational data queries (future phase)

> **Note**: Components like `OnboardingWizard.tsx` and `ConnectionWizard.tsx` exist in the codebase but are **not actively used** in this MVP. They are placeholders for future phases. See `specs/001-csv-upload-mvp/spec.md` for full scope details.

---

## Overview

This document describes the key use cases for the MVP with corresponding test data files. Each use case demonstrates a specific workflow that business users will perform.

---

## Use Case 1: Sales Data Import (CSV)

**Persona**: Sales Manager  
**Goal**: Upload monthly sales data for reporting

### Scenario
A sales manager exports monthly sales from their CRM and wants to make it queryable.

### Test File
`test-data/sales_data.csv`

### Data Structure
| Column | Type | Description |
|--------|------|-------------|
| order_id | TEXT | Unique order identifier |
| customer_name | TEXT | Customer full name |
| product | TEXT | Product name |
| quantity | INTEGER | Units sold |
| unit_price | DECIMAL | Price per unit |
| total_amount | DECIMAL | quantity × unit_price |
| order_date | DATE | Sale date (YYYY-MM-DD) |
| region | TEXT | Sales region |

### Expected Workflow
1. **Upload**: User uploads `sales_data.csv`
2. **Preview**: System shows schema preview with inferred types
3. **Create Table**: User confirms, system creates `sales_data` table
4. **View Data**: User sees first 100 rows in table preview

### ETL Operations to Test
- **INSERT**: Initial data load (all rows)
- **TRUNCATE**: Clear table before monthly refresh
- **UPSERT**: Update existing orders by `order_id`

---

## Use Case 2: Employee Directory (Excel)

**Persona**: HR Administrator  
**Goal**: Maintain employee contact list for internal directory

### Scenario
HR maintains employee data in Excel and wants a searchable database.

### Test File
`test-data/employees.xlsx`

### Data Structure
| Column | Type | Description |
|--------|------|-------------|
| employee_id | TEXT | Employee ID (e.g., EMP001) |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| email | TEXT | Work email |
| department | TEXT | Department name |
| hire_date | DATE | Start date |
| salary | DECIMAL | Annual salary |
| is_active | BOOLEAN | Currently employed |

### Expected Workflow
1. **Upload**: User uploads `employees.xlsx`
2. **Preview**: System shows schema with inferred types
3. **Create Table**: User confirms table creation
4. **Update**: Monthly refresh with updated employee data

### ETL Operations to Test
- **INSERT**: Initial employee load
- **UPSERT**: Update existing employees by `employee_id`
- **DELETE**: Remove terminated employees

---

## Use Case 3: Product Inventory (CSV)

**Persona**: Operations Manager  
**Goal**: Track product inventory levels

### Scenario
Warehouse manager exports daily inventory counts and needs historical tracking.

### Test File
`test-data/inventory.csv`

### Data Structure
| Column | Type | Description |
|--------|------|-------------|
| sku | TEXT | Product SKU (unique key) |
| product_name | TEXT | Product display name |
| category | TEXT | Product category |
| quantity_on_hand | INTEGER | Current stock |
| reorder_point | INTEGER | Minimum stock threshold |
| unit_cost | DECIMAL | Cost per unit |
| last_updated | DATE | Inventory count date |

### Expected Workflow
1. **Upload**: Daily inventory export
2. **Preview**: Verify column detection
3. **Upsert**: Update existing products, insert new ones

### ETL Operations to Test
- **UPSERT**: Daily refresh by `sku`
- **INSERT**: Add new products
- **DROP**: Remove obsolete inventory table

---

## Use Case 4: Financial Transactions (CSV)

**Persona**: Finance Analyst  
**Goal**: Import transaction data for reconciliation

### Scenario
Finance team receives bank export and needs to reconcile with internal records.

### Test File
`test-data/transactions.csv`

### Data Structure
| Column | Type | Description |
|--------|------|-------------|
| transaction_id | TEXT | Bank transaction ID |
| transaction_date | DATE | Transaction date |
| description | TEXT | Transaction description |
| amount | DECIMAL | Transaction amount (+/-) |
| category | TEXT | Expense category |
| account | TEXT | Account name |
| is_reconciled | BOOLEAN | Reconciliation status |

### Expected Workflow
1. **Upload**: Monthly bank statement export
2. **Preview**: Verify amount and date parsing
3. **Insert**: Load new transactions
4. **Query**: Run reconciliation queries

### ETL Operations to Test
- **INSERT**: Append new transactions
- **DELETE**: Remove duplicate entries
- **TRUNCATE**: Clear for re-import

---

## Use Case 5: Customer Contacts (Excel)

**Persona**: Marketing Manager  
**Goal**: Maintain customer contact list for campaigns

### Scenario
Marketing has a customer list in Excel for email campaigns.

### Test File
`test-data/customers.xlsx`

### Data Structure
| Column | Type | Description |
|--------|------|-------------|
| customer_id | TEXT | Customer ID |
| company_name | TEXT | Company name |
| contact_name | TEXT | Primary contact |
| email | TEXT | Contact email |
| phone | TEXT | Contact phone |
| city | TEXT | City |
| country | TEXT | Country |
| signup_date | DATE | Account creation date |
| is_subscribed | BOOLEAN | Email opt-in status |

### Expected Workflow
1. **Upload**: Customer list export
2. **Preview**: Verify email and phone formats
3. **Upsert**: Update existing contacts

### ETL Operations to Test
- **INSERT**: Initial customer load
- **UPSERT**: Update by `customer_id`
- **DELETE**: Remove unsubscribed customers

---

## Test Data Summary

| Use Case | File | Rows | Format | Key Column |
|----------|------|------|--------|------------|
| Sales Data | `sales_data.csv` | 50 | CSV | order_id |
| Employees | `employees.xlsx` | 25 | Excel | employee_id |
| Inventory | `inventory.csv` | 30 | CSV | sku |
| Transactions | `transactions.csv` | 100 | CSV | transaction_id |
| Customers | `customers.xlsx` | 40 | Excel | customer_id |

---

## Storage Quota Testing

### Free Plan Limits
- **Tables**: 20 maximum
- **Storage**: 1 GB (1024 MB)

### Test Scenarios
1. **Within Quota**: Upload 5 small files (~5 MB each)
2. **Near Limit**: Upload file that brings total to 90%
3. **Over Limit**: Attempt upload that exceeds quota (expect rejection)

---

## Error Handling Scenarios

### Invalid Data
1. **Malformed CSV**: Missing columns, inconsistent rows
2. **Wrong Types**: Text in numeric columns
3. **Empty File**: CSV/Excel with headers only

### System Errors
1. **Duplicate Table**: Create table that already exists
2. **Invalid Upsert Key**: Upsert on non-existent column
3. **Quota Exceeded**: Upload beyond storage limit

---

## ETL Operation Matrix

| Operation | Description | Confirmation Required | Reversible |
|-----------|-------------|----------------------|------------|
| INSERT | Add new rows | No | No |
| UPSERT | Insert or update by key | No | No |
| DELETE | Remove rows by condition | Yes | No |
| TRUNCATE | Clear all rows | Yes | No |
| DROP | Delete entire table | Yes (2-step) | No |

---

## API Endpoints for Testing

### Upload Flow
```
POST /api/uploads/start          # Start upload session
POST /api/uploads/:id/chunk      # Upload file chunk
POST /api/uploads/:id/complete   # Finalize upload
GET  /api/uploads/:id/preview    # Get schema preview
POST /api/uploads/:id/create     # Create table from upload
```

### Table Operations
```
GET  /api/tables                 # List user tables
GET  /api/tables/:name/preview   # Preview table data
POST /api/tables/:name/truncate  # Truncate table
POST /api/tables/:name/drop      # Drop table
```

### ETL Operations
```
POST /api/etl/insert             # Insert rows
POST /api/etl/upsert             # Upsert rows
POST /api/etl/delete             # Delete rows
GET  /api/etl/history            # Operation history
```

---

## Test Users & Use Cases

### User-to-Use-Case Matrix

| User | Password | Best For Testing | Related Use Cases |
|------|----------|------------------|-------------------|
| `demo@pollen.dev` | `demo123` | General demo, happy path | All use cases |
| `fresh-user@test.pollen.dev` | `test123` | First-time user experience | UC1: First upload |
| `active-user@test.pollen.dev` | `test123` | Normal operations | UC1-UC5: All ETL operations |
| `table-limit@test.pollen.dev` | `test123` | Table quota warnings | UC3: Inventory (test limit) |
| `storage-limit@test.pollen.dev` | `test123` | Storage quota warnings | UC4: Transactions (large file) |
| `error-user@test.pollen.dev` | `test123` | Error handling UI | Error scenarios |
| `admin@test.pollen.dev` | `test123` | Admin features | All use cases (2GB quota) |

### User Details

#### 1. Demo User (General Testing)
- **Email**: `demo@pollen.dev`
- **Password**: `demo123`
- **Role**: Admin
- **Quota**: 1 GB / 20 tables
- **State**: Clean slate
- **Use Cases**: All - primary demo account

#### 2. Fresh User (Onboarding Flow)
- **Email**: `fresh-user@test.pollen.dev`
- **Password**: `test123`
- **Role**: Member
- **Quota**: 0 MB used / 1 GB limit, 0 tables
- **State**: Just signed up, never uploaded
- **Use Cases**: 
  - UC1 (Sales Data): Test first upload experience
  - Verify empty state UI
  - Test onboarding prompts

#### 3. Active User (Normal Operations)
- **Email**: `active-user@test.pollen.dev`
- **Password**: `test123`
- **Role**: Member
- **Quota**: 103 MB used / 1 GB, 5 tables
- **State**: Has existing tables (sales_data, inventory, customers, transactions, employees)
- **Use Cases**:
  - UC1-UC5: All upload scenarios
  - UC2 (Employees): Test upsert on existing table
  - UC3 (Inventory): Test daily refresh workflow
  - Test table list with multiple tables

#### 4. Table Limit User (Quota Warning)
- **Email**: `table-limit@test.pollen.dev`
- **Password**: `test123`
- **Role**: Member
- **Quota**: 450 MB used / 1 GB, **18 of 20 tables**
- **State**: Near table count limit
- **Use Cases**:
  - UC3 (Inventory): Test "approaching limit" warning
  - Test what happens when trying to create table #21
  - Verify DROP frees up table slot

#### 5. Storage Limit User (Capacity Warning)
- **Email**: `storage-limit@test.pollen.dev`
- **Password**: `test123`
- **Role**: Member
- **Quota**: **950 MB used / 1 GB (93%)**, 8 tables
- **State**: Near storage capacity
- **Use Cases**:
  - UC4 (Transactions): Test large file rejection
  - Test "storage nearly full" warning banner
  - Verify TRUNCATE/DROP reclaims space

#### 6. Error User (Failure Scenarios)
- **Email**: `error-user@test.pollen.dev`
- **Password**: `test123`
- **Role**: Member
- **Quota**: 45 MB used / 1 GB, 2 tables
- **State**: Has failed operations in history
- **Use Cases**:
  - Test error message display in ETL history
  - Test retry after failure
  - Verify failed operation doesn't corrupt data

#### 7. Admin User (Extended Quota)
- **Email**: `admin@test.pollen.dev`
- **Password**: `test123`
- **Role**: Admin
- **Quota**: 0 MB used / **2 GB limit**, 0 tables
- **State**: Clean slate with elevated quota
- **Use Cases**:
  - All use cases without hitting limits
  - Test admin-specific features (if any)
  - Bulk upload testing

---

## Running Tests

### Manual Testing
1. Start services: `.\start-dev.ps1`
2. Login as demo user
3. Navigate to `/uploads`
4. Upload test files from `test-data/` folder
5. Verify table creation and preview

### Automated Testing
```bash
cd backend
npm test                    # Unit tests
npm run test:integration    # Integration tests
```

---

## Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Upload Success Rate | 99% | Files uploaded without error |
| Type Inference Accuracy | 95% | Correct column types detected |
| ETL Operation Speed | < 5 sec/1000 rows | Insert/upsert performance |
| UI Response Time | < 2 sec | Page load and preview |

