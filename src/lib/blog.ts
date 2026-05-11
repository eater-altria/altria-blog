import { desc, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { posts, postPublished } from "@/db/schema";
import { contentWithoutFrontmatter } from "@/lib/md-body";

export type PublishedPostCard = {
  slug: string;
  title: string;
  publishedAt: number;
  readCount: number;
  excerpt: string;
  readingMinutes: number;
};

const MARKDOWN_DECORATION_RE =
  /(```[\s\S]*?```)|(`[^`]*`)|(!?\[[^\]]*\]\([^)]+\))|(^#{1,6}\s+)|(^>\s+)|(^[-*+]\s+)|(^\d+\.\s+)|([*_~>#`])/gm;

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

export function extractExcerpt(markdown: string, maxLength = 168): string {
  const plain = normalizeWhitespace(
    contentWithoutFrontmatter(markdown).replace(MARKDOWN_DECORATION_RE, " "),
  );

  if (!plain) return "这篇文章还没有摘要，去正文里看看作者这次在想什么。";
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function estimateReadingMinutes(markdown: string): number {
  const plain = normalizeWhitespace(
    contentWithoutFrontmatter(markdown).replace(MARKDOWN_DECORATION_RE, " "),
  );
  if (!plain) return 1;

  const latinWordCount = plain.split(" ").filter(Boolean).length;
  const cjkCount = Array.from(plain).filter((char) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(char)).length;
  const readingUnits = latinWordCount + cjkCount * 0.65;
  return Math.max(1, Math.round(readingUnits / 220));
}

export async function listPublishedPostCards(db: Db): Promise<PublishedPostCard[]> {
  const rows = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      publishedAt: postPublished.publishedAt,
      readCount: postPublished.readCount,
      markdown: postPublished.markdown,
    })
    .from(posts)
    .innerJoin(postPublished, eq(postPublished.postId, posts.id))
    .orderBy(desc(postPublished.publishedAt));

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    publishedAt: row.publishedAt,
    readCount: row.readCount,
    excerpt: extractExcerpt(row.markdown),
    readingMinutes: estimateReadingMinutes(row.markdown),
  }));
}

export function formatLongDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
