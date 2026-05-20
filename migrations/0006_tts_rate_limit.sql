-- Fixed-window rate-limit counter for /api/tts. Each row is a (subject, minute-window) bucket.
-- D1 wraps each migration in its own platform-managed txn — do not open one yourself.

CREATE TABLE IF NOT EXISTS tts_rate_limit (
  bucket_key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tts_rate_limit_window_start ON tts_rate_limit(window_start);
