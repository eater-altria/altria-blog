## MODIFIED Requirements

### Requirement: Component-Level Neon Styling Rules
The system SHALL define explicit neon-club styling rules for key UI components including navigation, hero call-to-action, content cards, buttons, links, form inputs, the published article-detail table-of-contents rail, AND the visitor reading-progress indicator.

#### Scenario: Critical surfaces are covered
- **WHEN** reviewers validate scope
- **THEN** style rules exist for `Nav`, homepage hero, posts listing/details—including the article-detail TOC rail and scroll/progress adornments—and auth/comment forms, plus admin surfaces

#### Scenario: Focus and hover feedback are consistent
- **WHEN** an interactive element transitions between default, hover, and focus states
- **THEN** the style specification defines predictable border, glow, and motion behavior for each state, including TOC link/active affordances and the progress indicator track without obscuring body text legibility
