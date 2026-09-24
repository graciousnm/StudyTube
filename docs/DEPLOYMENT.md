# StudyForge — Deployment & Operations

## 1. Purpose

This document defines how StudyForge is built, deployed, operated, updated, backed up, and restored.

StudyForge is designed around:

```text
Next.js
+
SQLite
+
YouTube API
+
Persistent application storage
```

The deployment model should remain simple.

The goal is:

> Production-quality application code with personal-scale infrastructure.

---

# 2. Deployment Philosophy

StudyForge does not require a distributed infrastructure stack.

V1 should prefer:

```text
One application
One SQLite database
One persistent storage location
One container
Optional external backup storage
```

Do not introduce infrastructure such as:

- Kubernetes
- Redis
- Message queues
- Microservices
- Service meshes
- Distributed databases
- Background worker clusters
- Dedicated observability platforms

unless a future requirement genuinely requires them.

---

# 3. Supported Deployment Model

The primary deployment target is a containerized web application.

Conceptually:

```text
Internet
   ↓
Reverse Proxy
   ↓
StudyForge Container
   ↓
SQLite
```

A reverse proxy may be provided by the hosting platform.

StudyForge itself does not need to manage TLS termination.

---

# 4. Docker

StudyForge should provide a production Docker image.

The Docker image should contain:

- Production application code
- Production dependencies
- Required runtime
- Built Next.js application

It should not contain:

- Development secrets
- YouTube API keys
- R2 credentials
- User-generated database state
- Temporary development files

---

# 5. Multi-Stage Docker Build

The Dockerfile should use a multi-stage build where practical.

Conceptually:

```text
Dependencies
      ↓
Build
      ↓
Production Runtime
```

The final runtime image should contain only what is required to run StudyForge.

This reduces unnecessary image size and attack surface.

---

# 6. Node.js Runtime

StudyForge pins a supported Node.js LTS release: **Node.js 24 LTS** (`>=24 <25`).

The exact version is pinned consistently across:

```text
Local development  (.nvmrc, engines)
CI                 (engine-strict install)
Docker build       (node:24 base image)
Production
```

Do not allow local development and production to silently use incompatible Node.js versions.

---

# 7. Package Manager

StudyForge uses:

```text
pnpm
```

The project should pin the expected pnpm version.

Dependency installation in production should use the lockfile.

The build must not silently resolve different dependency versions.

---

# 8. Lockfile

The repository must commit:

```text
pnpm-lock.yaml
```

Production builds should install from the lockfile.

Dependency drift between environments should be avoided.

---

# 9. Application Port

The application should listen on a configurable port.

The container should expose the application's configured HTTP port.

The hosting platform or reverse proxy is responsible for exposing it externally.

The application should not assume a particular public hostname.

---

# 10. SQLite Storage

SQLite is the primary V1 database.

The database must live on persistent storage.

Example:

```text
/data/learning.sqlite
```

The exact path may be configurable, but the principle is:

> The database must not live only inside the container filesystem.

---

# 11. Container Ephemerality

Containers should be treated as replaceable.

A container may be:

```text
Stopped
Rebuilt
Recreated
Updated
Rolled back
```

without destroying learner data.

The database and other persistent application state must live outside the ephemeral container layer.

---

# 12. Persistent Volume

Production deployments should mount persistent storage for SQLite.

Conceptually:

```text
Host / Persistent Volume
        │
        ▼
Container
/data
        │
        ▼
learning.sqlite
```

The volume must remain attached when the application container is recreated.

---

# 13. Coolify Deployment

Coolify is a supported deployment option.

A typical deployment is:

```text
Git Repository
      ↓
Coolify
      ↓
Docker Build
      ↓
StudyForge Container
      ↓
Persistent Volume
```

Coolify is deployment infrastructure, not an application dependency.

StudyForge must remain deployable without Coolify.

---

# 14. Coolify Persistent Storage

When deployed through Coolify, the SQLite database should be stored on a persistent volume.

The deployment must not rely on the container's writable layer.

Before production use, verify:

```text
Create database
 ↓
Restart container
 ↓
Database remains
```

and:

```text
Recreate container
 ↓
Database remains
```

---

# 15. Database Path Configuration

The database path should be configurable through an environment variable or application configuration.

For example:

```text
DATABASE_URL
```

may point to the SQLite database.

The exact configuration name should remain consistent across:

```text
Application
Docker
Documentation
Backup scripts
Development environment
```

Do not scatter hard-coded database paths throughout the codebase.

---

# 16. Environment Variables

Secrets and environment-specific configuration must be supplied through environment variables.

Potential production configuration includes:

```text
DATABASE_URL
YOUTUBE_API_KEY
```

