import { asc, desc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { lessons, type Lesson } from "@/db/schema";
import type { LessonCreateInput, MoveDirection } from "./lesson.types";

export function createLesson(
  db: Db,
  moduleId: number,
  input: LessonCreateInput,
): Lesson {
  return db.transaction((tx) => {
    const last = tx
      .select({ position: lessons.position })
      .from(lessons)
      .where(eq(lessons.module_id, moduleId))
      .orderBy(desc(lessons.position))
      .limit(1)
      .get();

    return tx
      .insert(lessons)
      .values({
        module_id: moduleId,
        position: (last?.position ?? 0) + 1,
        ...input,
      })
      .returning()
      .get();
  });
}

export function deleteLesson(db: Db, lessonId: number): boolean {
  const existing = db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .get();
  if (!existing) {
    return false;
  }
  db.delete(lessons).where(eq(lessons.id, lessonId)).run();
  return true;
}

export function moveLesson(
  db: Db,
  lessonId: number,
  direction: MoveDirection,
): boolean {
  const target = db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .get();
  if (!target) {
    return false;
  }

  const siblings = db
    .select()
    .from(lessons)
    .where(eq(lessons.module_id, target.module_id))
    .orderBy(asc(lessons.position))
    .all();

  const index = siblings.findIndex((sibling) => sibling.id === lessonId);
  const neighbourIndex = direction === "up" ? index - 1 : index + 1;
  if (neighbourIndex < 0 || neighbourIndex >= siblings.length) {
    return false;
  }

  const neighbour = siblings[neighbourIndex];

  db.transaction((tx) => {
    tx.update(lessons)
      .set({ position: 0 })
      .where(eq(lessons.id, target.id))
      .run();
    tx.update(lessons)
      .set({ position: target.position })
      .where(eq(lessons.id, neighbour.id))
      .run();
    tx.update(lessons)
      .set({ position: neighbour.position })
      .where(eq(lessons.id, target.id))
      .run();
  });

  return true;
}

export function reorderLessons(
  db: Db,
  moduleId: number,
  orderedIds: number[],
): void {
  db.transaction((tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      tx.update(lessons)
        .set({ position: i + 1 })
        .where(eq(lessons.id, orderedIds[i]))
        .run();
    }
  });
}
