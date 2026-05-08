## Context

The blog currently renders article content and comments but does not store or display article read counts. Homepage content discovery is chronological, with no popularity signal. This change introduces engagement signals that are visible to readers and queryable by the homepage.

Constraints:
- The app runs on Next.js + OpenNext with Cloudflare D1.
- Metrics must only consider published posts.
- The solution should be simple to reason about and low-maintenance for a small blog.

## Goals / Non-Goals

**Goals:**
- Persist and increment read counts for published article visits.
- Display read count and comment count on article detail pages.
- Display the top 3 hottest published posts on homepage.
- Keep ranking deterministic and stable when counts tie.

**Non-Goals:**
- Per-user analytics dashboards or historical trend charts.
- Bot filtering or advanced anti-abuse analytics.
- Real-time streaming counters across tabs/sessions.

## Decisions

1. **Store read counts in first-class persistence tied to posts**
   - Decision: add a dedicated counter field/table in D1 (implementation can choose a column on `postPublished` or a separate `post_metrics` table).
   - Rationale: durability and queryability are required for homepage ranking.
   - Alternatives considered:
     - In-memory cache only: rejected, not durable across instances/deploys.
     - External analytics vendor: rejected, unnecessary complexity for current scope.

2. **Increment read count during published article page request**
   - Decision: increment counter in the article detail request path after publish checks pass.
   - Rationale: guarantees only legitimate published-page renders affect the metric.
   - Alternatives considered:
     - Client-side beacon endpoint: rejected for now due to extra endpoint complexity and easier abuse.
     - Batch offline aggregation: rejected as over-engineering for current traffic.

3. **Compute comment count in article query and show with read count**
   - Decision: include comment aggregation in page data fetch and render both numbers in metadata area.
   - Rationale: one cohesive engagement block is easier for readers and reviewers.
   - Alternatives considered:
     - Render only read count: rejected because user explicitly requires both metrics.

4. **Homepage hot posts sorted by reads desc, then publish time desc**
   - Decision: select top 3 published posts by read count descending; tie-break by most recently published.
   - Rationale: stable deterministic ordering and understandable behavior.
   - Alternatives considered:
     - Sort by comments: rejected; user requested "最热文章" aligned to read count.
     - Weighted score: rejected until more signals are required.

## Risks / Trade-offs

- **[Risk] Counter inflation from repeated refreshes** -> Mitigation: accept simple counting in v1 and document behavior; add anti-duplication only when product requires it.
- **[Risk] Extra write on article reads may increase latency** -> Mitigation: keep update query minimal and indexed by post id.
- **[Risk] Data migration mismatch across environments** -> Mitigation: include explicit migration + fallback default zero value.
