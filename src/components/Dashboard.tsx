"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Clock from "./Clock";
import MarksPanel from "./MarksPanel";
import NewsPanel from "./NewsPanel";
import { SAMPLE_EVENTS, SESSIONS, TIMEZONES } from "@/lib/data";
import {
  ALERT_LEAD_MS,
  fmtCountdown,
  fmtGmt,
  fmtHM,
  isInRange,
  nextOccurrenceMs,
  toLocalMinutes,
} from "@/lib/time";
import type { NewsEvent, TimeInterval, TimePoint } from "@/lib/types";
import { useStoredState } from "@/lib/useStoredState";

/* Stable references for useStoredState defaults. */
const NO_OFFSET: number | null = null;
const NO_IDS: string[] = [];
const NO_EVENTS: NewsEvent[] = [];
const NO_POINTS: TimePoint[] = [];
const NO_INTERVALS: TimeInterval[] = [];
const NO_SESSION_PREFS: Record<string, boolean> = {};

/* Browser notification permission as an external store. */
const permListeners = new Set<() => void>();
const subscribePerm = (cb: () => void) => {
  permListeners.add(cb);
  return () => permListeners.delete(cb);
};
const getPerm = (): NotificationPermission | "unsupported" =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;
const getServerPerm = (): NotificationPermission | "unsupported" => "default";

const noopSubscribe = () => () => {};
const getDeviceOffset = () => -new Date().getTimezoneOffset();
const getServerOffset = () => 0;

