import type { Course, Lesson, Module } from "@/db/schema";

export interface LessonNeighbour {
  courseId: number;
  moduleId: number;
  lessonId: number;
  title: string;
}

export interface LearningContext {
  course: Course;
  module: Module;
  lesson: Lesson;
  lessonNumber: number;
  lessonCount: number;
  previous?: LessonNeighbour;
  next?: LessonNeighbour;
}