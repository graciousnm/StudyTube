# StudyTube — Progress System

## 1. Purpose

This document defines how StudyTube tracks learner progress.

Progress must be:

- Deterministic
- Persistent
- Predictable
- Recoverable
- Independent of UI state
- Independent of YouTube analytics
- Consistent across course, module, and lesson views

The database is the source of truth.

---

# 2. Core Principle

StudyTube distinguishes between:

```text id="8q0h5n"
Watching a lesson
```

and:

```text id="y2k3rz"
Completing a lesson
```

Watching a video does not automatically mean the learner has completed it.

---

# 3. Progress Hierarchy

Progress exists at three conceptual levels:

```text id="v1k5d8"
Course
  │
  └── Modules
       │
       └── Lessons
            │
            └── Lesson Progress
```

Only lesson-level progress is stored directly.

Course and module progress are calculated from lesson completion.

---

# 4. Lesson Progress State

Every lesson has one of three learner-facing states:

```text id="a8k4mz"
Not Started
In Progress
Completed
```

---

# 5. Not Started

A lesson is considered **Not Started** when the learner has no meaningful progress record.

Conceptually:

```text id="7f5x2j"
No progress
```

or an equivalent zero-state.

The UI may display:

```text id="q9p6cm"
Not Started
```

---

# 6. In Progress

A lesson is **In Progress** when the learner has begun interacting with it but has not completed it.

Possible indicators include:

```text id="w6q1zv"
Saved playback position > 0
```

or:

```text id="v8k2sl"
A progress record exists and completed = false
```

The implementation should use one consistent rule.

The existence of a progress record should not by itself create contradictory UI states.

---

# 7. Completed

A lesson is **Completed** when:

```text id="m0x5py"
completed = true
```

and:

```text id="n6q3rs"
completed_at != null
```

Completion is explicit.

---

# 8. Completion Rule

The primary V1 completion action is:

**Mark as Complete**

When selected:

```text id="6v2c8h"
completed = true
completed_at = current timestamp
```

The lesson immediately becomes completed.

---

# 9. Uncomplete Rule

A learner may undo completion.

When a completed lesson is marked incomplete:

```text id="x9g7wb"
completed = false
completed_at = null
```

The saved playback position should remain unchanged.

This allows the learner to continue learning from the previous position.

---

# 10. Automatic Completion

V1 does not automatically mark lessons complete when a YouTube video ends.

For example:

```text id="m3k1fr"
Video reaches 100%
```

does not automatically mean:

```text id="e6t0pc"
Lesson completed
```

The learner explicitly controls completion.

This avoids accidental completion and keeps progress semantics simple.

---

# 11. Playback Position

StudyTube stores:

```text id="3n6jvb"
playback_position_seconds
```

This represents the latest useful playback position known to StudyTube.

It is used primarily for:

```text id="c8s5xw"
Resume Learning
```

It is not an analytics record.

---

# 12. Playback Position Precision

Playback position does not need second-by-second accuracy.

The goal is:

> Resume approximately where the learner stopped.

StudyTube should periodically persist playback position rather than writing every playback event to SQLite.

---

# 13. Playback Position Validation

Playback position must never be negative.

If a video duration is known:

```text id="n4p9vz"
0 <= playback_position_seconds <= duration_seconds
```

The application should clamp invalid values safely.

---

# 14. Duration Unknown

If YouTube does not provide a usable duration:

- Playback position may still be stored.
- Percentage progress should not be calculated from duration.
- Completion remains based on explicit learner completion.

The application must not invent a duration.

---

# 15. Playback Persistence

Playback position should be persisted:

- Periodically while playing
- When playback pauses where practical
- When the learner navigates away where practical
- When the learner leaves the learning page

The exact persistence interval is an implementation detail.

It should balance:

```text id="t7j4k0"
Resume reliability
```

against:

```text id="z5r2s8"
Unnecessary database writes
```

---

# 16. Browser Exit

StudyTube cannot guarantee that a browser will always allow a final network request when a tab or browser is closed.

Therefore, the application should not depend solely on an unload event.

Periodic persistence is required.

---

# 17. Course Progress

Course progress is calculated from all lessons belonging to the course.

Formula:

```text id="5z4j6m"
Completed Lessons
─────────────────
Total Lessons
```

Example:

```text id="j2v6xk"
Completed: 8
Total: 12

Progress: 66.7%
```

