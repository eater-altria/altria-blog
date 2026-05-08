import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { postDrafts, posts } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { markdownToTrustedHtml } from "@/lib/render-post";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminPreviewPage({ params }: PageProps) {
  const admin = await requireSuperAdmin();
  if (!admin) {
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
    <article className="relative flex flex-col gap-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-30%] top-[-260px] h-[620px] bg-[radial-gradient(58%_72%_at_50%_50%,rgba(0,245,255,0.10)_0%,rgba(122,92,255,0.07)_42%,rgba(255,43,214,0.05)_62%,transparent_100%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-36 top-1/3 h-72 w-72 rounded-full bg-cyan-400/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-36 top-[46%] h-72 w-72 rounded-full bg-fuchsia-500/8 blur-3xl"
      />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={`/admin/posts/${id}`} className="cyber-link">
          ← 返回继续编辑
        </Link>
      </div>
      <div className="cyber-panel relative z-10 border-dashed border-fuchsia-400/55 p-4 text-sm text-fuchsia-100/90">
        当前显示的是<strong>草稿预览</strong>。在你再次发布之前，访客读取的仍然是上一个已发布快照。
      </div>
      <header className="cyber-panel relative z-10 p-6">
        <h1 className="cyber-title text-3xl font-semibold tracking-tight">{postRow.title}</h1>
        <p className="cyber-muted mt-2 text-sm">预览模式 · 仅管理员可见</p>
      </header>
      <section
        className="cyber-panel relative z-10 max-w-none p-6 text-base leading-7 text-[#dce7ff] [&_blockquote]:border-l [&_blockquote]:border-cyan-400/45 [&_li]:leading-8 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-8 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-cyan-300 [&_a]:underline [&_code]:rounded [&_code]:bg-[#101a35] [&_code]:px-1 [&_code]:py-px [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-cyan-400/25 [&_pre]:bg-[#0a1229] [&_pre]:p-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
