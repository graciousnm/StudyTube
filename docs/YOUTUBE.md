# StudyTube — YouTube Integration

## 1. Purpose

This document defines how StudyTube integrates with YouTube.

YouTube is the content source for V1.

StudyTube does not host, download, proxy, or redistribute YouTube videos.

StudyTube uses YouTube for:

- Searching for educational videos
- Displaying video metadata
- Previewing videos
- Playing videos through the YouTube embedded player
- Tracking learner playback position where technically supported

---

# 2. YouTube Services Used

StudyTube uses two primary YouTube technologies:

```text
YouTube Data API v3
YouTube IFrame Player API
```

They serve different purposes.

### YouTube Data API v3

Used for:

- Searching for videos
- Retrieving video metadata

### YouTube IFrame Player API

Used for:

- Embedded playback
- Playback controls
- Playback state
- Current playback position

Do not use the Data API as a video playback mechanism.

---

# 3. High-Level Architecture

```text
                         StudyTube
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       YouTube Data API             YouTube IFrame API
              │                             │
              ▼                             ▼
       Search / Metadata              Video Playback
              │                             │
              ▼                             ▼
          SQLite                     Progress State
```

---

# 4. YouTube Feature Boundary

All YouTube-specific implementation belongs under:

```text
src/features/youtube/
```

Recommended structure:

```text
src/features/youtube/
├── youtube.api.ts
├── youtube.search.ts
├── youtube.player.ts
├── youtube.types.ts
└── youtube.validation.ts
```

Additional files may be introduced when justified by implementation complexity.

---

# 5. API Key Security

The YouTube Data API key is a server-side secret.

It must never be exposed to browser JavaScript.

Do not place the API key in:

- Client components
- Public environment variables
- HTML
- URLs sent to the browser
- Search result objects returned unnecessarily to the client

The browser communicates with StudyTube.

StudyTube communicates with YouTube.

```text
Browser
   │
   │ search request
   ▼
StudyTube Server
   │
   │ API key
   ▼
YouTube
```

---

# 6. Environment Variable

The YouTube API key should be configured through an environment variable.

Example:

```text
YOUTUBE_API_KEY
```

The exact environment variable name should remain consistent throughout the project.

The key must not be committed to source control.

---

# 7. Self-Hosted API Keys

Each self-hosted StudyTube installation should use its own YouTube API key.

The project should not ship with a shared API key.

Documentation should explain how an administrator/operator obtains and configures a YouTube API key.

---

# 8. YouTube Search

The primary V1 YouTube operation is video search.

User flow:

```text
Module
 ↓
Add YouTube Video
 ↓
Search
 ↓
Search YouTube
 ↓
Display Results
 ↓
Preview
 ↓
Add
```

---

# 9. Search Input

The search interface should accept normal learner search terms.

Examples:

```text
intro to real estate
beginner worship piano
biblical greek alphabet
javascript fundamentals
```

Search terms should be trimmed before sending them to the server.

Empty searches should not be submitted.

---

# 10. Search Validation

The server should validate:

- Search query is present
- Query is within a reasonable length
- Request parameters are valid

Do not allow arbitrary request parameters to be forwarded directly to YouTube.

The server should control which YouTube API options StudyTube supports.

---

# 11. Search Scope

V1 search should focus on videos.

The application should not search:

- Channels
- Playlists
- Live streams as a separate content type
- Shorts as a separate StudyTube feature

unless explicitly required.

The default search should target normal educational video content.

---

# 12. Search Results

StudyTube should normalize YouTube results into its own internal representation.

Example:

```text
YouTubeSearchResult

id
title
channelId
channelName
thumbnailUrl
duration
description
publishedAt
```

The rest of the application should not depend directly on the raw YouTube API response structure.

---

# 13. Search Result Normalization

Raw YouTube API data:

```text
YouTube API
    ↓
YouTube adapter
    ↓
StudyTube Search Result
```

The normalized representation should contain only the fields the UI actually needs.

This protects the application from unnecessary coupling to YouTube's response format.

---

# 14. Search Result Example

Conceptually:

```text
{
  youtubeVideoId: "...",
  title: "Introduction to Real Estate",
  channelName: "Example Channel",
  thumbnailUrl: "...",
  durationSeconds: 742,
  description: "...",
  publishedAt: "..."
}
```

The exact TypeScript type belongs in the YouTube feature.

---

# 15. Search Result Display

A search result should provide enough information for the learner to decide whether to preview it.

Recommended information:

- Thumbnail
- Video title
- Channel name
- Duration
- Preview action
- Add action

