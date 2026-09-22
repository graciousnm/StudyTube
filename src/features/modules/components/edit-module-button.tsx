"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "@/components/ui/icons";
import { updateModuleAction } from "@/features/modules/module.actions";
import { ModuleFormModal } from "./module-form-modal";

interface EditModuleButtonProps {
  moduleId: number;
  title: string;
  description: string;
  iconOnly?: boolean;
}

export function EditModuleButton({
  moduleId,
  title,
  description,
  iconOnly = false,
}: EditModuleButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {iconOnly ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Edit module"
          title="Edit module"
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <PencilIcon className="h-4 w-4" />
          Edit
        </Button>
      )}
      <ModuleFormModal
        open={open}
        onClose={() => setOpen(false)}
        action={updateModuleAction.bind(null, moduleId)}
        defaultValue={{ title, description }}
        title="Edit Module"
        submitLabel="Save Changes"
      />
    </>
  );
}