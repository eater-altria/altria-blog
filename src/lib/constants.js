export const SESSION_COOKIE = "blog_sid";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
export const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
