## ADDED Requirements

### Requirement: Visible Article Reading Progress Indicator
On the visitor article-detail page, the system SHALL display a conspicuous reading-progress control whose quantitative fill or equivalent visual mapping reflects scroll progress from the START of article prose body through the END of that same prose body (excluding comments and unrelated footers inside the article component tree).

#### Scenario: Progress increases while scrolling down the article
- **WHEN** a reader scrolls downward through the article prose from top to bottom
- **THEN** the reading-progress indicator monotonically advances toward full completion at the bottom of the prose body

#### Scenario: Progress decreases when scrolling back up
- **WHEN** a reader scrolls upward before reaching the end of the prose body
- **THEN** the reading-progress indicator decreases accordingly without leaving “full” state unless the bottom of prose is passed

### Requirement: TOC Selection Coordinates With Progress And Active Section
When the reader navigates via the TOC, the reading-progress indicator SHALL update coherently after the scroll settles, and the TOC SHALL indicate which section is currently “active” based on which heading’s content region is most representative of the reader’s viewport position.

#### Scenario: TOC jump updates progress and active entry
- **WHEN** a reader activates a TOC entry that scrolls to a later section
- **THEN** the reading-progress indicator reflects the new scroll offset after the scroll settles AND the active TOC highlighting aligns with the dominant section in view per the scroll-sync rules defined in technical design

### Requirement: Reduced-Motion Accommodation
Where smooth scrolling animations are employed for TOC-triggered scrolling, they SHALL honor `prefers-reduced-motion: reduce` using instant positional jumps equivalent to non-animated scroll.

#### Scenario: Reduced-motion users avoid animated scroll glide
- **WHEN** a reader prefers reduced motion and activates TOC navigation or equivalent scroll helpers
- **THEN** scrolling occurs without smooth interpolation beyond what accessibility defaults require
