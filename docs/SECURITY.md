# StudyForge — Security

## 1. Purpose

This document defines the security requirements and boundaries for StudyForge.

StudyForge is a self-hosted application designed primarily for individual learners.

Security priorities are:

1. Protect learner data
2. Protect server credentials
3. Prevent unauthorized database access
4. Validate untrusted input
5. Prevent common web vulnerabilities
6. Keep external integrations isolated
7. Fail safely
8. Keep the security model simple enough to maintain

---

# 2. Security Philosophy

StudyForge follows a simple principle:

> Treat everything crossing a trust boundary as untrusted.

This includes:

- Browser input
- Form submissions
- URL parameters
- YouTube API responses
- HTTP headers
- Environment configuration
- Imported data
- Database values
- External network responses

The application must validate and normalize data before using it.

---

# 3. Security Boundaries

The primary security boundaries are:

```text
Browser
   │
   │ untrusted input
   ▼
Next.js Server
   │
   ├── SQLite
   │
   └── YouTube API
```

The browser must never bypass the server to access:

- SQLite
- Server filesystem
- YouTube API credentials
- R2 credentials
- Server environment variables

---

# 4. Browser Trust Model

The browser is not trusted.

Client-side validation is useful for user experience but is not a security boundary.

For example:

```text
Browser validation
```

does not replace:

```text
Server validation
```

Every mutation must validate its inputs on the server.

---

# 5. Server Authority

The server is authoritative for:

- Database mutations
- Course structure
- Module structure
- Lesson structure
- Ordering
- Progress
- Notes
- YouTube API access
- Profile

The client may request an operation.

The server decides whether that operation is valid.

---

# 6. No Direct Database Access From Browser

The browser must never connect directly to SQLite.

Incorrect:

```text
Browser
   ↓
SQLite
```

Correct:

```text
Browser
   ↓
Next.js
   ↓
SQLite
```

This prevents exposing the database file or database interface to the public network.

---

# 7. SQLite Protection

The SQLite database contains important learner data.

It must:

- Exist on server-side storage
- Not be served as a static asset
- Not be placed in the public directory
- Not be directly downloadable
- Not be exposed through a route
- Have appropriate filesystem permissions

The database should reside outside the application's publicly served files.

---

# 8. Database Credentials

SQLite does not require a database username/password in the traditional sense.

Its primary security boundary is filesystem access.

Therefore:

```text
Protect the filesystem
```

is equivalent to:

```text
Protect the database
```

The application process should have only the permissions it requires.

---

# 9. Database Path Safety

Database paths must come from trusted server configuration.

Do not allow browser input to determine arbitrary filesystem paths.

Never construct database paths directly from request parameters.

Incorrect:

```text
/database?path=<user supplied path>
```

The application must use a fixed/configured database location.

---

# 10. Environment Variables

Secrets must be supplied through environment variables or an equivalent secure secret-management mechanism.

Examples include:

```text
YOUTUBE_API_KEY
```

and, when backups are enabled:

```text
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
```

Secrets must not be hard-coded into source code.

---

# 11. Environment Variable Exposure

Only values explicitly intended for browser use may be exposed to client-side code.

Sensitive server variables must never use a client-exposure mechanism such as a public environment-variable prefix.

The following must remain server-only:

```text
YOUTUBE_API_KEY
R2 credentials
Database configuration
Backup credentials
```

---

# 12. Secret Logging

Never log secrets.

Avoid logging:

```text
API keys
Access tokens
Passwords
Secret environment variables
Authorization headers
Signed URLs containing credentials
```

Logs should contain enough information for troubleshooting without exposing credentials.

---

# 13. Git Security

The repository must not contain:

```text
Real API keys
Real cloud credentials
Production database files
Private backup files
Secrets in test fixtures
```

Sensitive local files should be excluded through `.gitignore`.

---

# 14. `.env` Files

Development environment files containing real credentials must not be committed.

For example:

```text
.env.local
.env.production
```

should remain local or be managed by the deployment platform.

The repository may contain:

```text
.env.example
```

with placeholder values.

---

# 15. Input Validation

All external input must be validated.

Examples:

```text
Course title
Course description
Course learning goal
Module title
Lesson ID
Course ID
Module ID
YouTube video ID
Playback position
Note content
Ordering positions
```

Zod should be used where appropriate for structured validation.

---

# 16. Validation Location

Validation should occur at the server boundary.

For example:

