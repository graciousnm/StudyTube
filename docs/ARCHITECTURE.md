# StudyForge — Application Architecture

## 1. Purpose

This document defines the technical architecture of StudyForge.

StudyForge is a self-hosted, learner-focused web application for turning scattered YouTube educational content into structured learning paths.

The architecture is intentionally designed for:

- One primary learner per installation
- SQLite
- Next.js
- TypeScript
- Server-side application logic
- Minimal infrastructure
- Clear feature boundaries
- Maintainable open-source code
- No unnecessary distributed systems

The architecture should remain simple until actual product requirements require additional complexity.

---

# 2. Architectural Principles

StudyForge follows these principles:

1. Correctness over cleverness.
2. Simplicity over unnecessary abstraction.
3. Clear boundaries over tightly coupled features.
4. Server-side authority over client-side business logic.
5. Database state is the source of truth for persistent application state.
6. External APIs are isolated behind feature boundaries.
7. Progress is centralized and deterministic.
8. UI components should not contain business rules unnecessarily.
9. No infrastructure should be introduced without a concrete requirement.
10. Existing behavior must be preserved when modifying the application.

---

# 3. Technology Stack

The intended V1 stack is:

```text
Frontend:
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui selectively

Backend:
Next.js server-side functionality
TypeScript

Database:
SQLite
Drizzle ORM

Validation:
Zod

External API:
YouTube Data API v3

Video Playback:
YouTube IFrame Player API

Testing:
Vitest
Playwright

Package Manager:
pnpm

Deployment:
Docker
Coolify

Optional Backup:
Cloudflare R2
```

No individual technology should be added merely because it is popular.

---

# 4. High-Level Architecture

StudyForge follows a single-application architecture:

```text
                    Browser
                       │
                       ▼
                ┌─────────────┐
                │   Next.js   │
                │ Application │
                └──────┬──────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Features       Database    YouTube
          │            │            │
          ▼            ▼            ▼
      UI / Logic     SQLite      YouTube API
```

There is no separate backend service in V1.

There is no separate frontend deployment.

There is no microservice architecture.

---

# 5. Application Boundaries

The application has four major boundaries:

```text
Presentation
    ↓
Application / Feature Logic
    ↓
Persistence
    ↓
External Services
```

These boundaries should remain recognizable in the codebase.

---

# 6. Source Directory Structure

The intended structure is:

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── courses/
│   ├── modules/
│   ├── learn/
│   └── api/
│
├── components/
│   └── ui/
│
├── features/
│   ├── courses/
│   ├── modules/
│   ├── lessons/
│   ├── youtube/
│   ├── learning/
│   ├── progress/
│   └── notes/
│
├── db/
│   ├── client.ts
│   ├── schema.ts
│   └── migrations/
│
├── lib/
│   ├── validation/
│   ├── errors/
│   └── utils/
│
└── tests/
```

The exact directory names may evolve as implementation proceeds, but feature ownership should remain clear.

---

# 7. Next.js App Router

StudyForge uses the Next.js App Router.

The `app/` directory is responsible primarily for:

- Routing
- Layouts
- Page composition
- Loading states
- Error boundaries
- Route-level metadata
- Server/client component boundaries

Business logic should not be scattered throughout page components.

---

# 8. Feature-Oriented Architecture

Business capabilities belong under:

```text
src/features/
```

Example:

```text
src/features/courses/
```

may contain:

```text
course.types.ts
course.validation.ts
course.queries.ts
course.mutations.ts
course.service.ts
```

The exact file breakdown should be determined by actual complexity.

Do not create empty abstraction layers simply to follow a pattern.

---

# 9. Feature Ownership

Each feature should have clear ownership.

### Courses

Responsible for:

- Creating courses
- Editing courses
- Deleting courses
- Listing courses
- Course-level queries

### Modules

Responsible for:

- Creating modules
- Editing modules
- Deleting modules
- Reordering modules

### Lessons

Responsible for:

- Adding lessons
- Removing lessons
- Reordering lessons
- Loading lesson data

### YouTube

Responsible for:

- Searching YouTube
- Validating YouTube IDs
- Fetching metadata
- Player integration

### Learning

Responsible for:

- Learning-mode presentation
- Previous/next navigation
- Resume behavior
- Current lesson context

### Progress

Responsible for:

- Playback position
- Completion state
- Progress calculations
- Continue Learning logic

### Notes

Responsible for:

- Creating notes
- Editing notes
- Deleting notes
- Loading notes

---

# 10. Database Boundary

All database access should be centralized through the database layer and feature-specific queries/mutations.

UI components should not directly construct arbitrary SQL queries.

Preferred flow:

```text
UI
 ↓
