import type { ReactNode } from "react";

type Tone = "ok" | "danger" | "accent" | "muted";

const TONES: Record<Tone, { text: string; ring: string; dot: string }> = {
  ok: { text: "text-[var(--ok)]", ring: "ring-[color-mix(in_srgb,var(--ok)_45%,transparent)]", dot: "bg-[var(--ok)]" },
  danger: { text: "text-[var(--danger)]", ring: "ring-[color-mix(in_srgb,var(--danger)_45%,transparent)]", dot: "bg-[var(--danger)]" },
  accent: { text: "text-[var(--accent)]", ring: "ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]", dot: "bg-[var(--accent)]" },
  muted: { text: "text-[var(--muted)]", ring: "ring-[var(--line)]", dot: "bg-[var(--muted)]" },
};

/** A small rounded status badge with an optional leading dot. */
export default function StatusPill({ tone, dot = true, children }: { tone: Tone; dot?: boolean; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${t.text} ${t.ring}`}>
      {dot && <span className={`h-2 w-2 rounded-full ${t.dot}`} />}
      {children}
    </span>
  );
}