and optional backup configuration such as:

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```

Only variables actually required by the implementation should exist.

Do not add configuration merely for hypothetical future features.

---

# 17. Secret Handling

Secrets must never be committed to Git.

Do not commit:

```text
.env
.env.production
.env.local
```

when they contain real credentials.

The repository should provide an example configuration file such as:

```text
.env.example
```

containing placeholders only.

---

# 18. YouTube API Key

The YouTube API key must remain server-side.

It must not be:

- Hard-coded in frontend code
- Exposed in browser JavaScript
- Included in public configuration
- Logged
- Returned in API responses

The browser should request YouTube functionality through StudyForge's server-side integration.

---

# 19. R2 Credentials

If Cloudflare R2 backups are enabled, R2 credentials must remain server-side.

They must not be exposed to:

- Browser code
- Client components
- Public API responses
- Logs
- Error messages

---

# 20. Production Configuration

Production should run with:

```text
NODE_ENV=production
```

The application must not depend on development-only behavior.

Debugging output intended only for local development should not appear in production.

---

# 21. Logging

StudyForge should use normal application logs.

Logs should help identify:

- Application startup
- Database initialization problems
- Configuration problems
- YouTube integration failures
- Backup failures
- Unexpected application errors

Logs must not contain:

```text
API keys
Passwords
R2 secrets
Full request credentials
Sensitive learner data unnecessarily
```

---

# 22. Error Handling

Production errors must be safe for the user.

The UI should display a useful message such as:

```text
Something went wrong. Please try again.
```

rather than exposing:

```text
SQL errors
Stack traces
Environment variables
Internal file paths
API credentials
```

Detailed diagnostics belong in server logs.

---

# 23. Health Checks

A simple health-check mechanism may be provided.

The purpose is to determine whether the application is running.

A health check should not perform expensive operations.

It should not:

- Call YouTube
- Perform a full database backup
- Run migrations on every request
- Perform expensive queries

A basic application/database availability check is sufficient.

---

# 24. Database Initialization

Application startup must handle the expected database setup process predictably.

A production deployment should not silently create a database in an unexpected location.

The database path should be explicit.

If migrations are required, they should be applied through the documented migration process.

---

# 25. Database Migrations

Schema changes must use Drizzle migrations.

Do not modify the production SQLite schema manually unless performing a documented emergency recovery procedure.

Normal flow:

```text
Change schema
      ↓
Generate migration
      ↓
Review migration
      ↓
Test migration
      ↓
Deploy migration
```

---

# 26. Migration Safety

Before applying a significant migration:

```text
Backup database
      ↓
Apply migration
      ↓
Verify application
```

Migrations must not silently discard learner data.

Destructive migrations require particular care.

---

# 27. Fresh Installation

A fresh installation should follow:

```text
Deploy application
      ↓
Configure environment
      ↓
Configure persistent storage
      ↓
Initialize database
      ↓
Run migrations
      ↓
Open StudyForge
```

The exact command sequence should be documented in the repository's deployment instructions.

---

# 28. Existing Installation Update

An application update should follow:

```text
Backup database
      ↓
Pull new version
      ↓
Build new container
      ↓
Apply migrations
      ↓
Start application
      ↓
Verify application
```

The learner's existing SQLite database must remain attached to the new container.

---

# 29. Rollback

A deployment should have a practical rollback strategy.

If an application update fails:

```text
Previous application version
        +
Existing database
```

should remain recoverable.

If a migration changed the database schema incompatibly, restoring the previous database backup may also be necessary.

Do not assume that application rollback alone can reverse a destructive database migration.

---

# 30. Deployment Verification

After deployment, verify at minimum:

```text
Application loads
Course list loads
Existing course opens
Existing lessons open
Learning Mode works
Progress loads
Notes load
YouTube search works
```

For an update, existing learner data should be specifically checked.

---

# 31. SQLite Backup Principle

SQLite backups must be consistent.

Do not assume that copying a live SQLite database file is always safe while writes are occurring.

A backup mechanism should use a SQLite-consistent backup strategy.

The backup must represent a valid database state.

---

# 32. Backup Frequency

The planned default backup strategy is:

```text
Daily backup
```

The exact execution mechanism may depend on the deployment environment.

Backups should run independently of normal learner interaction where practical.

---

# 33. Cloudflare R2

Cloudflare R2 is an optional external backup destination.

It is not required for StudyForge to function.

Conceptually:

```text
SQLite
   ↓
Daily Backup
   ↓
