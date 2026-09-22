import type { Course, Lesson, LessonProgress, Module } from "@/db/schema";

export type LessonState = "not_started" | "in_progress" | "completed";

export interface ProgressSummary {
  completed: number;
  total: number;
  isEmpty: boolean;
  isComplete: boolean;
  percent: number | null;
}

export interface ContinueLearning {
  course: Course;
  module: Module;
  lesson: Lesson;
  progress: LessonProgress | null;
  started: boolean;
}

export interface ProgressActionState {
  error?: string;
  success?: boolean;
}