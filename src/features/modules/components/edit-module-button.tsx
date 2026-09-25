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
  open?: boolean;
  onClose?: () => void;
  hideTrigger?: boolean;
}

export function EditModuleButton({
  moduleId,
  title,
  description,
  iconOnly = false,
  open: controlledOpen,
  onClose: controlledOnClose,
  hideTrigger = false,
}: EditModuleButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnClose
    ? (value: boolean) => (value ? controlledOnClose() : controlledOnClose())
    : setInternalOpen;
  const handleClose = controlledOnClose ?? (() => setInternalOpen(false));

  return (
    <>
      {!hideTrigger &&
        (iconOnly ? (
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
        ))}
      <ModuleFormModal
        open={open}
        onClose={handleClose}
        action={updateModuleAction.bind(null, moduleId)}
        defaultValue={{ title, description }}
        title="Edit Module"
        submitLabel="Save Changes"
      />
    </>
  );
}