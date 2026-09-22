# StudyForge — Data Model

## 1. Purpose

This document defines the persistent data model for StudyForge.

The database is intentionally simple.

StudyForge V1 uses:

- SQLite
- Drizzle ORM
- Relational data modeling
- Explicit foreign-key relationships
- Persistent ordering
- Deterministic progress calculations

The database should represent the learner's curriculum directly.

---

# 2. Core Model

The primary hierarchy is:

```text id="5cmq7j"
Course
└── Module
    └── Lesson
        └── YouTube Video
```

Additional data is associated with lessons:

```text id="2r1vya"
Course
└── Module
    └── Lesson
        ├── YouTube Video
        ├── Progress
        └── Notes
```

There is no User entity in V1.

V1 does include a single-row local `profile` table (see §44). A profile is not an account: it stores one installation-level name so a self-hosted StudyForge instance can feel personal. It has no relationship to the curriculum hierarchy and provides no access control.

---

# 3. Entity Overview

V1 contains these primary entities:

```text id="c6m9r4"
courses
modules
lessons
lesson_progress
notes
profile
```

The `profile` table is a single-row installation-level record, not a curriculum entity. It is listed last because it represents the installation itself rather than learning content.

YouTube video metadata is stored as part of the lesson record in V1 rather than creating a separate `youtube_videos` table.

This keeps the model simple because a lesson currently represents one YouTube video.

---

# 4. Courses

Table:

```text id="2bmxh7"
courses
```

Purpose:

Represents a complete learning goal.

Examples:

```text id="4epb6d"
Real Estate
Worship Piano
Biblical Greek
JavaScript
```

### Fields

```text id="cnf3z1"
id
title
description
created_at
updated_at
```

### Field definitions

#### id

Primary key.

Use a stable unique identifier.

Recommended:

```text id="f0x5un"
text
```

or another project-standard identifier type.

The exact ID generation strategy should be consistent throughout the database.

#### title

Required course title.

Example:

```text id="y6z0ro"
Worship Piano
```

#### description

Optional course description.

May be empty.

#### created_at

Timestamp indicating when the course was created.

#### updated_at

Timestamp indicating when the course was last modified.

---

# 5. Course Relationships

A course has many modules.

```text id="u2hm5v"
Course 1 ──── * Module
```

Deleting a course should delete its modules, lessons, progress records, and associated notes.

This should be implemented deliberately using database constraints and/or explicit transactional deletion.

---

# 6. Modules

Table:

```text id="m6t8uj"
modules
```

Purpose:

Represents a section of a course.

Example:

```text id="6z5t1k"
Course:
Worship Piano

Modules:
1. Fundamentals
2. Chord Progressions
3. Worship Techniques
4. Songs
```

### Fields

```text id
course_id
title
description
position
created_at
updated_at
```

---

# 7. Module Fields

## id

Primary key.

## course_id

Foreign key referencing:

```text id="1o1b4n"
courses.id
```

Required.

A module belongs to exactly one course.

## title

Required module title.

## description

Optional module description.

## position

Integer representing the module's order within the course.

Example:

```text id="xppv4r"
1
2
3
4
```

Do not rely on:

- Creation time
- Alphabetical order
- Database row order

for curriculum ordering.

## created_at

Creation timestamp.

## updated_at

Last modification timestamp.

---

# 8. Module Relationships

A module belongs to one course.

A module contains many lessons.

```text id="d1qzhe"
Course
  │
  └── Module
        │
        └── Lesson
```

Deleting a module should delete:

- Its lessons
- Their progress records
- Their notes

This should occur safely and predictably.

---

# 9. Lessons

Table:

```text id="q6z0v5"
lessons
```

Purpose:

Represents one learning item in a module.

In V1, a lesson references one YouTube video.

### Fields

```text id
module_id
position

youtube_video_id
youtube_title
youtube_channel_id
youtube_channel_name
youtube_thumbnail_url
youtube_duration
youtube_description
youtube_published_at

created_at
updated_at
```

---

# 10. Lesson Identity

The StudyForge lesson ID and YouTube video ID are different concepts.

Example:

```text id="qk7l6w"
StudyForge Lesson ID:
lesson_123

YouTube Video ID:
dQw4w9WgXcQ
```

The StudyForge lesson represents the learner's curriculum item.

The YouTube ID identifies the external video.

Do not use the YouTube ID as the primary key for the lesson.

---

# 11. Lesson Fields

## id

Primary key.

## module_id

Foreign key referencing:

