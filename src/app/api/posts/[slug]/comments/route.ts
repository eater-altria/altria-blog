import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { comments, postPublished, posts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/guards";
import {
  attachCommentTurnstileBypassCookie,
  COMMENT_TURNSTILE_BYPASS_COOKIE,
  getCookieValueFromHeader,
  verifyCommentTurnstileBypassCookie,
} from "@/lib/comment-turnstile-bypass";
import { verifyTurnstileToken } from "@/lib/turnstile";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(req: Request, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再评论" }, { status: 401 });
  }

  let bodyText: unknown;
  try {
    bodyText = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体 JSON 格式错误" }, { status: 400 });
  }
  const body =
    typeof bodyText === "object" && bodyText !== null && "body" in bodyText
      ? String((bodyText as { body?: unknown }).body ?? "")
      : "";
  const turnstileToken =
    typeof bodyText === "object" && bodyText !== null && "turnstileToken" in bodyText
      ? String((bodyText as { turnstileToken?: unknown }).turnstileToken ?? "")
      : "";
  const parentCommentIdRaw =
    typeof bodyText === "object" && bodyText !== null && "parentCommentId" in bodyText
      ? String((bodyText as { parentCommentId?: unknown }).parentCommentId ?? "").trim()
      : "";
  const parentCommentId = parentCommentIdRaw || null;

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 5000) {
    return NextResponse.json({ error: "评论内容不能为空且不能超过 5000 字" }, { status: 400 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const bypassSecret = env.TURNSTILE_SECRET_KEY;
  const bypassCookie = getCookieValueFromHeader(req.headers.get("cookie"), COMMENT_TURNSTILE_BYPASS_COOKIE);

  const bypassOk =
    bypassSecret &&
    (await verifyCommentTurnstileBypassCookie(bypassCookie, bypassSecret, user.id));

  let usedTurnstileThisRequest = false;
  if (!bypassOk) {
    const verified = await verifyTurnstileToken(req, turnstileToken);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.message }, { status: verified.status ?? 400 });
    }
    usedTurnstileThisRequest = true;
  }

  const { slug } = await ctx.params;
  const db = await getDb();
  const postRow = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!postRow) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  const published = await db
    .select()
    .from(postPublished)
    .where(eq(postPublished.postId, postRow.id))
    .get();
  if (!published) {
    return NextResponse.json({ error: "文章尚未发布" }, { status: 404 });
  }

  if (parentCommentId) {
    const parentRow = await db.select().from(comments).where(eq(comments.id, parentCommentId)).get();
    if (!parentRow || parentRow.postId !== postRow.id) {
      return NextResponse.json({ error: "被回复的评论不存在或不属于该文章" }, { status: 400 });
    }
  }

  await db.insert(comments).values({
    id: crypto.randomUUID(),
    postId: postRow.id,
    userId: user.id,
    parentCommentId,
    body: trimmed,
    createdAt: Date.now(),
  });

  const res = NextResponse.json({ ok: true }, { status: 201 });
  if (usedTurnstileThisRequest && bypassSecret) {
    await attachCommentTurnstileBypassCookie(res, bypassSecret, user.id, req);
  }
  return res;
}
