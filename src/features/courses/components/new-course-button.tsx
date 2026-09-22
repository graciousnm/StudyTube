"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { createCourseAction } from "@/features/courses/course.actions";
import { CourseFormModal } from "./course-form-modal";

interface NewCourseButtonProps {
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
  className?: string;
  label?: string;
}

export function NewCourseButton({
  size = "md",
  variant = "primary",
  className,
  label = "New Course",
}: NewCourseButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="h-4 w-4" />
        {label}
      </Button>
      <CourseFormModal
        open={open}
        onClose={() => setOpen(false)}
        action={createCourseAction}
        title="Create Course"
        submitLabel="Create Course"
      />
    </>
  );
}