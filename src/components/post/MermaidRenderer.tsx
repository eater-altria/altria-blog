"use client";

import { useEffect, useState } from "react";

let idSeq = 0;

const MERMAID_RE = /<div class="mermaid-container"><pre class="mermaid">([\s\S]*?)<\/pre><\/div>/g;

function decodeMermaidHtml(escaped: string): string {
  return escaped
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Thin wrapper: renders an HTML string with mermaid blocks processed into SVGs.
 * Use for pages that don't go through ArticleTocProgress.
 */
export function MermaidProse({ html, className }: { html: string; className?: string }) {
  const rendered = useMermaidHtml(html);
  return <section className={className} dangerouslySetInnerHTML={{ __html: rendered }} />;
}

export function useMermaidHtml(sourceHtml: string): string {
  const [html, setHtml] = useState(sourceHtml);

  useEffect(() => {
    if (!MERMAID_RE.test(sourceHtml)) {
      setHtml(sourceHtml);
      return;
    }

    let cancelled = false;

    (async () => {
      const mermaid = (await import("mermaid")).default;
      if (cancelled) return;

      mermaid.initialize({ startOnLoad: false, theme: "default" });

      const blocks: { match: string; code: string }[] = [];
      let m: RegExpExecArray | null;
      const re = new RegExp(MERMAID_RE.source, MERMAID_RE.flags);
      while ((m = re.exec(sourceHtml)) !== null) {
        blocks.push({ match: m[0], code: decodeMermaidHtml(m[1]) });
      }

      let result = sourceHtml;
      for (const block of blocks) {
        if (cancelled) return;
        try {
          const id = `mermaid-svg-${++idSeq}`;
          const { svg } = await mermaid.render(id, block.code);
          result = result.replace(
            block.match,
            `<div class="mermaid-container mermaid-rendered">${svg}</div>`,
          );
        } catch {
          /* keep original block as fallback */
        }
      }

      if (!cancelled) setHtml(result);
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceHtml]);

  return html;
}
