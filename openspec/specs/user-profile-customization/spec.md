## ADDED Requirements

### Requirement: Authenticated User Can Access User Center From Navbar
The system MUST provide an authenticated-only user center entry in the primary navigation that routes to profile customization.

#### Scenario: Signed-in user sees user center nav entry
- **WHEN** an authenticated user loads any page with the main navbar
- **THEN** the navbar includes a visible link or menu item to the user center profile page

#### Scenario: Anonymous user does not see user center nav entry
- **WHEN** a non-authenticated visitor loads a page with the main navbar
- **THEN** no user center profile entry is rendered

### Requirement: User Can Update Public Username
The system MUST allow an authenticated user to update their public username through the user center and persist it for subsequent reads.

#### Scenario: Username update succeeds with valid unique value
- **WHEN** an authenticated user submits a valid username that does not conflict with another account
- **THEN** the system saves the username and returns success

#### Scenario: Username update is rejected on conflict
- **WHEN** an authenticated user submits a username already used by another account
- **THEN** the system rejects the update with a conflict validation error

### Requirement: User Can Upload and Replace Avatar Stored In R2
The system MUST allow authenticated users to upload avatar images, store them in Cloudflare R2, and associate the stored object reference with the user profile.

#### Scenario: Avatar upload succeeds
- **WHEN** an authenticated user uploads a valid avatar image within allowed size/type limits
- **THEN** the system stores the image in R2 and updates the user profile avatar reference

#### Scenario: Existing avatar is replaced cleanly
- **WHEN** an authenticated user uploads a new avatar after already having one
- **THEN** the system updates the profile to the new R2 object and retires or overwrites the prior object according to storage policy

#### Scenario: Invalid avatar file is rejected
- **WHEN** an authenticated user uploads a file that exceeds limits or has unsupported type
- **THEN** the system rejects the upload and leaves the existing profile avatar unchanged
