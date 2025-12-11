# Test Data Files

Sample data files for testing the MVP CSV/Excel upload workflow.

**Aligned with**: `docs/mvp-use-cases.md`

## Files

| File | Format | Rows | Use Case | Key Column |
|------|--------|------|----------|------------|
| `sales_data.csv` | CSV | 50 | Sales order tracking | `order_id` |
| `employees.xlsx` | Excel | 25 | Employee directory (HR) | `employee_id` |
| `inventory.csv` | CSV | 30 | Product inventory | `sku` |
| `transactions.csv` | CSV | 100 | Financial transactions | `transaction_id` |
| `customers.xlsx` | Excel | 40 | Customer contacts | `customer_id` |

## Generating Excel Files

Run this to create `.xlsx` files:

```bash
cd backend
node scripts/generate-test-excel.js
```

## Test Users

| User | Password | Scenario |
|------|----------|----------|
| `demo@pollen.dev` | `demo123` | General demo |
| `fresh-user@test.pollen.dev` | `test123` | First upload |
| `active-user@test.pollen.dev` | `test123` | Has 5 tables (upsert tests) |
| `table-limit@test.pollen.dev` | `test123` | 18/20 tables (limit warning) |
| `storage-limit@test.pollen.dev` | `test123` | 93% full (quota test) |

> Set passwords: `node backend/scripts/set-test-passwords.js`

## Quick Test Workflows

**Basic Upload**
1. Login as `demo@pollen.dev`
2. Upload `sales_data.csv`
3. Preview → Create table
4. View data

**Upsert Test**
1. Upload `inventory.csv` (create table)
2. Modify some quantities in CSV
3. Re-upload with "Upsert by sku"
4. Verify updates

**Storage Quota**
1. Login as `storage-limit@test.pollen.dev`
2. Upload large file → should warn/block

**Multi-Table**
1. Upload all 5 files as separate tables
2. Verify table list shows all
3. Check storage quota

See `docs/mvp-use-cases.md` for detailed scenarios.
