import Dropdown from "@/components/ui/Dropdown";
import Panel from "@/components/ui/Panel";
import { dateKeyFor, fmtCountdown, fmtDateKeyShort, fmtHM, localMinutesOf } from "@/lib/time";
import type { NewsEvent } from "@/lib/types";

const LEADS = [2, 5, 10, 15, 30].map((m) => ({ value: m, label: `${m} min` }));

interface Props {
  events: NewsEvent[];
  offset: number;
  nowMs: number | null;
  leadMin: number;
  onLead: (m: number) => void;
  onHover: (id: string | null) => void;
  onUnselect: (e: NewsEvent) => void;
}

/** Upcoming selected events (any date) and the alert lead time. */
export default function SelectedEvents({ events, offset, nowMs, leadMin, onLead, onHover, onUnselect }: Props) {
  return (
    <Panel className="p-3.5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Selected events</h3>
        <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          Alert me
          <Dropdown ariaLabel="Alert lead time" value={leadMin} options={LEADS} onChange={onLead} alignRight className="w-24" />
          before
        </label>
      </div>
      {events.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">
          Press <span className="font-medium text-[var(--fg)]">Select</span> on an event below to show it on the clock and get an alert.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {events.map((e) => (
            <li key={e.id} onMouseEnter={() => onHover(e.id)} onMouseLeave={() => onHover(null)} className="flex items-center gap-2 text-xs">
              <span className="w-[84px] shrink-0 font-mono text-[var(--muted)]">{fmtDateKeyShort(dateKeyFor(e.atMs, offset))}</span>
              <span className="w-11 shrink-0 font-mono font-medium">{fmtHM(localMinutesOf(e.atMs, offset))}</span>
              <span className="min-w-0 flex-1 truncate">
                {e.country && <span className="mr-1.5 font-mono text-[var(--muted)]">{e.country}</span>}
                {e.title}
              </span>
              {nowMs !== null && <span className="shrink-0 font-mono text-[var(--accent)]">{fmtCountdown(e.atMs - nowMs)}</span>}
              <button type="button" onClick={() => onUnselect(e)} aria-label={`Unselect ${e.title}`} className="shrink-0 text-[var(--muted)] hover:text-[var(--danger)]">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
