# StudyForge — Product Requirements

## 1. Product Overview

**Product:** StudyForge

**Tagline:** Build your own learning path.

StudyForge is an open-source, self-hosted learning application that allows learners to build structured courses from online video content.

The initial version focuses on YouTube as the primary content source.

The learner creates the curriculum.

StudyForge provides the structure, organization, sequencing, progress tracking, and learning experience.

---

# 2. Product Vision

The internet contains an enormous amount of educational content, but useful content is often scattered across many videos.

A learner may know:

> "I want to learn worship piano."

or:

> "I want to learn real estate."

or:

> "I want to learn biblical Greek."

But finding individual videos is not the same as following a structured learning path.

StudyForge solves this problem by allowing the learner to turn individual videos into an organized course.

```text
Scattered Videos
       ↓
   StudyForge
       ↓
Structured Course
       ↓
Learning Path
       ↓
Progress
       ↓
Completion
```

---

# 3. Target User

The primary user is an individual learner.

Examples include someone learning:

- Worship piano
- Real estate
- Programming
- Biblical Greek
- Photography
- Music theory
- Business
- A technical skill
- A hobby

The product should remain general-purpose.

Do not build domain-specific functionality into the core application.

---

# 4. Primary User Goal

The learner should be able to go from:

> "I want to learn X."

to:

> "I have a structured learning path for X, and I know exactly where I am."

without needing another course-management system.

---

# 5. Core User Workflow

The primary workflow is:

```text
Create Course
      ↓
Create Module
      ↓
Search YouTube
      ↓
Preview Videos
      ↓
Add Videos
      ↓
Reorder Lessons
      ↓
Start Learning
      ↓
Track Progress
      ↓
Resume Later
      ↓
Complete Course
```

Every part of V1 should support this workflow.

---

# 6. Core Domain Model

The fundamental hierarchy is:

```text
Course
└── Module
    └── Lesson
        └── YouTube Video
```

### Course

Represents a complete learning goal.

Examples:

```text
Real Estate
Worship Piano
Biblical Greek
JavaScript
```

### Module

Represents a major section of the course.

Examples:

```text
Worship Piano
├── Fundamentals
├── Chord Progressions
├── Worship Techniques
└── Songs
```

### Lesson

Represents an individual learning item inside a module.

In V1, lessons are primarily YouTube videos.

---

# 7. Course Management

The learner must be able to:

- Create a course
- View courses
- Edit a course
- Delete a course
- Open a course
- See course progress

A course should contain:

- Title
- Description
- Ordered modules

---

# 8. Course Creation

Minimum required information:

```text
Title
Description
```

Example:

```text
Title:
Real Estate

Description:
Learn the fundamentals of real estate investing.
```

Course creation should be a simple operation.

No multi-step course wizard is required.

Creating and editing a course happens in a modal dialog on the page the learner is already on (header, home, or course page), not on a separate route. Module create/edit works the same way from the course and module pages.

---

# 9. Module Management

The learner must be able to:

- Create a module
- Edit a module
- Delete a module
- Open a module
- Reorder modules
- See module progress

A module belongs to exactly one course.

A course can contain multiple modules.

---

# 10. Module Creation

Minimum required information:

```text
Module title
```

Optional:

```text
Description
```

Example:

```text
Introduction to Real Estate
```

The learner should be able to create a module directly from the course.

---

# 11. Lesson Management

The learner must be able to:

- Add a YouTube video as a lesson
- View lessons
- Reorder lessons
- Open a lesson
- Remove a lesson
- Mark a lesson complete

Lessons belong to exactly one module.

Lessons have an explicit order.

---

# 12. YouTube Integration

YouTube is the initial external content source.

StudyForge uses YouTube for:

- Search
- Video metadata
- Embedded playback

StudyForge does not host YouTube videos.

StudyForge does not download YouTube videos.

StudyForge does not redistribute YouTube video files.

---

# 13. YouTube Search

The learner must be able to search YouTube from inside StudyForge.

Example:

```text
Module:
Introduction to Real Estate

Search:
intro to real estate
```

StudyForge displays relevant results.

A result should provide, where available:

- Thumbnail
- Video title
- Channel name
- Duration
- Description
- Preview action
- Add action

---

# 14. YouTube Search Workflow

The intended workflow is:

```text
Open Module
      ↓
Click "Add YouTube Video"
      ↓
Enter Search Query
      ↓
Search YouTube
      ↓
Review Results
      ↓
Preview Video
      ↓
Add to Module
```

