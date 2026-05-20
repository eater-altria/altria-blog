export {};

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    AVATAR_R2: R2Bucket;
    TURNSTILE_SECRET_KEY: string;
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
    NEXT_PUBLIC_AVATAR_BASE_URL?: string;
    /** Doubao TTS V3 (HTTP Chunked / new auth). Enable by setting DOUBAO_TTS_ENABLED=true. */
    DOUBAO_TTS_API_KEY?: string;
    DOUBAO_TTS_RESOURCE_ID?: string;
    DOUBAO_TTS_VOICE?: string;
    DOUBAO_TTS_ENABLED?: string;
  }
}