```text id="q3g5zn"
modules.id
```

Required.

A lesson belongs to exactly one module.

## position

Integer representing the lesson's position within the module.

Example:

```text id="t1u4u6"
1
2
3
4
```

---

# 12. YouTube Video ID

Field:

```text id="s8v20k"
youtube_video_id
```

Required for V1 lessons.

This is the canonical identifier used to embed the YouTube video.

Example:

```text id="1exi3c"
dQw4w9WgXcQ
```

Store the ID rather than the full watch URL whenever possible.

The application can construct the appropriate URL when necessary.

---

# 13. YouTube Metadata

StudyForge should store useful metadata returned from YouTube so normal lesson displays do not require a YouTube API request every time.

Stored metadata:

```text id="l2jv9c"
youtube_title
youtube_channel_id
youtube_channel_name
youtube_thumbnail_url
youtube_duration
youtube_description
youtube_published_at
```

This metadata represents the video information known when the lesson was added.

It may become stale if the YouTube video changes later.

StudyForge should not require metadata to be perfectly synchronized with YouTube in V1.

---

# 14. YouTube Thumbnail

Store the thumbnail URL.

Example:

```text id="k5n7wp"
youtube_thumbnail_url
```

The application should not download and permanently store the image in V1.

The URL references the external YouTube resource.

If YouTube changes or removes the thumbnail, the application should handle that gracefully.

---

# 15. YouTube Duration

Store the duration returned by YouTube where available.

Recommended normalized representation:

```text id="z3j8ce"
integer seconds
```

Example:

```text id="twk0m1"
14:32 → 872 seconds
```

Do not store only a formatted display string.

The UI can convert seconds into:

```text id="l0h1tj"
14:32
```

when displaying the duration.

---

# 16. YouTube Description

Store the description available when the lesson is added.

This is informational metadata.

It should not be treated as canonical curriculum content.

The learner's own notes and curriculum structure belong to StudyForge.

---

# 17. YouTube Published Date

Store the original publication timestamp where available.

This may be useful when displaying search results or lesson metadata.

It should not affect curriculum ordering.

---

# 18. Lesson Progress

Table:

```text id="y9j1tc"
lesson_progress
```

Purpose:

Stores learner-specific progress for a lesson.

Even though V1 has no accounts, progress should remain a separate concept from lesson metadata.

### Fields

```text id
lesson_id
playback_position_seconds
completed
completed_at
created_at
updated_at
```

---

# 19. Progress Fields

## id

Primary key.

## lesson_id

Foreign key referencing:

```text id="6qv2uj"
lessons.id
```

A lesson has at most one progress record in V1.

Enforce uniqueness on:

```text id="mbwq3a"
lesson_id
```

---

# 20. Playback Position

Field:

```text id="x9r0h2"
playback_position_seconds
```

Stores the learner's latest known playback position.

Example:

```text id="t6r8sl"
512
```

meaning approximately:

```text
8 minutes 32 seconds
```

This allows StudyForge to resume playback where technically supported.

---

# 21. Playback Position Is Not Completion

Playback position must not determine completion automatically.

Example:

```text id="k4j8xx"
Video:
20 minutes

Playback:
19 minutes

Completed:
false
```

The learner may have watched nearly the entire video without marking the lesson complete.

Completion is a separate field.

---

# 22. Completed

Field:

```text id="3b0n5j"
completed
```

Boolean.

Possible values:

```text id="l2q8is"
false
true
```

V1 uses explicit lesson completion.

When the learner selects:

**Mark as Complete**

set:

```text id="r0b7if"
completed = true
```

and record:

```text id="e7c2xk"
completed_at
```

---

# 23. Completed At

Field:

```text id="xq8d7j"
completed_at
```

Nullable timestamp.

Rules:

```text id="l1l3r4"
completed = false
→ completed_at = null

completed = true
→ completed_at = timestamp
```

If a completed lesson is later marked incomplete, `completed_at` should be cleared.

---

# 24. Progress Creation

A lesson does not necessarily need a progress row immediately after creation.

A progress record may be created when the learner:

- Starts playback
- Changes playback position
- Marks the lesson complete

This avoids unnecessary records for untouched lessons.

---

# 25. Progress State

The application may derive the UI state from stored data.

### Not Started

```text id="2m6f2y"
No progress record
```

or equivalent zero-state.

### In Progress

```text id="j7x0yk"
progress exists
completed = false
```

### Completed

```text id="m3q4z7"
completed = true
```

The exact implementation may account for zero playback position.

