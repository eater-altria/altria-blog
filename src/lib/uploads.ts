export const BLOG_IMAGE_ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export const BLOG_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const extByType: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function getImageExtension(contentType: string): string | null {
  return extByType[contentType] ?? null;
}

export function validateBlogImageFile(file: File): string | null {
  if (file.size <= 0) {
    return "请选择图片文件";
  }

  if (file.size > BLOG_IMAGE_MAX_BYTES) {
    return "单张图片不能超过 10MB";
  }

  if (!BLOG_IMAGE_ALLOWED_TYPES.has(file.type)) {
    return "仅支持 PNG/JPEG/WEBP/GIF 图片";
  }

  return null;
}

export function buildPublicAssetUrl(baseUrl: string | undefined, objectKey: string): string {
  return baseUrl ? `${baseUrl.replace(/\/$/, "")}/${objectKey}` : objectKey;
}
