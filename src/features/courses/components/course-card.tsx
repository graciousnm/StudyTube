import Link from "next/link";
import Image from "next/image";
import { CheckIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Course } from "@/db/schema";
import { progressLabel } from "@/features/progress/progress.calculations";
import type { ProgressSummary } from "@/features/progress/progress.types";

interface CourseCardProps {
  course: Course;
  progress: ProgressSummary;
  thumbnailUrl?: string | null;
}

export function CourseCard({ course, progress, thumbnailUrl }: CourseCardProps) {
  return (
    <li className="h-full">
      <Link
        href={`/courses/${course.id}`}
        className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm transition-all hover:border-zinc-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 overflow-hidden"
      >
        {thumbnailUrl ? (
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-gradient-to-br from-brand/20 to-zinc-800" />
        )}
        <div className="flex flex-1 flex-col p-5">
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
        </div>
      </Link>
    </li>
  );
}