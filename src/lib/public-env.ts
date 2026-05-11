import { getCloudflareContext } from "@opennextjs/cloudflare";
import { resolveTurnstileSiteKey } from "@/lib/turnstile";

export const getTurnstileSiteKey = async (): Promise<string | undefined> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const resolved = resolveTurnstileSiteKey(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    if (resolved) return resolved;
  } catch {
    // Fallback to process.env in non-Cloudflare runtime.
  }

  return resolveTurnstileSiteKey(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
};
