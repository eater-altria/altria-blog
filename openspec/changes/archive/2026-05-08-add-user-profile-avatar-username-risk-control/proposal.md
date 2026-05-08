## Why

Current account UX is email-centric and does not provide a user profile center for persona customization, which limits identity expression in navigation and comment interactions. The product also lacks explicit anti-bot controls on high-abuse entry points (registration and comments), increasing spam and fake account risk as community activity grows.

## What Changes

- Add a user center entry in the navbar where authenticated users can manage a display username and avatar.
- Persist user-facing username separately from email, and require username input at registration time.
- Store uploaded avatar assets in Cloudflare R2 and save resulting object URL/key to user profile data.
- Introduce Cloudflare risk-control verification for both registration and comment submission flows to reduce automated abuse.
- Update UI and API contracts so comments and user surfaces show username/avatar identity instead of exposing email addresses.

## Capabilities

### New Capabilities
- `user-profile-customization`: User center profile editing, including username updates and avatar upload backed by Cloudflare R2.
- `username-first-registration`: Registration flow that requires username and treats email as non-display account credential.
- `registration-comment-risk-control`: Cloudflare risk-control validation integrated into registration and comment write APIs.

### Modified Capabilities
- `post-engagement-metrics`: Comment interaction behavior is updated to use profile identity attributes (username/avatar) for rendered commenter metadata.

## Impact

- Affected code: Navbar/UI auth surfaces, registration form/API, comments form/API, user schema and profile update endpoints.
- Cloudflare integration: R2 bucket binding/config for avatar storage; risk-control (e.g., Turnstile or equivalent Cloudflare validation) on sensitive write paths.
- Data model and migrations: add username and avatar fields (plus constraints/indexing as needed) to user records.
- Operational considerations: file size/type limits for avatar upload, secure object naming, and fallback behavior when risk-control validation fails.
