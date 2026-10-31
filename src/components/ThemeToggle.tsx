"use client";

import type { Theme } from "@/lib/types";

const OPTIONS: Array<{ id: Theme; label: string }> = [
  { id: "system", label: "Auto" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function ThemeToggle({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (t: Theme) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="flex overflow-hidden rounded border border-[var(--line)] text-xs"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={theme === o.id}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1.5 transition-colors ${
            theme === o.id
              ? "bg-[var(--fg)] text-[var(--bg)]"
              : "text-[var(--muted)] hover:text-[var(--fg)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
