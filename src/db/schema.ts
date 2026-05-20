import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username"),
  avatarKey: text("avatar_key"),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const postDrafts = sqliteTable("post_drafts", {
  postId: text("post_id")
    .primaryKey()
    .references(() => posts.id, { onDelete: "cascade" }),
  markdown: text("markdown").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const postPublished = sqliteTable("post_published", {
  postId: text("post_id")
    .primaryKey()
    .references(() => posts.id, { onDelete: "cascade" }),
  markdown: text("markdown").notNull(),
  readCount: integer("read_count").notNull().default(0),
  publishedAt: integer("published_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** If set, this row is a reply to another comment on the same post (see migration FK). */
  parentCommentId: text("parent_comment_id"),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),
});

/** Fixed-window rate-limit counters for `/api/tts`. Bucket key encodes subject + window. */
export const ttsRateLimit = sqliteTable("tts_rate_limit", {
  bucketKey: text("bucket_key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: integer("window_start").notNull(),
});

export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
