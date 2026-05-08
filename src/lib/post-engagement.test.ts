import assert from "node:assert/strict";
import test from "node:test";
import {
  getArticleEngagementSummary,
  getDisplayedReadCount,
  rankHotPosts,
  type HotPostItem,
} from "./post-engagement-utils.ts";

test("getDisplayedReadCount increments persisted read count for current request", () => {
  assert.equal(getDisplayedReadCount(0), 1);
  assert.equal(getDisplayedReadCount(41), 42);
});

test("getArticleEngagementSummary returns readable metrics text", () => {
  assert.equal(getArticleEngagementSummary(12, 3), "阅读 12 · 评论 3");
});

test("rankHotPosts sorts by read count then published time and limits to top 3", () => {
  const rows: HotPostItem[] = [
    { postId: "a", slug: "a", title: "A", readCount: 18, publishedAt: 1700000000000 },
    { postId: "b", slug: "b", title: "B", readCount: 20, publishedAt: 1690000000000 },
    { postId: "c", slug: "c", title: "C", readCount: 20, publishedAt: 1710000000000 },
    { postId: "d", slug: "d", title: "D", readCount: 3, publishedAt: 1720000000000 },
  ];

  const ranked = rankHotPosts(rows, 3);

  assert.deepEqual(
    ranked.map((item) => item.slug),
    ["c", "b", "a"],
  );
});

test("rankHotPosts gracefully returns all rows when fewer than three posts exist", () => {
  const rows: HotPostItem[] = [
    { postId: "a", slug: "a", title: "A", readCount: 5, publishedAt: 1700000000000 },
    { postId: "b", slug: "b", title: "B", readCount: 2, publishedAt: 1700000000001 },
  ];

  assert.equal(rankHotPosts(rows, 3).length, 2);
});
