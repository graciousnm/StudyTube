# StudyForge — Testing Strategy

## 1. Purpose

This document defines how StudyForge is tested.

Testing must protect the core learner experience while keeping the test suite:

- Reliable
- Deterministic
- Maintainable
- Fast enough for normal development
- Focused on user behavior
- Appropriate for a self-hosted application

StudyForge should test behavior and business rules rather than implementation details.

---

# 2. Testing Philosophy

The primary testing principle is:

> Test what the learner experiences and what the application promises.

Tests should verify:

```text
Given a known state
        ↓
When the user performs an action
        ↓
The application reaches the expected state
```

Tests should not unnecessarily depend on:

- Internal component structure
- CSS class names
- Private implementation details
- Specific React component hierarchies
- Database implementation details when behavior can be tested at a higher level

---

# 3. Testing Pyramid

StudyForge uses three primary levels of automated testing:

```text
             E2E
        ┌─────────────┐
        │  Playwright │
        └─────────────┘

       Integration
    ┌──────────────────┐
    │ Vitest + SQLite  │
    └──────────────────┘

           Unit
    ┌──────────────────┐
    │      Vitest      │
    └──────────────────┘
```

The majority of tests should be unit and integration tests.

End-to-end tests should focus on critical user workflows.

---

# 4. Test Technologies

The intended testing stack is:

```text
Vitest
Playwright
```

Vitest is used for:

- Unit tests
- Domain logic
- Validation
- Feature-level logic
- Integration tests where appropriate

Playwright is used for:

- Browser workflows
- Learning flows
- Navigation
- Forms
- Progress behavior
- Critical user journeys

---

# 5. Test Organization

Tests should remain close enough to their feature to be understandable without creating excessive duplication.

A possible structure is:

```text
src/
├── features/
│   ├── courses/
│   │   └── *.test.ts
│   ├── modules/
│   │   └── *.test.ts
│   ├── lessons/
│   │   └── *.test.ts
│   ├── youtube/
│   │   └── *.test.ts
│   ├── learning/
│   │   └── *.test.ts
│   ├── progress/
│   │   └── *.test.ts
│   └── notes/
│       └── *.test.ts
│
└── tests/
    ├── integration/
    └── fixtures/

tests/
└── e2e/
    └── *.spec.ts
```

The exact organization may change as the codebase develops.

The important requirement is clear ownership.

---

# 6. Unit Tests

Unit tests verify isolated business logic.

Good candidates include:

- Progress calculations
- Completion rules
- Curriculum ordering
- Continue Learning selection
- Input validation
- YouTube response normalization
- Playback-position validation
- Percentage calculations
- Duplicate detection
- Position normalization

Example:

```text
completed = 3
total = 5

expected progress = 60%
```

The test should verify the domain rule rather than the UI displaying `60%`.

---

# 7. Progress Unit Tests

Progress is a critical domain and requires comprehensive unit coverage.

Tests should verify:

```text
0 / 0
0 / 5
1 / 5
4 / 5
5 / 5
```

Expected behavior:

```text
0 / 0 → empty state
0 / 5 → 0%
1 / 5 → 20%
4 / 5 → 80%
5 / 5 → 100%
```

The empty state must never produce:

```text
NaN
Infinity
```

---

# 8. Lesson State Tests

Tests should verify the three learner-facing states:

```text
Not Started
In Progress
Completed
```

Examples:

```text
No progress record
→ Not Started
```

```text
Saved playback position, not completed
→ In Progress
```

```text
completed = true
→ Completed
```

The exact implementation representation may vary, but the learner-facing behavior must remain consistent.

---

# 9. Completion Tests

At minimum:

```text
Mark incomplete lesson complete
Mark completed lesson incomplete
Complete an already completed lesson
Uncomplete an already incomplete lesson
```

Expected behavior must be idempotent where appropriate.

For example:

```text
Complete
Complete again
```

must not create contradictory progress state.

---

# 10. Completion Timestamp Tests

When a lesson becomes complete:

```text
completed = true
completed_at = timestamp
```

When completion is removed:

```text
completed = false
completed_at = null
```

Tests should verify both values together.

A completed lesson must not have a null completion timestamp if the data model requires the timestamp.

---

# 11. Playback Position Tests

Tests should verify:

```text
0
Positive position
Negative position
Position beyond duration
Unknown duration
```

Examples:

