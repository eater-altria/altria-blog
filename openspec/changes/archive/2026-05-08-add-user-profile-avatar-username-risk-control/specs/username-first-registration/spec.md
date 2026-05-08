## ADDED Requirements

### Requirement: Registration Requires Username Input
The registration flow MUST require a username field in addition to existing account credentials and MUST reject submissions without a valid username.

#### Scenario: Registration request without username is rejected
- **WHEN** a client submits registration data missing username
- **THEN** the API responds with a validation error and does not create a user account

#### Scenario: Registration request with valid username succeeds
- **WHEN** a client submits registration data including a valid, policy-compliant username
- **THEN** the system creates the account and persists username as the public identity field

### Requirement: Username Must Be Unique At Registration
The system MUST enforce username uniqueness during registration.

#### Scenario: Duplicate username is blocked
- **WHEN** a registration request uses a username already bound to another account
- **THEN** the system rejects account creation with a conflict error

#### Scenario: Distinct username is accepted
- **WHEN** a registration request uses a username not currently in use
- **THEN** the system allows registration to proceed (subject to other validations)
