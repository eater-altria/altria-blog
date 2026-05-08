## ADDED Requirements

### Requirement: Published Post Read Counts Are Persisted
The system SHALL persist a read count for each published post and increment the count when the post detail page is successfully requested.

#### Scenario: Increment count on published post view
- **WHEN** a reader opens a published post detail page
- **THEN** the system increments that post's persisted read count by 1

#### Scenario: Unpublished content does not increment counters
- **WHEN** a post is not published and cannot be rendered publicly
- **THEN** no read count increment is recorded

### Requirement: Article Detail Displays Engagement Metrics
The system SHALL display both read count and comment count for the current article on the published post detail page.

#### Scenario: Metrics are visible with article metadata
- **WHEN** a reader visits a published post detail page
- **THEN** the page shows the post's read count and total comment count in the article metadata area

#### Scenario: Zero-value metrics are still explicit
- **WHEN** a published post has no reads or comments yet
- **THEN** the page shows explicit zero values instead of hiding the metrics
