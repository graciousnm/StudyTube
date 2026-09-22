"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";

export interface ConfirmDeleteState {
  error?: string;
}

export type ConfirmDeleteAction = (
  prevState: ConfirmDeleteState,
  formData: FormData,
) => Promise<ConfirmDeleteState>;

interface ConfirmDeleteButtonProps {
  heading: string;
  description: string;
  action: ConfirmDeleteAction;
  triggerLabel?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  iconOnly?: boolean;
  className?: string;
}

export function ConfirmDeleteButton({
  heading,
  description,
  action,
  triggerLabel = "Delete",
  confirmLabel = "Delete",
  pendingLabel = "Deleting…",
  iconOnly = false,
  className,
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    ConfirmDeleteState,
    FormData
  >(action, {});
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      {iconOnly ? (
        <Button
          variant="ghost-danger"
          size="icon"
          className={className}
          onClick={() => setOpen(true)}
          aria-label={triggerLabel}
          title={triggerLabel}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="danger" onClick={() => setOpen(true)}>
          <TrashIcon className="h-4 w-4" />
          {triggerLabel}
        </Button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={heading}>
        <p className="text-sm text-zinc-300">{description}</p>

        {state?.error ? (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {state.error}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            ref={cancelRef}
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <form action={formAction}>
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </form>
        </div>
      </Modal>
    </>
  );
}