import StatusPill from "@/components/ui/StatusPill";
import { zoneName } from "@/lib/data";
import { fmtClock, fmtDateKey, fmtGmt } from "@/lib/time";

interface Props {
  nowMs: number | null;
  offset: number;
  dateKey: string | null;
  isToday: boolean;
  /** Text for the red badge when the market is closed; null when open. */
  closedLabel: string | null;
}

/** Digital time, date, zone and the open/closed badge, shown above the dial. */
export default function ClockReadout({ nowMs, offset, dateKey, isToday, closedLabel }: Props) {
  const place = zoneName(offset);
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-1">
      <div>
        <p className="font-mono text-4xl font-semibold leading-none tabular-nums tracking-tight sm:text-5xl" aria-live="off">
          {nowMs === null ? "--:--:--" : fmtClock(nowMs, offset)}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {dateKey ? (isToday ? fmtDateKey(dateKey) : `Viewing ${fmtDateKey(dateKey)}`) : ""}
        </p>
        <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">
          {fmtGmt(offset)}
          {place && ` · ${place}`}
          {nowMs !== null && ` · UTC ${fmtClock(nowMs, 0)}`}
        </p>
      </div>
      {nowMs !== null && (
        <StatusPill tone={closedLabel ? "danger" : "ok"}>{closedLabel ?? (isToday ? "Market open" : "Trading day")}</StatusPill>
      )}
    </div>
  );
}