The UI may round this to:

```text id="t9p4r3"
67%
```

---

# 18. Course Completion

A course is complete when:

```text id="3m8j1p"
Total lessons > 0
```

and:

```text id="x4q7vz"
Completed lessons = Total lessons
```

Do not store a separate course completion flag.

It should be derived.

---

# 19. Empty Course

A course containing zero lessons is not considered completed.

Instead:

```text id="g6w2cn"
Progress: 0%
State: No lessons yet
```

The UI should distinguish this from a completed course.

---

# 20. Module Progress

Module progress is calculated from lessons belonging to that module.

Formula:

```text id="f8n3q6"
Completed Lessons
─────────────────
Total Lessons
```

---

# 21. Empty Module

A module with zero lessons is not considered completed.

Display:

```text id="u5j7s0"
No lessons yet
```

rather than:

```text id="b4r8m2"
100%
```

This prevents the mathematical empty-set case from becoming misleading learner progress.

---

# 22. Course Progress Across Modules

Course progress does not average module percentages.

Incorrect:

```text id="1s9d3m"
Module 1 = 100%
Module 2 = 50%

Course = 75%
```

if the modules contain different numbers of lessons.

Instead, course progress counts individual lessons:

```text id="q5x8k2"
Total completed lessons
──────────────────────
Total lessons
```

This gives each lesson equal weight.

---

# 23. Example

Course:

```text id="v6m2d8"
Module 1:
2 lessons
2 completed

Module 2:
10 lessons
5 completed
```

Course progress is:

```text id="g7c3y1"
7 completed
12 total

58.3%
```

It is not:

```text id="p2z5n9"
100% + 50%
────────────
2

= 75%
```

---

# 24. Continue Learning

The home page should provide a **Continue Learning** experience.

Its purpose is to help the learner return directly to the most relevant unfinished lesson.

---

# 25. Continue Learning Selection

Preferred deterministic algorithm:

### Step 1

Find incomplete lessons that have existing learner progress.

### Step 2

Among those lessons, select the most recently watched lesson.

Use the stored progress activity timestamp.

### Step 3

If no previously started incomplete lesson exists, select the first incomplete lesson according to curriculum order.

### Step 4

If every lesson is complete, the course is complete and there is no lesson to resume.

Continue Learning may also be scoped to a single module (for example, a module page banner). When scoped to a module, the same selection rule applies within that module: most recently watched incomplete lesson, then first incomplete lesson in curriculum order, then none.

---

# 26. Curriculum Order

When selecting the first incomplete lesson, use:

```text id="m1r4j7"
Course position
    ↓
Module position
    ↓
Lesson position
```

This is the authoritative learning order.

---

# 27. Most Recently Watched

The system should maintain enough timestamp information to identify the most recently interacted-with incomplete lesson.

The progress record may use:

```text id="q8z2v6"
updated_at
```

or a dedicated playback/activity timestamp.

The implementation must use one consistent definition of "recently watched."

---

# 28. Multiple Courses

If the learner has multiple courses with incomplete lessons, Continue Learning must determine which course to surface.

The preferred rule is:

```text id="k5t8x1"
Most recently interacted-with incomplete lesson
```

across all courses.

This allows the learner to return directly to what they were most recently studying.

If no progress exists, the application may show courses requiring attention according to a deterministic fallback such as course creation/order.

---

# 29. No Active Progress

If the learner has never started any lesson:

```text id="q7h4s2"
Continue Learning
```

should guide them toward the first incomplete lesson of an appropriate course.

The UI should avoid pretending that a lesson is being resumed when it has never been started.

---

# 30. Completed Courses

Completed courses should not appear in the primary Continue Learning action.

They belong in:

```text id="e3y7c9"
Completed
```

rather than:

```text id="s8x1v4"
In Progress
```

---

# 31. In Progress Course

A course is considered **In Progress** when:

```text id="n2q5x8"
0 < completed lessons < total lessons
```

and the course has at least one lesson.

---

# 32. Completed Course

A course is considered **Completed** when:

```text id="r4v7k0"
completed lessons = total lessons
```

and:

```text id="h6x2m9"
total lessons > 0
```

---

# 33. Course With No Lessons

A course with no lessons belongs in neither completed nor meaningful in-progress state.

It should be treated as:

