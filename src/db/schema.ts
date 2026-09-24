import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
} as const;

export const courses = sqliteTable(
  "courses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    goal: text("goal"),
    ...timestamps,
  },
  () => [],
);

export const modules = sqliteTable(
  "modules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    course_id: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    position: integer("position").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("modules_course_position_uq").on(table.course_id, table.position),
    index("modules_course_id_idx").on(table.course_id),
  ],
);

export const lessons = sqliteTable(
  "lessons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    module_id: integer("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    youtube_video_id: text("youtube_video_id").notNull(),
    youtube_title: text("youtube_title"),
    youtube_channel_id: text("youtube_channel_id"),
    youtube_channel_name: text("youtube_channel_name"),
    youtube_thumbnail_url: text("youtube_thumbnail_url"),
    youtube_duration: integer("youtube_duration"),
    youtube_description: text("youtube_description"),
    youtube_published_at: integer("youtube_published_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("lessons_module_position_uq").on(table.module_id, table.position),
    uniqueIndex("lessons_module_video_uq").on(
      table.module_id,
      table.youtube_video_id,
    ),
    index("lessons_module_id_idx").on(table.module_id),
  ],
);

export const lessonProgress = sqliteTable(
  "lesson_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    lesson_id: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    playback_position_seconds: integer("playback_position_seconds")
      .notNull()
      .default(0),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    completed_at: integer("completed_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("lesson_progress_lesson_id_uq").on(table.lesson_id),
    index("lesson_progress_lesson_id_idx").on(table.lesson_id),
  ],
);

export const notes = sqliteTable(
  "notes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    lesson_id: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("notes_lesson_id_uq").on(table.lesson_id)],
);

export const profile = sqliteTable("profile", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ...timestamps,
});

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.course_id], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  module: one(modules, { fields: [lessons.module_id], references: [modules.id] }),
  progress: one(lessonProgress, {
    fields: [lessons.id],
    references: [lessonProgress.lesson_id],
  }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonProgress.lesson_id],
    references: [lessons.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  lesson: one(lessons, { fields: [notes.lesson_id], references: [lessons.id] }),
}));

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type NewLessonProgress = typeof lessonProgress.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;