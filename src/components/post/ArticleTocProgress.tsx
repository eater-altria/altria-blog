"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactElement, type ReactNode } from "react";
import type { TocItem } from "@/lib/md-reading-nav";
import { useMermaidHtml } from "@/components/post/MermaidRenderer";

type Props = {
  toc: TocItem[];
  proseHtml: string;
  proseClassName: string;
  /** Stacks under the prose column so body + footer blocks share the same width (e.g. comments). */
  children?: ReactNode;
};

/** Fixed reading progress overlay (thin bar at top edge of viewport). */
function ReadingProgressPortal({ pct }: { pct: number }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px]" aria-hidden>
      <div
        className="h-full rounded-b-sm bg-[linear-gradient(90deg,var(--accent)_0%,var(--muted)_55%,var(--accent-rose)_100%)]"
        style={{
          transform: `scaleX(${Math.min(100, Math.max(0, pct)) / 100})`,
          transformOrigin: "left center",
          willChange: "transform",
        }}
      />
    </div>
  );
}

function tocLinkTypography(active: boolean) {
  return [
    "block rounded-xl px-2.5 py-2 text-[13px] leading-snug transition-colors focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
    active
      ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-[inset_0_0_0_1px_var(--line-strong)]"
      : "text-[var(--muted)] hover:bg-[var(--surface-raised-strong)] hover:text-[var(--foreground)]",
  ].join(" ");
}

/** Headings rendered from Markdown expose stable ids referenced by entries; must match SSR output. */
function collectHeadingTargets(root: HTMLElement, toc: TocItem[]): HTMLElement[] {
  return toc.map((entry) => root.querySelector(`#${CSS.escape(entry.id)}`)).filter(Boolean) as HTMLElement[];
}

export function ArticleTocProgress({ toc, proseHtml, proseClassName, children }: Props): ReactElement {
  const renderedHtml = useMermaidHtml(proseHtml);
  const rootRef = useRef<HTMLElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(toc[0]?.id ?? null);
  const [readPct, setReadPct] = useState(0);
  const rafRef = useRef<number | null>(null);

  const hasToc = toc.length > 0;

  const recomputeFromDom = useCallback(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;

    const rect = rootEl.getBoundingClientRect();
    const elTopAbs = rect.top + window.scrollY;
    const elBottomAbs = elTopAbs + rootEl.offsetHeight;

    /** Progress through prose only; ignore comments below article body. */
    const viewBottom = window.scrollY + window.innerHeight;
    const denom = Math.max(rootEl.offsetHeight - window.innerHeight * 0.25, 1);
    let raw = viewBottom - elTopAbs - window.innerHeight * 0.15;
    if (rootEl.offsetHeight <= window.innerHeight * 0.85) {
      raw = viewBottom >= elBottomAbs - 48 ? denom : raw * 0.45;
    }
    const pct = Math.min(100, Math.max(0, (raw / denom) * 100));

    let nextActive = toc[0]?.id ?? null;
    if (hasToc) {
      const targets = collectHeadingTargets(rootEl, toc);
      const line = window.innerHeight * 0.22;
      for (let i = targets.length - 1; i >= 0; i -= 1) {
        const h = targets[i];
        const tr = h.getBoundingClientRect();
        if (tr.top <= line) {
          nextActive = toc[i]?.id ?? null;
          break;
        }
      }
      /** Above first heading: keep first TOC entry highlighted. */
      if (targets.length > 0 && targets[0].getBoundingClientRect().top > line) {
        nextActive = toc[0]?.id ?? null;
      }
    }

    setReadPct(pct);
    setActiveId(nextActive);
  }, [hasToc, toc]);

  const scheduleRecompute = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      recomputeFromDom();
    });
  }, [recomputeFromDom]);

  useEffect(() => {
    scheduleRecompute();
    const onScroll = () => scheduleRecompute();
    const onResize = () => scheduleRecompute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleRecompute, proseHtml]);

  const handleTocClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>, id: string) => {
      event.preventDefault();
      const rootEl = rootRef.current;
      if (!rootEl) return;
      const target = rootEl.querySelector(`#${CSS.escape(id)}`);
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!(target instanceof HTMLElement)) return;

      target.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });

      if (history.replaceState) {
        history.replaceState(null, "", `#${encodeURIComponent(id)}`);
      }

      queueMicrotask(scheduleRecompute);
    },
    [scheduleRecompute],
  );

  function renderTocNav(tocNodes: ReactElement[], extraClass?: string) {
    return (
      <nav className={`surface-card p-4 ${extraClass ?? ""}`} aria-label="文章目录">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)]">目录</p>
        <ol className="mt-3 max-h-[40vh] list-none space-y-1 overflow-y-auto pr-1 lg:max-h-[calc(100vh-10rem)]">
          {tocNodes}
        </ol>
      </nav>
    );
  }

  const tocItems = toc.map((item) => {
    const padded = Math.max((item.depth - 1), 0) * 14;
    return (
      <li key={item.id} style={{ paddingLeft: padded }}>
        <a
          href={`#${item.id}`}
          className={tocLinkTypography(activeId === item.id)}
          aria-current={activeId === item.id ? "location" : undefined}
          onClick={(e) => handleTocClick(e, item.id)}
        >
          {item.text}
        </a>
      </li>
    );
  });

  const mainColumn = (
    <div className="flex min-w-0 flex-col gap-10 lg:gap-10">
      {hasToc && renderTocNav(tocItems, "lg:hidden")}
      <section
        ref={(n) => {
          rootRef.current = n;
        }}
        className={proseClassName}
        data-article-prose
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
      {children}
    </div>
  );

  return (
    <>
      <ReadingProgressPortal pct={readPct} />
      {hasToc ? (
        <div className="lg:grid lg:grid-cols-[minmax(0,13.75rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <aside className="sticky top-28 hidden w-full shrink-0 self-start lg:block">
            {renderTocNav(tocItems, "w-full")}
          </aside>
          <div className="min-w-0">{mainColumn}</div>
        </div>
      ) : (
        mainColumn
      )}
    </>
  );
}
