import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { posts, postDrafts, postPublished } from "@/db/schema";

export default async function AdminHomePage() {
  const db = await getDb();
  const rows = await db
    .select({
      post: posts,
      draft: postDrafts,
      published: postPublished,
    })
    .from(posts)
    .leftJoin(postDrafts, eq(postDrafts.postId, posts.id))
    .leftJoin(postPublished, eq(postPublished.postId, posts.id))
    .orderBy(desc(posts.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="cyber-muted text-xs uppercase tracking-wide">仅管理员可见</p>
          <h1 className="cyber-title text-3xl font-semibold tracking-tight">文章管理后台</h1>
        </div>
        <Link
          href="/admin/posts/new"
          className="cyber-button px-4 py-2.5 text-sm"
        >
          新建草稿
        </Link>
      </div>
      <table className="cyber-panel w-full overflow-hidden text-sm">
        <thead className="border-b border-[var(--line-soft)] bg-white/60 text-left">
          <tr>
            <th className="px-4 py-2 font-semibold">标题</th>
            <th className="px-4 py-2 font-semibold">Slug</th>
            <th className="px-4 py-2 font-semibold">草稿更新时间</th>
            <th className="px-4 py-2 font-semibold">发布时间</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="cyber-muted px-4 py-6 text-center" colSpan={4}>
                还没有文章，请先创建一篇 Markdown 草稿。
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.post.id} className="border-t border-[var(--line-soft)]">
              <td className="px-4 py-3">
                <Link className="cyber-link font-medium" href={`/admin/posts/${row.post.id}`}>
                  {row.post.title}
                </Link>
              </td>
              <td className="cyber-muted px-4 py-3">{row.post.slug}</td>
              <td className="cyber-muted px-4 py-3 text-xs">
                {row.draft
                  ? new Date(row.draft.updatedAt).toLocaleString()
                  : "暂无"}
              </td>
              <td className="cyber-muted px-4 py-3 text-xs">
                {row.published
                  ? new Date(row.published.publishedAt).toLocaleString()
                  : "未发布"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
