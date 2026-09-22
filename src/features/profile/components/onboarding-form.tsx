"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeOnboardingAction } from "@/features/profile/profile.actions";
import type { ProfileActionState } from "@/features/profile/profile.types";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<
    ProfileActionState,
    FormData
  >(completeOnboardingAction, {});

  const nameErrors = state?.fieldErrors?.name;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="profile-name"
          className="block text-sm font-medium text-zinc-200"
        >
          Name this installation
        </label>
        <Input
          id="profile-name"
          name="name"
          placeholder="type your name"
          required
          autoFocus
          maxLength={60}
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
        <p className="text-sm text-zinc-500">
          This name identifies the installation, not the learner; names are
          entirely local.
        </p>
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Complete this step →"}
        </Button>
      </div>
    </form>
  );
}