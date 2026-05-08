## ADDED Requirements

### Requirement: Article Body Exposes Stable Heading Anchors
The system SHALL ensure every heading level used to build the outline (at minimum `h2` and `h3`, and MUST include any other heading levels emitted from visitor Markdown) renders in the published article HTML with an `id` attribute that matches the corresponding TOC entry fragment.

#### Scenario: Heading links remain stable after repeated renders
- **WHEN** the same published Markdown is rendered multiple times
- **THEN** emitted heading `id` values remain identical for the same heading text and ordinal position

#### Scenario: Duplicate heading titles receive unique ids
- **WHEN** multiple headings share the same visible text in one article
- **THEN** each heading receives a deterministic unique `id` so fragment links from the TOC scroll to the intended section

### Requirement: Desktop TOC Beside Article Content
On viewports at or above the documented wide breakpoint (`lg`-equivalent breakpoint used in implementation), the system SHALL render an automatically generated TOC to the LEFT of the main article prose column inside the visitor article-detail layout WITHOUT hiding essential article metadata panels.

#### Scenario: Wide layout shows TOC and article together
- **WHEN** a reader opens an article-detail page at a viewport width at or above the wide breakpoint AND the Markdown contains at least one outline-eligible heading
- **THEN** the TOC renders in a sidebar column to the left of the prose region

#### Scenario: Empty outline suppresses distracting chrome
- **WHEN** the Markdown contains NO outline-eligible headings
- **THEN** the system SHALL omit the TOC region entirely or render zero-height equivalent without blank placeholder panels misleading users

### Requirement: Accessible TOC Navigation Into Sections
Each TOC entry SHALL be focusable via keyboard navigation and activating it MUST scroll the main document viewport so the referenced heading aligns into view with safe offset respecting fixed layout chrome when present.

#### Scenario: TOC click scrolls visible heading into view
- **WHEN** a reader activates a TOC entry targeting a heading anchor
- **THEN** that heading becomes scrolled into readable view and retains visible focus/outline affordances consistent with the theme spec
