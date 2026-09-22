import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/progress-bar";
import { learningPath } from "@/features/learning/learning.paths";
import { progressLabel } from "@/features/progress/progress.calculations";
import type {
  ContinueLearning,
  ProgressSummary,
} from "@/features/progress/progress.types";

interface ContinueLearningCardProps {
  item: ContinueLearning;
  progress: ProgressSummary;
}

export function ContinueLearningCard({
  item,
  progress,
}: ContinueLearningCardProps) {
  const lessonTitle =
    item.lesson.youtube_title ?? item.lesson.youtube_video_id;

  return (
    <section className="rounded-xl border border-brand/30 bg-brand-soft p-6 shadow-sm">
      <div className="min-w-0 space-y-1">
        <span className="inline-flex items-center rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-brand">
          {item.started ? "Continue Learning" : "Start Learning"}
        </span>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">
          {item.course.title}
        </h2>
      </div>
      <p className="mt-2 whitespace-pre-line text-zinc-300">
        {item.module.title} · {lessonTitle}
      </p>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0 max-w-xl">
          <div className="flex items-center justify-between gap-4 text-xs font-medium text-zinc-400">
            <span>Progress</span>
            <span className="text-zinc-300">{progressLabel(progress)}</span>
          </div>
          <ProgressBar
            percent={progress.percent}
            label={progressLabel(progress)}
            className="mt-2 h-1.5"
          />
          <Link
            href={learningPath(item.course.id, item.module.id, item.lesson.id)}
            className={`${buttonVariants({ variant: "primary" })} mt-4`}
          >
            {item.started ? "Continue Learning" : "Start Learning"}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}