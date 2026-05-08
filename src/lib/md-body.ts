import matter from "gray-matter";

/** Returns markdown body without YAML frontmatter (for rendering). */
export const contentWithoutFrontmatter = (markdown: string) =>
  matter(markdown).content.trim();
