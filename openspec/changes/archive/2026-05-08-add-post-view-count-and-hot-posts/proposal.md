## Why

Current article pages do not expose post engagement signals, so readers cannot quickly judge which content is active or popular. Adding view metrics and a hot-posts area on the homepage improves content discovery and provides clearer feedback on article reach.

## What Changes

- Add per-post read count tracking for published article visits.
- Show each article's read count and comment count on the article detail page.
- Add a "hot posts" section on the homepage that lists the top 3 most-read published posts.
- Define ranking behavior and fallback behavior when there is insufficient traffic data.

## Capabilities

### New Capabilities
- `post-engagement-metrics`: Track and expose per-post read count and comment count for published content.
- `hot-posts-discovery`: Surface top-read published posts on the homepage for faster content discovery.

### Modified Capabilities
- `theme-review-documentation`: Update reviewer-facing documentation to include the new article and homepage engagement displays.

## Impact

- Affected code: `src/app/posts/[slug]/page.tsx`, `src/app/page.tsx`, data access layer in `src/db/` and related query helpers.
- Data model: likely requires a persistent field/table for read counts and query paths for ranking top posts.
- Runtime behavior: article detail requests will trigger read count updates (with guardrails to avoid duplicate inflation).
- UI behavior: article page and homepage gain new data-driven blocks and labels.
