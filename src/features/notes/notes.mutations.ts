import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { notes, type Note } from "@/db/schema";

export function saveNote(db: Db, lessonId: number, content: string): Note {
  const now = new Date();
  return db
    .insert(notes)
    .values({ lesson_id: lessonId, content, created_at: now, updated_at: now })
    .onConflictDoUpdate({
      target: notes.lesson_id,
      set: { content, updated_at: now },
    })
    .returning()
    .get();
}

export function deleteNote(db: Db, lessonId: number): boolean {
  const result = db.delete(notes).where(eq(notes.lesson_id, lessonId)).run();
  return result.changes > 0;
}