```text
-10 → rejected or clamped
30 with duration 100 → 30
150 with duration 100 → 100
30 with unknown duration → 30
```

The chosen behavior must be consistent throughout the application.

---

# 12. Playback and Completion Independence

A critical invariant is:

```text
Playback position != completion state
```

Tests should verify:

```text
Save playback position
```

does not accidentally:

```text
Mark lesson complete
```

and:

```text
Mark lesson complete
```

does not accidentally:

```text
Reset playback position
```

unless explicitly intended.

---

# 13. Race Condition Tests

Progress updates can arrive in a different order from the order in which the learner initiated them.

The test suite should verify scenarios such as:

```text
Save playback position
Mark complete
Late playback request arrives
```

The late request must not remove completion.

This protects against inconsistent state caused by asynchronous browser requests.

---

# 14. Course Progress Tests

Course progress must be calculated from lessons.

Tests should verify:

```text
No lessons
Partially complete
Fully complete
```

Example:

```text
Completed: 3
Total: 4

Expected:
75%
```

The test must verify that module percentages are not averaged incorrectly.

---

# 15. Module Progress Tests

The same principles apply to modules.

Tests should cover:

```text
Empty module
One incomplete lesson
One completed lesson
Mixed completion
All lessons completed
```

An empty module must not become:

```text
100% complete
```

---

# 16. Continue Learning Tests

Continue Learning is a core learner workflow.

Tests must verify the deterministic selection algorithm.

### Case 1

Multiple incomplete lessons have progress.

Expected:

```text
Most recently interacted-with incomplete lesson
```

### Case 2

No incomplete lesson has existing progress.

Expected:

```text
First incomplete lesson in curriculum order
```

### Case 3

All lessons are complete.

Expected:

```text
No lesson to resume
```

---

# 17. Continue Learning Ordering

Curriculum order is:

```text
Course
  ↓
Module position
  ↓
Lesson position
```

Tests should deliberately create lessons in an order different from their IDs or creation timestamps.

The test must prove that IDs and creation order do not accidentally determine learning order.

---

# 18. Multiple Course Tests

When several courses contain incomplete lessons, tests should verify that the most recently interacted-with incomplete lesson is selected according to the defined Continue Learning rule.

The test should not depend on database insertion order.

---

# 19. Curriculum Modification Tests

Tests must verify that progress remains attached to the lesson.

### Reordering

```text
Lesson A → completed
Lesson B → incomplete

Reorder

Lesson B
Lesson A
```

Expected:

```text
Lesson A → completed
Lesson B → incomplete
```

### Moving

If moving lessons between modules is supported:

```text
Move completed lesson
```

Expected:

```text
Completion remains
```

---

# 20. Lesson Deletion Tests

Deleting a lesson must remove its dependent state.

Verify:

```text
Lesson deleted
Progress deleted
Notes deleted
```

Also verify:

```text
Course totals recalculated
Module totals recalculated
```

No stale progress should remain.

---

# 21. Lesson Addition Tests

Adding a new lesson should immediately affect derived progress.

Example:

```text
5 / 5 complete
```

Add one lesson:

```text
5 / 6 complete
```

The course must no longer be considered complete.

---

# 22. Rewatch Tests

A completed lesson may be watched again.

Verify:

```text
Completed
 ↓
Play
 ↓
Still Completed
```

Playback activity must not automatically remove completion.

---

# 23. Notes Tests

Notes are independent from progress.

Tests should verify:

```text
Create note
Edit note
Delete note
```

without changing:

```text
Lesson completion
Playback position
Course progress
```

---

# 24. Course Tests

Course tests should cover:

```text
Create course
Read course
Update course
Delete course
```

Validation should include:

- Required title
- Valid description handling
- Invalid input
- Empty values where prohibited

Deleting a course should remove its dependent modules, lessons, progress, and notes according to the database rules.

---

# 25. Module Tests

Module tests should cover:

```text
Create module
Read module
Update module
Delete module
Reorder modules
```

Modules must remain associated with the correct course.

Tests should ensure that a module cannot accidentally be associated with another course through invalid input.

---

# 26. Lesson Tests

Lesson tests should cover:

```text
Create lesson
Read lesson
Delete lesson
Reorder lessons
```

Adding a YouTube lesson must preserve:

```text
YouTube video ID
Title
Channel information
Thumbnail
Duration
Description
Published timestamp
```

