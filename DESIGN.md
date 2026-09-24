# StudyForge — Design System & UX Guidelines

## 1. Design Identity

**Product:** StudyForge

**Tagline:** Build your own learning path.

StudyForge is a focused learning environment where learners organize online video content into structured courses.

The interface should feel:

- Calm
- Focused
- Educational
- Personal
- Modern
- Practical
- Lightweight

StudyForge should feel like a place where someone **comes to learn**, not a place where someone **comes to manage a business**.

---

# 2. Core Design Principle

> **The interface should help the learner decide what to learn next, then get out of the way.**

Every major screen should answer:

1. Where am I?
2. What am I learning?
3. What have I completed?
4. What should I do next?

Avoid visual elements that do not help answer those questions.

---

# 3. Visual Personality

StudyForge should have a restrained visual language.

Use:

- Clean typography
- Generous spacing
- Clear hierarchy
- Subtle borders
- Moderate corner radii
- Simple line icons (inline SVG)
- Focused use of color
- Strong readability

Avoid:

- Excessive gradients
- Neon colors
- Excessive shadows
- Glassmorphism everywhere
- Large decorative illustrations
- Animated backgrounds
- Gamification-heavy visuals
- Excessive badges
- Dense dashboards
- Excessive card grids
- Emoji or text-glyph icons (`→`, `✓`, `○`, `↑`)

The design should remain attractive without becoming distracting.

---

# 4. Color Philosophy

The interface should use a restrained neutral foundation with one primary accent.

The accent color represents:

- Learning
- Progress
- Primary actions
- Current state

Color should communicate meaning rather than decoration.

V1 palette (dark theme only; there is no light/dark toggle):

```text
Accent (blue)        #3b82f6
Accent hover         #2563eb
Accent soft tint     rgb(59 130 246 / 0.14)
Success (green)      #10b981
Success tint         rgb(16 185 129 / 0.14)
Surface (page)       #09090b (zinc-950)
Surface (card/top)   #18181b (zinc-900)
Border               zinc-800
Text (primary)       #f4f4f5 (zinc-100)
Text (muted)         zinc-400 / zinc-500
```

Use the accent for primary actions, progress fills, active and hover states, and focus rings.
Use the success green for completed/lesson-complete states only.
Keep everything else neutral.

Examples:

```text
Primary accent
→ Main actions
→ Active navigation
→ Progress

Success
→ Completed lesson
→ Successful action

Warning
→ Important attention state

Error
→ Failed action
→ Validation problem

Neutral
→ Secondary information
→ Inactive states
```

Do not use color as the only method of communicating state.

Secondary and edit buttons use a neutral outline — transparent with a subtle border — whose fill appears only on hover. Destructive buttons use the same treatment in red. Icon-only delete controls use a muted ghost that only hints red on hover; the confirmation dialog's destructive button stays prominent red. Primary actions keep the solid accent.

---

# 5. Typography

Typography should prioritize readability.

Use a modern sans-serif typeface.

Establish a clear hierarchy:

```text
Page title
Section heading
Module title
Lesson title
Body text
Supporting metadata
```

Avoid excessive font sizes.

Course titles may be visually prominent, but the application should not rely on oversized typography for visual impact.

---

# 6. Spacing

Use a consistent spacing system.

Prefer a small set of reusable spacing values rather than arbitrary values throughout the application.

Spacing should create clear visual relationships:

```text
Page
 └── Section
      └── Content
           └── Item
```

Related content should be visually grouped.

Unrelated content should have sufficient separation.

---

# 7. Layout

StudyForge should use a responsive content-centered layout.

Desktop:

```text
┌───────────────────────────────────────────────┐
│ Navigation                                    │
├───────────────────────────────────────────────┤
│                                               │
│              Main Content                     │
│                                               │
│                                               │
└───────────────────────────────────────────────┘
```

The content area should not stretch unnecessarily across extremely wide screens.

