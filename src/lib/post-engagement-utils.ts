export type HotPostItem = {
  postId: string;
  slug: string;
  title: string;
  publishedAt: number;
  readCount: number;
};

export function getDisplayedReadCount(storedReadCount: number): number {
  return storedReadCount + 1;
}

export function getArticleEngagementSummary(readCount: number, commentCount: number): string {
  return `阅读 ${readCount} · 评论 ${commentCount}`;
}

export function rankHotPosts(postsList: HotPostItem[], limit = 3): HotPostItem[] {
  return [...postsList]
    .sort((a, b) => {
      if (b.readCount !== a.readCount) return b.readCount - a.readCount;
      return b.publishedAt - a.publishedAt;
    })
    .slice(0, limit);
}
