"use client";

import { useEffect } from "react";
import type { Theme } from "@/lib/types";

/** Applies the chosen theme to <html>. "system" removes the override so the OS preference applies. */
export function useTheme(theme: Theme) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
  }, [theme]);
}
