## ADDED Requirements

### Requirement: Homepage Shows Top Three Hot Posts
The system SHALL display a "hot posts" section on the homepage with the top 3 published posts ranked by read count.

#### Scenario: Top 3 posts are displayed
- **WHEN** a reader opens the homepage
- **THEN** the page renders up to three published posts with the highest read counts

#### Scenario: Ranking uses deterministic tie-breaker
- **WHEN** multiple published posts have the same read count
- **THEN** posts are ordered by most recent publish time first

### Requirement: Hot Posts Card Includes Essential Context
The system SHALL display each hot post with enough information for readers to evaluate and navigate quickly.

#### Scenario: Card shows engagement and navigation cues
- **WHEN** the hot posts section is rendered
- **THEN** each item includes title, link to article detail, and read count

#### Scenario: Graceful fallback with limited content
- **WHEN** fewer than three published posts exist
- **THEN** the section renders all available published posts without layout breakage
