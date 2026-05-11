-- Threaded replies: optional parent comment on the same post.
ALTER TABLE comments ADD COLUMN parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
