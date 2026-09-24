import { and, asc, desc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { modules, type Module } from "@/db/schema";
import type { ModuleInput, MoveDirection } from "./module.types";

export function createModule(
  db: Db,
  courseId: number,
  input: ModuleInput,
): Module {
  return db.transaction((tx) => {
    const last = tx
      .select({ position: modules.position })
      .from(modules)
      .where(eq(modules.course_id, courseId))
      .orderBy(desc(modules.position))
      .limit(1)
      .get();

    return tx
      .insert(modules)
      .values({
        course_id: courseId,
        title: input.title,
        description: input.description,
        position: (last?.position ?? 0) + 1,
      })
      .returning()
      .get();
  });
}

export function updateModule(
  db: Db,
  moduleId: number,
  input: ModuleInput,
): Module | undefined {
  const existing = db
    .select()
    .from(modules)
    .where(eq(modules.id, moduleId))
    .get();
  if (!existing) {
    return undefined;
  }
  return db
    .update(modules)
    .set({ title: input.title, description: input.description })
    .where(eq(modules.id, moduleId))
    .returning()
    .get();
}

export function deleteModule(db: Db, moduleId: number): boolean {
  const existing = db
    .select()
    .from(modules)
    .where(eq(modules.id, moduleId))
    .get();
  if (!existing) {
    return false;
  }
  db.delete(modules).where(eq(modules.id, moduleId)).run();
  return true;
}

export function moveModule(
  db: Db,
  moduleId: number,
  direction: MoveDirection,
): boolean {
  const target = db
    .select()
    .from(modules)
    .where(eq(modules.id, moduleId))
    .get();
  if (!target) {
    return false;
  }

  const siblings = db
    .select()
    .from(modules)
    .where(eq(modules.course_id, target.course_id))
    .orderBy(asc(modules.position))
    .all();

  const index = siblings.findIndex((sibling) => sibling.id === moduleId);
  const neighbourIndex = direction === "up" ? index - 1 : index + 1;
  if (neighbourIndex < 0 || neighbourIndex >= siblings.length) {
    return false;
  }

  const neighbour = siblings[neighbourIndex];

  db.transaction((tx) => {
    tx.update(modules)
      .set({ position: 0 })
      .where(eq(modules.id, target.id))
      .run();
    tx.update(modules)
      .set({ position: target.position })
      .where(eq(modules.id, neighbour.id))
      .run();
    tx.update(modules)
      .set({ position: neighbour.position })
      .where(eq(modules.id, target.id))
      .run();
  });

  return true;
}

export function reorderModules(
  db: Db,
  courseId: number,
  orderedIds: number[],
): void {
  db.transaction((tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      tx.update(modules)
        .set({ position: -(i + 1) })
        .where(
          and(
            eq(modules.id, orderedIds[i]),
            eq(modules.course_id, courseId),
          ),
        )
        .run();
    }
    for (let i = 0; i < orderedIds.length; i++) {
      tx.update(modules)
        .set({ position: i + 1 })
        .where(
          and(
            eq(modules.id, orderedIds[i]),
            eq(modules.course_id, courseId),
          ),
        )
        .run();
    }
  });
}
