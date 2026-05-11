import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/guards";
import { buildPublicAssetUrl } from "@/lib/uploads";
import { validateAvatarFile } from "@/lib/user-profile";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const avatar = form?.get("avatar");
  if (!(avatar instanceof File)) {
    return NextResponse.json({ error: "请上传头像文件" }, { status: 400 });
  }
  const avatarErr = validateAvatarFile(avatar);
  if (avatarErr) {
    return NextResponse.json({ error: avatarErr }, { status: 400 });
  }

  const { env } = await getCloudflareContext({ async: true });
  if (!env.AVATAR_R2) {
    return NextResponse.json({ error: "未配置头像存储桶" }, { status: 500 });
  }

  const ext = avatar.type === "image/png" ? "png" : avatar.type === "image/jpeg" ? "jpg" : "webp";
  const objectKey = `blog/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const bytes = await avatar.arrayBuffer();
  await env.AVATAR_R2.put(objectKey, bytes, {
    httpMetadata: { contentType: avatar.type },
  });

  if (user.avatarKey && user.avatarKey !== objectKey) {
    await env.AVATAR_R2.delete(user.avatarKey);
  }

  const baseUrl = env.NEXT_PUBLIC_AVATAR_BASE_URL;
  const avatarUrl = buildPublicAssetUrl(baseUrl, objectKey);

  const db = await getDb();
  await db
    .update(users)
    .set({
      avatarKey: objectKey,
      avatarUrl,
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true, avatarUrl });
}