where those values are available.

---

# 27. Duplicate Lesson Tests

The application must prevent duplicate YouTube videos within the same module.

Example:

```text
Module A
 └── Video X
```

Attempt:

```text
Add Video X again
```

Expected:

```text
Rejected
```

The same video may still be added to another module.

---

# 28. Ordering Tests

Ordering is persisted data.

Tests should verify:

```text
Initial order
Reorder
Reload
Order remains changed
```

The test must verify persistence rather than only checking the temporary UI order.

---

# 29. Transaction Tests

Operations that modify multiple records should be tested for transactional behavior.

Examples:

```text
Delete course
Reorder lessons
Reorder modules
Move lesson
```

If an operation fails partway through, the database should not be left in a partially updated state.

---

# 30. Validation Tests

All externally supplied input must be validated.

Tests should cover:

```text
Valid input
Missing input
Empty input
Invalid types
Unexpected values
Boundary values
```

Validation should be tested independently where practical.

---

# 31. YouTube Search Tests

YouTube integration must be tested without depending on the live YouTube API during normal automated test runs.

Tests should use mocked API responses.

Verify:

```text
Search request
Response normalization
Invalid response
Empty results
API error
Malformed external data
```

---

# 32. YouTube Search Result Tests

A search result should be normalized into StudyForge's internal representation.

Tests should verify that external API fields are mapped correctly.

The rest of the application should not need to understand the raw YouTube API response structure.

---

# 33. YouTube API Failure Tests

If YouTube is unavailable:

```text
Existing courses remain usable
Existing lessons remain usable
Local progress remains usable
```

The application should display a safe error for the failed search operation.

A YouTube outage must not corrupt local curriculum data.

---

# 34. Preview Tests

Previewing a search result must not create a StudyForge lesson.

Verify:

```text
Search
Preview
Close preview
```

does not change:

```text
Courses
Modules
Lessons
Progress
```

---

# 35. Add YouTube Video Tests

The integration test should verify:

```text
Search
 ↓
Select result
 ↓
Add to module
 ↓
Lesson created
```

The lesson must contain the required persisted YouTube metadata.

---

# 36. External API Isolation

Tests should confirm that YouTube-specific code remains isolated.

Application features should depend on StudyForge's normalized YouTube types rather than raw external API responses.

This makes future content-source integrations easier without rewriting the learning domain.

---

# 37. Learning Mode Tests

Learning Mode is a critical user-facing feature.

Tests should verify:

```text
Open lesson
Play lesson
Pause lesson
Navigate previous
Navigate next
Mark complete
Return to course
```

The learner must always know:

```text
Current course
Current module
Current lesson
```

---

# 38. Previous and Next Tests

Navigation must follow stored curriculum order.

Example:

```text
Lesson 1
Lesson 2
Lesson 3
```

Expected:

```text
Lesson 2 previous → Lesson 1
Lesson 2 next → Lesson 3
```

At boundaries:

```text
First lesson
```

has no previous lesson.

```text
Last lesson
```

has no next lesson.

---

# 39. Cross-Module Navigation

If navigation crosses module boundaries, tests should verify the complete curriculum sequence.

Example:

```text
Module 1
 ├── Lesson 1
 └── Lesson 2

Module 2
 ├── Lesson 3
 └── Lesson 4
```

Expected sequence:

```text
1 → 2 → 3 → 4
```

The application must not stop at the end of a module unless that is an explicit product decision.

---

# 40. Resume Tests

A critical workflow is:

```text
Open lesson
 ↓
Start playback
 ↓
Playback position saved
 ↓
Leave
 ↓
Return
 ↓
Resume near previous position
```

The test should verify that the saved position survives navigation.

Exact player timing should not be tested with brittle second-by-second assertions.

---

# 41. E2E Testing Philosophy

Playwright tests should represent real learner workflows.

Good E2E test:

```text
Create course
Create module
Add lesson
Open lesson
Mark complete
Return to course
Verify progress
```

Poor E2E test:

```text
Click every button individually
```

without verifying meaningful user outcomes.

---

# 42. Critical E2E Workflow

At minimum, Playwright must cover the primary learning journey:

```text
Create Course
      ↓
Create Module
      ↓
Search YouTube
      ↓
Add Lesson
      ↓
Open Learning Mode
      ↓
Start Learning
      ↓
Leave
      ↓
Return
      ↓
Resume
      ↓
Mark Complete
      ↓
Verify Progress
```

