"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { PlusIcon } from "@/components/ui/icons";
import { createModuleAction } from "@/features/modules/module.actions";
import { ModuleFormModal } from "@/features/modules/components/module-form-modal";
import type { ModuleOutline, ModuleTopics } from "@/features/ai/ai.types";
import { suggestMissingModuleAction } from "@/features/ai/ai.actions";
import { CurationSetup } from "@/features/ai/components/curation-setup";
import type { CurationPreferences } from "@/features/ai/components/curation-setup";
import { ModuleAiForm } from "@/features/ai/components/module-ai-form";
import { ModuleAiReview } from "@/features/ai/components/module-ai-review";
import { VideoCurationStep } from "@/features/ai/components/video-curation-step";

type Step = "choose" | "ai-form" | "ai-review" | "curation-setup" | "video-curation";

interface AddModuleModalProps {
  open: boolean;
  onClose: () => void;
  courseId: number;
  courseTitle: string;
  courseDescription: string;
  courseGoal?: string;
  aiAvailable?: boolean;
  moduleCount: number;
}

export function AddModuleModal({
  open,
  onClose,
  courseId,
  courseTitle,
  courseDescription,
  courseGoal,
  aiAvailable = false,
  moduleCount,
}: AddModuleModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [source, setSource] = useState<"generate" | "suggest">("generate");
  const [outline, setOutline] = useState<ModuleOutline | null>(null);
  const [moduleData, setModuleData] = useState<ModuleTopics | null>(null);
  const [videoPrefs, setVideoPrefs] = useState<CurationPreferences>({});
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  function reset() {
    setStep("choose");
    setSource("generate");
    setOutline(null);
    setModuleData(null);
    setVideoPrefs({});
    setSuggesting(false);
    setSuggestError(null);
  }

  function close() {
    reset();
    onClose();
  }

  function goToModule() {
    if (moduleData) {
      router.push(`/courses/${courseId}/modules/${moduleData.moduleId}`);
    }
    close();
  }

  async function handleSuggest() {
    setSuggestError(null);
    setSuggesting(true);
    try {
      const result = await suggestMissingModuleAction(courseId);
      if (result.error) {
        setSuggestError(result.error);
      } else if (result.outline) {
        setSource("suggest");
        setOutline(result.outline);
        setStep("ai-review");
      }
    } catch {
      setSuggestError("We couldn't scan this course right now. Please try again.");
    } finally {
      setSuggesting(false);
    }
  }

  const modalTitle =
    step === "video-curation"
      ? "Curate Videos"
      : step === "curation-setup"
        ? "Add Videos?"
        : step === "ai-review"
          ? "Review Your Module"
          : step === "ai-form"
            ? "Generate a Module"
            : "Add Module";

  return (
    <>
      <Modal open={open} onClose={close} title={modalTitle}>
        {step === "choose" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              How would you like to add a module?
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setManualOpen(true);
                  close();
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                  <PlusIcon className="h-5 w-5 text-zinc-300" />
                </div>
                <div>
                  <p className="font-medium text-zinc-100">Create Manually</p>
                  <p className="text-sm text-zinc-500">
                    Start with a blank module
                  </p>
                </div>
              </button>

              {aiAvailable ? (
                <button
                  type="button"
                  onClick={() => {
                    setSource("generate");
                    setStep("ai-form");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-800"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                    <span className="text-lg">&#x2728;</span>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-100">
                      Generate with AI
                    </p>
                    <p className="text-sm text-zinc-500">
                      Describe the module you want
                    </p>
                  </div>
                </button>
              ) : null}

              {aiAvailable && moduleCount > 0 ? (
                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={suggesting}
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                    <span className="text-lg">&#x1f50e;</span>
                  </div>
                  <div>
                    <p className="font-medium text-zinc-100">
                      Suggest Missing Module
                    </p>
                    <p className="text-sm text-zinc-500">
                      AI scans your course and finds a gap
                    </p>
                  </div>
                </button>
              ) : null}
            </div>

            {suggestError ? (
              <p role="alert" className="text-sm text-red-400">
                {suggestError}
              </p>
            ) : null}
          </div>
        )}

        {step === "ai-form" && (
          <ModuleAiForm
            courseTitle={courseTitle}
            courseDescription={courseDescription}
            courseGoal={courseGoal}
            onGenerated={(generated) => {
              setOutline(generated);
              setStep("ai-review");
            }}
            onCancel={close}
          />
        )}

        {step === "ai-review" && outline && (
          <ModuleAiReview
            courseId={courseId}
            outline={outline}
            onRegenerate={() => {
              if (source === "suggest") {
                handleSuggest();
              } else {
                setStep("ai-form");
              }
            }}
            onCreated={(data) => {
              setModuleData({
                moduleId: data.moduleId,
                title: data.title,
                topics: data.topics,
              });
              setStep("curation-setup");
            }}
          />
        )}

        {step === "curation-setup" && moduleData && (
          <CurationSetup
            onStart={(prefs) => {
              setVideoPrefs(prefs);
              setStep("video-curation");
            }}
            onSkip={goToModule}
          />
        )}

        {step === "video-curation" && moduleData && (
          <VideoCurationStep
            courseId={courseId}
            modules={[moduleData]}
            courseTitle={courseTitle}
            courseDescription={courseDescription}
            channel={videoPrefs.channel}
            notes={videoPrefs.notes}
            onDone={goToModule}
            onSkip={goToModule}
          />
        )}

        {suggesting ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
            <p className="text-sm text-zinc-400">
              Scanning your course for gaps...
            </p>
          </div>
        ) : null}
      </Modal>

      <ModuleFormModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        action={createModuleAction.bind(null, courseId)}
        title="Add Module"
        submitLabel="Create Module"
      />
    </>
  );
}