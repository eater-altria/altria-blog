import Link from "next/link";
import { getDb } from "@/db";
import { getHotPublishedPosts, rankHotPosts } from "@/lib/post-engagement";

export default async function Home() {
  const db = await getDb();
  const hotPosts = rankHotPosts(await getHotPublishedPosts(db, 20), 3);

  return (
    <div className="flex flex-col gap-8">
      <section className="cyber-panel relative overflow-hidden p-7 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <h1 className="cyber-title mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Altria 的部落格
        </h1>
        <p className="cyber-muted mt-4  max-w-2xl leading-relaxed">
          嗨，我是 Altria，一名全栈开发工程师。日常用 TypeScript、Golang 和 Rust 写代码，
          着迷于 AI 的一切新可能。业余时间喜欢收集各种各样的小裙子，也喜欢折腾软路由和家庭网络，
          对任何冒头的新技术都保持好奇心。
        </p>
      </section>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="cyber-button px-4 py-2 font-semibold tracking-wide" href="/posts">
          浏览文章
        </Link>
        <Link className="cyber-button-secondary px-4 py-2" href="/register">
          注册账号
        </Link>
        <Link className="cyber-chip px-4 py-2" href="/rss.xml">
          RSS 订阅
        </Link>
      </div>
      <section className="cyber-panel p-6">
        <h2 className="cyber-title text-xl font-semibold tracking-tight">热门文章</h2>
        <p className="cyber-muted mt-2 text-sm">按阅读数排序</p>
        <ul className="mt-5 space-y-3">
          {hotPosts.length === 0 && <li className="cyber-muted text-sm">暂无已发布文章，稍后再来看看。</li>}
          {hotPosts.map((post, index) => (
            <li
              key={post.postId}
              className="rounded-xl border border-cyan-400/25 bg-[#0b1329] px-4 py-3 transition hover:border-cyan-300/45"
            >
              <Link className="cyber-link text-sm font-semibold" href={`/posts/${post.slug}`}>
                TOP {index + 1} · {post.title}
              </Link>
              <p className="cyber-muted mt-1 text-xs">
                阅读 {post.readCount} · 发布于{" "}
                {new Date(post.publishedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
