import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { posts, postPublished } from "@/db/schema";

export default async function PostsPage() {
  const db = await getDb();
  const rows = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      publishedAt: postPublished.publishedAt,
    })
    .from(posts)
    .innerJoin(postPublished, eq(postPublished.postId, posts.id))
    .orderBy(desc(postPublished.publishedAt));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="cyber-title text-3xl font-semibold tracking-tight">Articles</h1>
        <p className="cyber-muted mt-2 text-sm">
          Only posts with a published snapshot appear here ({rows.length}).
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {rows.length === 0 && (
          <li className="cyber-panel py-10 text-center text-sm cyber-muted">
            Nothing published yet. Super admins publish from the dashboard.
          </li>
        )}
        {rows.map((row) => (
          <li key={row.slug} className="cyber-panel px-5 py-5 transition hover:-translate-y-0.5 hover:border-cyan-300/50">
            <Link
              className="cyber-link text-lg font-semibold tracking-tight"
              href={`/posts/${row.slug}`}
            >
              {row.title}
            </Link>
            <p className="cyber-muted mt-2 text-xs uppercase tracking-[0.15em]">
              {new Date(row.publishedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
