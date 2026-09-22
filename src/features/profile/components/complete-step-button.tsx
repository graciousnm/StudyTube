import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function CompleteStepButton() {
  return (
    <Link
      href="/onboarding"
      className={buttonVariants({ variant: "primary" })}
    >
      Complete this step →
    </Link>
  );
}