"use client";

import { Modal } from "@/components/ui/modal";
import { ModuleForm, type ModuleFormAction } from "./module-form";

interface ModuleFormModalProps {
  open: boolean;
  onClose: () => void;
  action: ModuleFormAction;
  defaultValue?: { title: string; description: string };
  title: string;
  submitLabel: string;
}

export function ModuleFormModal({
  open,
  onClose,
  action,
  defaultValue,
  title,
  submitLabel,
}: ModuleFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <ModuleForm
        action={action}
        defaultValue={defaultValue}
        submitLabel={submitLabel}
        onSuccess={onClose}
      />
    </Modal>
  );
}