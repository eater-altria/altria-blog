import { getCloudflareContext } from "@opennextjs/cloudflare";

export const getTurnstileSiteKey = async (): Promise<string | undefined> => {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const fromBinding = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (fromBinding && fromBinding.trim()) {
      return fromBinding;
    }
  } catch {
    // Fallback to process.env in non-Cloudflare runtime.
  }

  const fromProcess = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return fromProcess?.trim() ? fromProcess : undefined;
};