Use a reasonable maximum content width.

Learning mode may use a wider layout because video content benefits from additional horizontal space.

Lists of courses, modules and lessons render as modest card grids: one column on small screens, two on tablets, and at most three on wide screens.
Cards in a grid are equal-height; keep each card's primary action and footer controls aligned at the bottom.

---

# 8. Navigation

Primary navigation should remain simple.

Recommended structure:

```text
StudyForge

My Learning (/)
Courses (/courses)
In Progress
Completed

+ New Course
```

The exact implementation may be a sidebar, top navigation, or responsive combination depending on screen size. The app ships the first two destinations — Home/Hub ("My Learning") and the Courses library — in the header and mobile nav.

Navigation must never dominate the learning content.

On smaller screens, navigation should collapse into a mobile-friendly pattern.

Inner pages (course, module, add-video, lesson) show a breadcrumb trail — `Courses / Course / Module / …` — instead of a single Back link. The trail's current page is the last, non-linked item.

The global New Course control in the app header uses the neutral outline (see §4) so the solid accent stays reserved for in-page primary actions; the Courses page's own New Course controls remain solid primary.

When the installation has a local profile (see DATA_MODEL.md §44), the header also shows the learner's name with an avatar icon as a link to the Profile page. This is a local, single-installation designation — not an account — and it never dominates or clutters the navigation. Before a profile exists, the header shows no name and the home page prompts the name step instead (see §50).

---

# 9. Home / My Learning

The home screen should immediately communicate the learner's current learning state. It is a focused dashboard: course browsing lives on the dedicated Courses page (see §9a) rather than the home screen.

Primary content:

```text
Welcome back

Continue Learning
────────────────────────────
Course title
Current module
Current lesson
Progress
Continue button
```

Then:

```text
Recently studied
────────────────────────────
Up to 3 course cards
```

The most important action should be obvious:

**Continue Learning**

Do not make the learner search through the interface to resume their current course.

The home Continue Learning banner uses the standard banner card (see §12) — pill eyebrow, course title, module · lesson line, and the Progress section with a primary action — but keeps the soft accent skin so it remains the most prominent banner on the page.

When there is no course to continue, the home screen shows no Continue Learning banner. Add or resume courses from the Courses page instead.

---

# 9a. Courses

The Courses page (`/courses`) is the library the learner browses ("My Courses"). It lists every course in the app, each with its completion progress, in curriculum order:

```text
Courses                          [ + New Course ]

────────────────────────────
Course card · Course card · Course card
```

Primary content:

```text
Courses
────────────────────────────
Course list (with progress)
```

The most important action is creating the first course:

When there are no courses, the page shows an empty state — a dashed card with "No courses yet" and a solid primary `Create Course` button.

The header's global New Course control and the in-page Create Course button are the entry points; see §8.

---

# 10. Course Page

A course page should provide a clear overview.

Example:

```text
Real Estate

Introduction to real estate investing...

🎯 Goal: Learn to play worship piano confidently.   [when set]

████████████░░░░░░ 62%

12 of 19 lessons completed

[ Continue Learning ]

Modules

01  Introduction to Real Estate
    5 / 6 lessons complete

02  Real Estate Markets
    4 / 7 lessons complete

03  Financing
    3 / 6 lessons complete
```

The course page should emphasize:

- Course title
- Description
- Optional learning goal
- Overall progress
- Continue Learning
- Module structure

Avoid filling the page with unrelated statistics.

The course header leads with the title. Course actions (Edit / Export / Delete) sit in a three-dot menu to the right of the title; the "Add module" button is on the opposite side. The header ends with the description, an optional Goal call-out, and the Completed indicator.

Modules render as a card grid — two columns on tablet and three on large screens. Each card leads with a position pill and a `text-lg` title, with the description beneath; a progress row places the lesson count inline with a thin accent bar. A muted ghost delete sits in the card's top-right (reddening on hover), and move arrows live in a small-screens-only footer (see §17). A completed module may show a small Complete chip.

