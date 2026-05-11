import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/guards";
import {
  buildPublicAssetUrl,
  getImageExtension,
  validateBlogImageFile,
} from "@/lib/uploads";

export async function POST(req: Request) {
  const staff = await requireStaff();
  if (!staff) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const image = form?.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "请上传图片文件" }, { status: 400 });
  }

  const validationError = validateBlogImageFile(image);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const extension = getImageExtension(image.type);
  if (!extension) {
    return NextResponse.json({ error: "无法识别图片格式" }, { status: 400 });
  }

  const { env } = await getCloudflareContext({ async: true });
  if (!env.AVATAR_R2) {
    return NextResponse.json({ error: "未配置图片存储桶" }, { status: 500 });
  }

  const now = new Date();
  const objectKey =
    `image/blog/${now.getUTCFullYear()}/` +
    `${String(now.getUTCMonth() + 1).padStart(2, "0")}/` +
    `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const bytes = await image.arrayBuffer();
  await env.AVATAR_R2.put(objectKey, bytes, {
    httpMetadata: {
      contentType: image.type,
    },
  });

  const imageUrl = buildPublicAssetUrl(env.NEXT_PUBLIC_AVATAR_BASE_URL, objectKey);

  return NextResponse.json({
    ok: true,
    imageUrl,
    objectKey,
    markdown: `![](${imageUrl})`,
  });
}
