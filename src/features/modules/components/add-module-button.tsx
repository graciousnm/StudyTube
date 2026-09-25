"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { AddModuleModal } from "@/features/ai/components/add-module-modal";

interface AddModuleButtonProps {
  courseId: number;
  courseTitle: string;
  courseDescription: string;
  courseGoal?: string;
  aiAvailable?: boolean;
  moduleCount: number;
  size?: "sm" | "md";
}

export function AddModuleButton({
  courseId,
  courseTitle,
  courseDescription,
  courseGoal,
  aiAvailable = false,
  moduleCount,
  size = "md",
}: AddModuleButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size={size} onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        Add Module
      </Button>
      <AddModuleModal
        open={open}
        onClose={() => setOpen(false)}
        courseId={courseId}
        courseTitle={courseTitle}
        courseDescription={courseDescription}
        courseGoal={courseGoal}
        aiAvailable={aiAvailable}
        moduleCount={moduleCount}
      />
    </>
  );
}