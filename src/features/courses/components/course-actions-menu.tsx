"use client";

import { useState } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { deleteCourseAction } from "@/features/courses/course.actions";
import { EditCourseButton } from "@/features/courses/components/edit-course-button";

interface CourseActionsMenuProps {
  courseId: number;
  title: string;
  description: string;
  goal?: string;
}

export function CourseActionsMenu({
  courseId,
  title,
  description,
  goal,
}: CourseActionsMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu
        ariaLabel="Course actions"
        items={[
          { label: "Edit", onClick: () => setEditOpen(true) },
          { label: "Delete", onClick: () => setDeleteOpen(true), danger: true },
        ]}
      />
      <EditCourseButton
        courseId={courseId}
        title={title}
        description={description}
        goal={goal}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        hideTrigger
      />
      <ConfirmDeleteButton
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        triggerLabel="Delete course"
        heading="Delete Course?"
        description={`This will permanently remove "${title}" and all of its modules, lessons, progress, and notes.`}
        confirmLabel="Delete Course"
        action={deleteCourseAction.bind(null, courseId)}
        hideTrigger
      />
    </>
  );
}
