import type { ProgressSummary } from "@/features/progress/progress.types";

export interface ProfileActionState {
  error?: string;
  fieldErrors?: {
    name?: string[];
  };
  ok?: boolean;
}

export type CourseState = "completed" | "in_progress" | "not_started";

export interface CourseProgressEntry {
  courseId: number;
  title: string;
  state: CourseState;
  progress: ProgressSummary;
}

export interface LearnerStats {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  notStartedLessons: number;
  percent: number | null;
  overallComplete: boolean;
  workedMinutes: number;
  daysTouched: number;
  courseEntries: CourseProgressEntry[];
  mostInProgress: CourseProgressEntry | undefined;
  mostCurrent:
    | {
        courseId: number;
        title: string;
      }
    | undefined;
}