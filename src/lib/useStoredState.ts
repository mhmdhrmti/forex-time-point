"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Map<string, Set<() => void>>();

function subscribeKey(key: string, cb: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    set.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function readSnapshot<T>(key: string, initial: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return initial;
  }
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value: T = initial;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = initial;
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

/**
 * localStorage-backed state that is hydration-safe: the server (and first
 * client render) use `initial`, then the stored value takes over.
 */
export function useStoredState<T>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    (cb) => subscribeKey(key, cb),
    () => readSnapshot(key, initial),
    () => initial,
  );

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readSnapshot(key, initial);
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        /* storage unavailable: keep in-memory snapshot only */
        snapshotCache.set(key, { raw: JSON.stringify(resolved), value: resolved });
      }
      listeners.get(key)?.forEach((cb) => cb());
    },
    [key, initial],
  );

  return [value, set];
}
