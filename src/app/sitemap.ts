import { desc, eq } from "drizzle-orm";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
import { getDb } from "@/db";
import { posts, postPublished } from "@/db/schema";
import { absoluteUrl, getSiteBaseUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDb();
  const rows = await db
    .select({
      slug: posts.slug,
      publishedAt: postPublished.publishedAt,
    })
    .from(posts)
    .innerJoin(postPublished, eq(postPublished.postId, posts.id))
    .orderBy(desc(postPublished.publishedAt));

  const base = getSiteBaseUrl();
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: new Date(),
    },
    {
      url: `${base}/writing`,
      lastModified: new Date(),
    },
  ];

  const postEntries: MetadataRoute.Sitemap = rows.map((row) => ({
    url: absoluteUrl(`/writing/${row.slug}`),
    lastModified: new Date(row.publishedAt),
  }));

  return [...staticEntries, ...postEntries];
}