Feature action/service
 ↓
Feature query/mutation
 ↓
Drizzle
 ↓
SQLite
```

---

# 11. Database Client

The database client should live under:

```text
src/db/client.ts
```

It should be responsible for creating and exporting the Drizzle database connection.

The application should not create multiple unrelated database connection implementations.

---

# 12. Database Schema

The schema should live under:

```text
src/db/schema.ts
```

The schema defines the persistent entities documented in `DATA_MODEL.md`.

The current V1 entities are:

```text
courses
modules
lessons
lesson_progress
notes
profile
```

The `profile` table is the single-row installation-level exception to the curriculum entities (see DATA_MODEL.md §44).

---

# 13. Server-Side Database Access

Database operations should occur on the server.

The browser must not receive direct database access.

The client communicates with server-side application logic through Next.js mechanisms.

---

# 14. Server Actions and Route Handlers

Use the simplest appropriate Next.js mechanism.

### Server Actions

Use for mutations where they provide a clean implementation.

Examples:

- Create course
- Update course
- Delete course
- Create module
- Reorder lessons
- Mark lesson complete
- Save notes

### Route Handlers

Use where an HTTP endpoint is genuinely useful.

Examples:

- YouTube search
- External API proxying
- APIs needed by client-side functionality

Do not create REST endpoints simply because an operation exists.

### Revalidate vs redirect

Create and update actions (course, module, note) **revalidate** the affected paths and return `{}`; they do not redirect. This lets the modal form close and the current page re-render in place. Delete actions still `redirect` because the record's page no longer exists. The database remains the source of truth; `revalidatePath` keeps the server-rendered UI consistent.

---

# 15. Client Components

Client components should be used when the browser needs interactivity or browser-only APIs.

Examples:

- YouTube player
- Drag-and-drop ordering
- Interactive dialogs
- Client-side form interactions
- Playback state
- Immediate UI feedback

Do not convert entire pages to client components unnecessarily.

Prefer Server Components for static/server-rendered content.

---

# 16. Server Components

Server Components should be the default where possible.

Examples:

- Course pages
- Module pages
- Course lists
- Lesson lists
- Progress summaries
- Static page content

They may load data directly through server-side feature queries.

---

# 17. Client/Server Boundary

A component should become client-side because it actually requires client-side capabilities.

Do not use:

```text
"use client"
```

as a default for every component.

The boundary should be intentional.

---

# 18. Forms

Simple forms should use native React/Next.js capabilities.

Typical flow:

```text
Form
 ↓
Validation
 ↓
Server Action
 ↓
Database Mutation
 ↓
Revalidation
 ↓
Updated UI
```

Use Zod for input validation.

Do not introduce React Hook Form unless actual form complexity justifies it.

---

# 19. Validation

Validation should occur at trust boundaries.

Examples:

```text
Browser input
External API data
Server action input
Database mutation input
```

Zod should be used for structured validation where appropriate.

Validation errors should be converted into safe, user-readable messages.

---

# 20. Error Handling

Errors should be categorized.

At minimum:

```text
Validation errors
Not found errors
Conflict errors
External service errors
Database errors
Unexpected errors
```

Do not expose raw stack traces, SQL errors, environment variables, or API responses to the learner.

---

# 21. Not Found Behavior

If a requested resource does not exist:

```text
Course not found
Module not found
Lesson not found
```

the application should use appropriate Next.js not-found behavior.

Do not silently create missing records.

---

# 22. Mutation Rules

Mutations should validate:

1. Input
2. Resource existence
3. Relationship ownership
4. Business constraints
5. Database operation

Example:

```text
Move Lesson
 ↓
