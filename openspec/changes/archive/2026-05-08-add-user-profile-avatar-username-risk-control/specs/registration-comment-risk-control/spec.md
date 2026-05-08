## ADDED Requirements

### Requirement: Registration Must Pass Cloudflare Risk Verification
The system MUST require and verify a Cloudflare risk-control token for registration requests before creating a user account.

#### Scenario: Verified token allows registration processing
- **WHEN** a registration request includes a valid risk-control token and verification succeeds
- **THEN** the system proceeds to execute registration validation and account creation logic

#### Scenario: Missing or invalid token blocks registration
- **WHEN** a registration request lacks a token or token verification fails
- **THEN** the system rejects the request and does not create an account

### Requirement: Comment Submission Must Pass Cloudflare Risk Verification
The system MUST require and verify a Cloudflare risk-control token for comment creation requests before storing a comment.

#### Scenario: Verified token allows comment creation
- **WHEN** a comment submission includes a valid risk-control token and verification succeeds
- **THEN** the system proceeds with normal comment validation and persistence

#### Scenario: Failed verification blocks comment creation
- **WHEN** token verification fails for comment submission
- **THEN** the system rejects the request and does not persist the comment

### Requirement: Verification Failure Returns Actionable Client Error
The system MUST return an explicit, user-actionable error response when risk-control verification fails.

#### Scenario: Client receives retryable verification error
- **WHEN** verification fails due to token failure or challenge expiration
- **THEN** the API returns an error payload indicating verification failure and that the client must refresh/retry challenge
