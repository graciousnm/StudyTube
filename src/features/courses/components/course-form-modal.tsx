"use client";

import { Modal } from "@/components/ui/modal";
import { CourseForm, type CourseFormAction } from "./course-form";

interface CourseFormModalProps {
  open: boolean;
  onClose: () => void;
  action: CourseFormAction;
  defaultValue?: { title: string; description: string; goal?: string };
  title: string;
  submitLabel: string;
}

export function CourseFormModal({
  open,
  onClose,
  action,
  defaultValue,
  title,
  submitLabel,
}: CourseFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <CourseForm
        action={action}
        defaultValue={defaultValue}
        submitLabel={submitLabel}
        onSuccess={onClose}
      />
    </Modal>
  );
}