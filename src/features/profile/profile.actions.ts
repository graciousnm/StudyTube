"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { createProfile, updateProfileName } from "./profile.mutations";
import type { ProfileActionState } from "./profile.types";
import { parseProfileName } from "./profile.validation";

export async function completeOnboardingAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = parseProfileName(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted field.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  createProfile(getDb(), parsed.data);
  redirect("/");
}

export async function updateProfileNameAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = parseProfileName(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted field.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const updated = updateProfileName(getDb(), parsed.data);
  if (!updated) {
    return { error: "No learner profile exists yet." };
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/onboarding");
  return { ok: true };
}