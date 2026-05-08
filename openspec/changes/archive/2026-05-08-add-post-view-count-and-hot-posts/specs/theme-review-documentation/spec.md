## MODIFIED Requirements

### Requirement: Traceability to Implementation Surfaces
The system SHALL map design decisions to concrete implementation surfaces to reduce ambiguity during development handoff, including engagement-related surfaces introduced after theming.

#### Scenario: Engineers locate target files
- **WHEN** implementation planning starts
- **THEN** the documentation references primary target areas such as global styles, navigation, homepage, article detail metadata (read count/comment count), and content interaction surfaces

#### Scenario: Future updates remain maintainable
- **WHEN** a future contributor updates visual rules
- **THEN** they can revise one documented source of truth without redefining style assumptions, including rules for engagement badges and hot-post cards
