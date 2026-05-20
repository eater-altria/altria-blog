/** Type the bucket via the project's CloudflareEnv ambient typing — avoids importing
 *  `@cloudflare/workers-types` directly (which isn't a declared dependency here). */
type TtsBucket = NonNullable<CloudflareEnv["AVATAR_R2"]>;

const PREFIX = "tts/";

/** R2 object key. Voice + content hash means republishing or voice change invalidates automatically. */
export function buildCacheKey(postId: string, voice: string, contentHash: string): string {
  const safeVoice = voice.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${PREFIX}${postId}/${safeVoice}/${contentHash}.mp3`;
}

export async function readCachedMp3(bucket: TtsBucket, key: string): Promise<Uint8Array | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;
  const buf = await obj.arrayBuffer();
  return new Uint8Array(buf);
}

export async function writeCachedMp3(
  bucket: TtsBucket,
  key: string,
  mp3: Uint8Array,
): Promise<void> {
  await bucket.put(key, mp3, {
    httpMetadata: { contentType: "audio/mpeg" },
  });
}
