## MODIFIED Requirements

### Requirement: Article Detail Displays Engagement Metrics
The system SHALL display read count and comment count for the current article on the published post detail page, and comment entries SHALL render commenter identity using public profile data (username and optional avatar) instead of email.

#### Scenario: Metrics are visible with article metadata
- **WHEN** a reader visits a published post detail page
- **THEN** the page shows the post's read count and total comment count in the article metadata area

#### Scenario: Zero-value metrics are still explicit
- **WHEN** a published post has no reads or comments yet
- **THEN** the page shows explicit zero values instead of hiding the metrics

#### Scenario: Comment identity uses profile fields
- **WHEN** comments are rendered on a published post detail page
- **THEN** each comment shows the author's username and avatar (if present), and does not expose the author's email address
