ALTER TABLE post_published
ADD COLUMN read_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_post_published_read_count
ON post_published(read_count DESC, published_at DESC);
