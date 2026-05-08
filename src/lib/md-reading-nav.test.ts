import assert from "node:assert/strict";
import test from "node:test";
import {
  assignHeadingIds,
  buildMarkdownToc,
  collectMarkdownHeadings,
  parseMarkdownBodyWithAnchors,
} from "./md-reading-nav.ts";

test("assignHeadingIds resolves duplicate visible titles with deterministic suffixes", () => {
  assert.deepEqual(
    assignHeadingIds([
      { depth: 1, text: "Intro" },
      { depth: 2, text: "Details" },
      { depth: 2, text: "Details" },
    ]).map((t) => t.id),
    ["intro", "details", "details-2"],
  );
});

test("collectMarkdownHeadings ignores markdown-looking lines inside fenced code blocks", () => {
  const md = [
    "```",
    "# not a heading",
    "```",
    "",
    "# Real heading",
  ].join("\n");

  const headings = collectMarkdownHeadings(md);
  assert.equal(headings.length, 1);
  assert.equal(headings[0]?.text, "Real heading");
});

test("buildMarkdownToc keeps stable ids for CJK titles across repeated builds", () => {
  const md = "# 介绍\n\n## 深入\n";
  const a = buildMarkdownToc(md);
  const b = buildMarkdownToc(md);
  assert.deepEqual(a, b);
  assert.ok(a.every((entry) => entry.id.startsWith("section-")));
});

test("blockquote-nested headings are included in walk order before following top-level headings", () => {
  const md = ["# Outer", "", "> ## Inner", "", "## After"].join("\n");
  const headings = collectMarkdownHeadings(md);
  assert.deepEqual(headings.map((h) => h.text), ["Outer", "Inner", "After"]);
});

test("parseMarkdownBodyWithAnchors injects heading ids aligned with TOC length", async () => {
  const md = "## First\n### Second\n## First\n"; // deliberate duplicate heading text pattern
  const { html, toc } = await parseMarkdownBodyWithAnchors(md);
  assert.equal((html.match(/<h[1-6][^>]*\sid=/g) ?? []).length, toc.length);

  let secondPass: Awaited<ReturnType<typeof parseMarkdownBodyWithAnchors>>;
  secondPass = await parseMarkdownBodyWithAnchors(md);
  assert.equal(secondPass.toc.map((entry) => entry.id).join(), toc.map((entry) => entry.id).join());
});
