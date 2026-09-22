"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BookOpenIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { progressLabel } from "@/features/progress/progress.calculations";
import type { CourseState, LearnerStats } from "@/features/profile/profile.types";

interface LearnerStatsPanelProps {
  stats: LearnerStats;
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-100">
        {value}
      </p>
      {detail ? <p className="mt-1 text-sm text-zinc-400">{detail}</p> : null}
    </div>
  );
}

function CourseStateChip({ state }: { state: LearnerStats["courseEntries"][number]["state"] }) {
  const classes: Record<LearnerStats["courseEntries"][number]["state"], string> = {
    completed: "text-success",
    in_progress: "text-brand",
    not_started: "text-zinc-500",
  };
  const labels: Record<LearnerStats["courseEntries"][number]["state"], string> = {
    completed: "Completed",
    in_progress: "In progress",
    not_started: "Not started",
  };
  return (
    <span className={`text-sm font-medium ${classes[state]}`}>{labels[state]}</span>
  );
}

type FilterState = "all" | CourseState;

const tabs: { key: FilterState; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "not_started", label: "Not Started" },
];

export function LearnerStatsPanel({ stats }: LearnerStatsPanelProps) {
  const [filter, setFilter] = useState<FilterState>("all");

  const filteredEntries = useMemo(() => {
    if (filter === "all") return stats.courseEntries;
    return stats.courseEntries.filter((entry) => entry.state === filter);
  }, [stats.courseEntries, filter]);
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Lessons completed"
          value={`${stats.completedLessons} / ${stats.totalLessons}`}
          detail={stats.percent === null ? "No lessons yet" : `${stats.percent}% overall`}
        />
        <StatCard label="Worked" value={`${stats.workedMinutes} mins`} />
        <StatCard label="Days touched" value={`${stats.daysTouched}`} />
      </div>

      <div className="max-w-xl space-y-2">
        <p className="text-sm font-medium text-zinc-200">
          Overall progress
        </p>
        <ProgressBar
          percent={stats.percent}
          label={`${stats.completedLessons} / ${stats.totalLessons} lessons complete`}
        />
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
            {stats.completedLessons} completed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-brand" />
            {stats.inProgressLessons} in progress
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-zinc-600" />
            {stats.notStartedLessons} not started
          </span>
        </div>
      </div>

      {stats.courseEntries.length > 0 ? (
        <div>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
              Course progress
            </h2>
            <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {filteredEntries.length === 0 ? (
            <p className="mt-4 py-8 text-center text-sm text-zinc-500">
              No courses in this category.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredEntries.map((entry) => (
                <li key={entry.courseId}>
                  <Link
                    href={`/courses/${entry.courseId}`}
                    className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm transition-all hover:border-zinc-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-zinc-100">
                        {entry.title}
                      </h3>
                      <CourseStateChip state={entry.state} />
                    </div>
                    <div className="mt-auto pt-4">
                      <ProgressBar
                        percent={entry.progress.percent}
                        label={progressLabel(entry.progress)}
                      />
                      <p className="mt-2 text-sm text-zinc-400">
                        {progressLabel(entry.progress)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpenIcon className="h-8 w-8" />}
          title="No courses yet"
          description="Create a course to see your progress here."
        />
      )}
    </div>
  );
}