```text id="b3n9q6"
Not Started / Empty
```

with an invitation to add content.

---

# 34. Lesson Ordering and Progress

Changing lesson order does not change lesson progress.

Example:

```text id="p9w3m1"
Lesson A → completed
Lesson B → incomplete
```

If the learner reorders them:

```text id="v2k8s5"
Lesson B
Lesson A
```

their progress remains:

```text id="x6r1q4"
Lesson A → completed
Lesson B → incomplete
```

Progress belongs to the lesson, not its position.

---

# 35. Moving Lessons Between Modules

If V1 allows moving a lesson between modules, progress should remain attached to that lesson.

Example:

```text id="s7j5c2"
Module A
 └── Lesson X
      └── completed
```

Move Lesson X:

```text id="n3m8v0"
Module B
 └── Lesson X
      └── completed
```

The completion state remains.

---

# 36. Deleting Lessons

When a lesson is deleted:

- Its progress is deleted.
- Its notes are deleted.
- Course/module progress is recalculated.
- Remaining lesson ordering is normalized if necessary.

The deletion must not leave stale progress records.

---

# 37. Adding Lessons

Adding an incomplete lesson immediately changes progress totals.

Example:

```text id="d5q8z2"
5 completed
5 total

Add new lesson

5 completed
6 total
```

Progress becomes:

```text id="k4x9p1"
83.3%
```

The new lesson is not automatically marked complete.

---

# 38. Completing the Final Lesson

When the final incomplete lesson is completed:

```text id="h3m7s6"
completed lessons = total lessons
```

the course becomes completed immediately.

The UI should reflect the new course state without requiring a page reload.

---

# 39. Adding a Lesson to a Completed Course

If a new lesson is added to a completed course:

```text id="c1v6r8"
Previously:
10 / 10 completed

Add lesson:
10 / 11 completed
```

The course becomes incomplete again.

This is intentional.

Completion is derived from the current curriculum.

---

# 40. Removing a Completed Lesson

If a completed lesson is deleted:

```text id="a7x2m5"
9 / 10
```

the totals are recalculated from remaining lessons.

Do not manually maintain a stored course completion value.

---

# 41. Notes and Progress

Notes do not affect progress.

Writing a note does not:

```text id="j6r8t0"
Start a lesson
```

and does not:

```text id="q3p9v1"
Complete a lesson
```

Notes and progress are separate domains.

---

# 42. Preview and Progress

Previewing a YouTube search result does not affect StudyTube progress.

Only an existing StudyTube lesson can have progress.

---

# 43. Learning Mode and Progress

Learning Mode is the primary place where progress is created and updated.

The learner may:

- Start playback
- Pause
- Resume
- Seek
- Mark complete
- Navigate to another lesson

Each action should preserve consistent progress state.

---

# 44. Seeking

Seeking should update the saved playback position eventually.

Seeking does not automatically change completion.

Example:

```text id="x0c4m9"
Learner jumps from 02:00 → 18:00

Progress:
position ≈ 18:00
completed = false
```

---

# 45. Rewatching Completed Lessons

A completed lesson may be played again.

Playing a completed lesson should not automatically remove completion.

Example:

```text id="e4j7n2"
Completed
 ↓
Play again
 ↓
Still Completed
```

If the learner explicitly marks it incomplete, completion is removed.

---

# 46. Resume Completed Lessons

A completed lesson may still retain its last playback position.

When reopened, StudyTube may resume from that position.

The application should not unexpectedly reset completed lessons unless the learner explicitly chooses to restart.

---

# 47. Restart Behavior

V1 does not require a dedicated "Restart Lesson" feature.

If introduced later, the behavior should be explicitly defined.

It should not silently alter completion state unless that is an intentional product decision.

---

# 48. Progress Updates and Race Conditions

Progress updates can occur rapidly.

Example:

```text id="r1k6x8"
Playback update
     ↓
Pause
     ↓
Navigation
```

The server must avoid older asynchronous updates overwriting newer state where practical.

Progress persistence should favor the latest valid playback position.

---

# 49. Completion vs Playback Race

If the learner marks a lesson complete while a delayed playback-position request is still in flight, the delayed request must not reset completion.

Completion and playback position should be handled independently.

For example:

```text id="v5m2q7"
Request A:
save position

Request B:
mark complete

```

Request A must not result in:

```text id="j8c4w3"
completed = false
```

