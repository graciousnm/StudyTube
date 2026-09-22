import Link from "next/link";
import { CheckIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Course } from "@/db/schema";
import { progressLabel } from "@/features/progress/progress.calculations";
import type { ProgressSummary } from "@/features/progress/progress.types";

interface CourseCardProps {
  course: Course;
  progress: ProgressSummary;
}

export function CourseCard({ course, progress }: CourseCardProps) {
  return (
    <li className="h-full">
      <Link
        href={`/courses/${course.id}`}
        className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm transition-all hover:border-zinc-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-zinc-100">{course.title}</h3>
          {progress.isComplete ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-success">
              <CheckIcon className="h-4 w-4" />
              Completed
            </span>
          ) : null}
        </div>
        {course.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
            {course.description}
          </p>
        ) : null}
        <div className="mt-auto pt-4">
          <ProgressBar
            percent={progress.percent}
            label={progressLabel(progress)}
          />
          <p className="mt-2 text-sm text-zinc-400">{progressLabel(progress)}</p>
        </div>
      </Link>
    </li>
  );
}