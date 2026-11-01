import type { DayStatus } from "@/lib/calendar";

/** Clear "market closed" / holiday notice for the selected day. */
export default function StatusBanner({ status }: { status: DayStatus }) {
  if (!status.headline && status.notes.length === 0) return null;
  const closed = status.fullyClosed;
  return (
    <div
      role="status"
      className={`rounded-lg border-l-4 bg-[var(--surface)] px-3.5 py-2.5 text-sm ring-1 ring-[var(--line)] ${
        closed ? "border-[var(--danger)]" : "border-[var(--impact-medium)]"
      }`}
    >
      {status.headline && (
        <p className="font-medium text-[var(--danger)]">{status.headline}</p>
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