---

# 26. Course Progress Calculation

Course progress must be derived from lessons.

Formula:

```text id="p7m4jv"
completed lessons
-----------------
total lessons
```

Example:

```text id="1t7q6v"
12 completed
19 total

12 / 19 = 63.16%
```

The UI may display:

```text id="g2j9qv"
63%
```

Do not store a separate `course_progress` percentage unless a concrete requirement later justifies denormalizing it.

---

# 27. Module Progress Calculation

Module progress is derived from its lessons.

Formula:

```text id="7c5z1v"
completed lessons
-----------------
total lessons
```

Example:

```text id="p0y3sj"
4 completed
6 total

67%
```

Do not store module percentage independently.

---

# 28. Lesson Count

Course and module lesson counts should normally be derived from the database.

Avoid storing:

```text id="4ozm5g"
course.lesson_count
module.lesson_count
```

unless performance measurements demonstrate a need.

SQLite queries should be sufficient for the expected personal-scale workload.

---

# 29. Notes

Table:

```text id="s0x2jv"
notes
```

Purpose:

Stores learner-created notes.

### Fields

```text id
lesson_id
content
created_at
updated_at
```

---

# 30. Lesson Notes

V1 notes are associated with lessons.

A lesson has at most one note.

Relationship:

```text id="z7v3qs"
Lesson 1 ──── 0..1 Note
```

The `notes.lesson_id` column has a UNIQUE index so the database rejects a second note for the same lesson.
Saving a note creates the record on first save and updates the existing record on later saves.

Example:

```text id="8f7x2a"
Lesson:
Understanding Property Markets

Note:
- Review supply and demand.
- Look up capitalization rates.
- Rewatch section around 08:30.
```

---

# 31. Notes Content

The note content is plain text in V1.

Do not introduce a rich-text document format.

Do not store HTML from untrusted input.

Do not build a document editor.

---

# 32. Future Note Expansion

Future versions may support:

- Course-level notes
- Module-level notes
- Timestamped video notes
- Rich text

These should not affect the V1 schema unless explicitly implemented.

---

# 33. Relationships

The complete V1 relationship model is:

```text id="g0j9y4"
courses
   │
   │ 1:N
   ▼
modules
   │
   │ 1:N
   ▼
lessons
   │
   ├──────── 1:1 ──────── lesson_progress
   │
   └──────── 1:N ──────── notes
```

---

# 34. Foreign Keys

Foreign keys must be enforced where supported.

Relationships:

```text id="7s7w9c"
modules.course_id
    → courses.id

lessons.module_id
    → modules.id

lesson_progress.lesson_id
    → lessons.id

notes.lesson_id
    → lessons.id
```

---

# 35. Delete Behavior

Deleting a course should remove its descendants.

```text id="s1g5vl"
Course
 ↓
Modules
 ↓
Lessons
 ↓
Progress
 ↓
Notes
```

Deleting a module:

```text id="1l7o6g"
Module
 ↓
Lessons
 ↓
Progress
 ↓
Notes
```

Deleting a lesson:

```text id="g8s3s0"
Lesson
 ↓
Progress
 ↓
Notes
```

Use database cascade behavior where appropriate and safe.

Destructive operations initiated by the user must still have appropriate UI confirmation.

---

# 36. Ordering

Ordering is fundamental to StudyForge.

Modules have:

```text id="f0h2x9"
position
```

Lessons have:

```text id="q6z4k8"
position
```

Positions are scoped to their parent.

For modules:

```text id="a3x9s4"
course_id + position
```

For lessons:

```text id="n7y2v5"
module_id + position
```

---

# 37. Position Rules

Positions should represent ordering, not arbitrary identifiers.

Preferred sequence:

```text id="9nq2x7"
1
2
3
4
5
```

After reordering, positions should be normalized as necessary.

Do not depend on gaps between positions.

---

# 38. Unique Ordering Constraints

Where practical, enforce uniqueness for:

```text id="6k2w8d"
(course_id, position)

(module_id, position)
```

This prevents two sibling modules or lessons from unintentionally sharing the same position.

Reordering operations must account for these constraints transactionally.

---

# 39. Unique YouTube Video Constraint

V1 should prevent the same YouTube video from being added twice to the same module.

Recommended uniqueness constraint:

```text id="k3r8v2"
(module_id, youtube_video_id)
```

The same video may appear in:

- Different modules
- Different courses

unless future requirements change this rule.

---

# 40. IDs

All primary keys should use a consistent identifier strategy.

