import Button from "@/components/ui/Button";
import { fmtDateKeyShort } from "@/lib/time";

export type FeedState =
  | { status: "loading" }
  | { status: "ready"; stale: boolean; fetchedAt?: number; source?: string }
  | { status: "error"; message: string };

/** Loading / error / stale-data message for the Forex Factory feed. */
export default function FeedNotice({ feed, dateKey, onRetry }: { feed: FeedState; dateKey: string; onRetry: () => void }) {
  if (feed.status === "loading")
    return (
      <p className="rounded-lg bg-[var(--surface)] px-3 py-2.5 text-xs text-[var(--muted)] ring-1 ring-[var(--line)]">
        Loading events for {fmtDateKeyShort(dateKey)} from Forex Factory…
      </p>
    );
  if (feed.status === "error")
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-l-4 border-[var(--danger)] bg-[var(--surface)] px-3 py-2.5 text-xs ring-1 ring-[var(--line)]">
        <span className="min-w-0 flex-1 text-[var(--danger)]">{feed.message}</span>
        <Button size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  if (feed.stale)
    return <p className="text-[11px] text-[var(--muted)]">Showing the last saved copy; Forex Factory could not be reached just now.</p>;
  return null;
}
