import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1 text-sm text-zinc-400"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex min-w-0 items-center gap-1">
            {index > 0 ? (
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="min-w-0 max-w-full truncate hover:text-zinc-100"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className={`min-w-0 max-w-full truncate ${isLast ? "font-medium text-zinc-100" : ""}`}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}