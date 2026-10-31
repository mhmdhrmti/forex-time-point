import type { DayStatus } from "@/lib/calendar";

/** Clear "market closed" / holiday notice for the selected day. */
export default function StatusBanner({ status }: { status: DayStatus }) {
  if (!status.headline && status.notes.length === 0) return null;
  const closed = status.fullyClosed;
  return (
    <div
      role="status"
      className={`rounded border px-3 py-2.5 text-sm ${
        closed
          ? "border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]"
          : "border-[var(--line)]"
      }`}
    >
      {status.headline && (
        <p className="font-medium tracking-wide text-[var(--danger)]">{status.headline}</p>
      )}
      {status.notes.length > 0 && (
        <ul className="mt-1 flex flex-col gap-0.5 text-xs text-[var(--muted)]">
          {status.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
