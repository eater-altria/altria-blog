ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN avatar_key TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Backfill deterministic placeholders for existing rows.
UPDATE users
SET username = 'user_' || substr(replace(id, '-', ''), 1, 8)
WHERE username IS NULL OR trim(username) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);
