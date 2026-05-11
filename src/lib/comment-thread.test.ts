import assert from "node:assert/strict";
import test from "node:test";
import { buildCommentTree } from "./comment-thread.ts";

const base = {
  body: "x",
  username: "u",
  avatarUrl: null as string | null,
};

test("buildCommentTree nests replies under parent in chronological order", () => {
  const tree = buildCommentTree([
    { id: "1", parentCommentId: null, createdAt: 10, ...base },
    { id: "2", parentCommentId: "1", createdAt: 20, ...base },
    { id: "3", parentCommentId: null, createdAt: 5, ...base },
  ]);
  assert.equal(tree.length, 2);
  assert.deepEqual(
    tree.map((n) => n.id),
    ["3", "1"],
  );
  assert.equal(tree[1].children.length, 1);
  assert.equal(tree[1].children[0].id, "2");
});

test("buildCommentTree treats missing parent as root", () => {
  const tree = buildCommentTree([
    { id: "1", parentCommentId: null, createdAt: 1, ...base },
    { id: "2", parentCommentId: "missing", createdAt: 2, ...base },
  ]);
  assert.equal(tree.length, 2);
});
