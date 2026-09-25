"use client";

import type { ReactNode } from "react";

interface TabItem<T extends string> {
  key: T;
  label: string;
  icon?: ReactNode;
}

interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: TabBarProps<T>) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
            active === tab.key
              ? "bg-brand-soft text-brand"
              : "text-zinc-400 hover:text-zinc-100"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
