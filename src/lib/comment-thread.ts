export type FlatComment = {
  id: string;
  body: string;
  createdAt: number;
  username: string | null;
  avatarUrl: string | null;
  parentCommentId: string | null;
};

export type CommentTreeNode = FlatComment & { children: CommentTreeNode[] };

const byCreatedAt = (a: CommentTreeNode, b: CommentTreeNode) => a.createdAt - b.createdAt;

/**
 * Build a forest of comment threads from a flat list (same post).
 * Orphans (missing parent) are treated as top-level.
 */
export function buildCommentTree(rows: FlatComment[]): CommentTreeNode[] {
  const nodes = new Map<string, CommentTreeNode>();
  for (const r of rows) {
    nodes.set(r.id, { ...r, children: [] });
  }
  const roots: CommentTreeNode[] = [];
  for (const r of rows) {
    const node = nodes.get(r.id);
    if (!node) continue;
    const pid = r.parentCommentId;
    if (pid && nodes.has(pid)) {
      nodes.get(pid)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortDeep = (list: CommentTreeNode[]) => {
    list.sort(byCreatedAt);
    for (const n of list) sortDeep(n.children);
  };
  sortDeep(roots);
  return roots;
}
