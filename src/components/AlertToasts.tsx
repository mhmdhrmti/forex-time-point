import { dateKeyFor, fmtCountdown, fmtDateKeyShort, fmtGmt, fmtHM, localMinutesOf } from "@/lib/time";
import type { NewsEvent } from "@/lib/types";

interface Props {
  alerts: NewsEvent[];
  nowMs: number | null;
  offset: number;
  onDismiss: (id: string) => void;
}

/** Pop-ups for selected events that are about to start. */
export default function AlertToasts({ alerts, nowMs, offset, onDismiss }: Props) {
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    >
      {alerts.map((e) => (
        <div
          key={e.id}
          role="alert"
          className="pointer-events-auto flex items-start gap-3 rounded-xl border-l-4 border-[var(--accent)] bg-[var(--surface)] p-3.5 shadow-xl ring-1 ring-[var(--line)]"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Starts in {nowMs === null ? "" : fmtCountdown(e.atMs - nowMs)}
            </p>
            <p className="truncate text-sm font-medium">
              {e.country && <span className="mr-2 font-mono text-xs text-[var(--muted)]">{e.country}</span>}
              {e.title}
            </p>
            <p className="font-mono text-xs text-[var(--muted)]">
              {fmtDateKeyShort(dateKeyFor(e.atMs, offset))} · {fmtHM(localMinutesOf(e.atMs, offset))} {fmtGmt(offset)}
            </p>
          </div>
          <button type="button" onClick={() => onDismiss(e.id)} aria-label="Dismiss alert" className="text-[var(--muted)] hover:text-[var(--fg)]">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