---

# 11. Course Creation

Course creation should be simple.

Minimum information:

```text
Course title
Description
Learning goal (optional)
```

Course create and edit open in a modal dialog (from the header/home and the course page), not a separate route. Module create and edit work the same way, from the course and module pages. The add-video flow stays a full page because search results and the video preview need the space.

Import and export live inside these same flows rather than on their own pages:

- The course actions menu (top-right of the course header) offers Edit / Export / Delete. Export triggers a direct `.studyforge-course.json` download of that course's curriculum (title, description, learning goal, modules, lessons).
- The "New Course" flow's choice modal shows three options: Create Manually, Import a Course, and (when available) Create with AI. Import opens a modal with a file picker and a short explanation; the file is sent to the server, which validates it and redirects to the newly created course on success, or shows an error in place.

Example:

```text
Create Course

Title
[ Real Estate                    ]

Description
[ Learn the fundamentals of real estate ]

[ Create Course ]
```

Do not create a multi-step wizard for basic course creation.

---

# 12. Module Page

The module page should focus on the lessons.

Example:

```text
Introduction to Real Estate

6 lessons
4 completed

Lessons                [ Add YouTube Video ]

01  What Is Real Estate?
    YouTube · 14:32                  ✓

02  Types of Real Estate
    YouTube · 18:05                  ✓

03  Real Estate Terminology
    YouTube · 21:12

04  Understanding Property Markets
    YouTube · 16:44

05  ...
```

The module header is a card. A pill badge (matching the module position pills) labels the module number above the title, and module edit/delete appear as two matching ghost icon buttons in the top-right, vertically centered against the title. The header closes with a Progress section identical to the course banner's: a kicker row (`Progress` / `N / M lessons complete`) above a thin, full-width accent bar, a primary Start Learn/Continue Learning button leading to the module's current or next incomplete lesson, and a Completed chip when the module is fully complete. The Add YouTube Video control lives in the Lessons section header, mirroring Add Module on the course page.

Lessons should have a clear order.

The learner should easily understand:

- Lesson title
- Video source
- Duration
- Completion state
- Position in the module

Lessons render as cards with a 16:9 YouTube thumbnail (falling back to a centered play icon), a position pill (`01`, `02`, …) at the thumbnail's top-left, and a duration badge at its bottom-right. The completion toggle sits as a compact overlay chip in the thumbnail's top-right corner. The card body shows the title (white, accent on hover) and the channel. While a lesson is in progress, a thin progress bar and a status row ("N% watched" with a small dot) sit at the card bottom; completed lessons show a success "Completed" status, and not-started lessons show none. The status row's right side holds the reorder arrows and the icon-only remove control, which fades in on card hover on large screens and remains always visible on small screens. Cards equalize at the footer so progress and actions align across a row. The grid is two columns on tablet and three on large screens. Reorder arrows are shown on small screens only (see §17).

---

# 13. Adding a YouTube Video

The primary workflow is:

```text
Module
 ↓
Add YouTube Video
 ↓
Search
 ↓
Review results
 ↓
Preview
 ↓
Add to Module
```

The interface should make this workflow obvious.

---

# 14. YouTube Search

YouTube search should feel integrated into StudyForge rather than like a separate website.

The add-video page uses the expanded `lg` content width (max-w-5xl) and focuses entirely on search — the module page already lists lessons.

The search bar is wide and prominent. Results render as a responsive grid of YouTube-style cards: one column on small screens, two on tablets, and three on wide screens.

Example:

