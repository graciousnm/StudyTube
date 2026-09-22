"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "@/components/ui/icons";
import { updateCourseAction } from "@/features/courses/course.actions";
import { CourseFormModal } from "./course-form-modal";

interface EditCourseButtonProps {
  courseId: number;
  title: string;
  description: string;
  iconOnly?: boolean;
}

export function EditCourseButton({
  courseId,
  title,
  description,
  iconOnly = false,
}: EditCourseButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {iconOnly ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Edit course"
          title="Edit course"
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <PencilIcon className="h-4 w-4" />
          Edit
        </Button>
      )}
      <CourseFormModal
        open={open}
        onClose={() => setOpen(false)}
        action={updateCourseAction.bind(null, courseId)}
        defaultValue={{ title, description }}
        title="Edit Course"
        submitLabel="Save Changes"
      />
    </>
  );
}