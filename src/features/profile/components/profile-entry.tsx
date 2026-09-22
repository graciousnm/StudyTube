import Link from "next/link";
import { UserIcon } from "@/components/ui/icons";

interface ProfileEntryProps {
  name: string;
}

export function ProfileEntry({ name }: ProfileEntryProps) {
  return (
    <Link
      href="/profile"
      className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      aria-label="View learner profile"
      title="Learner profile"
    >
      <UserIcon className="h-4 w-4" />
      <span className="hidden sm:inline">{name}</span>
    </Link>
  );
}