Validate lesson ID
 ↓
Load lesson
 ↓
Verify target module
 ↓
Validate target position
 ↓
Update ordering transactionally
```

---

# 23. Course Ownership

Because V1 has no authentication or users, there is no user ownership layer.

The installation itself represents the learner's data.

The single-row local `profile` table is not an ownership mechanism. It stores an installation-level name only and never acts as a `user_id` on other tables.

Do not add:

```text
user_id
owner_id
account_id
```

without introducing an actual multi-user requirement.

---

# 24. YouTube Boundary

All YouTube-specific functionality must remain isolated.

Preferred boundary:

```text
src/features/youtube/
├── youtube.api.ts
├── youtube.search.ts
├── youtube.player.ts
├── youtube.types.ts
└── youtube.validation.ts
```

Other application features should not directly implement YouTube API requests.

---

# 25. YouTube Data API

The YouTube Data API is used for operations such as:

```text
Search YouTube
Fetch video metadata
```

The API key must remain server-side.

The browser must never receive the API key.

---

# 26. YouTube Search Flow

Preferred flow:

```text
Learner
 ↓
Search UI
 ↓
StudyForge server
 ↓
YouTube feature
 ↓
YouTube Data API
 ↓
Normalized search results
 ↓
Search UI
```

The raw YouTube API response should not be passed directly throughout the application.

Normalize the fields StudyForge actually needs.

---

# 27. Adding a YouTube Video

When a learner selects a search result:

```text
Search Result
 ↓
Validate video
 ↓
Check module for duplicate
 ↓
Create Lesson
 ↓
Persist YouTube metadata
 ↓
Return updated module
```

The video is not downloaded.

StudyForge stores metadata and the external video identifier.

---

# 28. YouTube Player

The YouTube IFrame Player API belongs at the client boundary.

Preferred architecture:

```text
Learning Page
     │
     ▼
YouTube Player Component
     │
     ▼
YouTube IFrame Player API
     │
     ▼
Playback Events
     │
     ▼
Progress Feature
     │
     ▼
Server
     │
     ▼
SQLite
```

The player should not contain curriculum business logic.

---

# 29. Progress Boundary

Progress logic belongs under:

```text
src/features/progress/
```

The progress feature should own:

- Playback position persistence
- Completion state
- Progress calculations
- Resume selection
- Continue Learning logic

Other features should consume progress results rather than independently recreating the rules.

---

# 30. Watched vs Completed

These are separate concepts.

Playback information:

```text
playback_position_seconds
```

does not automatically mean:

```text
completed = true
```

Completion is explicit.

This prevents different parts of the application from developing contradictory completion behavior.

---

# 31. Resume Logic

When opening a lesson:

```text
If saved playback position exists:
    resume from saved position

Otherwise:
    start from beginning
```

The player should not unexpectedly reset the learner's position.

---

# 32. Continue Learning

Continue Learning should use deterministic logic.

Preferred behavior:

1. Find incomplete lessons with existing progress.
2. Prefer the most recently watched incomplete lesson.
3. If none exist, select the first incomplete lesson according to curriculum order.
4. If all lessons are complete, the course is complete.

This logic belongs to the progress/learning domain, not the UI.

---

# 33. Previous and Next

Previous and next lesson navigation must follow curriculum order.

The order is:

```text
Course
  ↓
Module position
  ↓
