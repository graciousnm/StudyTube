import Link from "next/link";
import { CheckIcon, PlayIcon } from "@/components/ui/icons";
import { buttonVariants } from "@/components/ui/button";
import type { ProgressSummary } from "@/features/progress/progress.types";
import { progressLabel } from "@/features/progress/progress.calculations";

interface CourseCompleteCardProps {
  courseTitle: string;
  courseProgress: ProgressSummary;
  moduleCount: number;
}

export function CourseCompleteCard({
  courseTitle,
  courseProgress,
  moduleCount,
}: CourseCompleteCardProps) {
  return (
    <div className="rounded-xl border border-success/30 bg-success/5 p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-success text-zinc-950">
          <CheckIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            Course Complete
          </h2>
          <p className="text-sm text-zinc-400">
            {courseTitle} · {moduleCount} modules · {progressLabel(courseProgress)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Link
          href="/"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Continue Learning
          <PlayIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
