"use client";

import { useCallback, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* The browser fires `beforeinstallprompt` once; keep it so a button can trigger the install later. */
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((cb) => cb());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const canPrompt = () => deferred !== null;
const noSsr = () => false;

const noopSubscribe = () => () => {};
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

export function useInstallPrompt() {
  const canInstall = useSyncExternalStore(subscribe, canPrompt, noSsr);
  const standalone = useSyncExternalStore(noopSubscribe, isStandalone, noSsr);
  const ios = useSyncExternalStore(noopSubscribe, isIos, noSsr);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    emit();
  }, []);

  return { canInstall, install, standalone, ios };
}