```text
Request
  ↓
Parse
  ↓
Validate
  ↓
Business rule checks
  ↓
Database mutation
```

Do not perform a database mutation before validation is complete.

---

# 17. Authorization Boundary

V1 has no authentication or multi-user authorization.

The single-row local `profile` table (see DATA_MODEL.md §44) is a name for the installation. It provides no access control and must never be mistaken for authorization.

Therefore, the application assumes:

> Anyone with access to the deployed StudyForge instance can use and modify that instance.

This is an important deployment assumption.

StudyForge must not falsely imply that V1 provides user accounts or access control.

---

# 18. Private Deployment Consideration

Because V1 has no authentication, operators who need restricted access should place StudyForge behind an appropriate external access-control layer.

Examples may include:

- Private network
- VPN
- Reverse-proxy authentication
- Hosting-provider access control
- Other infrastructure-level authentication

These mechanisms are outside the core V1 application.

---

# 19. No Fake Authentication

Do not create an internal authentication system merely to make the application appear secure.

If authentication is not implemented:

```text
No authentication
```

must remain the documented behavior.

The local profile is not authentication. A profile name must never be treated as a credential, identity, or access-control signal.

Authentication is a future feature, not a hidden assumption.

---

# 20. CSRF Considerations

State-changing operations must be designed with browser request security in mind.

Where framework-provided protections apply, use them rather than creating custom security mechanisms unnecessarily.

Server Actions should use Next.js's built-in request model appropriately.

For custom Route Handlers:

- Validate request methods
- Validate request bodies
- Avoid accepting unintended cross-origin requests
- Apply appropriate origin/security checks where necessary

---

# 21. Same-Origin Assumption

StudyForge is primarily designed as a same-origin web application.

For example:

```text
https://study.example.com
```

serves both:

```text
UI
```

and:

```text
Application endpoints
```

Avoid unnecessary cross-origin APIs.

---

# 22. CORS

StudyForge should not enable permissive CORS by default.

Avoid configurations such as:

```text
Access-Control-Allow-Origin: *
```

unless a documented requirement actually exists.

V1 does not require a public cross-origin API.

---

# 23. SQL Injection

Database queries must use Drizzle's parameterized query mechanisms.

Never construct SQL statements by concatenating raw user input.

Incorrect:

```text
"SELECT * FROM lessons WHERE title = '" + userInput + "'"
```

Correct:

```text
Parameterized query
```

The ORM/query builder should handle parameter binding.

---

# 24. Dynamic Query Safety

User-controlled values must not determine arbitrary SQL fragments.

For example, a user should not be able to provide raw:

```text
ORDER BY
WHERE
TABLE
COLUMN
```

expressions unless explicitly validated against an allowlist.

---

# 25. XSS Prevention

User-controlled content may include:

- Course titles
- Descriptions
- Notes
- YouTube metadata

These values must be rendered as text by default.

Do not inject user content into raw HTML unless absolutely necessary.

---

# 26. Dangerous HTML

Avoid:

```text
dangerouslySetInnerHTML
```

for ordinary learner content.

If rich HTML becomes a future requirement, it must be sanitized with a well-maintained sanitizer and an explicitly defined allowed-content policy.

---

# 27. Notes Security

Lesson notes are user-controlled data.

Notes must be stored and rendered safely.

The application should treat note content as plain text in V1.

A learner entering:

```text
<script>alert("test")</script>
```

must not cause JavaScript to execute when the note is displayed.

---

# 28. YouTube Data as Untrusted Input

YouTube API responses are external data.

Even though they originate from a trusted platform, StudyForge should treat them as untrusted input.

Validate:

- Video ID
- Title
- Channel ID
- Channel name
- Thumbnail URL
- Duration
- Description
- Published timestamp

before storing or displaying them.

---

# 29. YouTube API Key Protection

The YouTube API key must only be used from server-side code.

Architecture:

```text
Browser
   ↓
StudyForge Server
   ↓
YouTube API
```

Never:

```text
Browser
   ↓
YouTube API with StudyForge secret
```

---

# 30. YouTube API Abuse

Search endpoints should not allow unlimited uncontrolled requests.

StudyForge should:

- Require an explicit search action
- Validate search parameters
- Avoid search-on-every-keystroke
- Limit unreasonable query sizes
- Handle API quota failures safely

If rate limiting becomes necessary, it can be introduced at the application or infrastructure layer.

---

