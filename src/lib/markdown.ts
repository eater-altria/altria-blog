import { Marked } from "marked";

const markdownEngine = new Marked({
  gfm: true,
});

export const renderMarkdownToHtml = (markdown: string) =>
  markdownEngine.parse(markdown, { async: true }) as Promise<string>;
