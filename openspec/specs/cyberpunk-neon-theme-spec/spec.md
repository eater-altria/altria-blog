## ADDED Requirements

### Requirement: Unified Neon Theme Tokens
The system SHALL define a reusable neon-club token set for colors, typography emphasis, border styles, glow intensity, and interaction states so that all core pages can share a consistent cyberpunk visual language.

#### Scenario: Token catalog is reviewable
- **WHEN** design reviewers inspect the theme documentation
- **THEN** they can find named tokens for background layers, text hierarchy, neon accents, borders, shadows, and motion timing

#### Scenario: Tokens are implementation-ready
- **WHEN** frontend developers begin implementation
- **THEN** each token has a clear semantic purpose and usage guidance without requiring visual reinterpretation

### Requirement: Component-Level Neon Styling Rules
The system SHALL define explicit neon-club styling rules for key UI components including navigation, hero call-to-action, content cards, buttons, links, form inputs, the published article-detail table-of-contents rail, AND the visitor reading-progress indicator.

#### Scenario: Critical surfaces are covered
- **WHEN** reviewers validate scope
- **THEN** style rules exist for `Nav`, homepage hero, posts listing/details—including the article-detail TOC rail and scroll/progress adornments—and auth/comment forms, plus admin surfaces

#### Scenario: Focus and hover feedback are consistent
- **WHEN** an interactive element transitions between default, hover, and focus states
- **THEN** the style specification defines predictable border, glow, and motion behavior for each state, including TOC link/active affordances and the progress indicator track without obscuring body text legibility

### Requirement: Readability and Accessibility Guardrails
The system SHALL define readability guardrails so neon styling does not degrade long-form reading or interaction clarity.

#### Scenario: Body content remains readable
- **WHEN** neon effects are applied to the page
- **THEN** long-form body text uses non-glowing typography with sufficient contrast against dark backgrounds

#### Scenario: Motion remains restrained
- **WHEN** animations are specified
- **THEN** the specification limits animation intensity, frequency, and duration to avoid distracting flicker
