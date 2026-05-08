import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { escape } from "html-escaper";
import { getDb } from "@/db";
import { comments, posts, postPublished, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/guards";
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

export default async function PublishedPostPage({ params }: PageProps) {
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
      <Link className="cyber-link text-sm" href="/posts">
        ← 全部文章
      </Link>
      <header className="cyber-panel relative z-10 p-6">
        <h1 className="cyber-title text-3xl font-semibold tracking-tight">{postRow.title}</h1>
        <p className="cyber-muted mt-2 text-sm">
          发布于 {new Date(published.publishedAt).toLocaleString()}
        </p>
        <p className="cyber-muted mt-2 text-xs uppercase tracking-[0.14em]">{engagementSummary}</p>
      </header>
      <ArticleTocProgress
        toc={toc}
        proseHtml={html}
        proseClassName={
          "cyber-panel relative z-10 max-w-none p-6 text-base leading-7 text-[#dce7ff] " +
          "[&_blockquote]:border-l [&_blockquote]:border-cyan-400/45 [&_li]:leading-8 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-8 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-cyan-300 [&_a]:underline " +
          "[&_code]:rounded [&_code]:bg-[#101a35] [&_code]:px-1 [&_code]:py-px [&_h1]:mt-10 [&_h1]:scroll-mt-28 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:scroll-mt-28 [&_h2]:text-2xl [&_h2]:font-semibold " +
          "[&_h3]:mt-6 [&_h3]:scroll-mt-28 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:scroll-mt-28 [&_h5]:scroll-mt-28 [&_h6]:scroll-mt-28 " +
          "[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-cyan-400/25 [&_pre]:bg-[#0a1229] [&_pre]:p-4"
        }
      >
        <section className="cyber-panel relative z-10 w-full p-6">
          <h2 className="text-lg font-semibold">评论区</h2>
          <p className="cyber-muted mt-1 text-sm">
            {user
              ? "欢迎留言交流，只有已登录用户可以发表评论。"
              : "登录后可发表评论，游客仍可正常阅读文章。"}
          </p>
          {user && (
            <div className="mt-4">
              <CommentForm slug={slug} siteKey={siteKey} />
            </div>
          )}
          <ul className="mt-6 space-y-4">
            {commentRows.length === 0 && (
              <li className="cyber-muted text-sm">还没有评论，来抢沙发吧。</li>
            )}
            {commentRows.map((c) => (
              <li key={c.id} className="rounded-xl border border-cyan-400/25 bg-[#0b1329] p-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 overflow-hidden rounded-full border border-cyan-400/35 bg-[#11203e]">
                    {c.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <p className="text-xs text-cyan-100/75">{escape(c.username ?? "匿名用户")}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{escape(c.body)}</p>
                <p className="mt-2 text-xs text-cyan-50/50">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </ArticleTocProgress>
    </article>
  );
}
