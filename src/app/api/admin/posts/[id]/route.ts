import { eq } from "drizzle-orm";
import matter from "gray-matter";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { postDrafts, posts } from "@/db/schema";
import { requireStaff, requireSuperAdmin } from "@/lib/auth/guards";
import { isValidSlug, slugify } from "@/lib/slug";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
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

  return NextResponse.json({
    post: postRow,
    draft: draft ?? null,
  });
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const staff = await requireStaff();
  if (!staff) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  let body: { markdown?: string; title?: string; slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体 JSON 格式错误" }, { status: 400 });
  }

  const markdown = body.markdown ?? "";
  if (!markdown.trim()) {
    return NextResponse.json({ error: "Markdown 内容不能为空" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const db = await getDb();
  const postRow = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!postRow) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  const parsed = matter(markdown.trim());
  const fm = parsed.data as { title?: string; slug?: string };
  const nextTitle =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : typeof fm.title === "string" && fm.title.trim()
        ? fm.title.trim()
        : postRow.title;

  let nextSlug =
    typeof body.slug === "string" && body.slug.trim()
      ? slugify(body.slug.trim())
      : typeof fm.slug === "string" && fm.slug.trim()
        ? slugify(String(fm.slug))
        : postRow.slug;

  if (!isValidSlug(nextSlug)) {
    nextSlug = slugify(nextTitle);
  }

  const existingSlug = await db.select().from(posts).where(eq(posts.slug, nextSlug)).get();
  if (existingSlug && existingSlug.id !== id) {
    return NextResponse.json({ error: "Slug 已被占用" }, { status: 409 });
  }

  const now = Date.now();
  await db
    .update(posts)
    .set({ title: nextTitle, slug: nextSlug })
    .where(eq(posts.id, id));

  await db
    .update(postDrafts)
    .set({ markdown: markdown.trim(), updatedAt: now })
    .where(eq(postDrafts.postId, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const db = await getDb();
  const postRow = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!postRow) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  await db.delete(posts).where(eq(posts.id, id));

  return NextResponse.json({
    ok: true,
    deletedPostId: id,
    deletedSlug: postRow.slug,
  });
}