# 31. YouTube URL Handling

StudyForge should store the canonical YouTube video ID rather than trusting arbitrary URLs as persistent identifiers.

Example:

```text
youtube_video_id
```

is preferred over storing an uncontrolled URL as the primary reference.

When accepting URLs, parse and validate them before extracting a video ID.

---

# 32. External URL Safety

Stored external URLs should not automatically be treated as safe.

Where a URL is displayed as a link, the application should use appropriate URL validation.

For known YouTube resources, restrict URLs to expected YouTube domains where practical.

---

# 33. Open Redirect Prevention

Do not allow user input to determine arbitrary redirect destinations.

Avoid patterns such as:

```text
/redirect?url=<arbitrary URL>
```

unless the destination is validated against a strict allowlist.

StudyForge does not require arbitrary external redirects in V1.

---

# 34. Embedded YouTube Player

The YouTube player is external content.

The application should embed it through the supported YouTube player mechanism rather than attempting to download or proxy the video.

The player should not receive StudyForge server secrets.

---

# 35. Content Security

Production deployments use the browser security headers below, configured in `next.config.ts`.

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
X-Frame-Options
```

The policy explicitly accounts for required YouTube embedding and application behavior.

Do not deploy an overly restrictive policy that breaks the core learning experience.

---

# 36. Content Security Policy

StudyForge ships a pragmatic Content-Security-Policy header that covers the required StudyForge resources.

The policy:

- Allows the application origin, YouTube's player script (`www.youtube.com`, `s.ytimg.com`), YouTube player frames (`youtube.com`, `youtube-nocookie.com`), thumbnails (`*.ytimg.com`), and inline styles.
- Uses `'unsafe-inline'` for scripts to stay compatible with Next.js RSC hydration; this is a deliberate pragmatic trade-off and should not be relied on as the only injection defense.
- Denies framing (`frame-ancestors 'none'`), objects, and unsupported base URIs.

Do not use:

```text
*
```

as a blanket security policy.

The CSP is tested against Learning Mode and YouTube playback in the manual browser pass.

---

# 37. Clickjacking

StudyForge sends `X-Frame-Options: DENY` to prevent unauthorized framing of the application.

The application does not allow arbitrary third-party sites to embed the StudyForge UI.

---

# 38. MIME Type Protection

The application prevents browsers from incorrectly interpreting returned content as another MIME type by sending:

```text
X-Content-Type-Options: nosniff
```

---

# 39. Error Handling

Errors crossing the browser boundary must be sanitized.

Do not return:

```text
Database stack trace
Filesystem path
Environment variable
Internal SQL query
Third-party API credential
```

Instead return a safe application-level error.

---

# 40. Error Logging

Detailed diagnostic information may be logged server-side when appropriate.

However, logs should still avoid sensitive values.

For example:

```text
YouTube search failed
```

is acceptable.

Including the complete API key in the log is not.

---

# 41. Authentication Future Boundary

If authentication is introduced later, it must be designed as a major architectural change.

Future authentication would require:

```text
Users
Ownership
Authorization
Session management
Password/token security
Migration strategy
```

It must not simply be bolted onto UI components.

---

# 42. Future Multi-User Security

If multi-user support is introduced, every resource must have an ownership or authorization relationship.

For example:

```text
User
 └── Course
      └── Module
           └── Lesson
```

Queries must verify ownership at the server boundary.

A future user must never be able to access another user's:

- Courses
- Lessons
- Notes
- Progress

by changing an ID in a request.

---

# 43. ID Enumeration

Even without authentication in V1, resource IDs should not be treated as an authorization mechanism.

For future authenticated deployments:

```text
Knowing a course ID
```

must never imply:

```text
Permission to access that course
```

Authorization must be checked independently.

---

# 44. Request Size Limits

Endpoints should avoid accepting unnecessarily large request bodies.

For example:

```text
Course title
Module title
Note content
Search query
```

should have reasonable maximum lengths.

This reduces abuse and prevents accidental oversized requests.

---

# 45. Note Size

Notes should have a documented reasonable maximum length.

The exact limit may be chosen during implementation.

The important principle is:

```text
Unlimited request body
```

should not be assumed.

---

# 46. Search Query Limits

YouTube search input should have a reasonable length limit.

Reject or normalize obviously excessive queries.

This prevents unnecessary external API requests and reduces abuse.

---

# 47. Playback Position Security

Playback position is numeric input from the browser.

The server must validate:

```text
Type
Non-negative value
Reasonable range
```

If duration is known:

```text
position <= duration
```

should be enforced or safely clamped.

---

# 48. Ordering Security

Reordering requests must validate that the requested items actually belong to the expected parent.

For example:

```text
Move lesson X within module Y
```

must not accidentally modify:

```text
Lesson Z in module Q
```

because a malicious request supplied arbitrary IDs.

---

# 49. Parent-Child Integrity

Every mutation involving nested resources should verify relationships.

Example:

```text
Course A
 └── Module A
      └── Lesson A