```text
Add YouTube Video

Search YouTube
[ intro to real estate                               ] [ Search ]

Results

┌──────────────────────┐  ┌──────────────────────┐
│  ┌──────────────┐    │  │  ┌──────────────┐    │
│  │  Thumbnail   │    │  │  │  Thumbnail   │    │
│  │     14:32    │    │  │  │     18:05    │    │
│  └──────────────┘    │  │  └──────────────┘    │
│  Introduction to     │  │  Types of Real       │
│  Real Estate         │  │  Estate              │
│  Example Channel     │  │  Example Channel 2   │
│                      │  │                      │
│  [ Preview ] [ Add ] │  │  [ Preview ] [ Add ] │
└──────────────────────┘  └──────────────────────┘
```

Search results should show:

- Thumbnail (16:9, duration badge overlay)
- Title (max two lines)
- Channel name
- Preview action
- Add action

Do not overwhelm the result card with unnecessary metadata.

---

# 15. Video Preview

Preview should happen **inside StudyForge**.

Do not send the learner to YouTube merely to preview a video.

Preferred interaction:

```text
Search Results
      ↓
   Preview
      ↓
┌───────────────────────────────┐
│                               │
│       YouTube Player          │
│                               │
├───────────────────────────────┤
│ Video title                   │
│ Channel                       │
│                               │
│ [ Add to Module ] [ Close ]   │
└───────────────────────────────┘
```

A dialog, drawer, or dedicated preview area may be used.

The learner should be able to watch enough of the video to decide whether it belongs in their course.

---

# 16. Adding a Video

After selecting a video:

```text
[ Add to Module ]
```

The video should become a lesson in the current module.

After successful addition:

- Give clear confirmation.
- Keep the learner in context.
- Do not unexpectedly navigate away.
- Make the new lesson visible.

The learner should be able to continue adding videos efficiently.

---

# 17. Reordering Lessons

Lesson ordering is important because StudyForge represents a learning path.

Use an intuitive reorder interaction.

Desktop may use:

```text
☰  01  Introduction
☰  02  Terminology
☰  03  Property Types
```

Dragging a lesson should provide clear visual feedback.

The new order must persist.

On mobile, the reorder interaction must remain usable without requiring precise drag-and-drop gestures.

If drag-and-drop becomes unreliable on mobile, provide an alternative such as move-up/move-down actions.

V1 shows the move-up/move-down arrows on small screens only. Desktop drag-and-drop is a planned follow-up; until it exists, large-screen reordering has no UI.

---

# 18. Learning Mode

Learning mode is one of the most important experiences in StudyForge.

It should minimize distractions.

Example:

```text
Courses / Introduction to Real Estate / Module 1 / Understanding Property Markets

Module 1 · Lesson 3 of 6

┌───────────────────────────────────────────────┐
│                                               │
│                 YouTube Player                │
│                                               │
└───────────────────────────────────────────────┘

Understanding Property Markets

[ Mark as Complete ]

Notes
───────────────────────────────────────────────
[                                               ]
[                                               ]

                         [ Next Lesson → ]
```

The player should be the dominant element.

Secondary application navigation should be minimized.

---

# 19. Learning Mode Requirements

The learner should always be able to see:

- Current course
- Current module
- Current lesson
- Lesson position
- Completion state
- Next lesson

The primary actions should be obvious:

```text
Mark as Complete
Next Lesson
```

If the lesson is already completed:

```text
✓ Completed
```

---

# 20. Continue Learning

The **Continue Learning** action should take the learner directly to the next relevant lesson.

Example:

```text
Course
Real Estate

Progress
62%

Continue Learning
```

If the learner previously stopped halfway through a lesson, StudyForge should restore that context where technically possible.

The learner should not have to manually remember where they stopped.

---

# 21. Progress Indicators

Progress should be visually simple.

Good:

```text
████████████░░░░  75%
```

Also useful:

```text
12 / 16 lessons completed
```

Do not turn progress into a game.

Avoid:

- XP
- Coins
- Leaderboards
- Streaks
- Excessive achievement badges

Progress exists to answer:

> "How far have I gotten?"

not:

> "How can I compete?"

---

# 22. Lesson States

Lessons should have clear visual states.

