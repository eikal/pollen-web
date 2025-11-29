-- Add password_hash column to users table for storing hashed passwords
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Optionally create an index to lookup by lower(email)
CREATE INDEX IF NOT EXISTS users_lower_email_idx ON users (lower(email));
