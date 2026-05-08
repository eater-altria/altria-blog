import { contentWithoutFrontmatter } from "@/lib/md-body";
import { parseMarkdownBodyWithAnchors, type TocItem } from "@/lib/md-reading-nav";

/** Full article render for published posts — deterministic heading anchors + TOC outline payload. */
export async function markdownToTrustedArticle(markdownWithFrontmatter: string): Promise<{
  html: string;
  toc: TocItem[];
}> {
  const body = contentWithoutFrontmatter(markdownWithFrontmatter);
  return parseMarkdownBodyWithAnchors(body);
}

/** HTML snapshot for previews and other callers that omit the outline — still emits stable heading ids for deep links. */
export const markdownToTrustedHtml = async (markdownWithFrontmatter: string): Promise<string> => {
  const { html } = await markdownToTrustedArticle(markdownWithFrontmatter);
  return html;
};
