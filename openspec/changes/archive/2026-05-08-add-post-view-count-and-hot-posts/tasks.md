## 1. Data Model and Query Foundations

- [x] 1.1 Add database migration for persistent per-post read counts with default zero for existing published posts.
- [x] 1.2 Update Drizzle schema/types to expose read count fields used by article and homepage queries.
- [x] 1.3 Add or update query helpers to fetch comment totals and top-read published posts with deterministic tie-breaking.

## 2. Article Detail Engagement Metrics

- [x] 2.1 Update published article detail request flow to increment read count only after publish checks pass.
- [x] 2.2 Extend article detail data fetching to include read count and comment count in one render path.
- [x] 2.3 Render read count and comment count in the article metadata area with explicit zero-value handling.

## 3. Homepage Hot Posts Section

- [x] 3.1 Add homepage data query for top 3 hottest published posts ranked by read count desc and publish time desc.
- [x] 3.2 Implement a hot-posts UI section on homepage showing title, article link, and read count per item.
- [x] 3.3 Add graceful fallback behavior when fewer than three published posts are available.

## 4. Validation and Documentation

- [x] 4.1 Add or update tests for read-count increment behavior, article metrics rendering, and homepage top-3 ranking.
- [x] 4.2 Validate no regressions on posts listing/detail pages and ensure query/migration behavior works in local D1.
- [x] 4.3 Update theme review documentation references to include engagement badges and hot-post card surfaces.
