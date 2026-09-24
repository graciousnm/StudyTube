import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import {
  courses,
  lessons,
  modules,
  type Course,
  type Module,
} from "@/db/schema";
import type { CourseInput } from "./course.types";
import type { ImportedModule } from "./course.validation";

export function createCourse(db: Db, input: CourseInput): Course {
  return db.insert(courses).values(input).returning().get();
}

export function updateCourse(
  db: Db,
  id: number,
  input: CourseInput,
): Course | undefined {
  const existing = db.select().from(courses).where(eq(courses.id, id)).get();
  if (!existing) {
    return undefined;
  }
  return db.update(courses).set(input).where(eq(courses.id, id)).returning().get();
}

export function deleteCourse(db: Db, id: number): boolean {
  const existing = db.select().from(courses).where(eq(courses.id, id)).get();
  if (!existing) {
    return false;
  }
  db.delete(courses).where(eq(courses.id, id)).run();
  return true;
}

export function createCourseWithModules(
  db: Db,
  input: {
    title: string;
    description: string;
    modules: { title: string; description: string }[];
  },
): { course: Course; modules: Module[] } {
  return db.transaction((tx) => {
    const course = tx
      .insert(courses)
      .values({ title: input.title, description: input.description })
      .returning()
      .get();

    const createdModules: Module[] = [];
    for (let i = 0; i < input.modules.length; i++) {
      const mod = tx
        .insert(modules)
        .values({
          course_id: course.id,
          title: input.modules[i].title,
          description: input.modules[i].description,
          position: i + 1,
        })
        .returning()
        .get();
      createdModules.push(mod);
    }

    return { course, modules: createdModules };
  });
}

export function createCourseWithModulesAndLessons(
  db: Db,
  input: CourseInput & { modules: ImportedModule[] },
): {
  course: Course;
  modules: Module[];
  lessonCount: number;
  skippedDuplicates: number;
} {
  return db.transaction((tx) => {
    const course = tx
      .insert(courses)
      .values({
        title: input.title,
        description: input.description,
        goal: input.goal,
      })
      .returning()
      .get();

    let lessonCount = 0;
    let skippedDuplicates = 0;
    const createdModules: Module[] = [];

    for (let i = 0; i < input.modules.length; i++) {
      const mod = tx
        .insert(modules)
        .values({
          course_id: course.id,
          title: input.modules[i].title,
          description: input.modules[i].description,
          position: i + 1,
        })
        .returning()
        .get();
      createdModules.push(mod);

      const seen = new Set<string>();
      let position = 1;
      for (const lesson of input.modules[i].lessons) {
        if (seen.has(lesson.youtubeVideoId)) {
          skippedDuplicates++;
          continue;
        }
        seen.add(lesson.youtubeVideoId);
        tx.insert(lessons)
          .values({
            module_id: mod.id,
            position,
            youtube_video_id: lesson.youtubeVideoId,
            youtube_title: lesson.title ?? null,
            youtube_channel_id: lesson.channelId ?? null,
            youtube_channel_name: lesson.channelName ?? null,
            youtube_thumbnail_url: lesson.thumbnailUrl ?? null,
            youtube_duration: lesson.durationSeconds ?? null,
            youtube_description: lesson.description ?? null,
            youtube_published_at: lesson.publishedAt
              ? new Date(lesson.publishedAt)
              : null,
          })
          .run();
        position++;
        lessonCount++;
      }
    }

    return { course, modules: createdModules, lessonCount, skippedDuplicates };
  });
}