unless explicitly requested.

---

# 50. Server Authority

The server is authoritative for persistent progress.

The browser may maintain temporary UI state, but it must not be treated as the permanent source of truth.

After a mutation, the UI should reconcile with server state.

---

# 51. Progress API

Progress operations should have a clear feature-level interface.

Conceptually:

```text id="q8m3v7"
getLessonProgress()
savePlaybackPosition()
markLessonComplete()
markLessonIncomplete()
getCourseProgress()
getModuleProgress()
getContinueLearning()
```

Exact function names may change during implementation.

---

# 52. Progress Calculation Location

Progress calculations should have one authoritative implementation.

Do not calculate course percentages independently in:

- Course page
- Home page
- Dashboard
- Learning page
- API route

Each surface should consume the same domain logic.

---

# 53. Rounding

Store exact counts.

Do not store rounded percentages.

Example:

```text id="f7n2k5"
completed = 2
total = 3
```

The UI can display:

```text id="p4x8c1"
67%
```

The underlying calculation remains:

```text id="m9v6z3"
2 / 3
```

---

# 54. Zero Division

Never divide by zero.

If:

```text id="b2x5m7"
total lessons = 0
```

the application should return an explicit empty state rather than:

```text id="j8k4q0"
NaN
Infinity
100%
```

---

# 55. Progress Consistency

At all times:

```text id="t3v8m1"
completed lessons <= total lessons
```

and:

```text id="r6q2z9"
completed lessons >= 0
```

Lesson completion itself must be represented consistently.

---

# 56. Progress After Database Restore

Progress is part of the core learner data.

A valid SQLite backup must preserve:

- Lesson completion
- Completion timestamps
- Playback positions
- Notes
- Curriculum structure

Restoring the database should restore the learner's previous learning state.

---

# 57. Progress Is Not Analytics

StudyTube does not attempt to answer questions such as:

```text id="v2k8r6"
How many seconds did the learner watch?
How many times did they pause?
How many times did they seek backward?
What percentage of the video was viewed?
```

unless such functionality becomes an explicit product requirement.

The V1 progress system exists to help the learner:

```text id="y5q1c7"
Know what is completed
Resume learning
Navigate their curriculum
```

---

# 58. Privacy

Progress data is local application data.

It should not be sent to external analytics providers.

YouTube should not be used as a StudyTube progress database.

---

# 59. Testing Progress

Progress is a critical domain and requires strong automated coverage.

At minimum, tests should cover:

### Lesson State

```text id="x8r2p5"
Not Started
In Progress
Completed
```

### Completion

```text id="j6m4v9"
Complete
Uncomplete
```

### Course Progress

```text id="c7z3n1"
0 lessons
1 lesson
Multiple lessons
All complete
```

### Module Progress

```text id="w5q8s2"
Empty
Partially complete
Complete
```

### Resume

```text id="m2v7k4"
Saved position
No saved position
Invalid saved position
```

### Continue Learning

```text id="p9x4c6"
Most recently watched
First incomplete
Everything completed
Multiple courses
```

### Curriculum Changes

```text id="r3j8n0"
Add lesson
Delete lesson
Reorder lesson
Move lesson
```

---

# 60. Critical End-to-End Progress Workflow

At least one Playwright workflow should verify:

```text id="k7m2v5"
Create Course
      ↓
Create Module
      ↓
Add Lesson
      ↓
Open Learning Mode
      ↓
Start Lesson
      ↓
Leave Lesson
      ↓
Return
      ↓
Resume Position
      ↓
Mark Complete
      ↓
Course Progress Updates
      ↓
Course Becomes Complete
```

This workflow represents one of the most important StudyTube user journeys.

---

# 61. Progress Invariants

The following rules must remain true:

```text id="g8x3q2"
Completion is explicit.

Playback position does not equal completion.

Course progress is derived.

Module progress is derived.

Progress belongs to lessons.

Reordering does not change progress.

Deleting a lesson removes its progress.

Adding a lesson can make a completed course incomplete.

Rewatching a completed lesson does not remove completion.

Notes do not affect progress.

Preview does not affect progress.

The server is authoritative.

Progress survives database backup and restore.
```

---

# 62. Final Progress Principle

> **StudyTube tracks enough state to help the learner know what they have completed and resume where they left off, without turning learning progress into an analytics system.**