This test should remain stable even if internal components are refactored.

---

# 43. Course Completion E2E

A separate workflow should verify:

```text
Create course
Add multiple lessons
Complete lesson 1
Complete lesson 2
...
Complete final lesson
```

Expected:

```text
Course becomes completed
```

Then:

```text
Add another lesson
```

Expected:

```text
Course becomes incomplete
```

This verifies the derived completion model.

---

# 44. Persistence E2E

Tests should verify that important learner state survives page reloads.

At minimum:

```text
Course
Module
Lesson
Ordering
Completion
Playback position
Notes
```

should remain available after reload.

---

# 45. Responsive Testing

StudyForge is responsive and must remain usable on smaller screens.

Playwright should include representative viewport tests for:

```text
Desktop
Tablet-sized viewport
Mobile-sized viewport
```

Tests should focus on usability rather than exact pixel dimensions.

Verify that:

- Navigation remains accessible
- Learning Mode remains usable
- YouTube player remains visible
- Buttons remain reachable
- Forms remain usable
- Content does not require horizontal scrolling unnecessarily

---

# 46. Accessibility Testing

Accessibility should be tested as part of normal development.

Verify:

- Semantic headings
- Form labels
- Keyboard navigation
- Visible focus
- Accessible dialogs
- Accessible buttons
- Meaningful link names
- Appropriate ARIA usage where necessary
- No essential information conveyed only by color

Automated accessibility checks may be added where useful.

Automated checks do not replace manual keyboard testing.

---

# 47. Error State Testing

Important failure states must be tested.

Examples:

```text
Invalid form submission
Database failure
YouTube API failure
Missing lesson
Missing course
Network failure
Invalid YouTube video
```

The user should receive a useful, safe message.

Raw:

```text
stack traces
database errors
API keys
environment variables
```

must never be exposed.

---

# 48. Not Found Tests

Tests should verify appropriate behavior when a resource does not exist.

Examples:

```text
Unknown course ID
Unknown module ID
Unknown lesson ID
```

The application should return the appropriate not-found experience rather than crashing.

---

# 49. Database Test Isolation

Tests must not accidentally depend on another test's database state.

Each test should use isolated database state.

Possible approaches include:

```text
Temporary SQLite database
```

or:

```text
Reset database between tests
```

The chosen approach should prioritize reliability and reasonable execution speed.

---

# 50. Test Fixtures

Shared fixtures should be used for recurring domain objects.

Examples:

```text
Course fixture
Module fixture
Lesson fixture
Completed lesson fixture
YouTube search result fixture
```

Fixtures should remain small and explicit.

Avoid giant fixtures that hide the state relevant to a test.

---

# 51. Test Data

Test data should represent realistic StudyForge usage.

Examples may include:

```text
Piano Course
Programming Course
Biblical Greek Course
Real Estate Course
```

The actual names are not important.

The important principle is that the application must remain generic and not accidentally encode a specific subject into its domain logic.

---

# 52. Mocking Rules

Mock external systems when testing local behavior.

YouTube API calls should normally be mocked.

Do not make every test depend on:

```text
Internet access
YouTube availability
API quota
External response timing
```

Live external API tests, if introduced, should be clearly separated from the normal test suite.

---

# 53. No Arbitrary Delays

Tests must not rely on arbitrary waits such as:

```text
wait 2 seconds
```

Prefer:

```text
wait for expected UI state
wait for network response
wait for specific element
wait for observable application state
```

This makes tests faster and more reliable.

---

# 54. Test Selectors

E2E tests should prefer stable selectors based on user-facing semantics.

Prefer:

```text
getByRole()
getByLabel()
getByText()
```

where appropriate.

Avoid relying on fragile CSS selectors such as:

```text
div:nth-child(4)
```

or implementation-specific class names.

If a dedicated test identifier is genuinely required, use a stable semantic identifier.

---

# 55. Test Assertions

Assertions should verify meaningful outcomes.

Prefer:

```text
expect(courseProgress).toBe("50%")
```

when the visible behavior matters.

Avoid excessive assertions about:

```text
specific DOM nesting
exact CSS classes
internal component names
```

unless those details are themselves contractual behavior.

---

# 56. Regression Tests