Do not overload the result with unnecessary metadata.

---

# 16. Search Pagination

V1 does not need sophisticated infinite scrolling.

The initial implementation should prefer a simple search experience.

If pagination is implemented:

- Keep pagination state explicit.
- Do not fetch large numbers of results unnecessarily.
- Do not automatically exhaust the YouTube search result set.

API quota and learner focus both favor bounded searches.

---

# 17. Search Quota

YouTube Data API usage is quota-based.

Search operations consume substantially more quota than many simple metadata operations.

Therefore:

- Do not search continuously while the learner types.
- Do not issue a request for every keystroke.
- Require an explicit search action or sensible debounce.
- Avoid duplicate requests.
- Avoid unnecessary repeated searches.

The exact quota allocation and current YouTube limits should be verified against Google's current official documentation when deployment documentation is finalized.

---

# 18. Search Debouncing

If search-as-you-type is ever introduced, it must use debouncing.

However, V1 should preferably use:

```text
Enter
```

or:

```text
Search button
```

to initiate the request.

This keeps API usage predictable.

---

# 19. Search Errors

YouTube search can fail for several reasons:

```text
Missing API key
Invalid API key
Quota exceeded
Network failure
YouTube service failure
Invalid request
```

These should be converted into safe application-level errors.

Do not expose raw Google/YouTube API error payloads to the learner.

---

# 20. Search Error UX

The learner should receive a useful message.

Examples:

```text
YouTube search is temporarily unavailable.

YouTube search quota has been reached.

YouTube search is not configured on this StudyTube installation.
```

Avoid displaying:

```text
403 quotaExceeded
```

as the primary user-facing message.

Detailed technical information may be logged server-side.

---

# 21. Preview

Preview allows the learner to watch a YouTube video before adding it to a module.

Flow:

```text
Search Result
 ↓
Preview
 ↓
Embedded YouTube Player
 ↓
Close
```

Preview does not create a lesson.

---

# 22. Preview Does Not Persist Progress

V1 preview playback should not automatically become curriculum progress.

If the learner watches a video in the preview interface:

```text
Preview
```

does not mean:

```text
Lesson started
```

and does not create a lesson.

Only an added lesson participates in StudyTube learning progress.

---

# 23. Preview Player

Preview should use the YouTube IFrame Player API or a standard supported YouTube embed.

The preview player should remain isolated from the lesson-learning player.

Do not accidentally associate preview playback with a lesson that has not yet been created.

---

# 24. Adding a Video

When the learner selects:

```text
Add
```

StudyTube should:

1. Validate the selected YouTube video ID.
2. Verify the target module exists.
3. Check whether the same video already exists in that module.
4. Persist the lesson.
5. Persist the available YouTube metadata.
6. Assign the next curriculum position.
7. Return the updated module/lesson state.

---

# 25. Duplicate Videos

The same YouTube video must not be added twice to the same module.

Constraint:

```text
(module_id, youtube_video_id)
```

must be unique.

Example:

```text
Module:
Real Estate Fundamentals

Video:
Introduction to Property Markets
```

cannot be added twice to that module.

---

# 26. Reusing Videos

The same YouTube video may be used in:

- Different modules
- Different courses

Example:

```text
Course A
 └── Module 1
      └── Video X

Course B
 └── Module 3
      └── Video X
```

This is allowed.

---

# 27. YouTube Video IDs

The YouTube video ID is the canonical external identifier.

StudyTube should not rely on the full URL as the primary identifier.

Supported input forms may include YouTube URLs if a future direct-URL-add feature is introduced.

V1 search results already provide the video ID.

---

# 28. YouTube URLs

When StudyTube needs a watch URL, it should construct it from the stored ID.

Conceptually:

```text
https://www.youtube.com/watch?v={VIDEO_ID}
```

Do not store multiple redundant YouTube URL formats in the database.

---

# 29. Video Availability

A video may become unavailable after being added.

Possible states include:

```text
Available
Private
Deleted
Region restricted
Embedding restricted
```

StudyTube should not automatically delete the lesson.

The learner's curriculum remains intact.

---

# 30. Unavailable Videos

If playback fails because the external video is unavailable:

- Preserve the lesson.
- Preserve its notes.
- Preserve its completion state.
- Preserve its curriculum position.
- Tell the learner the video is unavailable.

The learner can then remove or replace the lesson manually.

---

# 31. Metadata Staleness

Stored YouTube metadata may become stale.

Examples:

- Title changes
- Description changes
- Channel information changes
- Thumbnail changes

V1 does not require continuous synchronization.

