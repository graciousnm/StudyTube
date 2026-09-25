"use client";

import { useState } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { deleteModuleAction } from "@/features/modules/module.actions";
import { EditModuleButton } from "./edit-module-button";

interface ModuleActionsMenuProps {
  courseId: number;
  moduleId: number;
  title: string;
  description: string;
}

export function ModuleActionsMenu({
  courseId,
  moduleId,
  title,
  description,
}: ModuleActionsMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu
        ariaLabel="Module actions"
        items={[
          { label: "Edit", onClick: () => setEditOpen(true) },
          { label: "Delete", onClick: () => setDeleteOpen(true), danger: true },
        ]}
      />
      <EditModuleButton
        moduleId={moduleId}
        title={title}
        description={description}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        hideTrigger
      />
      <ConfirmDeleteButton
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        triggerLabel="Delete module"
        heading="Delete Module?"
        description={`This will permanently remove "${title}" and all of its lessons, progress, and notes.`}
        confirmLabel="Delete Module"
        action={deleteModuleAction.bind(null, courseId, moduleId)}
        hideTrigger
      />
    </>
  );
}