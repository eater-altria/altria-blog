## Why

Published posts can grow long enough that sequential scrolling makes it slow to locate sections or resume reading. Providing an automatic side table-of-contents anchored to headings, together with explicit reading progress feedback, improves skimming, navigation clarity, and sense of orientation without authors maintaining manual outline markup.

## What Changes

- On the public article detail page, derive a hierarchical outline from the article Markdown heading structure (`#`, `##`, …) as rendered for visitors.
- Place the outline as a sidebar on the left of the article body on wide viewports (with a graceful layout on narrower screens—e.g., stacked above the article or an equivalent reachable pattern—so usability is preserved).
- Make each TOC entry actionable: selecting it scrolls the reader to the corresponding section and aligns with the visible reading-progress indicator so the perceived “position” stays consistent while scrolling manually.
- Optionally extend existing theme documentation constraints so TOC and progress UI stay visually consistent with the neon reading surface.

## Capabilities

### New Capabilities

- `post-detail-table-of-contents`: Automatic heading-derived outline rendering, placement next to article content at desktop widths, anchored navigation into the rendered HTML sections.
- `post-detail-reading-progress`: A reading-progress affordance synchronized with viewport scroll position through the article; clicks from the TOC MUST update scrolling and keep progress/active-outline state coherent.

### Modified Capabilities

- `cyberpunk-neon-theme-spec`: Expand component styling scope to explicitly include the article-detail TOC sidebar and reading-progress control so reviewers can validate contrast, focus states, and motion against existing neon readability rules.

## Impact

- Affected surfaces: published post detail (`src/app/posts/[slug]/page.tsx`), Markdown/HTML pipeline helpers (heading ids if missing), likely new client component(s) for scroll/Toc sync and progress.
- Behaviour is client-interactive beyond static HTML; SSR must still expose stable heading anchors for links and accessibility.
- No change to drafts unless preview parity is intentionally requested later.
