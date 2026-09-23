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
  open?: boolean;
  onClose?: () => void;
  hideTrigger?: boolean;
}

export function EditCourseButton({
  courseId,
  title,
  description,
  iconOnly = false,
  open: controlledOpen,
  onClose: controlledOnClose,
  hideTrigger = false,
}: EditCourseButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnClose
    ? (value: boolean) => (value ? controlledOnClose() : controlledOnClose())
    : setInternalOpen;
  const handleClose = controlledOnClose ?? (() => setInternalOpen(false));

  return (
    <>
      {!hideTrigger && (
        iconOnly ? (
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
        )
      )}
      <CourseFormModal
        open={open}
        onClose={handleClose}
        action={updateCourseAction.bind(null, courseId)}
        defaultValue={{ title, description }}
        title="Edit Course"
        submitLabel="Save Changes"
      />
    </>
  );
}