```

A request claiming:

```text
course_id = B
module_id = A
```

must not be accepted simply because both IDs are valid.

The server must verify the actual relationship.

---

# 50. IDOR Prevention

Future authenticated versions must specifically protect against Insecure Direct Object Reference vulnerabilities.

For example:

```text
/api/courses/123
```

must not expose course `123` merely because the requester knows its ID.

Authorization must be evaluated against the authenticated user.

---

# 51. File Uploads

V1 does not support file uploads.

Therefore, StudyForge does not need to implement:

- Multipart upload security
- File-type detection
- Malware scanning
- Uploaded-file storage
- File execution prevention

If uploads are added later, they require a separate security design.

---

# 52. Local Video Hosting

StudyForge does not host downloaded YouTube videos.

Therefore, it does not require a media-upload security layer in V1.

This significantly reduces the attack surface.

---

# 53. R2 Security

If R2 backups are enabled:

- Credentials remain server-side
- Bucket access should be private
- Backup objects should not be publicly readable
- Credentials should have minimum required permissions
- Backup URLs should not be exposed unnecessarily

The application should never expose the R2 bucket as a public media store.

---

# 54. Backup Data Sensitivity

Backups contain learner data.

Protect them as carefully as the live database.

A backup should not become an accidental public download.

---

# 55. Backup Credential Rotation

Operators should be able to replace backup credentials without changing application data.

Credentials should be supplied through environment configuration rather than stored inside the SQLite database.

---

# 56. Dependency Security

Dependencies are part of the application's attack surface.

StudyForge should:

- Keep dependencies reasonably current
- Review security advisories
- Avoid unnecessary dependencies
- Remove unused packages
- Commit the lockfile
- Review major dependency upgrades

Do not add a dependency solely to solve a trivial problem that can safely be solved with the existing stack.

---

# 57. Dependency Updates

Dependency updates should be tested before deployment.

At minimum:

```text
Update dependency
      ↓
Install
      ↓
Typecheck
      ↓
Tests
      ↓
Build
```

Significant framework or ORM upgrades require additional review.

---

# 58. Supply Chain Security

Do not install packages solely because a random code snippet recommends them.

Before adding a dependency, consider:

- Maintainer reputation
- Maintenance activity
- Package purpose
- Dependency count
- Security history
- License compatibility
- Whether the existing stack already solves the problem

---

# 59. Docker Security

The production container should run with the minimum privileges required.

Where practical:

- Avoid privileged containers
- Avoid unnecessary host mounts
- Avoid host networking unless required
- Avoid exposing unnecessary ports
- Run as a non-root user where compatible with the application
- Keep the image minimal

---

# 60. Filesystem Security

The application should not require broad filesystem access.

Ideally:

```text
Application
 ├── Read application files
 └── Read/write designated data directory
```

It should not need unrestricted access to the host filesystem.

---

# 61. Container Secrets

Secrets should not be baked into Docker images.

Avoid:

```text
ENV YOUTUBE_API_KEY=...
```

inside the Dockerfile for real credentials.

Supply secrets at runtime through the deployment environment.

---

# 62. Docker Image Security

Production images should:

- Use a supported base image
- Minimize unnecessary packages
- Avoid development tools
- Avoid embedded secrets
- Be rebuilt when important base-image security updates are released

---

# 63. Database Backups and Security

Backup operations must not expose the live database through an HTTP endpoint.

Do not create a route such as:

```text
/download-backup
```

without strong authentication and authorization.

V1 does not require public backup management endpoints.

---

# 64. Security Headers

The application sends the following security headers (configured in `next.config.ts`):

```text
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy
```

The header set is verified against the deployed application, including YouTube playback and application behavior.

---

# 65. HTTPS

Production deployments should use HTTPS.

Sensitive configuration should never be transmitted over an unencrypted public connection.

Operators should configure TLS through their reverse proxy or hosting platform.

---

# 66. Local HTTP

Local development may use:

```text
http://localhost
```

This does not represent the production security posture.

Production deployments should use HTTPS.

---

# 67. Security and Error Recovery

A security failure should fail closed where practical.

For example:

```text
Invalid request
```

should result in:

```text
Rejected
```

rather than:

```text
Best-effort database mutation
```

---

# 68. Data Integrity Over Convenience

If an operation cannot be performed safely, it is better to reject it than to create uncertain state.

Examples:

```text
Invalid lesson relationship
→ Reject

