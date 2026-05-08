import { desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { comments, posts, postPublished } from "@/db/schema";
import {
  getArticleEngagementSummary,
  getDisplayedReadCount,
  rankHotPosts,
  type HotPostItem,
} from "@/lib/post-engagement-utils";

export { getArticleEngagementSummary, getDisplayedReadCount, rankHotPosts };
export type { HotPostItem };

export async function incrementPublishedPostReadCount(db: Db, postId: string): Promise<void> {
  await db
    .update(postPublished)
    .set({
      readCount: sql`${postPublished.readCount} + 1`,
    })
    .where(eq(postPublished.postId, postId));
}

export async function getHotPublishedPosts(db: Db, limit = 3) {
  return db
    .select({
      postId: posts.id,
      slug: posts.slug,
      title: posts.title,
      publishedAt: postPublished.publishedAt,
      readCount: postPublished.readCount,
    })
    .from(posts)
    .innerJoin(postPublished, eq(postPublished.postId, posts.id))
    .orderBy(desc(postPublished.readCount), desc(postPublished.publishedAt))
    .limit(limit);
}

export async function getPostCommentCount(db: Db, postId: string): Promise<number> {
  const row = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(comments)
    .where(eq(comments.postId, postId))
    .get();

  return Number(row?.count ?? 0);
}
