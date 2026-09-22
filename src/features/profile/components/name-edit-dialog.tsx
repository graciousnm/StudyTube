"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PencilIcon } from "@/components/ui/icons";
import { updateProfileNameAction } from "@/features/profile/profile.actions";
import type { ProfileActionState } from "@/features/profile/profile.types";

interface NameEditDialogProps {
  name: string;
}

export function NameEditDialog({ name }: NameEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        aria-label="Edit name"
      >
        <PencilIcon className="h-4 w-4" />
        Edit name
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit name">
        <NameEditForm name={name} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

interface NameEditFormProps {
  name: string;
  onClose: () => void;
}

function NameEditForm({ name, onClose }: NameEditFormProps) {
  const [state, formAction, pending] = useActionState<
    ProfileActionState,
    FormData
  >(updateProfileNameAction, {});

  useEffect(() => {
    if (state.ok) {
      onClose();
    }
  }, [state.ok, onClose]);

  const nameErrors = state?.fieldErrors?.name;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="profile-name"
          className="block text-sm font-medium text-zinc-200"
        >
          Name
        </label>
        <Input
          id="profile-name"
          name="name"
          placeholder="type your name"
          required
          autoFocus
          maxLength={60}
          defaultValue={name}
          aria-invalid={nameErrors ? true : undefined}
          aria-describedby={nameErrors ? "profile-name-errors" : undefined}
        />
        {nameErrors ? (
          <ul id="profile-name-errors" className="space-y-1">
            {nameErrors.map((message) => (
              <li key={message} className="text-sm text-red-400">
                {message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => !pending && onClose()}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}