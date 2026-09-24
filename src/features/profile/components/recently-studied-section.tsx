import { CourseCard } from "@/features/courses/components/course-card";
import type { ProgressSummary } from "@/features/progress/progress.types";
import type { RecentlyStudiedCourse } from "../profile.types";

interface RecentlyStudiedSectionProps {
  items: RecentlyStudiedCourse[];
  progressByCourse: Map<number, ProgressSummary>;
  thumbnailMap?: Map<number, string | null>;
}

export function RecentlyStudiedSection({
  items,
  progressByCourse,
  thumbnailMap,
}: RecentlyStudiedSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
          Recently studied
        </h2>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <CourseCard
            key={item.course.id}
            course={item.course}
            progress={progressByCourse.get(item.course.id) ?? {
              completed: 0,
              total: 0,
              isEmpty: true,
              isComplete: false,
              percent: null,
            }}
            thumbnailUrl={thumbnailMap?.get(item.course.id)}
            footer={`Last studied ${new Date(item.lastStudiedAt).toLocaleDateString()}`}
          />
        ))}
      </ul>
    </section>
  );
}