The implementation should choose one approach and use it consistently.

Possible approaches include:

- UUID
- CUID
- NanoID
- SQLite-generated integer IDs

For a personal SQLite application, simple IDs are acceptable.

Do not introduce multiple ID systems without a clear reason.

---

# 41. Timestamps

Use timestamps consistently.

Primary entities should include:

```text id="e2h9y4"
created_at
updated_at
```

Progress may additionally include:

```text id="x6c0mp"
completed_at
```

Timestamps should use one consistent representation throughout the application.

---

# 42. Data Validation

Database-level constraints are not a substitute for application validation.

Validate inputs before writing to the database.

Examples:

### Course title

Must not be empty.

### Module title

Must not be empty.

### YouTube video ID

Must be a valid expected YouTube video identifier.

### Position

Must be a valid integer.

### Playback position

Must not be negative.

### Note content

Must be valid plain text. Notes may not be empty and are limited to 10,000 characters.

---

# 43. What the Database Should Not Store

Do not store:

- YouTube video files
- Downloaded YouTube audio
- Downloaded YouTube thumbnails
- YouTube API keys
- R2 credentials
- User passwords
- Authentication sessions
- AI embeddings
- Vector data
- Analytics unrelated to learning
- Unnecessary API responses

The database should contain only information needed by StudyForge.

---

# 44. No User Table

V1 intentionally does not contain:

```text id="e8m2k4"
users
accounts
sessions
roles
permissions
```

There is no `user_id` column on courses, modules, lessons, progress, or notes.

The database represents one StudyForge installation.

## Local Profile Carve-Out

V1 does include one small exception: a single-row `profile` table.

Purpose:

- Names the StudyForge installation.
- Enables the first-run onboarding step and the Profile page.
- Is entirely local to the installation.

The `profile` table is not an account, identity, or access-control mechanism.

Table:

```text
profile
```

Fields:

```text
id
name
created_at
updated_at
```

Rules:

```text
The profile table contains exactly one row.

The row is identified by id = 1.

name is required and limited to 60 characters.

No authentication, sessions, or login are associated with the profile.

The profile has no relationship to courses, modules, lessons, progress, or notes.
```

The profile name is validated on the server with the same Zod rules as other inputs.

Do not extend the profile into user accounts, avatars, bios, preferences, or multi-user support.

---

# 45. No Course Duplication Table

Do not introduce a separate table for cloned courses or shared courses.

Social/course sharing is outside V1.

---

# 46. No Analytics Tables

Do not introduce tables such as:

```text id="v6k1cx"
analytics
events
page_views
user_activity
```

unless a concrete product requirement requires them.

StudyForge does not need an analytics system to provide its core learning experience.

---

# 47. No AI Tables

Do not introduce:

```text id="8u3p5r"
ai_suggestions
embeddings
vectors
prompts
ai_runs
```

in V1.

---

# 48. Transactions

Use database transactions for operations that modify multiple related records.

Examples:

### Reordering

```text id="j7g2pz"
Update multiple positions
```

### Deleting a course

```text id="r1p6md"
Delete course
Delete descendants
```

### Completing a lesson

If multiple dependent records are updated, use a transaction where appropriate.

The database should never be intentionally left in a partially updated state.

---

# 49. Progress and Curriculum Changes

Progress must remain consistent when curriculum changes.

Example:

```text id="5f8h1r"
Course:
10 total lessons
6 completed

Delete one completed lesson

→
9 total lessons
5 completed
```

Progress should be recalculated from the remaining lessons.

Do not manually decrement stored percentages.

---

# 50. Empty-State Progress

For a course with zero lessons:

```text id="k9m5c3"
0%
```

For a module with zero lessons:

```text id="n6z2w8"
0%
```

The application should distinguish between:

```text id="v5b8q1"
0% because nothing has been started
```

and:

```text id="q2c7k6"
No lessons exist yet
```

The UI should communicate the difference.

---

# 51. Database Indexes

Indexes should be added where they support real queries.

Likely useful indexes include:

```text id="x3r7z1"
modules.course_id
lessons.module_id
lesson_progress.lesson_id
notes.lesson_id
```

Composite indexes/unique constraints may cover:

```text id="f9w2c4"
course_id + position
module_id + position
module_id + youtube_video_id
```

Do not add indexes indiscriminately.

---

# 52. Drizzle Schema

The database schema should be represented through Drizzle.

The source of truth for application schema changes should be the Drizzle schema and migrations.