export default function Dashboard() {
  const deviceOffset = useSyncExternalStore(noopSubscribe, getDeviceOffset, getServerOffset);
  const [storedOffset, setStoredOffset] = useStoredState<number | null>("ftp:offset", NO_OFFSET);
  const offset = storedOffset ?? deviceOffset;

  const [pinnedIds, setPinnedIds] = useStoredState<string[]>("ftp:pinned", NO_IDS);
  const [custom, setCustom] = useStoredState<NewsEvent[]>("ftp:custom", NO_EVENTS);
  const [points, setPoints] = useStoredState<TimePoint[]>("ftp:points", NO_POINTS);
  const [intervals, setIntervals] = useStoredState<TimeInterval[]>("ftp:intervals", NO_INTERVALS);
  const [dismissed, setDismissed] = useStoredState<string[]>("ftp:dismissed", NO_IDS);
  const [sessionPrefs, setSessionPrefs] = useStoredState<Record<string, boolean>>(
    "ftp:sessions",
    NO_SESSION_PREFS,
  );

  const [tab, setTab] = useState<"news" | "marks">("news");
  const [nowMs, setNowMs] = useState<number | null>(null);
  const perm = useSyncExternalStore(subscribePerm, getPerm, getServerPerm);
  const audioRef = useRef<AudioContext | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const first = window.setTimeout(() => setNowMs(Date.now()), 0);
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  const events = useMemo(() => [...SAMPLE_EVENTS, ...custom], [custom]);
  const pinned = useMemo(
    () => events.filter((e) => pinnedIds.includes(e.id)),
    [events, pinnedIds],
  );

  /* Alerts are derived: any pinned event whose next occurrence is within 15 minutes. */
  const activeAlerts = useMemo(() => {
    if (nowMs === null) return [];
    return pinned
      .map((e) => {
        const at = nextOccurrenceMs(nowMs, e.utcMinutes);
        return { key: `${e.id}@${at}`, event: e, at };
      })
      .filter((a) => a.at - nowMs <= ALERT_LEAD_MS && !dismissed.includes(a.key))
      .sort((a, b) => a.at - b.at);
  }, [pinned, nowMs, dismissed]);

  /* Side effects (system notification + beep) once per alert. */
  useEffect(() => {
    for (const a of activeAlerts) {
      if (notifiedRef.current.has(a.key)) continue;
      notifiedRef.current.add(a.key);
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(`In 15 min: ${a.event.title}`, {
            body: `${a.event.region} · ${fmtHM(toLocalMinutes(a.event.utcMinutes, offset))} (${fmtGmt(offset)})`,
          });
        }
      } catch {
        /* notifications can be blocked by the browser */
      }
      const ctx = audioRef.current;
      if (ctx) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
          osc.connect(gain).connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.65);
        } catch {
          /* audio unavailable */
        }
      }
    }
  }, [activeAlerts, offset]);

  const enableAlerts = async () => {
    try {
      if (!audioRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctor) audioRef.current = new Ctor();
      }
      await audioRef.current?.resume();
    } catch {
      /* ignore */
    }
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
      permListeners.forEach((cb) => cb());
    }
  };

  const togglePin = (id: string) =>
    setPinnedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const nowUtcMin = nowMs === null ? null : (nowMs % 86_400_000) / 60_000;

  const offsetOptions = useMemo(() => {
    const list = TIMEZONES.map((t) => ({ offset: t.offset, label: `${fmtGmt(t.offset)} · ${t.places}` }));
    if (!list.some((o) => o.offset === deviceOffset)) {
      list.push({ offset: deviceOffset, label: `${fmtGmt(deviceOffset)} · This device` });
      list.sort((a, b) => a.offset - b.offset);
    }
    return list;
  }, [deviceOffset]);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium tracking-wide">Forex Time Point</h1>
          <p className="text-xs text-[var(--muted)]">24-hour market clock</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            Time zone
            <select
              value={offset}
              onChange={(e) => setStoredOffset(Number(e.target.value))}
              className="max-w-[260px] rounded border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-sm text-[var(--fg)]"
            >
              {offsetOptions.map((o) => (
                <option key={o.offset} value={o.offset}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {storedOffset !== null && (
            <button
              type="button"
              onClick={() => setStoredOffset(null)}
              className="text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--fg)] hover:underline"
            >
              Use device zone
            </button>
          )}
          <button
            type="button"
            onClick={enableAlerts}
            disabled={perm === "denied"}
            className="rounded border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--fg)] hover:text-[var(--fg)] disabled:opacity-50"
            title={
              perm === "denied"
                ? "Notifications are blocked in your browser settings"
                : "Enable sound and desktop notifications"
            }
          >
            {perm === "granted" ? "Alerts on" : perm === "denied" ? "Alerts blocked" : "Enable alerts"}
          </button>
        </div>
      </header>

      <main className="grid gap-10 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Clock
            nowMs={nowMs}
            offset={offset}
            pinned={pinned}
            points={points}
            intervals={intervals}
            visibleSessions={sessionPrefs}
          />

          <section aria-label="Trading sessions">
            <h2 className="mb-2 text-sm font-medium tracking-wide">Sessions</h2>
            <ul className="grid gap-px overflow-hidden rounded border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
              {SESSIONS.map((s) => {
                const open = nowUtcMin !== null && isInRange(nowUtcMin, s.startUtc, s.endUtc);
                const visible = sessionPrefs[s.id] !== false;
                return (
                  <li key={s.id} className="flex items-center gap-3 bg-[var(--bg)] px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={() => setSessionPrefs((p) => ({ ...p, [s.id]: !visible }))}
                      aria-label={`Show ${s.name} on clock`}
                      className="accent-[var(--accent)]"
                    />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 text-sm">{s.name}</span>
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {fmtHM(toLocalMinutes(s.startUtc, offset))}–{fmtHM(toLocalMinutes(s.endUtc, offset))}
                    </span>
                    <span
                      className={`w-12 text-right text-xs ${open ? "text-[#6fb59a]" : "text-[var(--muted)]"}`}
                    >
                      {nowUtcMin === null ? "—" : open ? "Open" : "Closed"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[11px] text-[var(--muted)]">
              Standard UTC hours; daylight-saving shifts are not applied.
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <div role="tablist" className="flex gap-6 border-b border-[var(--line)]">
            {(
              [
                ["news", "News"],
                ["marks", "Points & intervals"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`-mb-px border-b-2 pb-2 text-sm transition-colors ${
                  tab === id
                    ? "border-[var(--accent)] text-[var(--fg)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "news" ? (
            <NewsPanel
              events={events}
              pinnedIds={pinnedIds}
              offset={offset}
              nowMs={nowMs}
              onTogglePin={togglePin}
              onAddCustom={(e) => {
                const id = `c-${crypto.randomUUID()}`;
                setCustom((prev) => [...prev, { ...e, id, custom: true }]);
                setPinnedIds((prev) => [...prev, id]);
              }}
              onRemoveCustom={(id) => {
                setCustom((prev) => prev.filter((e) => e.id !== id));
                setPinnedIds((prev) => prev.filter((x) => x !== id));
              }}
            />
          ) : (
            <MarksPanel
              points={points}
              intervals={intervals}
              offset={offset}
              onAddPoint={(p) => setPoints((prev) => [...prev, { ...p, id: crypto.randomUUID() }])}
              onRemovePoint={(id) => setPoints((prev) => prev.filter((p) => p.id !== id))}
              onAddInterval={(i) =>
                setIntervals((prev) => [...prev, { ...i, id: crypto.randomUUID() }])
              }
              onRemoveInterval={(id) => setIntervals((prev) => prev.filter((i) => i.id !== id))}
            />
          )}
        </div>
      </main>

      {/* 15-minute alerts */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      >
        {activeAlerts.map((a) => (
          <div
            key={a.key}
            role="alert"
            className="pointer-events-auto flex items-start gap-3 rounded border border-[var(--accent)] bg-[var(--bg)] p-3 shadow-lg"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-[var(--accent)]">
                Starts in {nowMs === null ? "" : fmtCountdown(a.at - nowMs)}
              </p>
              <p className="truncate text-sm">
                <span className="mr-2 font-mono text-xs text-[var(--muted)]">{a.event.region}</span>
                {a.event.title}
              </p>
              <p className="font-mono text-xs text-[var(--muted)]">
                {fmtHM(toLocalMinutes(a.event.utcMinutes, offset))} {fmtGmt(offset)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDismissed((prev) => [...prev.slice(-49), a.key])}
              aria-label="Dismiss alert"
              className="text-[var(--muted)] hover:text-[var(--fg)]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