### Not Started

```text
○ Lesson Title
```

### In Progress

```text
◐ Lesson Title
   63% watched
```

### Completed

```text
✓ Lesson Title
```

Do not rely exclusively on color.

Use icons, text, or other visual indicators as well.

---

# 23. Module States

Modules should similarly communicate progress.

Example:

```text
Introduction
4 / 6 complete
██████████████░░
```

A completed module may show:

```text
✓ Complete
```

---

# 24. Empty States

Empty states should help the learner take the next action.

### No Courses

```text
You haven't created a course yet.

Create a course and start building your learning path.

[ Create Course ]
```

### Empty Module

```text
This module doesn't have any lessons yet.

Find YouTube videos and add them to your module.
```

### No Search Results

```text
No videos found.

Try a different search.
```

Avoid generic:

> "No data available."

Empty states are opportunities for useful guidance.

---

# 25. Loading States

Loading states should preserve layout stability.

Prefer:

- Skeletons
- Inline loading indicators
- Disabled action states

Avoid full-screen loading screens for small operations.

Example:

```text
Search YouTube...

[ loading indicator ]
```

The interface should not jump around when results arrive.

---

# 26. Error States

Errors should explain what happened in plain language.

Example:

```text
We couldn't load YouTube results.

Check your connection and try again.

[ Try Again ]
```

Do not expose technical implementation details to the learner.

---

# 27. Confirmation and Destructive Actions

Actions such as deleting a course or module should require appropriate confirmation.

Example:

```text
Delete Course?

This will remove the course, its modules,
lessons, progress, and notes.

[ Cancel ] [ Delete Course ]
```

Do not make destructive actions easy to trigger accidentally.

---

# 28. Notes

Notes should be lightweight.

A lesson has at most one note.
The note itself is shown read-only on the lesson page; creating and editing happen in a modal dialog with a plain-text textarea.
Deleting the note uses the standard confirm dialog.

They should support learning without becoming a full document editor.

Timestamps written in the note as `[MM:SS]` or `[H:MM:SS]` render as clickable accent chips on the read-only card. Clicking a chip seeks the lesson's YouTube player to that position (`[1:23]` → 83 seconds). The stored note keeps the literal timestamp text.

Example:

```text
Notes

[ Type your notes here... ]
```

Avoid building:

- Rich document editors
- Complex formatting systems
- Collaboration tools
- Document management systems

unless explicitly added to the product requirements later.

---

# 29. Responsive Design

StudyForge must work on:

- Desktop
- Laptop
- Tablet
- Mobile

Responsive behavior should be designed rather than simply shrinking desktop layouts.

---

# 30. Mobile Navigation

On mobile, primary navigation should be compact.

Possible pattern:

```text
┌───────────────────────────────┐
│ StudyForge              ☰     │
└───────────────────────────────┘
```

Navigation should be easy to reach without occupying excessive screen space.

---

# 31. Mobile Course Layout

On mobile:

- Course information stacks vertically.
- Progress remains visible.
- Modules become full-width sections.
- Lesson items remain easy to tap.
- Long descriptions may be collapsed where appropriate.

Avoid horizontal scrolling for primary content.

---

# 32. Mobile YouTube Search

Search results should become vertical cards.

Example:

```text
┌──────────────────────────┐
│                          │
│        Thumbnail         │
│                          │
├──────────────────────────┤
│ Introduction to Real...  │
│ Example Channel          │
│ 14:32                    │
│                          │
│ [ Preview ] [ Add ]      │
└──────────────────────────┘
```

Buttons must have comfortable touch targets.

---

# 33. Mobile Learning Mode

Learning mode should prioritize the video.

Example:

```text
← Back

Lesson 3 of 6

┌──────────────────────┐
│                      │
│    YouTube Player    │
│                      │
└──────────────────────┘

Understanding Property Markets

[ Mark Complete ]

Notes

[....................]

[ Next Lesson → ]
```