Lesson position
```

The application must not use:

- Database insertion order
- Alphabetical order
- YouTube publication date

for navigation.

---

# 34. Learning Mode

Learning Mode combines:

```text
Lesson
YouTube Player
Progress
Notes
Navigation
```

Conceptually:

```text
┌─────────────────────────────┐
│ Course / Module / Lesson    │
├─────────────────────────────┤
│                             │
│      YouTube Player         │
│                             │
├─────────────────────────────┤
│ Progress / Completion       │
├─────────────────────────────┤
│ Notes                       │
├─────────────────────────────┤
│ Previous      Next          │
└─────────────────────────────┘
```

Learning Mode should remain focused on learning rather than becoming a general content-management dashboard.

---

# 35. Notes Architecture

Notes are associated with lessons.

A lesson has at most one note, enforced by a UNIQUE index on `notes.lesson_id`.
A single save operation acts as an upsert: it creates the note on first save and updates the existing record on later saves.
Deleting a note deletes the lesson's single record.

Preferred flow:

```text
Notes UI (read-only note + modal editor)
 ↓
Validation
 ↓
Server mutation (upsert)
 ↓
SQLite
 ↓
Updated note
```

Notes should not require a separate editor framework in V1.

---

# 36. Caching

Caching should be introduced only where useful.

Potential candidates:

- YouTube search results
- Static course data

However, correctness takes priority over caching.

Do not introduce Redis.

Do not introduce a distributed cache.

Do not build cache invalidation infrastructure without a demonstrated need.

---

# 37. YouTube API Caching

Search results may be cached temporarily if API quota or performance becomes an actual concern.

However:

- Search results do not need to be persistent curriculum data.
- Added lessons must be stored in SQLite.
- The application should remain functional even if temporary search caching is unavailable.

---

# 38. State Management

StudyForge does not require a global client state manager in V1.

Do not introduce Redux.

Prefer:

- Server state
- URL state
- Local component state
- Server Actions
- Browser APIs where appropriate

TanStack Query may be introduced only if the actual client interaction model demonstrates a clear need.

---

# 39. URL State

URL parameters should be used where they provide useful navigation state.

Examples:

```text
/search?q=real+estate
/learn/lesson-id
```

Do not encode large application state into URLs.

---

# 40. UI Component Architecture

Reusable UI primitives belong under:

```text
src/components/ui/
```

Examples may include:

```text
Button
Dialog
Input
Textarea
Dropdown
Card
Tabs
```

Feature-specific components belong under their feature.

Example:

```text
src/features/youtube/components/
```

A generic UI component should not contain StudyForge-specific business logic.

---

# 41. Component Responsibilities

Components should generally fall into one of three categories.

### UI primitives

Reusable presentation components.

### Feature components

Components implementing a specific StudyForge capability.

### Page components

Components composing features for a route.

Avoid components that simultaneously:

- Fetch external APIs
- Perform database mutations
- Implement business rules
- Render complex UI

unless the simplicity of the feature genuinely warrants it.

---

# 42. Styling

Tailwind CSS is the primary styling system.

shadcn/ui may be used selectively.

Do not create a custom design system unnecessarily.

The visual rules in `DESIGN.md` are authoritative for product presentation.

---

# 43. Security Boundary

Secrets must remain server-side.

Examples:

```text
YOUTUBE_API_KEY
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
```

must never be exposed to client-side JavaScript.

Only explicitly safe public configuration may be exposed to the browser.

---

# 44. Environment Variables

Environment variables should be accessed through a controlled server-side configuration layer where practical.

Required/optional variables should be documented.

Example:

```text
YOUTUBE_API_KEY
DATABASE_URL
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
```

R2 variables are optional because R2 is not required for normal operation.

---

# 45. Database Location

The SQLite database should reside on persistent storage.

Example:

```text
/data/learning.sqlite
```

The exact path may be configurable.

The database must not live only inside an ephemeral container filesystem in production.

---

# 46. Container Architecture

The application should run as a single primary container in V1.

Conceptually:

```text
┌──────────────────────────┐
│      StudyForge          │
│                          │
│ Next.js                  │
│ Node.js                  │
│ SQLite                   │
└────────────┬─────────────┘
             │
             ▼
      Persistent Volume
             │
             ▼
      learning.sqlite
