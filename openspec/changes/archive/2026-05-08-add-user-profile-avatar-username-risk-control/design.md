## Context

The current blog supports account registration/login and comments, but user identity presentation is email-oriented and there is no dedicated profile center for managing display metadata. The navbar lacks an account-centric destination where users can update avatar and public username. In parallel, registration and comment submission are write-heavy endpoints vulnerable to automated abuse without explicit challenge verification.

This change spans UI (navbar, forms, user center), API routes (registration, comments, profile updates), storage (user profile fields), and Cloudflare services (R2 for avatar objects and risk-control token verification), so a single design is needed to align contracts and rollout.

## Goals / Non-Goals

**Goals:**
- Add a user center entry in navbar for authenticated users.
- Support editable public username and avatar for user profiles.
- Persist avatar binaries in Cloudflare R2 with safe object naming and profile linkage.
- Require username input during registration and enforce uniqueness/validation.
- Add Cloudflare risk-control checks to registration and comment submission APIs.
- Ensure user-visible surfaces use username/avatar identity instead of email display.

**Non-Goals:**
- Building a full social profile system (bio, followers, profile pages).
- Migrating historical comments to denormalized avatar snapshots.
- Introducing third-party identity providers.
- Reworking unrelated content/discovery features.

## Decisions

1. **Profile model adds explicit `username` and `avatar` fields**
   - **Decision:** Add database columns for normalized username (unique, indexed) and avatar metadata (object key and/or public URL).
   - **Rationale:** Username is a first-class, user-controlled public identifier distinct from login email. Avatar reference in profile allows R2 lifecycle management.
   - **Alternative considered:** Derive username from email local-part. Rejected due to privacy leakage and collisions.

2. **Avatar uploads are handled by server API and stored in Cloudflare R2**
   - **Decision:** Accept avatar upload through authenticated profile endpoint, validate MIME/size, generate deterministic scoped key (e.g., `avatars/<userId>/<timestamp>.<ext>`), write to R2 binding, and persist key.
   - **Rationale:** Centralized validation prevents arbitrary client-side writes and simplifies auditing and abuse controls.
   - **Alternative considered:** Direct client upload with presigned URL. Deferred to keep first version simpler and minimize additional signing infrastructure.

3. **Navbar user center is the single entry point for profile customization**
   - **Decision:** Add a dedicated navigation item for signed-in users that links to a profile page containing username + avatar controls.
   - **Rationale:** Keeps account customization discoverable and avoids overloading admin/post authoring pages.
   - **Alternative considered:** Embed profile edit controls in registration/login views. Rejected because profile updates must remain accessible after onboarding.

4. **Risk-control verification is mandatory for registration and comment writes**
   - **Decision:** Registration form and comment form must submit a risk token; backend verifies token with Cloudflare risk-control API before processing write.
   - **Rationale:** Protects highest-risk unauthenticated and semi-authenticated write paths with minimal UX friction.
   - **Alternative considered:** IP rate limiting only. Rejected because it is weaker against distributed bot traffic.

5. **Comment display resolves author identity from profile fields**
   - **Decision:** Comment rendering uses `username` as primary label and `avatar` as optional visual identity; email is never displayed publicly.
   - **Rationale:** Matches requested UX/privacy model and aligns new registration requirement with visible outcomes.
   - **Alternative considered:** Continue showing email in comments while adding username only in navbar. Rejected as inconsistent identity model.

## Risks / Trade-offs

- **[Risk] Username uniqueness conflicts for existing users** -> **Mitigation:** add migration strategy (backfill placeholder usernames, enforce edit-on-conflict).
- **[Risk] R2 storage growth and orphaned avatar objects** -> **Mitigation:** overwrite/delete prior object on successful update and enforce quotas/size limits.
- **[Risk] Risk-control outages can block legitimate writes** -> **Mitigation:** define fail-closed behavior with clear UI error, plus observability/alerts for sustained verification failures.
- **[Risk] Added friction may reduce registration/comment conversion** -> **Mitigation:** load challenges only on submit path and keep retry UX concise.
- **[Risk] Public URL handling may expose private bucket patterns** -> **Mitigation:** use controlled public domain/path strategy and avoid leaking internal metadata.

## Migration Plan

1. Add DB migration for username/avatar fields and constraints.
2. Backfill usernames for existing users using deterministic placeholders, then prompt users to customize.
3. Configure Cloudflare bindings/secrets for R2 bucket and risk-control credentials in environments.
4. Deploy API support first (accept/serve new profile fields and token verification), then ship UI updates.
5. Monitor registration/comment failure rates and verification metrics post-deploy.
6. Rollback plan: disable new UI entrypoints and gate strict checks with feature flag if emergency regressions occur; keep backward-compatible reads for existing accounts.

## Open Questions

- Should username policy allow Unicode, or remain ASCII/limited charset in V1?
- Should avatar retrieval use direct public R2 URL or proxied asset endpoint for cache/security control?
- For existing users without username, do we force first-login completion before posting comments?
- Which Cloudflare risk product/config is canonical in this repo (Turnstile or another challenge flow), and where should shared verification utility live?