Every significant bug discovered in production or development should be evaluated for a regression test.

Example:

```text
Bug:
Late playback request removed completion.

Regression test:
Delayed playback update cannot unset completion.
```

The goal is to prevent recurring defects.

---

# 57. Test-Driven Bug Fixing

When practical:

```text
Reproduce bug
     ↓
Write failing test
     ↓
Fix implementation
     ↓
Verify test passes
```

This is especially valuable for:

- Progress
- Ordering
- Persistence
- Data integrity
- YouTube integration boundaries

---

# 58. Security Testing

Security-sensitive behavior should receive automated coverage where practical.

Tests should verify:

- Server-only YouTube API key usage
- Input validation
- Safe error handling
- No arbitrary database access from browser code
- No accidental exposure of environment variables
- No unsafe handling of external API data

The browser must never receive:

```text
YOUTUBE_API_KEY
R2 credentials
database credentials
```

---

# 59. Data Integrity Tests

The test suite must protect important database invariants.

Examples:

```text
Lesson belongs to a module
Module belongs to a course
Progress belongs to a lesson
Notes belong to a lesson
Lesson position is scoped to its module
Module position is scoped to its course
Duplicate YouTube video cannot exist within one module
```

---

# 60. Migration Testing

Database migrations must be tested before release.

At minimum:

```text
Fresh database
 ↓
Apply migrations
 ↓
Application starts
```

For meaningful schema changes:

```text
Existing database
 ↓
Apply migration
 ↓
Existing data remains valid
```

Migrations must not silently destroy learner data.

---

# 61. Backup and Restore Testing

Because SQLite contains the learner's curriculum and progress, backup restoration should be periodically tested.

A restore test should verify that:

```text
Courses
Modules
Lessons
Progress
Playback positions
Notes
```

remain available after restoration.

A backup that cannot be restored is not considered a reliable backup.

---

# 62. Build Verification

The application must pass the production build before release.

At minimum:

```text
Type checking
Linting
Unit tests
Integration tests
Production build
```

should succeed.

E2E tests should run in CI or an equivalent release-validation environment.

---

# 63. Recommended Validation Sequence

A normal validation sequence is:

```text
Format
   ↓
Lint
   ↓
Typecheck
   ↓
Unit Tests
   ↓
Integration Tests
   ↓
Build
   ↓
E2E Tests
```

The exact command names depend on the project's package configuration.

---

# 64. CI Philosophy

Continuous integration should remain lightweight.

StudyForge does not need a complicated CI platform architecture.

CI should primarily answer:

```text
Does the code build?
Does it typecheck?
Do the tests pass?
Does the critical user workflow still work?
```

---

# 65. Flaky Tests

Flaky tests are defects in the test suite.

A test that sometimes passes and sometimes fails without a product change should not simply be retried indefinitely.

Investigate:

- Timing assumptions
- Shared state
- Network dependencies
- Random data
- Database isolation
- Race conditions
- Browser synchronization

Retries may hide problems and should not be the primary solution.

---

# 66. Test Performance

The test suite should remain reasonably fast.

Prefer:

```text
Many fast unit tests
Some integration tests
A smaller number of meaningful E2E tests
```

Do not turn every behavior into an E2E test.

---

# 67. What Not to Test

Do not create tests solely because something exists.

Avoid excessive testing of:

- Framework internals
- Third-party library behavior
- React's own behavior
- Static markup with no meaningful behavior
- Exact implementation structure
- Trivial getter/setter logic

Test StudyForge's behavior and business rules.

---

# 68. Test Coverage

Coverage metrics are useful indicators but are not the primary definition of quality.

High coverage does not guarantee:

```text
Correct product behavior
```

The most important domains should have strong behavioral coverage even if overall line coverage is lower.

Priority areas:

```text
Progress
Curriculum ordering
Course/module/lesson relationships
YouTube integration
Learning Mode
Persistence
Data integrity
```

---

# 69. Minimum Release Quality Gate

A release should not be considered ready if:

```text
Typecheck fails
Lint fails due to release-blocking issues
Unit tests fail
Critical integration tests fail
Production build fails
Critical E2E workflow fails
```

Known non-critical failures must be explicitly understood before release.

---

# 70. Critical Test Matrix

The following workflows should have automated coverage:

| Area                 | Unit | Integration | E2E |
| -------------------- | ---: | ----------: | --: |
| Course CRUD          |    ✓ |           ✓ |   ✓ |
| Module CRUD          |    ✓ |           ✓ |   ✓ |
| Lesson CRUD          |    ✓ |           ✓ |   ✓ |
| Ordering             |    ✓ |           ✓ |   ✓ |
| YouTube search       |    ✓ |           ✓ |   — |
| YouTube preview      |    — |           ✓ |   ✓ |
| Add YouTube lesson   |    ✓ |           ✓ |   ✓ |
| Progress calculation |    ✓ |           ✓ |   ✓ |
| Completion           |    ✓ |           ✓ |   ✓ |
| Resume               |    ✓ |           ✓ |   ✓ |
| Continue Learning    |    ✓ |           ✓ |   ✓ |
| Notes                |    ✓ |           ✓ |   ✓ |
| Profile              |    ✓ |           ✓ |   — |
| Database persistence |    — |           ✓ |   ✓ |
| Responsive behavior  |    — |           — |   ✓ |
| Accessibility        |    — |           — |   ✓ |
| Backup/restore       |    — |           ✓ |   — |

The exact distribution may evolve as implementation progresses.

The Profile row uses `—` for E2E because the repository has no automation scaffold for it yet; the profile onboarding and rename flows are covered by unit and integration tests and verified manually in the browser.

---

# 71. Definition of Done

A feature is not complete merely because its implementation exists.

A feature should be considered complete when:

```text
Requirement understood
        ↓
Implementation complete
        ↓
Validation implemented
        ↓
Relevant tests added
        ↓
Error states handled
        ↓
Existing tests still pass
        ↓
Documentation updated
```

---

# 72. Feature-Specific Test Requirements

Every new feature should answer:

1. What is the expected user behavior?
2. What are the valid inputs?
3. What are the invalid inputs?
4. What happens when external dependencies fail?
5. What data must persist?
6. What existing behavior could this change affect?
7. What regression test should protect it?

If these questions cannot be answered, the feature is not sufficiently defined.

---

# 73. Testing Documentation

When testing behavior changes, update the relevant documentation.

Examples:

```text
Progress rule changed
→ Update PROGRESS.md
```

```text
YouTube behavior changed
→ Update YOUTUBE.md
```

```text
Architecture changed
→ Update ARCHITECTURE.md
```

Tests and documentation must describe the same product behavior.

---

# 74. Final Testing Principle

> **StudyForge testing should prove that learners can reliably build, navigate, resume, and complete learning paths without losing their data or progress.**

The test suite should protect the product's core promise:

```text
Scattered Videos
      ↓
Structured Learning Path
      ↓
Reliable Progress
      ↓
Resume Learning
      ↓
Complete the Course
```

---

# 75. Profile Testing

The local profile feature (DESIGN.md §50, §51; DATA_MODEL.md §44) must be covered by unit and integration tests.

### Validation tests

- The name is required.
- Leading/trailing whitespace is trimmed.
- Names longer than 60 characters are rejected.
- The validation surface uses the same server-boundary pattern as other inputs.

### Query tests

- Empty installation: no courses and no progress rows produce an empty stats payload, never `NaN`/`Infinity`.
- Lesson buckets correctly split total / completed / in-progress / not-started from `lesson_progress`.
- A lesson with playback but `completed = 0` counts as in progress.
- A lesson with only playback (never completed) counts as not started when deriving course state.
- Worked minutes floor the sum of completed lessons' `youtube_duration` in seconds.
- Days touched counts distinct UTC calendar dates across progress updates.
- Most-in-progress picks the highest-percentage in-progress course of all.
- Most-current picks the course of the most recently updated progress row.
- Uncompleted lessons contribute to in progress, never to completed.

### Action tests

- Completing onboarding creates the single profile row at `id = 1` and redirects to `/`.
- A blank name is rejected and no row is created.
- Renaming updates the row and revalidates `/`, `/profile`, and `/onboarding`.
- Renaming when no profile row exists is an error, not a crash.

### Page-level behavior

- `/onboarding` redirects to `/` when a profile already exists.
- `/profile` redirects to `/onboarding` when no profile exists.
- The profile page never initializes a YouTube player.

### E2E / manual verification

The repository has no Playwright scaffold, so profile flows are covered by the unit and integration suite and verified manually in the browser. Any future e2e for onboarding or profile editing should follow the §42 workflow structure.
