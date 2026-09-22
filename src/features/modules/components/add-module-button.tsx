"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { createModuleAction } from "@/features/modules/module.actions";
import { ModuleFormModal } from "./module-form-modal";

interface AddModuleButtonProps {
  courseId: number;
  size?: "sm" | "md";
}

export function AddModuleButton({
  courseId,
  size = "md",
}: AddModuleButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size={size} onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        Add Module
      </Button>
      <ModuleFormModal
        open={open}
        onClose={() => setOpen(false)}
        action={createModuleAction.bind(null, courseId)}
        title="Add Module"
        submitLabel="Create Module"
      />
    </>
  );
}