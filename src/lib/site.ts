/** Production origin when Workers omit NEXT_PUBLIC_* at runtime; keep in sync with wrangler `vars`. */
const PRODUCTION_SITE_FALLBACK = "https://docs.altriayu.uk";

const stripTrailingSlash = (url: string) => url.replace(/\/$/, "");

export const getSiteBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return stripTrailingSlash(raw);
  if (process.env.NODE_ENV === "production") return PRODUCTION_SITE_FALLBACK;
  return "http://localhost:3000";
};

export const absoluteUrl = (path: string) => {
  const base = getSiteBaseUrl();
  if (!path.startsWith("/")) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
};
