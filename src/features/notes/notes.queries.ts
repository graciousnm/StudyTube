import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { notes, type Note } from "@/db/schema";

export function getNoteByLesson(db: Db, lessonId: number): Note | undefined {
  return db.select().from(notes).where(eq(notes.lesson_id, lessonId)).get();
}