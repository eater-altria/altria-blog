import Link from "next/link";
import type { PublishedPostCard } from "@/lib/blog";
import { formatShortDate } from "@/lib/blog";

type PostCardProps = {
  post: PublishedPostCard;
  featured?: boolean;
};

export function PostCard({ post, featured = false }: PostCardProps) {
  return (
    <article
      className={[
        "surface-card group transition duration-200 hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[0_28px_80px_rgba(15,23,42,0.08)]",
        featured ? "p-7 sm:p-8" : "p-6",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-strong)]">
        <span>{formatShortDate(post.publishedAt)}</span>
        <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
        <span>{post.readingMinutes} 分钟阅读</span>
        <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
        <span>{post.readCount} 次阅读</span>
      </div>
      <h2
        className={[
          "mt-4 font-semibold tracking-tight text-[var(--foreground)]",
          featured ? "text-[1.85rem] leading-tight sm:text-[2.15rem]" : "text-xl leading-tight",
        ].join(" ")}
      >
        <Link href={`/writing/${post.slug}`} className="story-link">
          {post.title}
        </Link>
      </h2>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-[15px]">{post.excerpt}</p>
      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          href={`/writing/${post.slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] transition hover:text-[var(--accent)]"
        >
          阅读全文
          <span aria-hidden>→</span>
        </Link>
        <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted-strong)]">
          Essay
        </span>
      </div>
    </article>
  );
}
