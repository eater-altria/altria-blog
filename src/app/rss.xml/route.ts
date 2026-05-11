import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { posts, postPublished } from "@/db/schema";
import { absoluteUrl, getSiteBaseUrl } from "@/lib/site";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const db = await getDb();
  const rows = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      publishedAt: postPublished.publishedAt,
    })
    .from(posts)
    .innerJoin(postPublished, eq(postPublished.postId, posts.id))
    .orderBy(desc(postPublished.publishedAt))
    .limit(50);

  const site = getSiteBaseUrl();
  const items = rows
    .map((row) => {
      const url = absoluteUrl(`/writing/${row.slug}`);
      const pubDate = new Date(row.publishedAt).toUTCString();
      return `
    <item>
      <title>${escapeXml(row.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml("CF Edge Blog")}</title>
    <link>${escapeXml(`${site}/`)}</link>
    <description>${escapeXml("Published writing feed")}</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