Cloudflare R2
```

A self-hosted installation may use another backup provider or local backup strategy instead.

---

# 34. R2 Retention

The planned R2 retention policy is:

```text
7 days
```

This means the deployment retains approximately one week's worth of daily database backups.

The retention period may be changed by the operator.

---

# 35. Backup Naming

Backups should use deterministic, timestamped names.

Example:

```text
studyforge-2026-09-17.sqlite
```

or an equivalent unambiguous format.

The backup name should make it possible to identify when the snapshot was created.

---

# 36. Backup Verification

A successful upload does not necessarily prove that a backup is usable.

Where practical, backups should be periodically verified by:

```text
Download
 ↓
Open/validate SQLite database
 ↓
Verify expected tables
```

A restore test is more valuable than merely checking that an object exists in R2.

---

# 37. Restore Procedure

A basic restore process is:

```text
Stop application
      ↓
Preserve current database
      ↓
Retrieve backup
      ↓
Validate backup
      ↓
Replace database
      ↓
Run required compatibility checks
      ↓
Start application
      ↓
Verify learner data
```

Never overwrite the current database before preserving it when performing a manual recovery.

---

# 38. Restore Verification

After restoration, verify:

```text
Courses
Modules
Lessons
Progress
Playback positions
Notes
Ordering
```

The restored application should represent the learner's state at the backup point.

---

# 39. Backup Failure

A failed backup should not corrupt the running application.

For example:

```text
R2 unavailable
```

should result in:

```text
Backup failure logged
```

not:

```text
StudyForge unavailable
```

The primary application and its database remain local.

---

# 40. Backup Security

Backups contain the learner's application data.

Backup storage must therefore be protected.

R2 or another backup destination should use credentials with only the permissions required for the backup process.

Do not use broader cloud credentials unnecessarily.

---

# 41. Backup Does Not Replace Database Integrity

Backups protect against data loss.

They do not replace:

- Database transactions
- Validation
- Migration testing
- Application correctness
- Restore testing

The application must still maintain a valid SQLite database during normal operation.

---

# 42. YouTube Dependency

StudyForge depends on YouTube for external content discovery and playback.

However:

```text
YouTube unavailable
```

must not destroy:

```text
Existing courses
Existing modules
Existing lessons
Existing progress
Existing notes
```

Existing curriculum is local data.

---

# 43. YouTube API Quota

The YouTube Data API is quota-based.

StudyForge should minimize unnecessary API requests.

Search should be explicit rather than triggered by every keystroke.

Operators should configure their own YouTube API credentials.

The application should handle quota or API errors gracefully.

Exact quota values should not be hard-coded into deployment documentation unless verified against current YouTube documentation.

---

# 44. No Video Hosting

StudyForge does not download or host YouTube videos.

The deployment therefore does not require:

```text
Large video storage
Video transcoding
Media processing workers
Object storage for video
CDN video infrastructure
```

YouTube remains the external content host.

---

# 45. Resource Expectations

StudyForge is intended for personal or small self-hosted deployments.

The infrastructure does not need to be optimized for large-scale SaaS workloads.

Typical deployment priorities are:

```text
Reliable SQLite storage
Enough memory for Next.js
Reliable backups
Stable network access
```

Do not prematurely optimize for thousands of concurrent users.

---

# 46. Persistent Storage Capacity

SQLite database size should remain relatively small because StudyForge stores:

```text
Curriculum metadata
YouTube metadata
Progress
Notes
```

It does not store video files.

Operators should still monitor available disk space because:

- SQLite grows over time
- Backups require storage
- Application updates require image storage
- Logs may consume disk space

---

# 47. File Permissions

The application process must have appropriate permissions to:

```text
Read the application
Read/write the SQLite database
Write required application data
```

It should not receive unnecessary filesystem privileges.

---

# 48. Database File Access

Only server-side application code should access SQLite.

The browser must never directly access:

```text
learning.sqlite
```

or the persistent filesystem.

---

# 49. Reverse Proxy and HTTPS

Production deployments should normally expose StudyForge through HTTPS.

TLS termination may be handled by:

```text
Coolify
Reverse proxy
Hosting platform
```

StudyForge itself does not need to implement TLS.

---

# 50. Domain Configuration

StudyForge should work behind a normal domain or subdomain.

The application should not hard-code a production hostname.

Examples:

```text
study.example.com
example.com
localhost
```

should all be possible deployment environments.

---

# 51. Development vs Production

Development may use:

```text
Local SQLite
Local environment variables
Development server
```

Production should use:

```text
Persistent SQLite storage
Production build
Production environment variables
HTTPS
Backups
```

The application behavior should remain consistent across environments wherever possible.

---

# 52. Local Development

A developer should be able to run StudyForge without:

```text
Coolify
Cloudflare R2
Production infrastructure
```

Local development should require only the necessary application dependencies.

YouTube functionality requires a valid API key if live search is being used.

---

# 53. Self-Hosting Without Coolify

StudyForge documentation must not imply that Coolify is mandatory.

A self-hosted operator should be able to run:

```text
Docker
+
Persistent volume
+
Environment variables
```

using their preferred infrastructure.

Coolify is one supported deployment option.

---

# 54. Self-Hosting Without R2

R2 is optional.

A user may instead configure:

```text
Local backups
Another object-storage provider
Another backup service
```

provided that the resulting backup process preserves the same core requirement:

> The SQLite database can be restored to a valid previous state.

---

# 55. Deployment Documentation

The repository should include practical deployment instructions covering:

```text
Environment setup
Database configuration
YouTube API configuration
Docker deployment
Persistent storage
Migrations
Backup configuration
Restore procedure
Coolify example
```

The documentation should distinguish:

```text
Required
```

from:

```text
Optional
```

infrastructure.

---

# 56. Environment Example

The repository should provide a safe example such as:

```text
DATABASE_URL=file:/data/learning.sqlite

