## 1. Markdown and anchor plumbing

- [x] 1.1 Extend Markdown→HTML pipeline so emitted heading elements receive deterministic `id` attributes with duplicate-title suffixing rules.
- [x] 1.2 Extract a heading tree (level, text, slug id) from the same parsed Markdown used for visitor HTML, for server-side TOC payload.
- [x] 1.3 Add unit tests covering duplicate headings, fenced-code false positives, and id stability across repeated renders.

## 2. Article layout and TOC UI

- [x] 2.1 Refactor published article detail layout into a responsive grid: prose column plus left-rail TOC at `lg+`, stacked fallback on smaller viewports.
- [x] 2.2 Implement TOC component with semantic structure, active-state styling, and keyboard-focusable entries linked to heading fragments.
- [x] 2.3 Ensure empty/no-heading articles hide the TOC without layout gaps.

## 3. Reading progress and scroll sync

- [x] 3.1 Implement reading-progress bar scoped to article prose bounds (start/end markers in DOM or measured container).
- [x] 3.2 Wire IntersectionObserver (or equivalent) to update active TOC item while scrolling; debounce/hysteresis to reduce flicker on dense headings.
- [x] 3.3 On TOC activation, scroll to target with offset for fixed chrome; respect `prefers-reduced-motion`.
- [x] 3.4 After programmatic scroll, reconcile progress fill and active TOC entry.

## 4. Theming, QA, and docs

- [x] 4.1 Apply neon theme tokens to TOC rail and progress bar (contrast, hover, focus rings) consistent with `cyber-panel` reading surfaces.
- [x] 4.2 Manual QA: long post, short post, mobile stack, RTL not required unless already supported — verify keyboard and screen reader landmarks.
- [x] 4.3 Update theme reviewer notes if separate documentation file exists outside this OpenSpec artifact set.
