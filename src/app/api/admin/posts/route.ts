import { desc, eq } from "drizzle-orm";
import matter from "gray-matter";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { postDrafts, posts, postPublished } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { isValidSlug, slugify } from "@/lib/slug";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  const db = await getDb();
  const rows = await db
    .select({
      post: posts,
      draft: postDrafts,
      published: postPublished,
    })
    .from(posts)
    .leftJoin(postDrafts, eq(postDrafts.postId, posts.id))
    .leftJoin(postPublished, eq(postPublished.postId, posts.id))
    .orderBy(desc(posts.createdAt));

  return NextResponse.json({
    posts: rows.map((r) => ({
      ...r.post,
      draftUpdatedAt: r.draft?.updatedAt ?? null,
      publishedAt: r.published?.publishedAt ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  let markdown = "";
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    const file = fd.get("file");
    const textField = fd.get("markdown");
    if (file instanceof File) {
      markdown = await file.text();
    } else if (typeof textField === "string") {
      markdown = textField;
    }
  } else {
    let body: { markdown?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "请求体 JSON 格式错误" }, { status: 400 });
    }
    markdown = body.markdown ?? "";
  }

  if (!markdown.trim()) {
    return NextResponse.json({ error: "Markdown 内容不能为空" }, { status: 400 });
  }

  const parsed = matter(markdown.trim());
  const storedMarkdown = markdown.trim();
  const fm = parsed.data as { title?: string; slug?: string };
  const title =
    typeof fm.title === "string" && fm.title.trim()
      ? fm.title.trim()
      : "Untitled";
  let slug =
    typeof fm.slug === "string" && fm.slug.trim()
      ? slugify(String(fm.slug))
      : slugify(title);

  if (!isValidSlug(slug)) {
    slug = slugify(title);
    if (!isValidSlug(slug)) {
      slug = `post-${crypto.randomUUID().slice(0, 8)}`;
    }
  }

  const db = await getDb();
  const now = Date.now();

  for (let i = 0; i < 50; i += 1) {
    const clash = await db.select().from(posts).where(eq(posts.slug, slug)).get();
    if (!clash) break;
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const id = crypto.randomUUID();
  await db.insert(posts).values({
    id,
    slug,
    title,
    createdAt: now,
  });
  await db.insert(postDrafts).values({
    postId: id,
    markdown: storedMarkdown,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, id, slug }, { status: 201 });
}
