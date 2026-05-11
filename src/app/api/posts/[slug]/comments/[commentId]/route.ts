import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { comments, posts } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/guards";

type RouteContext = { params: Promise<{ slug: string; commentId: string }> };

export async function DELETE(_req: Request, ctx: RouteContext) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "无权限执行此操作" }, { status: 403 });
  }

  const { slug, commentId } = await ctx.params;
  if (!commentId.trim()) {
    return NextResponse.json({ error: "评论 id 无效" }, { status: 400 });
  }

  const db = await getDb();
  const postRow = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!postRow) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  const commentRow = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, commentId), eq(comments.postId, postRow.id)))
    .get();

  if (!commentRow) {
    return NextResponse.json({ error: "评论不存在" }, { status: 404 });
  }

  await db.delete(comments).where(eq(comments.id, commentId));

  return NextResponse.json({ ok: true }, { status: 200 });
}
