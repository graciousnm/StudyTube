import { asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { courses, type Course } from "@/db/schema";

export function listCourses(db: Db): Course[] {
  return db.select().from(courses).orderBy(asc(courses.created_at)).all();
}

export function getCourseById(db: Db, id: number): Course | undefined {
  return db.select().from(courses).where(eq(courses.id, id)).get();
}