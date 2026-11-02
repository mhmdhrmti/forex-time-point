import { useMemo } from "react";
import Panel from "@/components/ui/Panel";
import { ffWeekParam } from "@/lib/ffpage";
import { fmtDateKey, fmtGmt, fmtHM, localMinutesOf } from "@/lib/time";
import type { NewsEvent } from "@/lib/types";
import AddEventForm from "./AddEventForm";
import EventFilters, { type ImpactFilter } from "./EventFilters";
import EventRow from "./EventRow";
import FeedNotice, { type FeedState } from "./FeedNotice";
import SelectedEvents from "./SelectedEvents";

interface Props {
  dateKey: string;
  isToday: boolean;
  dayEvents: NewsEvent[];
  upcomingSelected: NewsEvent[];
  selectedIds: string[];
  offset: number;
  nowMs: number | null;
  feed: FeedState;
  leadMin: number;
  impactFilter: ImpactFilter;
  currencyFilter: string;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onLeadChange: (m: number) => void;
  onImpactFilter: (f: ImpactFilter) => void;
  onCurrencyFilter: (c: string) => void;
  onToggleSelect: (e: NewsEvent) => void;
  onAddCustom: (e: Omit<NewsEvent, "id" | "custom">) => void;
  onRemoveCustom: (id: string) => void;
  onRetry: () => void;
}

/** The News tab: day heading, filters, selected events, the day's list and a custom-event form. */
export default function NewsPanel(p: Props) {
  const currencies = useMemo(
    () => [...new Set(p.dayEvents.filter((e) => e.country && e.country !== "ALL").map((e) => e.country))].sort(),
    [p.dayEvents],
  );
  const rows = useMemo(
    () =>
      p.dayEvents.filter(
        (e) =>
          e.impact === "holiday" ||
          p.selectedIds.includes(e.id) ||
          ((p.impactFilter === "all" || e.impact === p.impactFilter) && (p.currencyFilter === "all" || e.country === p.currencyFilter)),
      ),
    [p.dayEvents, p.impactFilter, p.currencyFilter, p.selectedIds],
  );
  const filtered = p.impactFilter !== "all" || p.currencyFilter !== "all";

  return (
    <section aria-label="Daily news and events" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {fmtDateKey(p.dateKey)}
            {p.isToday && (
              <span className="ml-2 rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--accent)]">
                Today
              </span>
            )}
          </h2>
          <p className="text-xs text-[var(--muted)]">
            <a
              href={`https://www.forexfactory.com/calendar?day=${ffWeekParam(p.dateKey)}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-[var(--fg)]"
            >
              Forex Factory
            </a>{" "}
            · times in {fmtGmt(p.offset)}
            {p.feed.status === "ready" && p.feed.fetchedAt
              ? ` · updated ${fmtHM(localMinutesOf(p.feed.fetchedAt, p.offset))}${p.feed.source === "json" ? " · weekly feed" : ""}`
              : ""}
            {` · ${p.dayEvents.filter((e) => !e.custom).length} events`}
          </p>
        </div>
        <EventFilters impact={p.impactFilter} currency={p.currencyFilter} currencies={currencies} onImpact={p.onImpactFilter} onCurrency={p.onCurrencyFilter} />
      </div>

      <FeedNotice feed={p.feed} dateKey={p.dateKey} onRetry={p.onRetry} />

      <SelectedEvents events={p.upcomingSelected} offset={p.offset} nowMs={p.nowMs} leadMin={p.leadMin} onLead={p.onLeadChange} onHover={p.onHover} onUnselect={p.onToggleSelect} />

      <Panel className="overflow-hidden lg:max-h-[460px] lg:overflow-y-auto">
        <ul>
          {rows.length === 0 && p.feed.status === "ready" && (
            <li className="px-4 py-8 text-center text-xs text-[var(--muted)]">No events for this date{filtered ? " with these filters" : ""}.</li>
          )}
          {rows.map((e, i) => (
            <EventRow
              key={e.id}
              event={e}
              offset={p.offset}
              nowMs={p.nowMs}
              selected={p.selectedIds.includes(e.id)}
              hot={p.hoverId === e.id}
              first={i === 0}
              onHover={p.onHover}
              onToggle={p.onToggleSelect}
              onRemove={p.onRemoveCustom}
            />
          ))}
        </ul>
      </Panel>

      <AddEventForm dateKey={p.dateKey} offset={p.offset} onAdd={p.onAddCustom} />
    </section>
  );
}
