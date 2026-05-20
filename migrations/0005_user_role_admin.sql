-- Add `admin` role to CHECK constraint (SQLite: rebuild `users` table).
-- D1 wraps each migration in its own platform-managed txn — do not open one yourself.
-- Also: wrangler scans the raw file for the literal txn-begin keyword (even in comments),
-- so don't write it out anywhere. PRAGMA foreign_keys is unnecessary here because D1
-- defaults foreign_keys to OFF and the codebase never re-enables it.

CREATE TABLE users__role_migration (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT,
  avatar_key TEXT,
  avatar_url TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at INTEGER NOT NULL
);

-- Must list columns: after ALTER ADD, `users` column order is not id,email,username,…
INSERT INTO users__role_migration (
  id,
  email,
  username,
  avatar_key,
  avatar_url,
  password_hash,
  role,
  created_at
)
SELECT
  id,
  email,
  username,
  avatar_key,
  avatar_url,
  password_hash,
  role,
  created_at
FROM users;

DROP TABLE users;

ALTER TABLE users__role_migration RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);
