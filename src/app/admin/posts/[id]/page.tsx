import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { postDrafts, posts } from "@/db/schema";
import { EditPostForm } from "@/components/forms/EditPostForm";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminEditPostPage({ params }: PageProps) {
  const { id } = await params;
  const db = await getDb();
  const postRow = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!postRow) notFound();
  const draft = await db.select().from(postDrafts).where(eq(postDrafts.postId, id)).get();
  const markdown = draft?.markdown ?? "---\ntitle: Untitled\n---\n";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin"
            className="cyber-link text-sm"
          >
            ← 返回后台首页
          </Link>
          <h1 className="cyber-title mt-2 text-2xl font-semibold">{postRow.title}</h1>
          <p className="cyber-muted text-sm">slug: {postRow.slug}</p>
        </div>
        <a
          href={`/writing/${postRow.slug}`}
          className="cyber-link text-sm underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          查看线上页面
        </a>
      </div>
      <EditPostForm postId={postRow.id} initialMarkdown={markdown} />
    </div>
  );
}
