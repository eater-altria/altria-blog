import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { postDrafts, posts } from "@/db/schema";
import { requireStaff } from "@/lib/auth/guards";
import { markdownToTrustedHtml } from "@/lib/render-post";
import { MermaidProse } from "@/components/post/MermaidRenderer";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminPreviewPage({ params }: PageProps) {
  const staff = await requireStaff();
  if (!staff) {
    redirect("/login?next=/admin");
  }

  const { id } = await params;
  const db = await getDb();

  const postRow = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!postRow) notFound();

  const draft = await db.select().from(postDrafts).where(eq(postDrafts.postId, id)).get();
  if (!draft) notFound();

  const html = await markdownToTrustedHtml(draft.markdown);

  return (
    <article className="flex flex-col gap-10">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={`/admin/posts/${id}`} className="story-link">
          ← 返回继续编辑
        </Link>
      </div>
      <div className="surface-card border-dashed border-[var(--line-strong)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent)]">
        当前显示的是<strong>草稿预览</strong>。在你再次发布之前，访客读取的仍然是上一个已发布快照。
      </div>
      <header className="surface-card p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">{postRow.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">预览模式 · 仅管理员可见</p>
      </header>
      <MermaidProse
        html={html}
        className="surface-card article-prose max-w-none p-6 text-base leading-8 [&_a]:text-[var(--accent)] [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--line-strong)] [&_blockquote]:pl-4 [&_code]:rounded-md [&_code]:bg-[rgba(31,106,93,0.08)] [&_code]:px-1.5 [&_code]:py-0.5 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-[var(--surface-border)] [&_pre]:bg-[#1b2331] [&_pre]:p-4 [&_pre]:text-[#f8fafc]"
      />
    </article>
  );
}
