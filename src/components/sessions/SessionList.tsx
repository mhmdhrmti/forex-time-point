import Panel from "@/components/ui/Panel";
import type { Session } from "@/lib/types";
import { fmtHM, isInRange, toLocalMinutes } from "@/lib/time";

interface Props {
  offset: number;
  /** Sessions resolved for the viewed date. */
  sessions: Session[];
  /** Current minute of the UTC day, or null before the client clock is ready. */
  nowUtcMin: number | null;
  /** Viewing today (so Open/Closed can be live). */
  isToday: boolean;
  /** Whole market closed: every row is disabled and cannot be toggled. */
  marketClosed: boolean;
  closedReason: string | null;
  /** Session id → bank-holiday reason. */
  closedSessions: Record<string, string>;
  visible: Record<string, boolean>;
  onToggle: (id: string, visible: boolean) => void;
}

/** The four sessions with show/hide toggles and a live Open / Closed state. */
export default function SessionList({ offset, sessions, nowUtcMin, isToday, marketClosed, closedReason, closedSessions, visible, onToggle }: Props) {
  return (
    <section aria-label="Trading sessions">
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Sessions</h2>
      <Panel className={`grid gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-2 ${marketClosed ? "opacity-70" : ""}`}>
        {sessions.map((s) => {
          const shown = visible[s.id] !== false;
          const holiday = closedSessions[s.id];
          let label = "—";
          let tone: "open" | "closed" | "idle" = "idle";
          if (marketClosed) {
            label = "Closed";
            tone = "closed";
          } else if (holiday) {
            label = "Holiday";
            tone = "closed";
          } else if (isToday && nowUtcMin !== null) {
            const open = isInRange(nowUtcMin, s.startUtc, s.endUtc);
            label = open ? "Open" : "Closed";
            tone = open ? "open" : "idle";
          }
          return (
            <div key={s.id} className="flex items-center gap-3 bg-[var(--surface)] px-3.5 py-2.5" title={holiday ?? (marketClosed ? closedReason ?? undefined : undefined)}>
              <input
                type="checkbox"
                checked={shown && !marketClosed}
                disabled={marketClosed}
                onChange={() => onToggle(s.id, !shown)}
                aria-label={`Show ${s.name} on clock`}
                className="accent-[var(--accent)] disabled:cursor-not-allowed"
              />
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color, opacity: marketClosed ? 0.35 : 1 }} />
              <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
              <span className="font-mono text-xs text-[var(--muted)]">
                {fmtHM(toLocalMinutes(s.startUtc, offset))}–{fmtHM(toLocalMinutes(s.endUtc, offset))}
              </span>
              <span
                className={`w-14 text-right text-xs ${
                  tone === "open" ? "font-medium text-[var(--ok)]" : tone === "closed" ? "font-medium text-[var(--danger)]" : "text-[var(--muted)]"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </Panel>
      <p className="mt-2 px-1 text-[11px] text-[var(--muted)]">
        {marketClosed
          ? "The market is closed, so sessions, time points and ranges are locked."
          : "Session hours follow each market's local time and daylight saving. Weekend closure is Fri 17:00 – Sun 17:00 New York time."}
      </p>
    </section>
  );
}
