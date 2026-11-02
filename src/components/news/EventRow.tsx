import Button from "@/components/ui/Button";
import { dateKeyFor, fmtCountdown, fmtDateKeyShort, fmtHM, localMinutesOf } from "@/lib/time";
import type { Impact, NewsEvent } from "@/lib/types";

const IMPACT_DOT: Record<Impact, string> = {
  high: "bg-[var(--impact-high)]",
  medium: "bg-[var(--impact-medium)]",
  low: "bg-[var(--impact-low)]",
};

interface Props {
  event: NewsEvent;
  offset: number;
  nowMs: number | null;
  selected: boolean;
  hot: boolean;
  first: boolean;
  onHover: (id: string | null) => void;
  onToggle: (e: NewsEvent) => void;
  onRemove: (id: string) => void;
}

/** One event: time, impact, title, forecast/previous and a Select button. */
export default function EventRow({ event: e, offset, nowMs, selected, hot, first, onHover, onToggle, onRemove }: Props) {
  const holiday = e.impact === "holiday";
  const day = e.allDay && e.dateKey ? e.dateKey : dateKeyFor(e.atMs, offset);
  const countdown = selected && nowMs !== null && e.atMs > nowMs ? fmtCountdown(e.atMs - nowMs) : null;
  return (
    <li
      onMouseEnter={() => onHover(e.id)}
      onMouseLeave={() => onHover(null)}
      className={`flex items-start gap-3 border-l-[3px] px-3.5 py-2.5 transition-colors ${first ? "" : "border-t border-t-[var(--line)]"} ${
        selected
          ? "border-l-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]"
          : hot
            ? "border-l-transparent bg-[color-mix(in_srgb,var(--fg)_4%,transparent)]"
            : "border-l-transparent"
      }`}
    >
      <span className="w-12 shrink-0 pt-0.5 font-mono text-sm">{e.allDay ? "All day" : fmtHM(localMinutesOf(e.atMs, offset))}</span>
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${holiday ? "bg-[var(--danger)]" : IMPACT_DOT[e.impact as Impact]}`}
        title={holiday ? "Holiday" : `${e.impact} impact`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {e.country && <span className="mr-2 font-mono text-xs text-[var(--muted)]">{e.country}</span>}
          <span className={selected ? "font-medium" : ""}>{e.title}</span>
          {holiday && (
            <span className="ml-2 rounded bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--danger)]">
              {e.country === "ALL" ? "Market closed" : "Holiday"}
            </span>
          )}
        </p>
        <p className="font-mono text-[11px] text-[var(--muted)]">
          {fmtDateKeyShort(day)}
          {e.forecast ? ` · F ${e.forecast}` : ""}
          {e.previous ? ` · P ${e.previous}` : ""}
          {countdown && <span className="text-[var(--accent)]"> · in {countdown}</span>}
        </p>
      </div>
      {e.custom && (
        <button type="button" onClick={() => onRemove(e.id)} aria-label={`Delete ${e.title}`} className="pt-0.5 text-xs text-[var(--muted)] hover:text-[var(--danger)]">
          ✕
        </button>
      )}
      {!holiday && !e.allDay && (
        <Button size="sm" variant={selected ? "accent" : "outline"} aria-pressed={selected} onClick={() => onToggle(e)}>
          {selected ? "Selected" : "Select"}
        </Button>
      )}
    </li>
  );
}