YOUTUBE_API_KEY=your_youtube_api_key_here
```

Optional backup variables should be included only if backup functionality is actually implemented.

No real credentials belong in the repository.

---

# 57. Deployment Secrets Checklist

Before production deployment:

```text
[ ] No secrets committed to Git
[ ] YouTube API key configured server-side
[ ] Database path configured
[ ] Persistent volume configured
[ ] Backup destination configured if desired
[ ] Backup credentials configured if desired
[ ] HTTPS configured
[ ] Application starts successfully
```

---

# 58. Production Readiness Checklist

Before exposing StudyForge to normal use:

```text
[ ] Production build succeeds
[ ] Typecheck succeeds
[ ] Tests pass
[ ] Persistent SQLite storage verified
[ ] Database migrations verified
[ ] YouTube search works
[ ] Existing lessons play
[ ] Progress persists
[ ] Notes persist
[ ] Backup succeeds
[ ] Restore procedure tested
[ ] No secrets appear in logs
[ ] Error pages do not expose internals
```

---

# 59. Update Checklist

For a normal update:

```text
[ ] Review release/change
[ ] Backup SQLite database
[ ] Verify backup
[ ] Deploy new application version
[ ] Apply migrations if required
[ ] Start application
[ ] Verify health
[ ] Verify existing courses
[ ] Verify progress
[ ] Verify learning mode
[ ] Verify YouTube integration
```

---

# 60. Emergency Recovery

If the application becomes unavailable:

1. Preserve the current database.
2. Inspect application logs.
3. Identify whether the issue is application, configuration, database, or external-service related.
4. Roll back the application version if appropriate.
5. Restore the database only when necessary.
6. Verify learner data after recovery.

Do not immediately overwrite the database during troubleshooting.

---

# 61. Data Loss Prevention

The most important operational data is:

```text
Courses
Modules
Lessons
Lesson progress
Notes
Ordering
```

The deployment architecture must prioritize protecting these records.

YouTube content itself is external and is not owned by StudyForge.

---

# 62. Operational Principle

The deployment should make the following possible:

```text
Container destroyed
       ↓
New container created
       ↓
Persistent database reattached
       ↓
StudyForge continues
```

This is a fundamental requirement of the deployment model.

---

# 63. Infrastructure Boundary

StudyForge owns:

```text
Application behavior
Database schema
Data integrity
Progress logic
YouTube integration
Backup-compatible data
```

The deployment platform owns:

```text
Container execution
Networking
TLS
Persistent storage provisioning
Infrastructure availability
```

The exact division may vary by hosting environment.

---

# 64. No Infrastructure Lock-In

Application code must not depend directly on Coolify-specific APIs.

Likewise, the core application must not require R2.

Deployment-specific configuration belongs at the infrastructure boundary.

---

# 65. Future Scaling

If StudyForge eventually needs significantly larger scale, the architecture can evolve.

Possible future changes could include:

```text
PostgreSQL
Managed storage
Distributed deployment
Caching
Background jobs
External object storage
Authentication
```

These are not V1 requirements.

Do not introduce them before the product actually requires them.

---

# 66. Final Deployment Principle

> **StudyForge should be easy to deploy, difficult to accidentally lose data from, and independent of any particular hosting provider.**

The essential production model is:

```text
Git Repository
      ↓
Docker Build
      ↓
StudyForge
      ↓
Persistent SQLite
      ↓
Daily Backup
      ↓
Optional External Storage
```

The application should remain useful even when optional infrastructure such as R2 or a particular deployment platform is unavailable.
