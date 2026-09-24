"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import {
  deleteCourseAction,
  exportCourseAction,
} from "@/features/courses/course.actions";
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
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await exportCourseAction(courseId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([result.json], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Course exported");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <DropdownMenu
        ariaLabel="Course actions"
        items={[
          { label: "Edit", onClick: () => setEditOpen(true) },
          { label: "Export", onClick: handleExport },
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