import { escape as escapeHtml } from "html-escaper";
import { Marked, type Tokens } from "marked";

const markdownEngine = new Marked({
  gfm: true,
});

markdownEngine.use({
  renderer: {
    code(token: Tokens.Code): string | false {
      if (token.lang === "mermaid") {
        return `<div class="mermaid-container"><pre class="mermaid">${escapeHtml(token.text)}</pre></div>\n`;
      }
      return false;
    },
  },
});

export const renderMarkdownToHtml = (markdown: string) =>
  markdownEngine.parse(markdown, { async: true }) as Promise<string>;