```

No separate application server is required.

---

# 47. Coolify

Coolify is a supported deployment environment.

However, the application architecture must not depend on Coolify-specific functionality.

The same Docker image should be usable with other compatible deployment systems.

---

# 48. Backup Architecture

Backups are operational infrastructure, not application-domain logic.

Conceptually:

```text
StudyForge
    │
    ▼
SQLite
    │
    ▼
SQLite-consistent backup
    │
    ▼
Optional R2
```

The application itself should not require R2 to function.

---

# 49. External Service Failure

YouTube may be unavailable.

The application should distinguish between:

```text
StudyForge database unavailable
```

and:

```text
YouTube API unavailable
```

If YouTube search is unavailable:

- Existing courses should remain accessible.
- Existing lessons should remain accessible where their stored metadata is sufficient.
- The learner should receive a clear error when attempting a YouTube operation.

An external API failure should not corrupt local curriculum data.

---

# 50. Database Failure

Database failures should fail safely.

The application should:

- Log useful server-side information.
- Show a safe user-facing error.
- Never expose raw SQL errors.
- Avoid partially applying multi-step mutations.

---

# 51. Logging

Logging should be useful for debugging without becoming an analytics system.

Useful examples:

```text
Database connection failure
YouTube API failure
Unexpected server error
Migration failure
```

Do not log:

- API keys
- R2 credentials
- Authentication secrets
- Sensitive request data
- Entire external API payloads unnecessarily

---

# 52. Observability

V1 does not require:

- Distributed tracing
- Prometheus
- Grafana
- ELK
- OpenTelemetry infrastructure
- Dedicated logging services

Standard application/container logs are sufficient initially.

---

# 53. Performance Philosophy

Optimize for correctness first.

Expected workload is personal-scale.

Prioritize:

1. Fast page navigation
2. Efficient database queries
3. Responsive YouTube playback
4. Minimal unnecessary client JavaScript
5. Reasonable API usage

Do not optimize hypothetical large-scale workloads.

---

# 54. Database Query Philosophy

Queries should retrieve only what the current feature needs.

Avoid:

```text
Load entire database
```

or deeply nested uncontrolled queries.

Prefer explicit queries such as:

```text
getCourseWithModules()
getModuleWithLessons()
getLesson()
getLessonProgress()
getContinueLearningLesson()
```

The exact API should evolve with implementation.

---

# 55. Business Logic Location

Business rules belong in feature/domain logic.

Examples:

```text
Can this video be added?
How are lessons ordered?
What counts as completed?
What is the next lesson?
What is the Continue Learning lesson?
```

These rules should not be duplicated across multiple UI components.

---

# 56. Reordering Architecture

Reordering is a database mutation.

Example:

```text
Drag lesson 4
 ↓
Drop at position 2
 ↓
Validate request
 ↓
Load module lessons
 ↓
Calculate new order
 ↓
Update positions in transaction
 ↓
