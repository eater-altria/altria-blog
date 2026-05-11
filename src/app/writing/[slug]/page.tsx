import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { escape } from "html-escaper";
import { getDb } from "@/db";
import { comments, posts, postPublished, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/guards";
import { formatLongDate } from "@/lib/blog";
import {
  getArticleEngagementSummary,
  getDisplayedReadCount,
  getPostCommentCount,
  incrementPublishedPostReadCount,
} from "@/lib/post-engagement";
import { markdownToTrustedArticle } from "@/lib/render-post";
import { ArticleTocProgress } from "@/components/post/ArticleTocProgress";
import { CommentForm } from "@/components/forms/CommentForm";
import { getTurnstileSiteKey } from "@/lib/public-env";

type PageProps = { params: Promise<{ slug: string }> };

export default async function WritingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const db = await getDb();

  const postRow = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!postRow) notFound();

  const published = await db
    .select()
    .from(postPublished)
    .where(eq(postPublished.postId, postRow.id))
    .get();

  if (!published) notFound();

  await incrementPublishedPostReadCount(db, postRow.id);

  const { html, toc } = await markdownToTrustedArticle(published.markdown);
  const displayedReadCount = getDisplayedReadCount(published.readCount);
  const commentCount = await getPostCommentCount(db, postRow.id);
  const engagementSummary = getArticleEngagementSummary(displayedReadCount, commentCount);

  const commentRows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postRow.id))
    .orderBy(asc(comments.createdAt));

  const user = await getCurrentUser();
  const siteKey = await getTurnstileSiteKey();

  return (
    <article className="space-y-10">
      <Link className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)]" href="/writing">
        <span aria-hidden>←</span>
        返回文章归档
      </Link>

      <header className="border-b border-[var(--line-soft)] pb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--muted-strong)]">
          <span>Essay</span>
          <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
          <span>{formatLongDate(published.publishedAt)}</span>
        </div>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
          {postRow.title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{engagementSummary}</p>
      </header>

      <ArticleTocProgress
        toc={toc}
        proseHtml={html}
        proseClassName={
          "surface-card article-prose max-w-none p-6 sm:p-8 lg:p-10 text-[15px] leading-8 " +
          "[&_a]:text-[var(--accent)] [&_a]:underline [&_a]:underline-offset-4 " +
          "[&_blockquote]:border-l-2 [&_blockquote]:border-[var(--line-strong)] [&_blockquote]:pl-4 [&_blockquote]:italic " +
          "[&_code]:rounded-md [&_code]:bg-[rgba(31,106,93,0.08)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.92em] " +
          "[&_h1]:mt-12 [&_h1]:scroll-mt-28 [&_h1]:text-3xl [&_h2]:mt-10 [&_h2]:scroll-mt-28 [&_h2]:text-2xl " +
          "[&_h3]:mt-8 [&_h3]:scroll-mt-28 [&_h3]:text-xl [&_h4]:mt-6 [&_h4]:scroll-mt-28 " +
          "[&_img]:rounded-2xl [&_img]:border [&_img]:border-[var(--surface-border)] " +
          "[&_li]:leading-8 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl " +
          "[&_pre]:border [&_pre]:border-[var(--surface-border)] [&_pre]:bg-[#1b2331] [&_pre]:p-4 [&_pre]:text-[#f8fafc] " +
          "[&_p]:leading-8 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
        }
      >
        <section className="surface-card w-full p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">评论</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                {user
                  ? "欢迎留言交流。你的用户名和头像会显示在评论区里。"
                  : "登录后可以发表评论，游客仍然可以完整阅读正文。"}
              </p>
            </div>
            <span className="soft-pill px-3 py-1.5 text-xs font-medium">{commentRows.length} 条留言</span>
          </div>
          {user ? (
            <div className="mt-6">
              <CommentForm slug={slug} siteKey={siteKey} />
            </div>
          ) : null}
          <ul className="mt-8 space-y-4">
            {commentRows.length === 0 ? (
              <li className="text-sm text-[var(--muted)]">还没有评论，第一条留言会很显眼。</li>
            ) : null}
            {commentRows.map((comment) => (
              <li key={comment.id} className="rounded-[1.2rem] border border-[var(--surface-border)] bg-white/55 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-[var(--surface-border)] bg-[var(--surface-strong)]">
                    {comment.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={comment.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[var(--muted-strong)]">
                        无
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {escape(comment.username ?? "匿名用户")}
                    </p>
                    <p className="text-xs text-[var(--muted-strong)]">
                      {new Date(comment.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">
                  {escape(comment.body)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </ArticleTocProgress>
    </article>
  );
}
