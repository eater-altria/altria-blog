import type { NextResponse } from "next/server";

/** HttpOnly cookie: 评论 Turnstile 通过后 30 分钟内同设备同账号可免重复验证。 */
export const COMMENT_TURNSTILE_BYPASS_COOKIE = "cf_comment_ts_ok";

export const getCookieValueFromHeader = (cookieHeader: string | null, name: string): string | undefined => {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const p = part.trim();
    const eqIdx = p.indexOf("=");
    if (eqIdx === -1) continue;
    if (p.slice(0, eqIdx).trim() !== name) continue;
    return decodeURIComponent(p.slice(eqIdx + 1).trim());
  }
  return undefined;
};

const BYPASS_TTL_MS = 30 * 60 * 1000;
const PAYLOAD_PREFIX = "cf-comment-bypass:v1:";

const enc = new TextEncoder();

const toBase64Url = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const timingSafeEqualStr = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  return out === 0;
};

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toBase64Url(sig);
}

/** `userId|expiresAtMs.signature` */
export const buildCommentTurnstileBypassCookieValue = async (
  secret: string,
  userId: string,
): Promise<string> => {
  const expiresAt = Date.now() + BYPASS_TTL_MS;
  const payload = `${userId}|${expiresAt}`;
  const sig = await hmacSha256Base64Url(secret, `${PAYLOAD_PREFIX}${payload}`);
  return `${payload}.${sig}`;
};

export const verifyCommentTurnstileBypassCookie = async (
  raw: string | undefined | null,
  secret: string | undefined | null,
  currentUserId: string,
): Promise<boolean> => {
  if (!raw?.trim() || !secret?.trim()) return false;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return false;
  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const pipe = body.lastIndexOf("|");
  if (pipe <= 0) return false;
  const uid = body.slice(0, pipe);
  const expStr = body.slice(pipe + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || uid !== currentUserId) return false;
  if (Date.now() >= exp) return false;
  const expected = await hmacSha256Base64Url(secret, `${PAYLOAD_PREFIX}${body}`);
  return timingSafeEqualStr(sig, expected);
};

export const attachCommentTurnstileBypassCookie = async (
  res: NextResponse,
  secret: string,
  userId: string,
  req: Request,
): Promise<void> => {
  const value = await buildCommentTurnstileBypassCookieValue(secret, userId);
  const secure = new URL(req.url).protocol === "https:";
  res.cookies.set({
    name: COMMENT_TURNSTILE_BYPASS_COOKIE,
    value,
    httpOnly: true,
    maxAge: Math.floor(BYPASS_TTL_MS / 1000),
    path: "/",
    sameSite: "lax",
    secure,
  });
};