Avoid unnecessary sidebars.

---

# 34. Accessibility

Accessibility is part of the design.

Use:

- Semantic HTML
- Proper headings
- Keyboard navigation
- Visible focus states
- Accessible labels
- Sufficient contrast
- Descriptive button text
- Accessible dialogs
- Appropriate ARIA attributes where necessary

Do not use icons without accessible labels when the icon is the only indication of an action.

Do not rely on color alone to communicate state.

---

# 35. Keyboard Interaction

Desktop users should be able to navigate core workflows with a keyboard.

Important interactions should support:

- Tab navigation
- Enter/Space activation
- Escape to close dialogs
- Keyboard-accessible forms
- Keyboard-accessible menus

If drag-and-drop is used, provide a keyboard-accessible alternative where practical.

---

# 36. Animation

Animation should be subtle and functional.

Good uses:

- Dialog opening
- Reordering feedback
- Progress updates
- Loading transitions
- Navigation transitions

Avoid:

- Constant motion
- Decorative animations
- Long transitions
- Distracting effects

The learner's attention belongs to the learning content.

---

# 37. Notifications

Use notifications sparingly.

Appropriate examples:

```text
Video added to module.
Lesson marked complete.
Course created.
```

Avoid excessive toast notifications for routine interactions.

Important information should remain visible in the interface when appropriate.

---

# 38. Design System Components

Reusable components should be created when a pattern occurs more than once or has meaningful interaction logic.

Potential components:

```text
Button
Icon
Breadcrumb
Dialog / Modal
Input
Textarea
Select
Dropdown
Toast
ProgressBar
CourseCard
CourseHeader
ModuleCard
ModuleList
LessonItem
LessonList
YouTubeSearch
YouTubeResult
VideoPreview
LearningPlayer
ContinueLearning
EmptyState
LoadingState
ErrorState
```

Use shadcn/ui components where appropriate rather than recreating standard primitives unnecessarily.

---

# 39. Avoid Component Over-Abstraction

Do not create a component for every `<div>`.

A component should exist because it:

- Represents a meaningful concept
- Is reused
- Contains meaningful behavior
- Improves readability
- Establishes a consistent design pattern

Avoid meaningless abstractions such as:

```text
PageWrapper
ContentWrapper
GenericContainer
UniversalCard
BaseBox
```

unless they provide real value.

---

# 40. Design Consistency

Once a visual pattern is established, reuse it.

For example:

If course progress is represented as:

```text
12 / 16 lessons
████████████░░░░
```

do not represent the same concept differently elsewhere without a clear reason.

Consistency is more important than visual novelty.

---

# 41. Desktop Information Density

Desktop layouts may show more information simultaneously.

However, density should remain controlled.

Prefer:

```text
Course
 ├── Progress
 ├── Continue Learning
 └── Modules
      ├── Lesson
      ├── Lesson
      └── Lesson
```

rather than:

```text
Course
 ├── Statistics
 ├── Analytics
 ├── Activity
 ├── Recommendations
 ├── Achievements
 ├── Recent Videos
 ├── Charts
 └── Miscellaneous
```

StudyForge is a learning tool, not an analytics dashboard.

---

# 42. Course Cards

Course cards should provide useful information.

Example:

```text
Real Estate

Learn the fundamentals of real estate.

12 / 19 lessons
████████████░░░░

Continue Learning →
```

Do not fill course cards with unnecessary metadata.

---

# 43. Course Completion

A completed course should be visually recognizable without turning completion into a celebration-heavy gamification system.

Example:

```text
✓ Completed

Real Estate
19 / 19 lessons
```

A simple completion state is sufficient.

---

# 44. Search Philosophy

Search should feel fast and focused.

The user should be able to:

1. Enter a query.
2. Search.
3. Review results.
4. Preview.
5. Add.

Avoid complex filtering systems in V1 unless the YouTube API workflow genuinely requires them.

