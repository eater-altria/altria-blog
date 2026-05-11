import { getDb } from "@/db";
import { listPublishedPostCards } from "@/lib/blog";
import { PostCard } from "@/components/site/PostCard";

export default async function WritingPage() {
  const db = await getDb();
  const posts = await listPublishedPostCards(db);
  const lead = posts[0] ?? null;
  const rest = posts.slice(1);

  return (
    <div className="space-y-10">
      <header className="space-y-4 border-b border-[var(--line-soft)] pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted-strong)]">
          Writing
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
          写作与笔记
        </h1>
        <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">
          这里收录所有已发布文章。内容会偏向工程实践、产品感受、AI、以及我偶尔认真记录下来的生活观察。
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-strong)]">总文章数</p>
          <p className="mt-3 text-3xl font-semibold">{posts.length}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-strong)]">写作节奏</p>
          <p className="mt-3 text-lg font-semibold">长期更新</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">公开区只展示已发布快照，草稿仍在后台继续打磨。</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-strong)]">阅读建议</p>
          <p className="mt-3 text-lg font-semibold">从最新一篇开始</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">也可以按热门列表回看站内最常被读到的内容。</p>
        </div>
      </div>

      {lead ? <PostCard post={lead} featured /> : null}

      {rest.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : null}

      {posts.length === 0 ? (
        <div className="surface-card p-10 text-center text-sm leading-7 text-[var(--muted)]">
          暂时还没有已发布文章。等第一篇正式上线之后，这里会成为完整归档页。
        </div>
      ) : null}
    </div>
  );
}
