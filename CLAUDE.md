# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — Next.js dev server (Node runtime, not Workers). `next.config.ts` calls `initOpenNextCloudflareForDev()` so `getCloudflareContext()` resolves real bindings (D1, R2) from `.wrangler/` during dev.
- `npm run lint` — ESLint via `eslint-config-next`. Ignores `.next/`, `.open-next/`, etc. (see `eslint.config.mjs`).
- `npm test` — runs `node --test --experimental-strip-types "src/**/*.test.ts"`. Tests are stripped TS, no transpiler. Run one: `node --test --experimental-strip-types src/lib/comment-thread.test.ts`. `tsconfig.json` excludes `**/*.test.ts` from the build.
- `npm run build:worker` / `preview:worker` / `deploy:worker` — OpenNext-Cloudflare bundling, local preview against `.wrangler/`, and deploy. `npm run build` (plain Next) is rarely what you want; the production target is the Worker.
- `npm run d1:migrate:local` — apply `migrations/*.sql` to the local D1. Remote: `npx wrangler d1 migrations apply cf-edge-blog-db --remote`.
- `npm run cf-typegen` — regenerate `cloudflare-env.d.ts` from `wrangler.jsonc`. Run after adding/changing bindings or vars.

## Architecture

**Runtime target is Cloudflare Workers, not Node.** Production runs `.open-next/worker.js` (built by `@opennextjs/cloudflare`). Any code that may run server-side must be Workers-compatible — no Node-only APIs without `nodejs_compat`, no filesystem.

**Bindings flow through `getCloudflareContext()`.** Server code never imports `process.env.DB`. Pattern:

```ts
const { env } = await getCloudflareContext({ async: true });
env.DB        // D1Database
env.AVATAR_R2 // R2Bucket
```

`src/db/index.ts` wraps this with Drizzle. `cloudflare-env.d.ts` is the canonical typing of `env` — keep it in sync via `cf-typegen` whenever `wrangler.jsonc` changes.

**Posts: draft / published split.** This is the most load-bearing invariant in the data model.

- Admin UI writes `post_drafts.markdown`.
- Publishing copies the draft snapshot into `post_published` (with `read_count`, `published_at`, `updated_at`).
- Public pages (`/writing/[slug]`), RSS, sitemap **always read `post_published`**. Never expose draft markdown to visitors.
- Editing a draft does not affect the live site until republished.

**Roles.** `users.role` is one of `user | admin | super_admin` (CHECK constraint, see `migrations/0005_user_role_admin.sql`).

- `/api/auth/register` only ever creates `user`. Privilege escalation must happen via direct D1 write.
- `admin` and `super_admin` both pass `isStaffRole` (`src/lib/auth/roles.ts`) and can use the writing admin UI. Use `requireStaff` for general admin routes; `requireSuperAdmin` only for super-admin-only actions (e.g., creating other admins).
- Sessions: cookie `blog_sid` (see `src/lib/constants.ts`), 30-day lifetime, rows in `sessions` table cleared lazily on lookup if expired.

**Markdown rendering.** Two layers in `src/lib/`:

- `markdown.ts` — `marked` instance with a custom `code` renderer that emits `<pre class="mermaid">` blocks for ` ```mermaid `. Output HTML is treated as trusted and inserted via `dangerouslySetInnerHTML` — markdown comes from `super_admin` only, so we don't sanitize. **Do not loosen this assumption to accept user-submitted markdown without adding sanitization.**
- `md-reading-nav.ts` — parses headings to assign stable anchor ids and produces the TOC payload consumed by `ArticleTocProgress`.
- `render-post.ts` is the entry point: `markdownToTrustedArticle()` returns `{ html, toc }`; `markdownToTrustedHtml()` is the preview-only shim.
- Mermaid is rendered client-side by `src/components/post/MermaidRenderer.tsx`.

**Risk control (Turnstile).** `/api/auth/register` and comment POST verify Turnstile via `src/lib/turnstile.ts`. Site key is public (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`), secret lives in `TURNSTILE_SECRET_KEY` (set with `wrangler secret put`). There is a server-only bypass for RSC preview/testing — see `comment-turnstile-bypass*.ts`.

**Site URL.** `src/lib/site.ts:getSiteBaseUrl()` reads `NEXT_PUBLIC_SITE_URL`, falling back to `https://docs.altriayu.uk` in production and `http://localhost:3000` otherwise. RSS and sitemap depend on this being correct. Production value lives in `wrangler.jsonc` `vars`.

**Root layout sets `dynamic = "force-dynamic"`.** Pages do not statically prerender by default in this app — don't add `revalidate`/`generateStaticParams` to public pages without confirming compatibility with the OpenNext-Workers target.

## Conventions

- TS path alias: `@/*` → `src/*`.
- Component class names: prefer the semantic utilities in `src/app/globals.css` (`surface-card`, `button-primary`, `story-link`, `input-shell`, `article-prose`). See `DESIGN.md` for the full design-token / class catalog before adding new visual styles — extending the existing variables is preferred over inventing a parallel palette.
- Migrations are append-only. Add `migrations/000N_*.sql`; never edit a shipped migration. D1 quirk: do **not** wrap migrations in `BEGIN TRANSACTION` (D1 manages the transaction itself) — see the header comment in `0005_user_role_admin.sql`.
- Avatars: PNG/JPEG/WEBP, ≤ 2MB (`AVATAR_*` constants in `src/lib/constants.ts`). New upload deletes the prior `avatar_key` in R2 to avoid orphans.
- Tests live next to source as `*.test.ts` and import directly from `@/lib/...`. They run under stripped-TS Node, so no JSX or DOM in test files.

## OpenSpec workflow

`openspec/` holds spec-driven change proposals (`changes/`) and merged specs (`specs/`). The `.cursor/commands/opsx-*.md` files describe the propose → apply → archive flow. If asked to "propose a change" or work on something under `openspec/`, read those command files first — they are the source of truth for the artifact structure.