---

# 45. Interaction Principle

Every primary action should have an obvious result.

Examples:

```text
Create Course
→ Course appears.

Create Module
→ Module appears.

Add Video
→ Lesson appears.

Mark Complete
→ Progress updates.

Next Lesson
→ Next lesson opens.

Continue Learning
→ Learner resumes where they left off.
```

The application should never leave the learner wondering whether an action worked.

---

# 46. Product Personality

StudyForge should feel like:

> A quiet workspace for building a meaningful learning habit.

It should not feel like:

> A corporate learning management system.

or:

> A social network for courses.

or:

> An AI productivity platform.

The learner and their learning path are the focus.

---

# 47. Design Anti-Patterns

Do not introduce these patterns unless explicitly required:

### Generic SaaS dashboard

```text
Dashboard
Revenue
Users
Analytics
Activity
Reports
```

### Excessive card grids

```text
┌────┐ ┌────┐ ┌────┐ ┌────┐
│    │ │    │ │    │ │    │
└────┘ └────┘ └────┘ └────┘
```

### Excessive gamification

```text
🔥 14 Day Streak
⭐ 4,230 XP
🏆 Level 12
🥇 Top 5%
```

### AI-first interface

```text
✨ Ask AI
✨ Generate Course
✨ Optimize Learning
✨ AI Recommendations
```

These are not part of StudyForge V1.

---

# 48. Design Before Implementation

When implementing a new screen, first determine:

1. What learner problem does this screen solve?
2. What is the primary action?
3. What information is necessary?
4. What information is unnecessary?
5. What happens when there is no data?
6. What happens while loading?
7. What happens when something fails?
8. How does the screen behave on mobile?

Do not implement only the happy path.

---

# 49. Final Design Principle

> **StudyForge should make learning feel organized, not managed.**

Every design decision should support that principle.

---

# 50. Onboarding Page

On first run — when no profile row exists yet — the home page presents a single primary CTA: `Complete this step →`.

That button opens the `/onboarding` page.

Purpose:

- Capture a name for the installation.
- Never imply that the name is a user account, login, or credential.

The onboarding page is minimal:

```text
← Back to StudyForge

Name this installation
helper text

[ input: type your name ]

This name identifies the installation, not the learner; names are entirely local.

[ Complete this step → ]
```

Behavior:

- The back link returns to `/`.
- The input validates a trimmed string of 1–60 characters.
- On submit, the action shows "Saving…" while the server creates the profile and redirects to `/`.
- After success, the header now shows the name as the Profile entry and the home page setup card disappears.
- If a profile already exists, `/onboarding` redirects back to `/`.

The onboarding page is intentionally not a setup wizard or multi-step flow.

---

# 51. Profile Page

Route: `/profile`

Purpose:

- Show the installation name.
- Let the learner rename it via a modal dialog.
- Show derived learning stats.

Layout:

```text
[Name]
Learner profile · all stats are local

[ Edit name ]

Lessons completed
x / y

Worked
x hours y minutes

Days touched
x

Course progress
───────────────────────────
Course title — state — x / y lessons
```

Rules:

- All stats are fully derived from lesson progress; nothing extra is stored.
- Lesson completed totals and worked minutes come from the lessons where `completed = 1`.
- "Worked" sums `youtube_duration` of completed lessons (floor of total seconds in minutes).
- "Days touched" counts distinct UTC calendar dates touched by any progress update.
- Course progress uses the same `deriveProgress` logic the rest of the app uses (see PROGRESS.md).
- The Profile page never initializes a YouTube player.

The name edit opens in a small modal (see Modal component), not a separate page.

The dialog closes automatically after a successful save and also resets any stale validation state when reopened.

```text
Edit name
────────────────
[ input: Learner ]

Cancel   Save Changes
```

Validation and save are handled by a server action.

If no profile exists, `/profile` redirects to `/onboarding`.
