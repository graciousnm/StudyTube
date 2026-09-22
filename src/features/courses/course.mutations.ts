import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { courses, modules, type Course, type Module } from "@/db/schema";
import type { CourseInput } from "./course.types";

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