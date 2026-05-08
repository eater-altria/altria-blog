## 1. Data Model and Configuration

- [x] 1.1 Add and run database migration for user `username` and `avatar` profile fields with uniqueness constraints.
- [x] 1.2 Backfill existing users with deterministic placeholder usernames and document conflict-handling policy.
- [x] 1.3 Configure Cloudflare R2 binding and risk-control credentials/secrets across local and deployed environments.

## 2. User Center and Profile APIs

- [x] 2.1 Add authenticated navbar user center entry and profile page route.
- [x] 2.2 Implement profile update API for username changes with server-side validation and conflict responses.
- [x] 2.3 Implement avatar upload API path with MIME/size validation, R2 object write, and prior avatar replacement cleanup.

## 3. Registration and Comment Flow Changes

- [x] 3.1 Update registration UI to collect username and submit it to the registration API.
- [x] 3.2 Update registration API to require username and enforce uniqueness at write time.
- [x] 3.3 Integrate Cloudflare risk-control widget/token acquisition into registration and comment forms.
- [x] 3.4 Add backend risk-control token verification to registration and comment creation endpoints with explicit failure responses.

## 4. Rendering, Testing, and Rollout

- [x] 4.1 Update comment rendering and related selectors to display username/avatar identity and hide email from public UI.
- [x] 4.2 Add or update automated tests for username validation, avatar upload constraints, R2 persistence behavior, and risk-control pass/fail scenarios.
- [x] 4.3 Add operational documentation for avatar storage policy, verification failure handling, and rollout/rollback checklist.