Do not manually modify production SQLite tables outside the migration process unless performing an explicitly documented recovery operation.

---

# 53. Migrations

Schema changes must use migrations.

Before modifying an existing table:

1. Update the Drizzle schema.
2. Generate the migration.
3. Review the migration.
4. Test it against a representative database.
5. Apply it through the documented migration process.

Never assume a development database is disposable when testing migration behavior.

---

# 54. Seed Data

StudyForge may provide optional development seed data.

Seed data must never be required for production use.

Development examples may include:

```text id="4u9v0m"
Real Estate
Worship Piano
Biblical Greek
```

Seed data should not contain real user information or credentials.

---

# 55. Database Backup

The SQLite database file is persistent application data.

A deployment should place it on persistent storage.

Example:

```text id="m1p7v8"
/data/learning.sqlite
```

Backups should be created using a SQLite-safe method.

Do not assume that copying the live SQLite file during active writes is always sufficient for a consistent backup.

---

# 56. R2 Backup Integration

Cloudflare R2 is optional.

A deployment may use:

```text id="p9c1m3"
SQLite
 ↓
Backup process
 ↓
R2
```

The database model itself must not depend on R2.

No R2-specific columns belong in the database.

---

# 57. Data Portability

The data model should remain portable.

The learner should not be locked into:

- Coolify
- Cloudflare
- YouTube API infrastructure
- A specific hosting provider

The SQLite database should remain a self-contained representation of the learner's StudyForge data, apart from external YouTube content references.

---

# 58. External Content Dependency

StudyForge lessons reference YouTube content.

Therefore, a lesson may remain in the database even if:

- The video is deleted.
- The video becomes private.
- The video becomes unavailable.
- Metadata changes.

StudyForge should preserve the learner's curriculum record rather than silently deleting the lesson.

The learner can decide whether to remove or replace it.

---

# 59. Data Integrity Principles

The following rules must always hold:

```text id="6x4p0b"
Every module belongs to a course.

Every lesson belongs to a module.

Every lesson has an explicit position.

Every module has an explicit position.

Every lesson references one YouTube video in V1.

A lesson has at most one progress record.

A lesson has at most one note.

Progress is derived from lessons.

Course progress is not stored independently.

Module progress is not stored independently.
```

---

# 60. Conceptual Schema

The complete conceptual model:

```text id="9n2q5w"
┌──────────────────┐
│     COURSE       │
├──────────────────┤
│ id               │
│ title            │
│ description      │
│ created_at       │
│ updated_at       │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│     MODULE       │
├──────────────────┤
│ id               │
│ course_id        │
│ title            │
│ description      │
│ position         │
│ created_at       │
│ updated_at       │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌────────────────────────────┐
│          LESSON            │
├────────────────────────────┤
│ id                         │
│ module_id                  │
│ position                   │
│ youtube_video_id           │
│ youtube_title              │
│ youtube_channel_id         │
│ youtube_channel_name       │
│ youtube_thumbnail_url      │
│ youtube_duration           │
│ youtube_description        │
│ youtube_published_at       │
│ created_at                 │
│ updated_at                 │
└──────────┬─────────────────┘
           │
           ├───────────────┐
           │               │
           │ 1:1           │ 1:N
           ▼               ▼
┌──────────────────┐  ┌──────────────────┐
│ LESSON_PROGRESS  │  │      NOTES       │
├──────────────────┤  ├──────────────────┤
│ id               │  │ id               │
│ lesson_id        │  │ lesson_id        │
│ playback_position│  │ content          │
│ completed        │  │ created_at       │
│ completed_at     │  │ updated_at       │
│ created_at       │  └──────────────────┘
│ updated_at       │
└──────────────────┘
```

A single-row `profile` table exists separately from the curriculum hierarchy:

```text id="q3k8n5"
┌──────────────────┐
│     PROFILE      │
├──────────────────┤
│ id               │
│ name             │
│ created_at       │
│ updated_at       │
└──────────────────┘

One row per installation (id = 1).
No foreign keys to the curriculum.
```

---

# 61. V1 Schema Principle

The database should remain intentionally small.

The initial schema should solve the actual product:

```text id="m6v4h2"
Courses
Modules
Lessons
Progress
Notes
Profile
```

The profile is the single justified exception: a one-row table that names the installation. It exists because the v1 product has a first-run onboarding step and a Profile page.

Nothing else should be added without a concrete requirement.

---

# 62. Final Data Principle

> **Store the learner's curriculum and learning state; reference external content rather than trying to own it.**
