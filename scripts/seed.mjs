import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const force = process.argv.includes("--force");

const envPath = path.resolve(".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const databaseUrl = process.env.DATABASE_URL ?? "./data/learning.sqlite";
const databasePath = path.resolve(databaseUrl);
mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const COURSE = {
  title: "Worship Piano",
  description:
    "Go from your first chord to playing full worship songs with confidence.",
};

const MODULES = [
  {
    title: "Foundations",
    description:
      "Get comfortable at the keyboard: the C scale, simple chords, and the 1-4-5-6 pattern behind most worship songs.",
    lessons: [
      {
        videoId: "Z03pBerFfoo",
        title: "5 Days To Learning Worship Piano (EASY Lessons For Beginners)",
        channel: "Garrett Johnson",
        duration: 1740,
      },
      {
        videoId: "SJPedNAtPOs",
        title: "Here I Am to Worship | Key of C | Beginner Piano Tutorial",
        channel: "Piano Meditation Worship Tutorials",
        duration: 517,
        publishedAt: Date.UTC(2023, 1, 13),
      },
      {
        videoId: "OPhH_Jku4KY",
        title:
          "How to Play Worship Piano That Sounds Professional (Beginner Friendly)",
        channel: "Church Piano Tutorials with Jonathan Hudson",
        duration: 1160,
        publishedAt: Date.UTC(2025, 8, 18),
      },
      {
        videoId: "Ohgtg4jmo00",
        title: "How to Play Introductions for Worship | EASY Worship Piano Tutorial",
        channel: "Adoration Music Academy",
        duration: 602,
      },
      {
        videoId: "t7oYtETjl1U",
        title: "Worship Piano Tutorial | 1 Easy Trick To Sound Like A Pro",
        channel: "Worship Music Academy",
        duration: 428,
      },
    ],
  },
  {
    title: "Chords, Flow & Dynamics",
    description:
      "Make simple chords sound rich and full with inversions, arpeggios, and dynamics that follow the song.",
    lessons: [
      {
        videoId: "J68H7OWKEoQ",
        title: "How To Flow | Worship Piano Chords for Beginners | Gospel",
        channel: "PrettySimpleMusic",
        duration: 903,
      },
      {
        videoId: "clBe7yuYsok",
        title:
          "This Worship Piano Tutorial Will Transform Your Playing in 12 Minutes",
        channel: "giftedkeys Elijah",
        duration: 725,
        publishedAt: Date.UTC(2026, 4, 18),
      },
      {
        videoId: "iwQPXUyoq7s",
        title:
          "Beginner's Guide To Playing Worship Piano (Dynamics, Builds & Tools)",
        channel: "Garrett Johnson",
        duration: 588,
        publishedAt: Date.UTC(2024, 6, 9),
      },
    ],
  },
  {
    title: "Play Through Songs",
    description:
      "Apply everything you have learned to complete song tutorials in the key of C.",
    lessons: [
      {
        videoId: "HhwTMKTNI7U",
        title: "What A Beautiful Name - Hillsong Worship (Key of C) Easy Piano",
        channel: "Simplified Piano",
        duration: 334,
      },
      {
        videoId: "mXvhSQgDmHg",
        title:
          "Hillsong Worship - What A Beautiful Name | EASY Christian Piano Tutorial",
        channel: "Hillsong Worship Lessons",
        duration: 612,
      },
    ],
  },
];

function countCourses() {
  return db.prepare("select count(*) as count from courses").get().count;
}

function wipe() {
  db.prepare("delete from courses").run();
}

function thumbnailUrl(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

const insertCourse = db.prepare(
  "insert into courses (title, description, created_at, updated_at) values (?, ?, ?, ?)",
);
const insertModule = db.prepare(
  "insert into modules (course_id, title, description, position, created_at, updated_at) values (?, ?, ?, ?, ?, ?)",
);
const insertLesson = db.prepare(
  `insert into lessons (
     module_id, position, youtube_video_id, youtube_title, youtube_channel_id,
     youtube_channel_name, youtube_thumbnail_url, youtube_duration,
     youtube_description, youtube_published_at, created_at, updated_at
   ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const insertProgress = db.prepare(
  `insert into lesson_progress (
     lesson_id, playback_position_seconds, completed, completed_at, created_at, updated_at
   ) values (?, ?, ?, ?, ?, ?)`,
);
const insertNote = db.prepare(
  "insert into notes (lesson_id, content, created_at, updated_at) values (?, ?, ?, ?)",
);
const upsertProfile = db.prepare(
  `insert into profile (id, name, created_at, updated_at) values (1, ?, ?, ?)
   on conflict(id) do update set name = excluded.name, updated_at = excluded.updated_at`,
);

function seed() {
  const now = Date.now();
  const run = db.transaction(() => {
    const courseId = Number(
      insertCourse.run(COURSE.title, COURSE.description, now, now)
        .lastInsertRowid,
    );

    let firstLessonId;
    let secondLessonId;
    let secondDuration = 0;

    MODULES.forEach((module, moduleIndex) => {
      const moduleId = Number(
        insertModule.run(
          courseId,
          module.title,
          module.description,
          moduleIndex + 1,
          now,
          now,
        ).lastInsertRowid,
      );

      module.lessons.forEach((lesson, lessonIndex) => {
        const lessonId = Number(
          insertLesson.run(
            moduleId,
            lessonIndex + 1,
            lesson.videoId,
            lesson.title,
            null,
            lesson.channel,
            thumbnailUrl(lesson.videoId),
            lesson.duration,
            null,
            lesson.publishedAt ?? null,
            now,
            now,
          ).lastInsertRowid,
        );
        if (moduleIndex === 0 && lessonIndex === 0) {
          firstLessonId = lessonId;
        }
        if (moduleIndex === 0 && lessonIndex === 1) {
          secondLessonId = lessonId;
          secondDuration = lesson.duration;
        }
      });
    });

    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
    const anHourAgo = now - 60 * 60 * 1000;

    insertProgress.run(firstLessonId, 0, 1, twoDaysAgo, twoDaysAgo, twoDaysAgo);
    insertProgress.run(
      secondLessonId,
      Math.round(secondDuration * 0.35),
      0,
      null,
      anHourAgo,
      anHourAgo,
    );

    insertNote.run(
      secondLessonId,
      "Keep the left hand light and let the melody sing. Practice the 1-4-5-6 progression slowly before speeding up.",
      anHourAgo,
      anHourAgo,
    );

    const lessonCount = MODULES.reduce(
      (total, module) => total + module.lessons.length,
      0,
    );
    return { courseId, lessonCount };
  });

  return run();
}

if (countCourses() > 0 && !force) {
  console.log(
    `Database already has ${countCourses()} course(s). Re-run with --force to replace them.`,
  );
  const now = Date.now();
  upsertProfile.run("Learner", now, now);
  db.close();
  process.exit(0);
}

if (force) {
  wipe();
}

const { courseId, lessonCount } = seed();
db.close();

console.log(`Seeded "Worship Piano" (course ${courseId}) with ${MODULES.length} modules and ${lessonCount} lessons.`);
console.log(`Database: ${databasePath}`);
console.log(
  "Lesson 1 is marked complete; lesson 2 has a saved playback position and a demo note.",
);
console.log('The installation is named "Learner" (local profile row).');