export {};

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    AVATAR_R2: R2Bucket;
    TURNSTILE_SECRET_KEY: string;
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
    NEXT_PUBLIC_AVATAR_BASE_URL?: string;
  }
}