Revalidate affected UI
```

The database must remain correctly ordered even if the browser refreshes immediately afterward.

---

# 57. Optimistic UI

Optimistic updates may be used where they substantially improve the interaction.

Examples:

- Drag-and-drop ordering
- Completion toggle

However, optimistic UI must not become the source of truth.

If the server rejects a mutation, the UI must reconcile with server state.

---

# 58. Progressive Enhancement

Where practical, core operations should continue to work through standard server-side mechanisms.

The application should not depend unnecessarily on complex client-side JavaScript for basic CRUD.

Interactive features such as the YouTube player naturally require client-side JavaScript.

---

# 59. Testing Architecture

Testing follows three layers.

### Unit Tests

Use Vitest for:

- Validation
- Progress calculations
- Ordering algorithms
- Continue Learning selection
- Utility functions

### Integration Tests

Test:

- Database mutations
- Feature services
- YouTube normalization
- Progress persistence

### End-to-End Tests

Use Playwright for real learner workflows.

Examples:

```text
Create course
Create module
Search YouTube
Add lesson
Reorder lesson
Start learning
Mark complete
Leave
Return
Resume
Complete course
```

---

# 60. Test the User Workflow

Tests should focus primarily on observable behavior.

Avoid tests that unnecessarily lock the codebase to implementation details.

For example, prefer:

```text
Learner marks lesson complete
→ lesson appears completed
→ course progress updates
```

over:

```text
Function X was called three times
```

unless the latter is genuinely important.

---

# 61. Dependency Policy

Dependencies must earn their place.

Before adding a dependency, ask:

1. Is the functionality already available?
2. Is the implementation small enough to maintain locally?
3. Does the dependency solve a real problem?
4. Does it introduce unnecessary runtime or maintenance cost?
5. Does it complicate self-hosting?

Avoid dependency accumulation.

---

# 62. No Distributed Architecture

V1 explicitly does not use:

```text
Microservices
Redis
Message queues
Background worker clusters
Kubernetes
Service mesh
Separate API server
Separate database server
```

The architecture is intentionally monolithic.

---

# 63. Monolith Is Intentional

A monolithic architecture is appropriate for StudyForge because:

- The workload is personal-scale.
- The feature set is focused.
- SQLite is sufficient.
- Deployment should be easy.
- Open-source users should have minimal infrastructure requirements.
- Debugging should remain straightforward.

This is not an accidental limitation.

---

# 64. Future Evolution

The architecture should allow future additions without prematurely implementing them.

Potential future capabilities include:

```text
Additional content sources
Accounts
Multi-device synchronization
Course import/export
Practice activities
AI-assisted learning
Sharing
```

Future capabilities should be introduced through deliberate architectural changes.

They must not be simulated through unused V1 abstractions.

---

# 65. If Authentication Is Added Later

Authentication would introduce a new ownership boundary.

The likely future relationship would become:

```text
User
 │
 └── Course
      └── Module
           └── Lesson
```

Progress would then require user-specific ownership.

This is intentionally deferred.

V1 must not build authentication infrastructure merely to prepare for this possibility.

The single-row local `profile` table in V1 is unrelated to this future model and must not grow user-scoped fields ahead of it.

---

# 66. If Additional Content Sources Are Added

YouTube is the only content source in V1.

If another source is introduced later, the architecture should isolate source-specific implementations.

Conceptually:

```text
Content Source
├── YouTube
├── Future Source
└── Future Source
```

The learner-facing lesson model should not become tightly coupled to every external provider.

This abstraction should only be introduced when a second source actually exists.

---

# 67. AI Integration

AI is explicitly outside V1.

If AI is introduced later, it should operate as an assistive feature.

Preferred conceptual flow:

```text
Existing Curriculum
       ↓
AI Suggestion
       ↓
Learner Reviews
       ↓
Accept / Reject / Modify
       ↓
Persisted Curriculum
```

AI must not silently modify courses, modules, lessons, or progress.

---

# 68. Architectural Invariants

The following must remain true:

```text
SQLite is the V1 database.

The application is a Next.js monolith.

The browser never accesses SQLite directly.

YouTube API keys remain server-side.

YouTube videos are never downloaded or hosted.

Progress logic has one authoritative implementation.

Course and module progress are derived.

Curriculum ordering is persisted.

External API failures do not corrupt local data.

No authentication exists in V1. The single-row local profile is not an account or a credential.

No AI exists in V1.

No distributed infrastructure exists in V1.
```

---

# 69. Implementation Rule

When implementing a feature:

```text
Requirement
    ↓
Identify owning feature
    ↓
Validate input
    ↓
Apply business rules
    ↓
Persist through database layer
    ↓
Return safe result
    ↓
Update/revalidate UI
    ↓
Test workflow
```

Avoid jumping directly from UI interaction to database mutation.

---

# 70. Final Architecture Principle

> **StudyForge is a deliberately simple monolithic application: the browser provides the learning experience, feature modules own business behavior, SQLite stores the learner's state, and external services remain behind explicit boundaries.**
