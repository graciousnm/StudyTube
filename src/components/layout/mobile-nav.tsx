"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenIcon, HomeIcon, UserIcon } from "@/components/ui/icons";

const navItems = [
  { href: "/", icon: HomeIcon, label: "Home", matchExact: true },
  { href: "/courses", icon: BookOpenIcon, label: "Courses" },
  { href: "/profile", icon: UserIcon, label: "Profile", matchExact: true },
];

export function MobileNav() {
  const pathname = usePathname();

  function isActive(item: (typeof navItems)[number]) {
    if (item.matchExact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950 sm:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "text-brand"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}