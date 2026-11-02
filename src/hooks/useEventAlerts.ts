"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { fmtGmt, fmtHM, localMinutesOf } from "@/lib/time";
import type { NewsEvent } from "@/lib/types";

type Permission = NotificationPermission | "unsupported";

/* Notification permission as a tiny external store, so the UI updates when the user answers the prompt. */
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getPermission = (): Permission => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);
const getServerPermission = (): Permission => "default";

/** Mobile browsers only allow notifications through a service worker, so prefer that and fall back to the page API. */
async function showNotification(title: string, body: string, tag: string) {
  const options = {
    body,
    tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [120, 60, 120],
  } as NotificationOptions;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return void (await reg.showNotification(title, options));
  } catch {
    /* fall through */
  }
  try {
    new Notification(title, options);
  } catch {
    /* notifications blocked */
  }
}

function beep(ctx: AudioContext) {
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

interface Options {
  /** Selected events (any date). */
  events: NewsEvent[];
  nowMs: number | null;
  leadMin: number;
  dismissed: string[];
  offset: number;
}

/** Selected events starting within `leadMin` minutes; fires a sound + system notification once per event. */
export function useEventAlerts({ events, nowMs, leadMin, dismissed, offset }: Options) {
  const permission = useSyncExternalStore(subscribe, getPermission, getServerPermission);
  const audioRef = useRef<AudioContext | null>(null);
  const notified = useRef<Set<string>>(new Set());

  const active = useMemo(() => {
    if (nowMs === null) return [];
    const lead = leadMin * 60_000;
    return events.filter((e) => e.atMs >= nowMs && e.atMs - nowMs <= lead && !dismissed.includes(e.id));
  }, [events, nowMs, leadMin, dismissed]);

  useEffect(() => {
    for (const e of active) {
      if (notified.current.has(e.id)) continue;
      notified.current.add(e.id);
      if (Notification.permission === "granted") {
        void showNotification(
          `Starting soon: ${e.title}`,
          `${e.country} · ${fmtHM(localMinutesOf(e.atMs, offset))} (${fmtGmt(offset)})`,
          e.id,
        );
      }
      if (audioRef.current) beep(audioRef.current);
    }
  }, [active, offset]);

  /** Must run from a click: unlocks audio and asks for notification permission. */
  const enable = useCallback(async () => {
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
      listeners.forEach((cb) => cb());
    }
  }, []);

  return { active, permission, enable };
}
