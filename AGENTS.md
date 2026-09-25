<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# StudyForge — Agent Guidelines

> Build your own learning path. Learner turns scattered YouTube videos into structured, trackable courses.

## Current repo state

- **Docs are the authoritative spec.** `docs/` and `DESIGN.md` (repo root, not `/docs`) define the product, architecture, data model, progress rules, YouTube integration, testing, security, and deployment. When implementing a feature, the owning doc **is** the definition of done. Do not invent behavior the docs do not specify.
- The app (`src/`) implements that spec. Major domain rules live in the docs — read them before writing feature code.

## Non-negotiable constraints

- **No AI mutation without explicit learner review.** AI is assistive only: it proposes, the learner reviews and decides. **No authentication/accounts** in V1 (no login, sessions, user tables, or `userId`/`owner` fields anywhere).
- **Not a generic SaaS**: no billing, subscriptions, orgs, teams, admin dashboards, analytics, user management. **No gamification** (XP, streaks, leaderboards, badges).
- Learner-first, not an instructor LMS. Never invent features; if a requirement is ambiguous, flag it and choose the simplest behavior consistent with the docs.

## Domain invariants (do not break)

- Hierarchy: `Course → Module → Lesson → YouTube video`. A lesson = one YouTube video.
- Store YouTube **metadata + `youtube_video_id` only**, never URLs; never download/host video content.
- **Watched ≠ Completed.** Playback position never auto-completes a lesson. Uncompleting clears `completed_at`, preserves `playback_position_seconds`.
- Course/module % is **derived** (`completed / total`), never stored; one centralized deterministic implementation. `0/0` → empty state, never `NaN`/`Infinity`.
- Ordering is explicit, persisted `position` scoped to parent; never insertion/alphabetical/timestamp order.
- Continue Learning: most recently interacted-with incomplete lesson → else first incomplete in curriculum order → else none.
- Same YouTube video can't be added twice to one module; reuse across modules/courses is allowed.
- Video becoming unavailable/deleted on YouTube must **not** delete its lesson.
- Course/module pages must **not** initialize YouTube players; one player at a time (preview or learning mode).
- Browser never touches SQLite or `YOUTUBE_API_KEY`. Validate all server-boundary input (Zod). No new dependencies without justification (no Redux, no React Hook Form by default, no Redis, no background jobs, no microservices).

## Workflow

1. Read the owning doc for the feature before editing.
2. Smallest change inside the owning feature boundary (`src/features/<feature>/`; all YouTube code in `src/features/youtube/`).
3. Validate: typecheck → lint → unit/integration tests → build → relevant Playwright workflows.
4. Update affected docs when behavior, schema, or architecture changes; never let code and docs silently diverge.
