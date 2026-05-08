## Context

The blog renders Markdown to sanitized HTML server-side (`markdownToTrustedArticle` / `parseMarkdownBodyWithAnchors`). To support heading jump links reliably, headings in the emitted HTML MUST carry stable fragment identifiers compatible with TOC links (`id="..."`), including collision handling when duplicates exist.

Readers expect TOC + progress UX to work without layout shift regressions inside the neon “cyber-panel” article layout.

## Goals / Non-Goals

**Goals:**

- Automatically build the TOC strictly from headings present in the visitor-facing Markdown (same structure as rendered body).
- Left-side TOC alongside the primary article column on sufficiently wide breakpoints.
- Anchored scrolling from TOC clicks with offset that avoids fixed chrome covering section titles (when applicable).
- A visible reading-progress indicator whose value reflects vertical progress through the article body and updates as the reader scrolls; TOC active item MUST stay aligned with the section currently dominant in view (within reasonable hysteresis/debounce constraints).
- Mobile/narrow graceful fallback MUST NOT trap keyboard focus or obscure content.

**Non-Goals:**

- Admin-only preview TOC parity unless cheap to share code paths (defer if it increases scope materially).
- Editable/per-post manual outline overrides authored in frontmatter at this iteration.
- Full “reader mode”, font-size controls, or print-specific layouts beyond what is explicitly specified.

## Decisions

1. **Heading extraction source of truth**
   - **Decision:** Parse headings from Markdown on the server in the same normalization path used for rendered HTML guarantees (reuse or mirror the Markdown parser config used for marking headings with ids), not by scraping headings from final HTML strings with regex fragile to `<code>#` artefacts.
   - **Rationale:** Consistent outline even if HTML serializer changes markup shape slightly later.
   - **Alternatives considered:** Regex over markdown text (slightly brittle with fenced-code false positives unless fenced blocks respected); scraping DOM IDs from HTML-only (risk of drift versus parser).

2. **Heading id collision strategy**
   - **Decision:** Slugify heading text plus numeric suffix increments for duplicates deterministically (`intro`, `intro-2`, …) and ensure rendered heading elements reuse the SAME ids emitted in the TOC.
   - **Rationale:** deterministic anchors predictable for links and SSR cache friendliness.

3. **TOC interaction + accessibility**
   - **Decision:** Use semantic list markup (`nav`/`ol`/`li`) plus button or anchor semantics that focus the heading target safely; honour `prefers-reduced-motion` where smooth scrolling applies.
   - **Rationale:** Screen reader and keyboard parity with clickable outline.

4. **Left rail layout responsiveness**
   - **Decision:** Use a two-column container at breakpoints above a Tailwind-aligned `lg` threshold; collapse TOC below the hero metadata or ahead of comments on smaller widths with identical behaviour.
   - **Rationale:** Avoid unusable cramped sidebars on tablets/phones without abandoning TOC entirely.

## Risks / Trade-offs

- **[Risk]** Client hydration mismatch if heading ids drift between SSR passes → **[Mitigation]** centralize slug/id generation invoked by both TOC data and markdown renderer pass.
- **[Risk]** “Active section flicker” when headings are dense → **[Mitigation]** hysteresis/rootMargin tuning for intersection observers and sane debouncing.
- **[Risk]** Long TOC taller than viewport → **[Mitigation]** sticky container with constrained max-height and internal scrolling without clipping focus outlines.

## Open Questions

- Should preview pages mirror TOC/progress verbatim for authoring confidence? Recommend follow-up iteration if duplication cost is noticeable.
