import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { postPublished, posts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/guards";
import { readDoubaoConfig, streamSynthesizedChunks } from "@/lib/tts/doubao";
import { buildCacheKey, readCachedMp3, writeCachedMp3 } from "@/lib/tts/cache";
import { chunkForTts, markdownToTtsText, sha256Hex } from "@/lib/tts/extract-text";
import { checkRateLimit } from "@/lib/tts/rate-limit";

type RouteContext = { params: Promise<{ slug: string }> };

/** Per-minute caps. Tightened for anonymous to discourage scraping; loose for logged-in. */
const LIMITS = {
  user: { windowSeconds: 60, max: 10 },
  anon: { windowSeconds: 60, max: 3 },
};

function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function mp3Response(
  body: Uint8Array,
  init: { cacheHit: boolean; voice: string; resourceId: string },
): Response {
  // Slice into a fresh ArrayBuffer so the body is unambiguously a BodyInit-compatible buffer.
  const ab = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
  return new Response(ab, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(body.length),
      "Cache-Control": "private, max-age=3600",
      "X-TTS-Cache": init.cacheHit ? "hit" : "miss",
      "X-TTS-Voice": init.voice,
      "X-TTS-Resource-Id": init.resourceId,
    },
  });
}

export async function GET(req: Request, ctx: RouteContext) {
  const { env, ctx: cfCtx } = await getCloudflareContext({ async: true });
  const doubao = readDoubaoConfig(env);
  if (!doubao) {
    return NextResponse.json(
      { error: "云端朗读未启用", reason: "tts-disabled" },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  const subject = user ? `user:${user.id}` : `ip:${getClientIp(req)}`;
  const limit = user ? LIMITS.user : LIMITS.anon;

  const db = await getDb();

  const limitRes = await checkRateLimit(db, {
    subject,
    windowSeconds: limit.windowSeconds,
    max: limit.max,
    scope: "tts",
  });
  if (!limitRes.ok) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后重试", retryAfterSeconds: limitRes.retryAfterSeconds },
      {
        status: 429,
        headers: { "Retry-After": String(limitRes.retryAfterSeconds) },
      },
    );
  }

  const { slug } = await ctx.params;
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

  const ttsText = markdownToTtsText(published.markdown);
  if (!ttsText) {
    return NextResponse.json({ error: "文章无可朗读文本" }, { status: 422 });
  }

  const contentHash = (await sha256Hex(`${doubao.voice}:${ttsText}`)).slice(0, 16);
  const cacheKey = buildCacheKey(postRow.id, doubao.voice, contentHash);

  const bucket = env.AVATAR_R2;
  if (bucket) {
    const cached = await readCachedMp3(bucket, cacheKey);
    if (cached) {
      return mp3Response(cached, {
        cacheHit: true,
        voice: doubao.voice,
        resourceId: doubao.resourceId,
      });
    }
  }

  // V3 endpoint accepts longer text per request; raise per-chunk cap accordingly.
  // The exact API limit isn't published; ~3000 bytes (~1000 zh chars) leaves margin under
  // the implicit cap that triggers 40402003 TTSExceededTextLimit.
  const chunks = chunkForTts(ttsText, 3000);
  if (chunks.length === 0) {
    return NextResponse.json({ error: "文本切分后为空" }, { status: 422 });
  }

  // Streaming MISS path: kick off all chunks in parallel; emit bytes in order as they arrive.
  // First-byte latency ≈ max(per-chunk time) instead of sum(per-chunk time).
  const { stream, whenComplete } = streamSynthesizedChunks(doubao, chunks);

  // Persist to R2 after the response is fully sent. waitUntil keeps the worker alive past
  // the response. If unavailable (some adapters), fall back to fire-and-forget.
  const cachePromise = whenComplete.then(async (r) => {
    if (r.ok && bucket) {
      try {
        await writeCachedMp3(bucket, cacheKey, r.mp3);
      } catch {
        /* ignore cache write failures */
      }
    }
  });
  if (cfCtx?.waitUntil) {
    cfCtx.waitUntil(cachePromise);
  } else {
    void cachePromise;
  }

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      // No Content-Length — body length is unknown until all chunks land.
      "Cache-Control": "private, max-age=3600",
      "X-TTS-Cache": "miss",
      "X-TTS-Voice": doubao.voice,
      "X-TTS-Resource-Id": doubao.resourceId,
    },
  });
}
