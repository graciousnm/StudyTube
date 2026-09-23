"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { CourseFormModal } from "@/features/courses/components/course-form-modal";
import { createCourseAction } from "@/features/courses/course.actions";
import type { CourseOutline, ModuleTopics } from "@/features/ai/ai.types";
import { CurationSetup } from "@/features/ai/components/curation-setup";
import type { CurationPreferences } from "@/features/ai/components/curation-setup";
import { OutlineForm } from "@/features/ai/components/outline-form";
import { OutlineReview } from "@/features/ai/components/outline-review";
import { VideoCurationStep } from "@/features/ai/components/video-curation-step";

type Step = "choose" | "ai-form" | "ai-review" | "curation-setup" | "video-curation";

interface CreateCourseButtonProps {
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
  className?: string;
  label?: string;
  aiAvailable?: boolean;
}

export function CreateCourseButton({
  size = "md",
  variant = "primary",
  className,
  label = "New Course",
  aiAvailable = false,
}: CreateCourseButtonProps) {
  const router = useRouter();
  const [manualOpen, setManualOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [courseData, setCourseData] = useState<{
    courseId: number;
    modules: ModuleTopics[];
  } | null>(null);
  const [videoPrefs, setVideoPrefs] = useState<CurationPreferences>({});

  function closeAi() {
    setAiOpen(false);
    setStep("choose");
    setOutline(null);
    setCourseData(null);
    setVideoPrefs({});
  }

  function goToCourse() {
    if (courseData) {
      router.push(`/courses/${courseData.courseId}`);
    }
    closeAi();
  }

  const modalTitle =
    step === "video-curation"
      ? "Curate Videos"
      : step === "curation-setup"
        ? "Add Videos?"
        : step === "ai-review"
          ? "Review Your Learning Path"
          : "Create a Learning Path";

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          if (!aiAvailable) {
            setManualOpen(true);
            return;
          }
          setAiOpen(true);
          setStep("choose");
          setOutline(null);
          setCourseData(null);
          setVideoPrefs({});
        }}
      >
        <PlusIcon className="h-4 w-4" />
        {label}
      </Button>

      <Modal open={aiOpen} onClose={closeAi} title={modalTitle}>
        {step === "choose" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              How would you like to create your course?
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setManualOpen(true);
                  closeAi();
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                  <PlusIcon className="h-5 w-5 text-zinc-300" />
                </div>
                <div>
                  <p className="font-medium text-zinc-100">Create Manually</p>
                  <p className="text-sm text-zinc-500">
                    Start with a blank course
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setStep("ai-form")}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                  <span className="text-lg">&#x2728;</span>
                </div>
                <div>
                  <p className="font-medium text-zinc-100">Create with AI</p>
                  <p className="text-sm text-zinc-500">
                    Get a suggested learning outline
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === "ai-form" && (
          <OutlineForm
            onGenerated={(o) => {
              setOutline(o);
              setStep("ai-review");
            }}
            onCancel={closeAi}
          />
        )}

        {step === "ai-review" && outline && (
          <OutlineReview
            outline={outline}
            onRegenerate={() => setStep("ai-form")}
            onCreated={(data) => {
              setCourseData(data);
              setStep("curation-setup");
            }}
          />
        )}

        {step === "curation-setup" && courseData && (
          <CurationSetup
            onStart={(prefs) => {
              setVideoPrefs(prefs);
              setStep("video-curation");
            }}
            onSkip={goToCourse}
          />
        )}

        {step === "video-curation" && courseData && (
          <VideoCurationStep
            courseId={courseData.courseId}
            modules={courseData.modules}
            courseTitle={outline?.title ?? ""}
            courseDescription={outline?.description ?? ""}
            channel={videoPrefs.channel}
            notes={videoPrefs.notes}
            onDone={goToCourse}
            onSkip={goToCourse}
          />
        )}
      </Modal>

      <CourseFormModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        action={createCourseAction}
        title="Create Course"
        submitLabel="Create Course"
      />
    </>
  );
}