The learner should remain inside StudyForge during the process.

---

# 15. Video Preview

The learner must be able to preview a YouTube video without leaving StudyForge.

Preview should use the YouTube embedded player.

The learner should be able to:

- Start playback
- Pause playback
- Inspect the video
- Decide whether it belongs in the course
- Add the video to the current module

---

# 16. Adding a YouTube Video

When the learner selects:

**Add to Module**

StudyForge creates a lesson referencing the selected YouTube video.

The application should store the relevant metadata and YouTube video ID.

The video itself is not stored.

After adding the video:

- The new lesson appears in the module.
- The lesson receives an appropriate order position.
- The learner remains in the current workflow.
- The learner can continue adding videos.

---

# 17. Duplicate Videos

V1 should prevent accidental duplicate lessons within the same module.

If the learner attempts to add the same YouTube video twice to the same module, StudyForge should provide a clear message rather than silently creating another identical lesson.

The same video may be used in different modules or courses unless future product requirements change this behavior.

---

# 18. Lesson Ordering

Lessons must have explicit ordering.

Example:

```text
1. What Is Real Estate?
2. Types of Real Estate
3. Real Estate Terminology
4. Understanding Property Markets
```

The learner can change the order.

The order determines the sequence used by learning mode.

---

# 19. Module Ordering

Modules must also have explicit ordering.

Example:

```text
1. Fundamentals
2. Chord Progressions
3. Worship Techniques
4. Songs
```

The course's module order determines the overall course sequence.

---

# 20. Learning Mode

Learning mode is the primary consumption experience.

The learner selects a lesson and enters a focused learning interface.

The interface should provide:

- Embedded YouTube player
- Course context
- Module context
- Lesson title
- Completion state
- Notes
- Previous/next navigation
- Mark Complete action

---

# 21. Learning Sequence

The default sequence is:

```text
Course
 ↓
Module
 ↓
Lesson
 ↓
Next Lesson
 ↓
Next Lesson
 ↓
Next Module
 ↓
Next Module
```

When the learner completes the final lesson of a module, the next lesson should be the first lesson of the next module where applicable.

When the learner completes the final lesson of the final module, the course is complete.

---

# 22. Marking Lessons Complete

The learner should have an explicit way to mark a lesson complete.

Example:

```text
[ Mark as Complete ]
```

Once completed:

```text
✓ Completed
```

Completing a lesson updates:

- Lesson state
- Module progress
- Course progress

---

# 23. Watched vs Completed

StudyForge distinguishes between:

### Playback progress

How much of the video has been watched.

Example:

```text
63% watched
```

### Completion

Whether the learner considers the lesson completed.

Example:

```text
✓ Completed
```

These should not automatically be treated as identical.

V1 may use explicit completion.

Playback tracking should be stored separately where supported by the YouTube player.

---

# 24. Progress Calculation

Progress must be deterministic.

### Lesson

```text
Not Started
In Progress
Completed
```

### Module

```text
Completed lessons / Total lessons
```

### Course

```text
Completed lessons / Total lessons
```

Example:

```text
12 completed
19 total

63%
```

Do not use subjective or AI-generated progress calculations.

---

# 25. Course Progress

Course progress should reflect actual lesson completion.

Example:

```text
Real Estate

12 / 19 lessons completed

████████████░░░░░░░
```

If there are no lessons:

```text
0%
```

The course should not appear completed until all required lessons are completed.

---

# 26. Module Progress

Module progress is calculated from its lessons.

Example:

```text
Introduction to Real Estate

4 / 6 completed
```

A module with no lessons has no completed lessons.

The UI should handle the empty state explicitly.

---

# 27. Continue Learning

StudyForge must provide a **Continue Learning** workflow.

The learner should not have to manually locate their current lesson.

Continue Learning should identify the learner's relevant next/current lesson based on stored progress.

Example:

```text
Real Estate
62% complete

[ Continue Learning ]
```

Selecting the button opens the appropriate lesson in learning mode.

---

# 28. Resume Position

StudyForge should preserve learning context.

At minimum, it should remember:

- Course
- Module
- Lesson
- Completion state

Where technically supported, it should also preserve video playback position.

Example:

```text
Course:
Real Estate

Module:
Introduction

Lesson:
Understanding Property Markets

Playback:
08:42 / 16:44
```

