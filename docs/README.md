# StudyForge

> **Build your own learning path.**

StudyForge is an open-source, self-hosted web app that helps learners turn scattered YouTube videos into structured learning paths.

Create courses, organize modules, add YouTube videos as lessons, track progress, take notes, and resume where you left off.

## Features

- Create courses and modules
- Search YouTube
- Preview videos
- Add videos as lessons
- Reorder lessons
- Learn through an embedded YouTube player
- Save playback position
- Mark lessons complete
- Track course progress
- Resume learning
- Take lesson notes
- Responsive interface

## How It Works

```text
Course
└── Module
    └── Lesson
        └── YouTube Video
```

Typical workflow:

```text
Create Course
→ Create Module
→ Search YouTube
→ Add Lessons
→ Organize
→ Learn
→ Track Progress
```

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- SQLite
- Drizzle ORM
- Zod
- YouTube Data API v3
- YouTube IFrame Player API
- Vitest
- Playwright
- pnpm
- Docker

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Configure:

```env
DATABASE_URL=/data/learning.sqlite
YOUTUBE_API_KEY=your-api-key
```

### 3. Start development

```bash
pnpm dev
```

## YouTube API

StudyForge uses the YouTube Data API v3 for searching videos and retrieving metadata.

Each self-hosted installation uses its own YouTube API key.

The API key must remain server-side and should never be committed to Git.

## Deployment

StudyForge runs as a single web application with SQLite persistence.

Docker and platforms such as Coolify are supported.

Make sure the SQLite database is stored on persistent storage.

Optional Cloudflare R2 backups can be configured separately.

## Testing

```bash
pnpm test
pnpm test:e2e
```

## V1 Scope

StudyForge is intentionally focused on the learner experience.

V1 does **not** include:

- User accounts
- AI
- Social features
- Instructor dashboards
- Billing
- Video hosting
- Certificates
- Quizzes or grading

## Documentation

For more information, see:

- `PRODUCT.md` — Product requirements
- `ARCHITECTURE.md` — Application architecture
- `DATA_MODEL.md` — Database design
- `DESIGN.md` — UI/UX
- `YOUTUBE.md` — YouTube integration
- `PROGRESS.md` — Progress system
- `TESTING.md` — Testing
- `DEPLOYMENT.md` — Deployment
- `SECURITY.md` — Security
- `AGENTS.md` — Engineering guidelines

## License

StudyForge is released under the **MIT License**.
