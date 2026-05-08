import { AVATAR_ALLOWED_TYPES, AVATAR_MAX_BYTES, USERNAME_RE } from "./constants";

export const normalizeUsername = (value: string) => value.trim();

export const isValidUsername = (value: string) => USERNAME_RE.test(normalizeUsername(value));

export const buildPlaceholderUsername = (userId: string) =>
  `user_${userId.replaceAll("-", "").slice(0, 8)}`;

export const validateAvatarFile = (file: File): string | null => {
  if (file.size <= 0) {
    return "请选择头像文件";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "头像大小不能超过 2MB";
  }
  if (!AVATAR_ALLOWED_TYPES.has(file.type)) {
    return "仅支持 PNG/JPEG/WEBP 格式头像";
  }
  return null;
};