The stored metadata represents the information available when the lesson was added.

---

# 32. Metadata Refresh

A future version may support refreshing YouTube metadata.

V1 does not require:

```text
Scheduled metadata synchronization
Background metadata workers
Automatic polling
```

Do not introduce them prematurely.

---

# 33. YouTube Player Architecture

The learning player is a client-side component.

Conceptually:

```text
Learning Page
     │
     ▼
YouTube Player Component
     │
     ▼
YouTube IFrame Player API
     │
     ├── play
     ├── pause
     ├── seek
     ├── current time
     └── state changes
```

The player should communicate playback information to the progress feature.

The player exposes an imperative seek handle. Timestamped notes on the lesson page use it to jump the video to the note's timestamp when clicked. Only one player exists per learning page, so the seek handle always targets the active lesson video.

---

# 34. Player Does Not Own Progress Rules

The player knows about playback.

The progress feature knows about learning progress.

For example:

```text
Player:
"Current position is 512 seconds."

Progress:
"Persist 512 seconds."

Progress:
"Lesson is still incomplete."
```

Do not place completion business logic directly inside the player component.

---

# 35. Playback Position Persistence

StudyTube should persist playback position periodically rather than writing to SQLite every second.

The exact interval should be selected during implementation based on:

- Reliability
- User experience
- Database write frequency
- Browser behavior

The system should also attempt to save important final state when playback pauses or the learner leaves the lesson.

---

# 36. Playback Position Accuracy

Playback position is approximate.

The purpose is:

```text
Resume where the learner left off.
```

It is not intended to be:

```text
Precise analytics
```

The application should not attempt to record every second of playback.

---

# 37. Completion

Completion is explicit.

The primary V1 interaction is:

```text
Mark as Complete
```

When activated:

```text
completed = true
completed_at = current timestamp
```

---

# 38. Uncomplete

If the learner chooses to undo completion:

```text
completed = false
completed_at = null
```

The saved playback position should normally remain intact.

This allows the learner to continue from where they left off.

---

# 39. Automatic Completion

V1 should not automatically mark a lesson complete solely because the video reaches its end.

This avoids surprising behavior and keeps completion under learner control.

If automatic completion is considered later, it should be a deliberate product decision.

---

# 40. Playback State

The player may report states such as:

```text
Unstarted
Playing
Paused
Ended
Buffering
Cued
```

StudyTube only needs the states necessary for its user experience and progress persistence.

Do not build a full analytics state machine.

---

# 41. Player Loading

The YouTube player should load only when needed.

Examples:

- Learning page
- Preview dialog

Do not initialize YouTube players for every lesson card on a course page.

This reduces unnecessary browser work and external requests.

---

# 42. Multiple Players

Avoid having many active YouTube players simultaneously.

A module page with 20 lessons should not create 20 embedded players.

Use:

```text
Preview one selected video
```

or:

```text
Learning one current lesson
```

---

# 43. Course Page Behavior

The course page should not load the YouTube player.

It should display curriculum information.

Example:

```text
Course
 ├── Module
 │    ├── Lesson
 │    ├── Lesson
 │    └── Lesson
 └── Module
```

Video playback belongs to Preview or Learning Mode.

---

# 44. Module Page Behavior

The module page may display:

- Lesson thumbnail
- Lesson title
- Channel
- Duration
- Completion state
- Preview action

It should not embed every video.

---

# 45. Learning Page Behavior

The learning page should:

1. Load the current lesson.
2. Load progress.
3. Initialize the YouTube player.
4. Resume playback where available.
5. Persist playback position.
6. Display completion state.
7. Provide notes.
8. Provide previous/next navigation.

---

# 46. Resume Behavior

When opening a lesson:

```text
saved position = 0
→ start from beginning
```

When a saved position exists:

```text
saved position = 512
→ seek to approximately 512 seconds
```

If the lesson is already complete, the application may still resume from the stored position rather than unexpectedly resetting it.

---

# 47. Invalid Saved Position

If stored playback position is invalid:

```text
position < 0
```

or exceeds the known duration, the application should clamp it safely.

Example:

```text
duration = 600
position = 900

→ seek to 600 or an appropriate safe position
```

Never pass invalid values directly to the player.

---

# 48. Deleted or Changed Videos

A YouTube video may disappear after being added.

StudyTube must not interpret external disappearance as a database deletion request.

The lesson remains:

```text
Course
 → Module
   → Lesson
```

until the learner explicitly removes it.

---

# 49. Replacing a Video

V1 does not require a dedicated "replace video" operation.

The learner
