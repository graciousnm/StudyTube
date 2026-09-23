"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { TabBar } from "@/components/ui/tabs";
import type { Course } from "@/db/schema";
import type { ProgressSummary } from "@/features/progress/progress.types";
import { CourseCard } from "./course-card";

type FilterState = "all" | "in_progress" | "completed";

interface CourseGridProps {
  courses: Course[];
  progressByCourse: Map<number, ProgressSummary>;
  thumbnailMap?: Map<number, string | null>;
}

export function CourseGrid({ courses, progressByCourse, thumbnailMap }: CourseGridProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterState>("all");

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return courses.filter((course) => {
      if (term && !course.title.toLowerCase().includes(term)) return false;
      const progress = progressByCourse.get(course.id);
      if (filter === "completed") return progress?.isComplete ?? false;
      if (filter === "in_progress") {
        return (progress?.percent ?? 0) > 0 && !progress?.isComplete;
      }
      return true;
    });
  }, [courses, search, filter, progressByCourse]);

  const tabs: { key: FilterState; label: string }[] = [
    { key: "all", label: "All" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
          />
        </div>
        <TabBar tabs={tabs} active={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          {search ? "No courses match your search." : "No courses in this category."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={progressByCourse.get(course.id) ?? { completed: 0, total: 0, isEmpty: true, isComplete: false, percent: null }}
              thumbnailUrl={thumbnailMap?.get(course.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
