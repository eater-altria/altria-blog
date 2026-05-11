import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Must match `vars` placeholder in `wrangler.jsonc` until a real key is set. */
const TURNSTILE_SITE_KEY_PLACEHOLDER = "replace-with-your-turnstile-site-key";

/**
 * Returns a usable site key, or `undefined` when unset / still the template placeholder.
 * Turnstile error **400020** means invalid sitekey — often caused by leaving the placeholder.
 */
export const resolveTurnstileSiteKey = (raw: string | undefined | null): string | undefined => {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t || t === TURNSTILE_SITE_KEY_PLACEHOLDER) return undefined;
  return t;
};

type TurnstileResult = { ok: true } | { ok: false; message: string; status?: number };

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const getClientIp = (req: Request) => {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || undefined;
};

export const verifyTurnstileToken = async (
  req: Request,
  token: string,
): Promise<TurnstileResult> => {
  if (!token.trim()) {
    return { ok: false, message: "请先完成安全验证", status: 400 };
  }

  const { env } = await getCloudflareContext({ async: true });
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: false, message: "服务端未配置风控密钥", status: 500 };
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token.trim());
  const remoteip = getClientIp(req);
  if (remoteip) {
    form.set("remoteip", remoteip);
  }

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) {
    return { ok: false, message: "安全验证服务暂时不可用", status: 502 };
  }

  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  if (!isTurnstileVerificationSuccess(data)) {
    return { ok: false, message: "安全验证失败，请重试", status: 400 };
  }

  return { ok: true };
};

export const isTurnstileVerificationSuccess = (payload: { success?: boolean }) =>
  payload.success === true;
