import Link from "next/link";
import { getDb } from "@/db";
import { listPublishedPostCards } from "@/lib/blog";
import { PostCard } from "@/components/site/PostCard";
import { Reveal } from "@/components/motion/Reveal";

export default async function Home() {
  const db = await getDb();
  const publishedPosts = await listPublishedPostCards(db);
  const latestPosts = publishedPosts.slice(0, 5);
  const featuredPost = latestPosts[0] ?? null;
  const secondaryPosts = latestPosts.slice(1);
  const popularPosts = [...publishedPosts]
    .sort((left, right) => right.readCount - left.readCount || right.publishedAt - left.publishedAt)
    .slice(0, 3);

  return (
    <div className="space-y-16">
      <section className="grid gap-10 border-b border-[var(--line-soft)] pb-14 lg:grid-cols-[minmax(0,1.35fr)_18rem] lg:items-end">
        <Reveal className="space-y-6">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted-strong)]">
            Personal blog
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-[var(--foreground)] sm:text-6xl">
            写代码、记灵感，也认真过日子。
          </h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            我是 Altria，做全栈开发，也长期沉迷于 AI、工程细节、家庭网络和那些值得被写下来的新鲜感。
            这里更像一本持续更新的工作手帐，而不是只摆成果的橱窗。
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="button-primary px-5 py-3 font-medium" href="/writing">
              开始阅读
            </Link>
            <Link className="button-secondary px-5 py-3" href="/register">
              注册参与评论
            </Link>
            <Link className="soft-pill px-4 py-2.5 text-sm font-medium" href="/rss.xml">
              RSS 订阅
            </Link>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <Reveal className="surface-card p-5" delay={1}>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-strong)]">已发布</p>
            <p className="mt-3 text-3xl font-semibold">{publishedPosts.length}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">所有公开文章都会在这里长期归档。</p>
          </Reveal>
          <Reveal className="surface-card p-5" delay={2}>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-strong)]">关注主题</p>
            <p className="mt-3 text-xl font-semibold">Engineering · AI</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">也会穿插产品观察和一点生活记录。</p>
          </Reveal>
        </div>
      </section>

      <section className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.25fr)_20rem]">
        <Reveal className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                Recent writing
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[2rem]">
                最近更新
              </h2>
            </div>
            <Link href="/writing" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]">
              查看归档
            </Link>
          </div>
          {featuredPost ? <PostCard post={featuredPost} featured /> : null}
          {secondaryPosts.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {secondaryPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          ) : null}
          {publishedPosts.length === 0 ? (
            <div className="surface-card p-8 text-sm text-[var(--muted)]">
              还没有已发布文章。等第一篇上线之后，这里会变成一张很完整的阅读首页。
            </div>
          ) : null}
        </Reveal>

        <Reveal as="aside" className="space-y-6" delay={1}>
          <div className="surface-card p-6">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-strong)]">
              Popular
            </p>
            <ol className="mt-5 space-y-4">
              {popularPosts.map((post, index) => (
                <li key={post.slug} className="border-b border-[var(--line-soft)] pb-4 last:border-b-0 last:pb-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                    0{index + 1}
                  </p>
                  <Link href={`/writing/${post.slug}`} className="story-link mt-2 block text-base font-semibold leading-7">
                    {post.title}
                  </Link>
                  <p className="mt-2 text-sm text-[var(--muted)]">{post.readCount} 次阅读</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="surface-card p-6">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-strong)]">
              About this place
            </p>
            <p className="mt-4 text-sm leading-8 text-[var(--muted)]">
              我想把这个站点做成一个安静但有温度的个人博客。内容不追求“每篇都像代表作”，更重视持续思考和表达。
            </p>
            <p className="mt-4 text-sm leading-8 text-[var(--muted)]">
              如果你也在折腾 AI、工程、产品，或者只是想偶尔读点真实工作里的感受，欢迎来这里看看。
            </p>
          </div>
        </Reveal>
      </section>

      <section className="grid gap-6 border-t border-[var(--line-soft)] pt-10 md:grid-cols-3">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-strong)]">
            Writing rhythm
          </p>
          <p className="mt-3 text-sm leading-8 text-[var(--muted)]">
            这里会持续记录工程实践、AI 工具、产品观察，还有一些值得慢慢写下来的日常想法。
          </p>
        </Reveal>
        <Reveal delay={1}>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-strong)]">
            Reading mood
          </p>
          <p className="mt-3 text-sm leading-8 text-[var(--muted)]">
            我希望这里的文章读起来是安静的、完整的，不急着下结论，也不把思考压缩成只有结尾的摘要。
          </p>
        </Reveal>
        <Reveal delay={2}>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-strong)]">
            Small conversations
          </p>
          <p className="mt-3 text-sm leading-8 text-[var(--muted)]">
            如果某篇文章刚好也碰到了你的经验或情绪，欢迎留下几句回应，让这里慢慢长出一点交流感。
          </p>
        </Reveal>
      </section>
    </div>
  );
}
