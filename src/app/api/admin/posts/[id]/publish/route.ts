import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { postDrafts, posts, postPublished } from "@/db/schema";
import { requireStaff } from "@/lib/auth/guards";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteContext) {
  const staff = await requireStaff();
  if (!staff) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const db = await getDb();
  const postRow = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!postRow) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  const draft = await db.select().from(postDrafts).where(eq(postDrafts.postId, id)).get();
  if (!draft) {
    return NextResponse.json({ error: "草稿不存在，无法发布" }, { status: 400 });
  }

  const now = Date.now();
  const existing = await db
    .select()
    .from(postPublished)
    .where(eq(postPublished.postId, id))
    .get();

  if (existing) {
    await db
      .update(postPublished)
      .set({
        markdown: draft.markdown,
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(postPublished.postId, id));
  } else {
    await db.insert(postPublished).values({
      postId: id,
      markdown: draft.markdown,
      publishedAt: now,
      updatedAt: now,
    });
  }

  return NextResponse.json({ ok: true });
}
