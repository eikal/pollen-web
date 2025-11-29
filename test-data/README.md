# Test Data Files

This folder contains sample data files for testing the MVP upload workflow.

## Test Users

| User | Password | Scenario | Use With |
|------|----------|----------|----------|
| `demo@pollen.dev` | `demo123` | General demo | Any file |
| `fresh-user@test.pollen.dev` | `test123` | First upload | `sales_data.csv` |
| `active-user@test.pollen.dev` | `test123` | Has 5 tables | Upsert tests |
| `table-limit@test.pollen.dev` | `test123` | 18/20 tables | Test limit warning |
| `storage-limit@test.pollen.dev` | `test123` | 93% full | Large file rejection |
| `error-user@test.pollen.dev` | `test123` | Has failures | Error UI testing |
| `admin@test.pollen.dev` | `test123` | 2GB quota | Bulk uploads |

> To set passwords after migrations: `node scripts/set-test-passwords.js`

## Files

| File | Format | Rows | Use Case |
|------|--------|------|----------|
| `sales_data.csv` | CSV | 50 | Sales order tracking |
| `inventory.csv` | CSV | 30 | Product inventory management |
| `transactions.csv` | CSV | 100 | Financial transaction reconciliation |
| `employees.xlsx` | Excel | 25 | Employee directory (HR) |
| `customers.xlsx` | Excel | 40 | Customer contacts (Marketing) |

## Generating Excel Files

Excel files need to be generated using the script:

```bash
cd backend
node scripts/generate-test-excel.js
```

## Data Characteristics

### sales_data.csv
- **Key column**: `order_id` (for upsert operations)
- **Type inference**: Dates, decimals, integers, text
- **Region values**: North, South, East, West

### inventory.csv
- **Key column**: `sku` (for upsert operations)
- **Type inference**: Integers, decimals, dates, text
- **Categories**: Widgets, Gadgets, Tools, Supplies, Accessories, Components, Parts

### transactions.csv
- **Key column**: `transaction_id` (for upsert operations)
- **Type inference**: Dates, decimals (positive/negative), booleans, text
- **Categories**: Revenue, expenses, payroll, etc.

### employees.xlsx
- **Key column**: `employee_id` (for upsert operations)
- **Type inference**: Dates, decimals, booleans, text
- **Departments**: Engineering, Marketing, Sales, HR, Finance, Operations

### customers.xlsx
- **Key column**: `customer_id` (for upsert operations)
- **Type inference**: Dates, booleans, text
- **Countries**: USA, UK, Germany, Japan, Sweden, Australia, Switzerland, Brazil, Norway, China

## Testing Workflows

### Basic Upload Flow
1. Upload `sales_data.csv`
2. Preview schema (verify type inference)
3. Create table
4. View data preview

### Upsert Flow
1. Create table from `inventory.csv`
2. Modify some rows in CSV (change quantities)
3. Re-upload with upsert operation on `sku`
4. Verify updates applied

### Multi-Table Flow
1. Upload `sales_data.csv` → create `sales_data` table
2. Upload `inventory.csv` → create `inventory` table
3. Verify both tables appear in table list
4. Verify storage quota updated

### Cleanup Flow
1. Create table from test file
2. Test TRUNCATE (clear data, keep structure)
3. Test DROP (remove entire table)
4. Verify storage quota decreased
