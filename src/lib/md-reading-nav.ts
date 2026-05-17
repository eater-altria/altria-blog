import { escape as escapeHtml } from "html-escaper";
import { Marked, type RendererThis, type Tokens } from "marked";

export type TocItem = {
  id: string;
  depth: number;
  text: string;
};

/** Deterministic ASCII-ish hash for headings that slugify empties out (e.g. CJK). */
export function headingTextHash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(31, h) + text.charCodeAt(i) || 0;
  }
  return (h >>> 0).toString(36).slice(0, 10);
}

/** ASCII slug from heading text — mirrors `@/lib/slug` omitting empty→`post` fallback (we branch to hash separately). */
function slugifyLatinHeading(raw: string): string {
  return (
    raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || ""
  );
}

function primarySlugBase(rawText: string): string {
  const latin = slugifyLatinHeading(rawText.trim());
  if (latin) return latin;
  return `section-${headingTextHash(rawText)}`;
}

/** Assigns deterministic ids compatible with Markdown heading order traversal. */
export function assignHeadingIds(entries: Pick<TocItem, "depth" | "text">[]): TocItem[] {
  const usage = new Map<string, number>();
  return entries.map(({ depth, text }) => {
    const base = primarySlugBase(text);
    const prev = usage.get(base) ?? 0;
    const next = prev + 1;
    usage.set(base, next);
    const id = next <= 1 ? base : `${base}-${next}`;
    return { id, depth, text };
  });
}

/** Collect headings in marked walk order (respects fenced code / nested blocks consistently with parser). */
export function collectMarkdownHeadings(markdown: string): Omit<TocItem, "id">[] {
  const md = new Marked({ gfm: true });
  const tokens = md.lexer(markdown);
  const raw: Omit<TocItem, "id">[] = [];

  md.walkTokens(tokens, (token) => {
    if (token.type === "heading") {
      const h = token as Tokens.Heading;
      raw.push({ depth: h.depth, text: (h.text ?? "").trim() });
    }
    return undefined;
  });

  return raw;
}

export function buildMarkdownToc(markdown: string): TocItem[] {
  return assignHeadingIds(collectMarkdownHeadings(markdown));
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * Parses Markdown body to HTML while injecting deterministic heading ids that match TOC entries.
 * Uses isolated Marked instance (no globals) for safe concurrent requests.
 */
export async function parseMarkdownBodyWithAnchors(markdown: string): Promise<{ html: string; toc: TocItem[] }> {
  const toc = buildMarkdownToc(markdown);
  let index = 0;

  const md = new Marked({ gfm: true, async: true });
  md.use({
    renderer: {
      heading(this: RendererThis, token: Tokens.Heading): string | false {
        const id = toc[index]?.id ?? `heading-${index}`;
        index += 1;
        const inner = this.parser.parseInline(token.tokens);
        return `<h${token.depth} id="${escapeHtmlAttr(id)}">${inner}</h${token.depth}>\n`;
      },
      code(token: Tokens.Code): string | false {
        if (token.lang === "mermaid") {
          return `<div class="mermaid-container"><pre class="mermaid">${escapeHtml(token.text)}</pre></div>\n`;
        }
        return false;
      },
    },
  });

  const html = await md.parse(markdown);

  return { html: String(html), toc };
}
