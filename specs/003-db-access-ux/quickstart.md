# Quickstart: Database Access & Upload UX

## DB Access
1. Go to Settings → Data Access.
2. Copy Host, Port, Database, Schema, Username, Password.
3. DBeaver: New PostgreSQL connection → paste values → Test.
4. psql:
   - `psql -h <HOST> -p <PORT> -U <USERNAME> -d <DATABASE>`
   - `SET search_path TO user_<uuid>; SELECT * FROM sales_data LIMIT 5;`

## Excel Multi-Sheet
1. Upload `.xlsx` file.
2. Select sheet when prompted.
3. Preview and Create Table.
4. Re-upload to process another sheet.

## Upload Page
- Use Upload page for all imports.
- Actions: Create Table, Upsert, Delete Rows, Truncate, Drop (confirmations required).

## Free Plan & Premium
- Free: 1GB storage, 20 tables max, basic operations.
- Premium: Click "Contact Us" to open form or mailto.

## Settings Redirect
- Authenticated users stay on Settings.
- Unauthenticated users are redirected to Login.