Invalid reorder request
→ Reject

Malformed YouTube response
→ Reject/ignore safely

Invalid playback position
→ Reject or clamp safely
```

---

# 69. Security Testing

Security-sensitive behavior must have automated tests where practical.

Tests should cover:

```text
Input validation
SQL parameterization
XSS-safe rendering
Invalid resource relationships
Playback validation
Ordering validation
YouTube API failure
Secret exposure prevention
Safe error responses
```

---

# 70. Security Regression Tests

Security bugs should result in regression tests.

Example:

```text
Bug:
Lesson mutation accepted a lesson from another module.

Fix:
Validate parent relationship.

Regression test:
Cross-module lesson mutation is rejected.
```

---

# 71. Security Review Checklist

Before a production release:

```text
[ ] No secrets committed
[ ] No secrets exposed to browser
[ ] Database not publicly accessible
[ ] Input validation active
[ ] SQL queries parameterized
[ ] User content rendered safely
[ ] YouTube API key server-side
[ ] R2 credentials server-side
[ ] Safe error messages
[ ] Production HTTPS enabled
[x] Security headers reviewed
[ ] Docker image reviewed
[ ] Dependencies reviewed
[ ] Backup storage private
[ ] Critical security tests passing
```

---

# 72. Threat Model

The primary V1 threats include:

```text
Browser input abuse
SQL injection
XSS
Credential exposure
Database exposure
Malicious API requests
YouTube API abuse
Unsafe external data
Container misconfiguration
Backup exposure
Dependency vulnerabilities
```

The V1 architecture intentionally reduces the attack surface by avoiding:

```text
Authentication
Multi-user permissions
File uploads
Video hosting
Public API
Microservices
Distributed infrastructure
```

---

# 73. V1 Security Boundary

StudyForge V1 should be understood as:

```text
A self-hosted application
for a trusted deployment environment
without built-in user authentication.
```

The single-row local profile (a name for the installation) is covered by this boundary: it is not an account and provides no access control.

This is a deliberate product limitation.

Operators requiring internet-wide private access should add an appropriate external access-control layer.

---

# 74. Future Security Work

Potential future requirements include:

- Authentication
- User accounts
- Session management
- Passwordless login
- Multi-user authorization
- Course ownership
- Sharing permissions
- File upload security
- Rate limiting
- Audit logs
- Account recovery
- Multi-device synchronization

These should be treated as new security domains rather than assumed extensions of V1.

---

# 74a. Course Import Security

Course import accepts a JSON file uploaded by the learner. It is a V1 feature with the following security posture:

- The file is read and validated entirely server-side; the browser never writes to the database.
- Only the exact export format (`format: "studyforge-course"`) is accepted.
- Every field is run through Zod at the server boundary:
  - YouTube video IDs must match the 11-character video ID format.
  - Thumbnail URLs must point to the ytimg.com CDN.
  - Text fields are trimmed and length-capped (titles, descriptions, goals, module names).
  - Counts are capped (50 modules, 200 lessons per module) and total file size is capped at 5 MB.
- Imported content stores YouTube metadata and IDs only — never URLs to arbitrary hosts beyond the validated thumbnails, and never video content.
- Import always creates a new course; it cannot overwrite or merge into existing data.

---

# 75. Final Security Principle

> **StudyForge should expose as little as necessary, trust as little as necessary, validate every external input, and keep learner data and server credentials behind clear boundaries.**

The fundamental security model is:

```text
             UNTRUSTED
                │
                ▼
          ┌───────────┐
          │  Browser  │
          └─────┬─────┘
                │
          Validate input
                │
                ▼
          ┌───────────┐
          │  Server   │
          └─────┬─────┘
             │       │
             ▼       ▼
         SQLite    YouTube
          │
          ▼
      Learner Data
```

Security must remain part of the architecture rather than being added after implementation.