When the learner returns, StudyForge should use that information to restore their learning context.

---

# 29. Next Lesson

Learning mode should provide a clear next action.

Example:

```text
Current:
Understanding Property Markets

[ Next Lesson → ]
```

The next lesson follows the stored lesson/module ordering.

The application must not randomly select another lesson.

---

# 30. Previous Lesson

Learning mode should allow the learner to return to the previous lesson.

Example:

```text
← Previous Lesson
```

The previous lesson follows the stored curriculum order.

---

# 31. Course Completion

A course is complete when all lessons in all modules are complete.

Example:

```text
Real Estate

19 / 19 lessons completed

✓ Course Complete
```

Completion should be deterministic.

---

# 32. Notes

Learners may create notes associated with learning content.

V1 notes should remain simple.

A note may be associated with:

- A lesson
- Potentially a course/module depending on implementation

The initial experience should support basic text notes.

Do not build a full document editor in V1.

---

# 33. My Learning

My Learning is the primary home for the learner.

It should show:

- Courses
- Current progress
- Continue Learning
- Recently accessed learning

The most important item should be the learner's current learning activity.

---

# 34. In Progress

The learner should be able to see courses that are currently being worked on.

A course is considered in progress when:

```text
0 < completed lessons < total lessons
```

Courses with no lessons should not incorrectly appear as actively progressing.

---

# 35. Completed

The Completed area shows courses where:

```text
completed lessons = total lessons
```

The learner should be able to reopen completed courses.

Completion does not lock the course.

---

# 36. Course Editing

The learner should be able to modify their curriculum after creation.

For example:

```text
Course
 ↓
Add Module
 ↓
Add Lessons
 ↓
Reorder
 ↓
Continue Learning
```

Editing a course should not destroy existing progress unless the affected lesson/module is deleted.

---

# 37. Deleting Content

The learner may delete:

- Courses
- Modules
- Lessons

Deleting content should update dependent progress appropriately.

For example:

```text
Delete Lesson
 ↓
Lesson removed
 ↓
Progress recalculated
```

If deleting a course removes all of its modules and lessons, the user should receive an appropriate confirmation before the operation.

---

# 38. Empty Course

A newly created course may have no modules.

The interface should guide the learner toward creating the first module.

Example:

```text
Your course is ready.

Start building your learning path by
creating your first module.

[ Create Module ]
```

---

# 39. Empty Module

A newly created module may have no lessons.

The interface should guide the learner toward adding YouTube content.

Example:

```text
This module has no lessons yet.

Search YouTube and start building this section.

[ Add YouTube Video ]
```

---

# 40. Search Failure

If YouTube search fails, the learner should receive a clear message.

Example:

```text
We couldn't load YouTube results.

[ Try Again ]
```

Do not expose API keys, request details, or raw API errors.

---

# 41. No Search Results

If a search returns no useful results:

```text
No videos found.

Try a different search.
```

The search field should remain available.

---

# 42. Unavailable Videos

A YouTube video may later become unavailable.

StudyForge should not assume that a previously added video will remain playable forever.

If playback fails:

```text
This video is currently unavailable on YouTube.
```

The learner should still be able to remove or replace the lesson.

---

# 43. Product Data Ownership

StudyForge owns the learner's curriculum data.

Examples:

- Courses
- Modules
- Lessons
- Ordering
- Completion state
- Playback progress
- Notes

YouTube remains the source of the referenced video content.

StudyForge stores references and metadata rather than video files.

---

# 44. Persistence

All meaningful learner actions must persist.

Examples:

```text
Create Course
→ Persist

Create Module
→ Persist

Add Video
→ Persist

Reorder Lesson
→ Persist

Mark Complete
→ Persist

Add Note
→ Persist

Playback Progress
→ Persist where supported
```

Refreshing the browser must not erase curriculum state.

---

# 45. No Accounts

The initial product has no authentication or multi-user account system.

There is one local StudyForge installation and its associated learning data.

Do not introduce user ownership fields into the domain model.

The product does include a simple local profile: a single-row table that stores a name for the installation (see DATA_MODEL.md §44). A profile is not an account — there is no login, session, credential, or per-learner data associated with it. It exists so a self-hosted installation can feel personal and to support the first-run name step.

---

# 46. Open Source

StudyForge is open source under the MIT License.

The application should be usable by other people who clone and self-host the repository.

The product itself must not depend on the original developer's:

- Database
- YouTube API key
- Cloudflare account
- Domain
- Server
- Credentials

Each installation should provide its own configuration.

---

# 47. Self-Hosting

StudyForge should be designed for self-hosting.

A deployment may look like:

```text
Docker
  ↓
Next.js
  ↓
SQLite
```

Coolify is one supported deployment option.

Cloudflare R2 may be used for backups.

Neither Coolify nor R2 is part of the fundamental product experience.

---

# 48. Backup Philosophy

The application database should be backed up independently from the application container.

One deployment configuration may use:

```text
SQLite
 ↓
Daily Backup
 ↓
Cloudflare R2
 ↓
7-Day Retention
```

Backups are an operational concern.

The learner should not need to understand R2 to use StudyForge.

---

# 49. V1 Feature Set

The V1 release should contain:

### Courses

- Create
- Edit
- Delete
- View
- Progress

### Modules

- Create
- Edit
- Delete
- Reorder
- View
- Progress

### Lessons

- Add
- Remove
- Reorder
- View
- Complete

### YouTube

- Search
- Preview
- Add video

### Learning

- Learning mode
- Previous lesson
- Next lesson
- Mark complete
- Resume

### Progress

- Lesson progress
- Module progress
- Course progress
- In-progress courses
- Completed courses

### Notes

- Basic lesson notes

### Platform

- Responsive UI
- SQLite persistence
- Self-hosting
- Automated tests

---

# 50. Explicitly Out of Scope

The following are not V1 product requirements:

## Accounts

- Registration
- Login
- Passwords
- OAuth

Public profiles, bios, avatars, and account-linked identity are out of scope. The only profile in V1 is a simple local installation profile (a single-row `profile` table naming the installation) — that is not a user account.

## AI

- AI course generation
- AI recommendations
- AI tutoring
- AI summaries
- AI agents
- AI-generated notes

## Social

- Following
- Followers
- Likes
- Comments
- Public profiles
- Social feeds
- Course sharing
- Course cloning

## Commercial

- Payments
- Billing
- Subscriptions
- Marketplace
- Course sales

## Gamification

- XP
- Points
- Levels
- Streaks
- Leaderboards
- Achievements

## Advanced Learning

- Certificates
- Exams
- Quizzes
- Assignments
- Grading
- Instructor feedback
- Practice tracking

## Infrastructure

- Microservices
- Kubernetes
- Redis
- Message queues
- Object storage for video
- Background workers

These may be considered in future versions but should not be implemented in V1.

---

# 51. Future Possibilities

Future versions may consider:

- Additional content sources
- Practice assignments
- Learning reminders
- Better playback analytics
- Course sharing
- Course import/export
- Optional AI curriculum suggestions
- Optional user accounts
- Multi-device synchronization

These are possibilities, not current requirements.

No future feature should be implemented merely because it is listed here.

---

# 52. AI Future Principle

If AI is eventually introduced, the learner remains in control.

The preferred model is:

```text
Learner
 ↓
Request AI suggestion
 ↓
AI proposes
 ↓
Learner reviews
 ↓
Accept / Reject / Modify
 ↓
Curriculum changes
```

AI must not silently modify a learner's course.

---

# 53. Product Success Criteria

A V1 implementation should allow a new learner to complete this workflow without external instructions:

```text
Open StudyForge
 ↓
Create "Real Estate"
 ↓
Create "Introduction to Real Estate"
 ↓
Search YouTube
 ↓
Preview a video
 ↓
Add it to the module
 ↓
Add several more videos
 ↓
Reorder them
 ↓
Start Learning
 ↓
Mark lessons complete
 ↓
Leave StudyForge
 ↓
Return later
 ↓
Continue Learning
 ↓
Resume the course
```

If this workflow works reliably, the core product is working.

---

# 54. Product Decision Rules

When requirements are unclear, use these principles:

### Learner over administrator

Build for the person learning.

### Structure over features

A clear learning path is more important than additional functionality.

### Simplicity over complexity

Prefer the simplest solution that satisfies the requirement.

### Persistence over convenience

Important learner actions must survive refreshes and restarts.

### Explicit over automatic

The learner should remain in control of curriculum decisions.

### Focus over distraction

The interface should support learning rather than compete with it.

---

# 55. Final Product Principle

> **StudyForge helps learners turn scattered online content into an organized learning path they can actually follow and finish.**
